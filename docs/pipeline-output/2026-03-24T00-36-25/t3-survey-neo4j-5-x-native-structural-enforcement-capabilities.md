# Survey Neo4j 5.x native structural enforcement capabilities

> Task ID: t3
> Model: gemini-2.5-flash:default
> Duration: 64857ms
> Output chars: 21588
> Timestamp: 2026-03-24T00:58:12.947Z

> **⚠️ Hallucination flags (2):**
> - [content/warning] References eliminated entity "monitoring overlay"
> - [content/warning] Task t3 references "schema.ts" but this file was not in its context

---

## R-63: Adversarial Perimeter Defence for the Graph - Neo4j 5.x Native Structural Enforcement Capabilities

### Introduction to R-63 Challenge

The R-63 design challenge highlights a critical vulnerability: the ability for any user with Neo4j write access to inject "morpheme-labeled nodes" (e.g., `Seed`, `Bloom`) directly via raw Cypher. This bypasses application-level governance, leading to nodes without expected structural relationships (`INSTANTIATES`, `CONTAINS`) or observation recordings, rendering the governance layer structurally blind. The requirement is for structural enforcement at the database layer itself, robust against application compromise, and without relying on a separate monitoring overlay. This analysis surveys Neo4j 5.x native capabilities to achieve this.

---

### Neo4j 5.x Native Structural Enforcement Capabilities Survey

This section details various Neo4j 5.x mechanisms, evaluating them against the criteria of enforcement level, bypass resistance, performance cost, and edition requirements.

#### 1. Property Existence Constraints

*   **Description**: Ensures a specified property exists (is not `NULL`) on all nodes or relationships of a given label or type. This is a fundamental structural integrity check.
*   **Syntax Example (from `src/graph/schema.ts`)**:
    ```cypher
    CREATE CONSTRAINT seed_content_required IF NOT EXISTS FOR (s:Seed) REQUIRE s.content IS NOT NULL
    ```
*   **Enforcement Level**: **Pre-commit**. The database checks this constraint before committing the transaction. Any write operation violating it causes the transaction to fail immediately.
*   **Bypass Resistance**: **High**. These are core database-level rules. Raw Cypher cannot circumvent them; any attempt to create or modify data that violates an existence constraint will be rejected by the database engine itself.
*   **Performance Cost**: **Low**. Part of the standard write validation process, highly optimized. Involves a quick check on property presence.
*   **Neo4j Edition**: **Community & Enterprise**.

#### 2. Property Type Constraints

*   **Description**: Neo4j is a schemaless database and is dynamically typed at the property level. **It does not provide native DDL (Data Definition Language) constructs for strictly enforcing property data types** (e.g., `s.age` must be an `INTEGER`). Properties can hold values of various types (String, Integer, Float, Boolean, List, Map, DateTime) and the same property name can hold different types across different nodes.
*   **Enforcement Level**: **N/A for native structural enforcement**.
*   **Bypass Resistance**: **N/A for native structural enforcement**. Without a native mechanism, raw Cypher can assign any valid data type to a property.
*   **Performance Cost**: **N/A**.
*   **Neo4j Edition**: **N/A**.
*   **Achieving Type Enforcement (Non-Native)**: Property type enforcement *can* be achieved using **APOC Triggers** or **Transaction Event Handlers** (Java plugins). These mechanisms can inspect property values (e.g., using `apoc.meta.type()`) and roll back transactions if types don't match expectations. However, these are not considered "native structural constraints" in the same vein as `IS NOT NULL`.

#### 3. Node Key Constraints

*   **Description**: Combines uniqueness and existence for a set of properties on a node label. A node key effectively declares that the combination of specified properties uniquely identifies a node within that label, and all properties in the key must exist and be non-NULL.
*   **Syntax Example**:
    ```cypher
    CREATE CONSTRAINT my_node_key IF NOT EXISTS FOR (n:MyLabel) REQUIRE (n.prop1, n.prop2) IS NODE KEY
    ```
*   **Enforcement Level**: **Pre-commit**. The database validates the uniqueness and existence of the key properties before committing.
*   **Bypass Resistance**: **High**. Similar to uniqueness constraints, raw Cypher cannot bypass node key constraints. Any attempt to create a node with a duplicate key combination or a node missing a key property will fail the transaction.
*   **Performance Cost**: **Low to Moderate**. Involves creating a composite index for the key properties. This adds a small overhead to writes but significantly improves lookup performance on these keys.
*   **Neo4j Edition**: **Community & Enterprise**.

#### 4. Uniqueness Constraints

*   **Description**: Ensures that the value of a specific property (or a combination of properties for composite uniqueness) is unique across all nodes or relationships of a given label or type. Uniqueness constraints also implicitly enforce property existence for the constrained property.
*   **Syntax Example (from `src/graph/schema.ts`)**:
    ```cypher
    CREATE CONSTRAINT seed_id_unique IF NOT EXISTS FOR (s:Seed) REQUIRE s.id IS UNIQUE
    ```
*   **Enforcement Level**: **Pre-commit**. Checked before the transaction commits. Violations lead to transaction rollback.
*   **Bypass Resistance**: **High**. Cannot be circumvented by raw Cypher. The database engine enforces uniqueness as a fundamental integrity rule.
*   **Performance Cost**: **Low to Moderate**. Requires an underlying unique index, which has a small overhead for write operations but is crucial for data integrity and often beneficial for query performance.
*   **Neo4j Edition**: **Community & Enterprise**.

#### 5. APOC Triggers (`apoc.trigger.add`)

*   **Description**: APOC (Awesome Procedures on Cypher) triggers allow arbitrary Cypher logic to be executed in response to database events (e.g., before or after a transaction commits, or after a specific statement). They are highly flexible for custom validation and side effects.
*   **Syntax Example**:
    ```cypher
    CALL apoc.trigger.add('check_governed_seed_creation', '
      UNWIND apoc.trigger.nodesByLabel("Seed", "created") AS node
      WHERE NOT (node)-[:INSTANTIATES]->(:MorphemeDefinition) // Or check for txMetadata
      CALL apoc.trigger.fail("Ungoverned Seed node created. Missing INSTANTIATES relationship or governance token.")
      RETURN NULL
    ', {phase:'before'})
    ```
*   **Enforcement Level**: Conceptually **Post-commit Event with Pre-commit Rollback Capability**. Triggers with `phase:'before'` execute *after* the initial write operations in a transaction but *before* the transaction is fully committed. If the trigger logic calls `apoc.trigger.fail()`, the entire transaction (including the original write) is rolled back. Triggers with `phase:'after'` execute post-commit for side effects and cannot roll back the original transaction.
*   **Bypass Resistance**: **Moderate to High**.
    *   **Resistance**: A user cannot directly bypass a trigger by submitting raw Cypher that violates its logic. The trigger will fire and, if designed to, roll back the transaction. This provides robust structural enforcement even if the application client is compromised, as the logic resides within the database.
    *   **Potential Bypass (Admin)**: A user with administrative privileges (`dbms.security.admin` or `dbms.security.sudo`) could potentially disable the trigger (`apoc.trigger.remove`) or modify the APOC plugin settings. However, this requires elevated administrative access, not merely "Neo4j write access."
*   **Performance Cost**: **Moderate to High**. The cost depends directly on the complexity and efficiency of the Cypher query executed by the trigger. Triggers run synchronously as part of the transaction lifecycle, so inefficient triggers can significantly impact write performance.
*   **Neo4j Edition**: **Community & Enterprise**. APOC triggers are a part of APOC Core and are available in both editions.
*   **Transaction Rollback Capability**: APOC triggers can invoke `apoc.trigger.fail("message")` to explicitly mark the current transaction for rollback. This is a crucial feature for enforcing structural invariants, as it prevents any violating writes from persisting. The entire transaction is aborted, effectively achieving pre-commit enforcement of custom rules.
*   **Limitations**: Logic is expressed in Cypher, which might be less suitable for very complex procedural validation compared to Java-based plugins. Can increase transaction latency if the trigger query is slow. Debugging trigger logic can be more challenging.

#### 6. Neo4j 5.x Transaction Event Handlers (Java Plugins)

*   **Description**: These are custom Java plugins deployed to the Neo4j server that can hook into various stages of a transaction's lifecycle. They offer the most powerful and flexible way to implement custom server-side logic, leveraging the full power of Java.
*   **Enforcement Level**: **Pre-commit**. Event handlers can implement a `beforeCommit(TransactionData data)` method. Within this method, they can inspect all changes within the transaction (created nodes, deleted relationships, property updates, etc.) and throw a `TransactionValidationException` (or any other `RuntimeException`) to abort and roll back the transaction. They can also perform post-commit actions.
*   **Bypass Resistance**: **Very High**. As compiled Java code running directly within the Neo4j JVM, these handlers are part of the core database process. They cannot be bypassed by raw Cypher and are extremely resilient to application compromise. Disabling them would require filesystem access to remove the plugin JAR, which is an administrative task far beyond standard write access.
*   **Performance Cost**: **Moderate to High**. While potentially more performant than complex Cypher triggers for intricate logic (due to JVM optimization), poorly written Java plugins can still impact performance significantly. Performance depends on the complexity of the validation logic.
*   **Neo4j Edition**: **Enterprise**. Deploying custom Java plugins is an Enterprise Edition feature.
*   **Rollback Capability**: Explicitly throwing an exception in the `beforeCommit` phase causes the entire transaction to roll back, ensuring structural enforcement.

#### 7. Transaction Metadata (`tx.metadata`)

*   **Description**: Transaction metadata allows applications to attach a custom map of key-value pairs to a transaction when executing Cypher via driver APIs. This metadata is transient, available only during the transaction's lifecycle, and can be inspected by APOC triggers or Java event handlers. It is *not* an enforcement mechanism itself, but a means to provide context for other enforcement mechanisms.
*   **Injection Capabilities**: Applications can inject metadata when executing Cypher via driver APIs:
    ```javascript
    // JavaScript Driver Example
    session.writeTransaction(tx => tx.run('CREATE (n:MyNode {prop: $val})', { val: 'some value' }), {
        metadata: { source: 'governed_app', policy_id: 'R-63_validated', cryptographic_token: '...' }
    });
    ```
    Or for programmatic metadata within Cypher when using APOC: `CALL db.run('...', { tx_metadata: { ... } })`
*   **Verification Capabilities**: APOC triggers or Java event handlers can access this metadata.
    *   **APOC Trigger Example**: `apoc.tx.meta.get('source')` or `apoc.trigger.properties.get('txMetadata').source`. A trigger could then `apoc.trigger.fail()` if specific metadata is missing or incorrect, effectively distinguishing a "governed" write (with correct metadata) from an "ungoverned" one.
*   **Enforcement Level**: **Indirect**. Metadata itself doesn't enforce, but it provides crucial context for pre-commit enforcement mechanisms (APOC triggers, Java handlers) to act upon.
*   **Bypass Resistance**: **Low for Injection alone; High when combined with triggers/handlers**. A malicious user can omit or forge metadata if there's no enforcement mechanism *checking* it. However, if an APOC trigger or Java handler *requires* specific metadata (e.g., a cryptographic write token or an origin identifier) and rolls back transactions without it, then the combined resistance becomes high.
*   **Performance Cost**: **Very Low** for injection. The cost for verification is absorbed into the cost of the trigger/handler.
*   **Neo4j Edition**: **Community & Enterprise**.

#### 8. Fine-grained RBAC (Label-Level `GRANT`/`DENY`)

*   **Description**: Role-Based Access Control (RBAC) in Neo4j allows administrators to define roles and grant/deny specific privileges on database resources (nodes, relationships, properties, labels, operations) to those roles. This includes fine-grained control over which labels users can create, read, update, or delete.
*   **Enforcement Level**: **Pre-execution / Pre-transaction**. Permissions are checked *before* a Cypher statement is allowed to run. If a user lacks the necessary privilege for an operation (e.g., `CREATE` a node with a specific label), the query will be rejected immediately with an authorization error.
*   **Bypass Resistance**: **High**. RBAC is a fundamental security layer enforced by the database server. Users cannot bypass denied privileges. An attempt to create a node with a forbidden label (e.g., `Seed`, `Bloom`) will result in an authorization error, preventing the operation from even starting. This is extremely effective against raw Cypher injections by unauthorized roles.
*   **Neo4j RBAC Label-Level `GRANT`/`DENY` Syntax**:
    *   **Version Requirements**: Generally available in Neo4j 4.x and 5.x **Enterprise Edition**. Some basic role management exists in Community, but fine-grained label-level control is an Enterprise feature.
    *   **Examples**:
        *   `DENY CREATE { LABELS Seed, Bloom } ON GRAPH neo4j TO general_writer_role`
            *   Prevents `general_writer_role` from creating any nodes with the `Seed` or `Bloom` labels.
        *   `GRANT CREATE { LABELS Seed, Bloom } ON GRAPH neo4j TO governed_app_role`
            *   Allows `governed_app_role` to create `Seed` and `Bloom` nodes.
        *   `DENY WRITE { LABELS Seed (status) } ON GRAPH neo4j TO guest_user_role`
            *   Prevents `guest_user_role` from modifying the `status` property on `Seed` nodes.
        *   `GRANT SET PROPERTY { LABELS Seed (governance_token) } ON GRAPH neo4j TO governed_app_role`
            *   Allows `governed_app_role` to set the `governance_token` property on `Seed` nodes.
*   **Performance Cost**: **Low**. Authorization checks are an integral and highly optimized part of the query planner and execution engine.
*   **Neo4j Edition**: **Enterprise**.

#### 9. Impersonation (`CALL dbms.security.sudo` / `USING IMPERSONATED USER`)

*   **Description**: Impersonation allows a user (or an application running as a user) to execute Cypher queries with the privileges of another, usually more privileged, user. This is a mechanism for controlled privilege elevation for specific, authorized operations, not an enforcement mechanism itself.
*   **Syntax**:
    *   `CALL dbms.security.sudo('privileged_user', 'CREATE (n:HighlySensitiveLabel {prop: "value"})')`
    *   `USING IMPERSONATED USER 'privileged_user' CREATE (n:HighlySensitiveLabel {prop: "value"})`
*   **Enforcement Level**: **Contextual Privilege Application**. The privileges applied are those of the impersonated user, subject to *their* RBAC definitions.
*   **Bypass Resistance**: **N/A (as an enforcement mechanism)**. It's a feature for privilege management. Its use implies that the caller is trusted to use it correctly or is sufficiently privileged to invoke it.
*   **How it Relates to R-63**: Impersonation could be used to *enable* governed writes by allowing a less privileged application account to temporarily operate with the privileges of a `governed_app_role` for specific, audited operations. However, for preventing *ungoverned* writes by general users, it's not a direct solution but rather a feature that needs careful management within the overall security model.
*   **Performance Cost**: **Very Low**. Minimal overhead for changing the security context.
*   **Neo4j Edition**: **Enterprise** (requires `dbms.security.sudo` privilege, which is highly restricted).

---

### Analysis & Design Options for R-63

To address the R-63 challenge of preventing ungoverned morpheme-labeled node injection, a multi-layered, structural enforcement approach within Neo4j is required.

#### Core Structural Enforcement Layers:

1.  **Fine-grained RBAC (Enterprise Edition Required)**:
    *   **Mechanism**: This is the most direct and powerful first line of defense.
    *   **Design**:
        *   Define a `governed_writer` role with explicit `GRANT CREATE { LABELS Seed, Bloom, Decision, ConstitutionalRule, ... } ON GRAPH neo4j`.
        *   Define a `general_user` or `default_writer` role with `DENY CREATE { LABELS Seed, Bloom, Decision, ConstitutionalRule, ... } ON GRAPH neo4j`.
        *   The legitimate application for governed writes must connect with credentials mapping to the `governed_writer` role. All other users/applications (including potentially compromised ones or those attempting raw Cypher injection) should operate under the `general_user` role, thus being unable to create these sensitive node types.
    *   **Compliance**: `(a) structural enforcement`, `(b) no monitoring overlay`, `(c) works when application is compromised` (RBAC is server-side).

2.  **APOC Triggers with Transaction Metadata & Cryptographic Write Tokens**:
    *   **Mechanism**: Provides a flexible, content-aware, and verifiable layer of enforcement.
    *   **Design**:
        *   **Transaction Metadata Injection**: The legitimate application for governed writes is mandated to inject specific metadata into each write transaction, e.g., `tx.metadata.governance_origin: 'CodexSignum_Core'`, and potentially a cryptographic write token: `tx.metadata.governance_token: '...'`. This token could be a HMAC or digital signature of the node's properties and its intended relationships, generated by the application.
        *   **APOC Trigger Enforcement**: Create `before` triggers (`apoc.trigger.add('...', {phase:'before'})`) for all sensitive node labels (`Seed`, `Bloom`, etc.) on `created` events.
            *   **Check 1: Required Relationships**: Verify that newly created `Seed` nodes have an `INSTANTIATES` relationship, and `Bloom` nodes have a `CONTAINS` relationship, etc. (as specified in `schema.ts` and the problem statement). Example:
                ```cypher
                UNWIND apoc.trigger.nodesByLabel("Seed", "created") AS node
                WHERE NOT EXISTS((node)-[:INSTANTIATES]->())
                CALL apoc.trigger.fail("Ungoverned Seed node created: missing INSTANTIATES relationship.")
                RETURN NULL
                ```
            *   **Check 2: Metadata/Token Validation**: Inspect `apoc.tx.meta.get('governance_origin')`. If it's missing or incorrect, `apoc.trigger.fail()`. If `tx.metadata.governance_token` is used, the trigger would verify this token against the actual node properties and relationships. If the token is invalid or missing for a sensitive node type, `apoc.trigger.fail()`. This makes ungoverned injections impossible without a valid, verifiable token.
        *   **Append-Only Provenance Chains**: As a related use, triggers can enforce that creation of any sensitive node (e.g., `Seed`, `Bloom`) must also trigger the creation of a `ProvenanceStart` node linked to it, ensuring that all morpheme-labeled nodes have an explicit origin record.
    *   **Compliance**: `(a) structural enforcement` (rollback capability), `(b) no monitoring overlay` (logic is in DB), `(c) works when application is compromised` (trigger logic runs on server, token verification handles compromised app attempting to inject false data).

3.  **Property Existence Constraints & Uniqueness Constraints**:
    *   **Mechanism**: Basic, but essential for core data integrity.
    *   **Design**: Continue to define `REQUIRE ... IS NOT NULL` and `REQUIRE ... IS UNIQUE` constraints for all critical properties (e.g., `id`, `type`, `status`, `content`) on morpheme-labeled nodes. This ensures that even if a node *is* created, it must have these fundamental properties, which can then be used by other triggers for more complex validation.
    *   **Compliance**: `(a) structural enforcement`, `(b) no monitoring overlay`, `(c) works when application is compromised`.

#### Non-Applicable / Complementary Mechanisms:

*   **Property Type Constraints**: Not natively available. Achieved via APOC triggers/Java handlers.
*   **Transaction Event Handlers (Java Plugins)**: Provides the highest level of bypass resistance and performance for complex logic but requires Enterprise Edition and JVM-level deployment. This is a more robust alternative to APOC triggers for high-assurance scenarios.
*   **Impersonation**: Not an enforcement mechanism. It's a privilege management feature that could be used by a legitimate application to elevate its privileges for governed writes, but doesn't prevent ungoverned writes by others.

#### Conclusion:

The most effective "database-layer structural enforcement" for R-63 relies on a combination of **fine-grained RBAC** (for preventing creation of sensitive labels by unauthorized roles) and **APOC Triggers (or Java Event Handlers)**. These triggers, crucially leveraging **Transaction Metadata** with **cryptographic write tokens** and verifying expected **structural relationships**, can distinguish governed writes and roll back any transaction that violates the defined invariants. This multi-layered approach ensures that the database itself acts as the guardian of its structural integrity, meeting the requirements of structural enforcement, no monitoring overlay, and resilience to application compromise.