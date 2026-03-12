/**
 * Bootstrap the Constitutional Bloom — the organisational core of the Codex Signum graph.
 *
 * Phase A: Creates the Constitutional Bloom node + 41 definition Seeds
 * Phase A.5: Creates 3 governance Resonators + 3 observation Grids
 *
 * [NO-PIPELINE] — pure mechanical graph mutation from v5.0 §Constitutional Coupling.
 * All writes use MERGE (idempotent). Safe to re-run.
 *
 * @see docs/specs/cs-v5.0.md §Constitutional Coupling
 */

import { writeTransaction, readTransaction } from "../src/graph/client.js";
import path from "path";
import fs from "fs";

// ─── Load environment ───────────────────────────────────────────────

function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../DND-Manager/.env"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const clean = line.replace(/\r$/, "");
        const match = clean.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (match) {
          const [, key, rawVal] = match;
          const val = rawVal.replace(/^["']|["']$/g, "");
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
  if (process.env.NEO4J_USERNAME && !process.env.NEO4J_USER) {
    process.env.NEO4J_USER = process.env.NEO4J_USERNAME;
  }
}

loadEnv();

// ─── Phase A: Constitutional Bloom + 41 Seeds ──────────────────────

async function phaseA() {
  console.log("\n═══ Phase A: Constitutional Bloom + 41 Definition Seeds ═══\n");

  // ── 1. Constitutional Bloom node ──
  console.log("Creating Constitutional Bloom...");
  await writeTransaction(async (tx) => {
    await tx.run(`
      MERGE (cb:Bloom {id: 'constitutional-bloom'})
      ON CREATE SET
        cb.name = 'Constitutional Bloom',
        cb.type = 'constitutional',
        cb.status = 'active',
        cb.content = 'Organisational core of the Codex Signum graph. Contains all morpheme definitions, axiom Seeds, grammar rule Seeds, imperative Seeds, state dimension definitions, anti-pattern catalogue, and escalation trajectory signatures. Every morpheme instance in the graph connects here via INSTANTIATES.',
        cb.specVersion = 'v5.0',
        cb.createdAt = datetime(),
        cb.updatedAt = datetime()
      ON MATCH SET
        cb.updatedAt = datetime()
    `);
  });
  console.log("  ✓ Constitutional Bloom");

  // ── 2. Six morpheme definition Seeds ──
  console.log("Creating morpheme definition Seeds...");
  const morphemeDefs = [
    {
      id: "def:morpheme:seed",
      name: "Seed Definition",
      specSection: "The Six Morphemes > Seed",
      content:
        "Encodes: Origin, instance, datum, coherent unit. A point of light. The Seed is the atomic unit: a piece of data, a function instance, a decision point. Its brightness reflects its ΦL. Its hue reflects its harmonic character. A healthy Seed glows. A degraded one dims. A Seed with no inbound or outbound Lines is Dormant: present in the graph, potentially viable, but not participating in any flow. Dormant Seeds are visible as bright but isolated points. They have ΦL computed from their internal properties but an integration factor of zero.",
    },
    {
      id: "def:morpheme:line",
      name: "Line Definition",
      specSection: "The Six Morphemes > Line",
      content:
        "Encodes: Flow, transformation, direction, conductivity. A luminous filament with intrinsic oscillation. It connects morphemes, carries transformation, shows data flow. Direction encodes relationship: Forward (→) — transformation, processing; Return (←) — result, feedback; Parallel — monitoring, observation; Bidirectional (↔) — dialogue, iteration. Conductivity determines whether signal flows. A Line is not a passive connection. It is a circuit that closes only when both endpoints satisfy the requirements for that connection. Conductivity is determined at three layers: morpheme hygiene, grammatical shape, and contextual fitness.",
    },
    {
      id: "def:morpheme:bloom",
      name: "Bloom Definition",
      specSection: "The Six Morphemes > Bloom",
      content:
        "Encodes: Scope, boundary, context. A boundary of light. The Bloom defines containment (G3): everything inside it is within its scope. Lines crossing the boundary are its interface with the outside. An open boundary indicates active interface Lines crossing it — the Bloom is accepting connections. A closed boundary indicates no active interface Lines — the Bloom is a protected scope. This is derived from the topology, not declared.",
    },
    {
      id: "def:morpheme:resonator",
      name: "Resonator Definition",
      specSection: "The Six Morphemes > Resonator",
      content:
        "Encodes: Transformation, decision, routing. A Resonator reads from input Lines, transforms, and writes to output Lines. Its shape IS its function. A Resonator with many inputs and one output is a compression. One input and many outputs is a distribution. Balanced inputs and outputs is a relay. The rendered shape is derived from the actual input/output topology, not prescribed. Minimum viable topology: at least one input Line, at least one output Line, an INSTANTIATES Line to the Constitutional Bloom, and containment within a Bloom (G3).",
    },
    {
      id: "def:morpheme:grid",
      name: "Grid Definition",
      specSection: "The Six Morphemes > Grid",
      content:
        "Encodes: Structured data, knowledge, persistent memory. A Grid contains Seeds and Lines. Nothing else. No Resonators, no Helixes, no Blooms. This is the structural distinction from a Bloom: a Grid is pure data with no active computation inside it. Its contents are stable between external writes. Resonators read from Grids and write to Grids, but they operate from outside the Grid's boundary. The Grid's internal topology IS its retrieval structure.",
    },
    {
      id: "def:morpheme:helix",
      name: "Helix Definition",
      specSection: "The Six Morphemes > Helix",
      content:
        "Encodes: Recursion, iteration, temporal flow, learning. A Helix governs iteration. It reads from a Grid, evaluates whether progress is being made, and either continues iterating or terminates. Its shape is derived from its behaviour: tightness reflects temporal scale, convergence direction reflects whether the iterations are improving (tightening spiral), stable (steady spiral), or degrading (loosening spiral), and depth reflects how many iterations have completed. A Helix operates in one of three modes: Refinement Helix, Learning Helix, or Evolutionary Helix.",
    },
  ];

  for (const def of morphemeDefs) {
    await writeTransaction(async (tx) => {
      await tx.run(
        `
        MERGE (s:Seed {id: $id})
        ON CREATE SET
          s.name = $name,
          s.seedType = 'definition',
          s.content = $content,
          s.status = 'active',
          s.specVersion = 'v5.0',
          s.specSection = $specSection,
          s.createdAt = datetime()
        ON MATCH SET
          s.content = $content,
          s.specVersion = 'v5.0',
          s.specSection = $specSection,
          s.updatedAt = datetime()
        WITH s
        MATCH (cb:Bloom {id: 'constitutional-bloom'})
        MERGE (cb)-[:CONTAINS]->(s)
        `,
        def,
      );
    });
    console.log(`  ✓ ${def.id}`);
  }

  // ── 3. Eight axiom Seeds ──
  console.log("Creating axiom Seeds...");
  const axioms = [
    {
      id: "def:axiom:a1",
      name: "A1. Fidelity",
      specSection: "Axioms > A1. Fidelity",
      content:
        "Representation must match actual state. A Seed displaying health while encoding corruption is a structural violation. The state dimension computations must be deterministic given the same structural inputs.",
    },
    {
      id: "def:axiom:a2",
      name: "A2. Visible State",
      specSection: "Axioms > A2. Visible State",
      content:
        "Health, activity, and connection are expressed in the structural properties of the encoding. Healthy patterns glow. Failing patterns dim. Dead patterns go dark. Active patterns pulse. Exploring patterns are vivid. Rigid patterns are grey. The state is always in the structure. External systems may derive their own reports, dashboards, or representations from it.",
    },
    {
      id: "def:axiom:a3",
      name: "A3. Transparency",
      specSection: "Axioms > A3. Transparency",
      content:
        "Every signal must be interpretable by its receiver. No construct may be opaque by design. Patterns must be legible. Transparency requires more than visibility — it requires testability. Premises must be explicit, inferences traceable, and conclusions publicly testable. Line conductivity enforces transparency structurally.",
    },
    {
      id: "def:axiom:a4",
      name: "A4. Provenance",
      specSection: "Axioms > A4. Provenance",
      content:
        "Every element carries the signature of its origin. Line conductivity enforces this: an element without traceable provenance fails the morpheme hygiene check, its Lines do not conduct, and it cannot participate in flows. It is structurally present but inert. No provenance, no conductivity.",
    },
    {
      id: "def:axiom:a6",
      name: "A6. Minimal Authority",
      specSection: "Axioms > A6. Minimal Authority",
      content:
        "A pattern requests only the resources its purpose requires. Containment (G3) enforces this: a Resonator's input Lines define its authority scope. It cannot read what it is not connected to. It cannot write outside its containing Bloom.",
    },
    {
      id: "def:axiom:a7",
      name: "A7. Semantic Stability",
      specSection: "Axioms > A7. Semantic Stability",
      content:
        "The vocabulary is fixed. Growth is compositional. New patterns compose from existing morphemes. They do not introduce new morpheme types, new state dimensions, or new grammar rules. The Constitutional Bloom enforces this: morpheme definitions, axiom Seeds, and grammar rule Seeds are contained within it. Every instance in the graph INSTANTIATES one of these definitions.",
    },
    {
      id: "def:axiom:a8",
      name: "A8. Adaptive Pressure",
      specSection: "Axioms > A8. Adaptive Pressure",
      content:
        "A system that cannot learn is already degrading. Learning from observed outcomes must be structural and visible: feedback flows through Lines, adaptation manifests as luminance change, exploration is measurable as εR. A pattern with no Helix has no learning mechanism. Its εR is zero. It is structurally rigid, and that rigidity is visible.",
    },
    {
      id: "def:axiom:a9",
      name: "A9. Comprehension Primacy",
      specSection: "Axioms > A9. Comprehension Primacy",
      content:
        "When efficiency and understanding conflict, understanding wins. The language serves comprehension. A faster system that nobody can read is worse than a slower one that everyone can.",
    },
  ];

  for (const axiom of axioms) {
    await writeTransaction(async (tx) => {
      await tx.run(
        `
        MERGE (s:Seed {id: $id})
        ON CREATE SET
          s.name = $name,
          s.seedType = 'axiom',
          s.content = $content,
          s.status = 'active',
          s.specVersion = 'v5.0',
          s.specSection = $specSection,
          s.createdAt = datetime()
        ON MATCH SET
          s.content = $content,
          s.specVersion = 'v5.0',
          s.specSection = $specSection,
          s.updatedAt = datetime()
        WITH s
        MATCH (cb:Bloom {id: 'constitutional-bloom'})
        MERGE (cb)-[:CONTAINS]->(s)
        `,
        axiom,
      );
    });
    console.log(`  ✓ ${axiom.id}`);
  }

  // Axiom DAG (DEPENDS_ON relationships)
  console.log("Creating axiom DEPENDS_ON DAG...");
  const axiomDeps: [string, string][] = [
    ["def:axiom:a1", "def:axiom:a2"],
    ["def:axiom:a1", "def:axiom:a3"],
    ["def:axiom:a4", "def:axiom:a2"],
    ["def:axiom:a7", "def:axiom:a2"],
    ["def:axiom:a8", "def:axiom:a2"],
    ["def:axiom:a8", "def:axiom:a3"],
    ["def:axiom:a9", "def:axiom:a3"],
  ];
  for (const [from, to] of axiomDeps) {
    await writeTransaction(async (tx) => {
      await tx.run(
        `
        MATCH (a:Seed {id: $from}), (b:Seed {id: $to})
        MERGE (a)-[:DEPENDS_ON]->(b)
        `,
        { from, to },
      );
    });
  }
  console.log("  ✓ Axiom DAG (7 DEPENDS_ON edges)");

  // ── 4. Five grammar rule Seeds ──
  console.log("Creating grammar rule Seeds...");
  const grammarRules = [
    {
      id: "def:grammar:g1",
      name: "G1. Proximity",
      specSection: "Grammar > G1. Proximity",
      content:
        "Connection requires intent. Elements near each other are not automatically connected. Connection requires explicit intent. Exception (Structural Containment): containment creates inherent connection. A Seed inside a Grid is part of that Grid. A morpheme enclosed by a Bloom is within that Bloom's scope.",
    },
    {
      id: "def:grammar:g2",
      name: "G2. Orientation",
      specSection: "Grammar > G2. Orientation",
      content:
        "Direction encodes flow. Toward (→) — input, request, forward flow. Away (←) — output, result, return flow. Parallel — monitoring, logging. Bidirectional (↔) — iteration, dialogue.",
    },
    {
      id: "def:grammar:g3",
      name: "G3. Containment",
      specSection: "Grammar > G3. Containment",
      content:
        "Enclosure creates scope. A Bloom or Grid enclosing other morphemes defines: scope — what belongs to this pattern; protection — what is shielded from outside; interface — where external connection happens. Nested containment creates hierarchy through composition. G3 governs intentional effects: data transformation, state mutation, and explicit signal propagation.",
    },
    {
      id: "def:grammar:g4",
      name: "G4. Flow",
      specSection: "Grammar > G4. Flow",
      content:
        "Light movement is data transfer. Active Lines pulse with light: direction — where data flows; speed — activity rate; brightness — ΦL and conductivity; colour — harmonic character. Dark Lines are dormant or non-conductive. A Line's conductivity is a structural property, not an administrative rule.",
    },
    {
      id: "def:grammar:g5",
      name: "G5. Resonance",
      specSection: "Grammar > G5. Resonance",
      content:
        "Alignment enables composition. Patterns with harmonically aligned ΨH compose naturally. They can share state implicitly, respond to each other's changes, and connect without explicit wiring. Clashing signatures create visible dissonance — a warning of integration friction.",
    },
  ];

  for (const rule of grammarRules) {
    await writeTransaction(async (tx) => {
      await tx.run(
        `
        MERGE (s:Seed {id: $id})
        ON CREATE SET
          s.name = $name,
          s.seedType = 'grammar-rule',
          s.content = $content,
          s.status = 'active',
          s.specVersion = 'v5.0',
          s.specSection = $specSection,
          s.createdAt = datetime()
        ON MATCH SET
          s.content = $content,
          s.specVersion = 'v5.0',
          s.specSection = $specSection,
          s.updatedAt = datetime()
        WITH s
        MATCH (cb:Bloom {id: 'constitutional-bloom'})
        MERGE (cb)-[:CONTAINS]->(s)
        `,
        rule,
      );
    });
    console.log(`  ✓ ${rule.id}`);
  }

  // ── 5. Three imperative Seeds ──
  console.log("Creating imperative Seeds...");
  const imperatives = [
    {
      id: "def:imperative:omega1",
      name: "Ω₁ Reduce Suffering",
      specSection: "Heuristic Imperatives > Ω₁",
      content:
        "The system tends toward reducing suffering in participants, in affected systems, and in the broader environment. Not every pattern directly addresses suffering. The imperative applies to the system's aggregate direction of travel.",
    },
    {
      id: "def:imperative:omega2",
      name: "Ω₂ Increase Prosperity",
      specSection: "Heuristic Imperatives > Ω₂",
      content:
        "The system distributes capability, rewards contribution, and expands access rather than concentrating control. Open protocols, permissionless participation, and CC0 licensing keep prosperity ungated. The system creates more value than it captures.",
    },
    {
      id: "def:imperative:omega3",
      name: "Ω₃ Increase Understanding",
      specSection: "Heuristic Imperatives > Ω₃",
      content:
        "The system makes the invisible visible, the complex comprehensible, and the opaque transparent. This is the imperative most deeply embedded in the design. The entire language exists to increase understanding. Axiom 9 (Comprehension Primacy) is its structural expression.",
    },
  ];

  for (const imp of imperatives) {
    await writeTransaction(async (tx) => {
      await tx.run(
        `
        MERGE (s:Seed {id: $id})
        ON CREATE SET
          s.name = $name,
          s.seedType = 'imperative',
          s.content = $content,
          s.status = 'active',
          s.specVersion = 'v5.0',
          s.specSection = $specSection,
          s.createdAt = datetime()
        ON MATCH SET
          s.content = $content,
          s.specVersion = 'v5.0',
          s.specSection = $specSection,
          s.updatedAt = datetime()
        WITH s
        MATCH (cb:Bloom {id: 'constitutional-bloom'})
        MERGE (cb)-[:CONTAINS]->(s)
        `,
        imp,
      );
    });
    console.log(`  ✓ ${imp.id}`);
  }

  // ── 6. Three state dimension definition Seeds ──
  console.log("Creating state dimension definition Seeds...");
  const dimensions = [
    {
      id: "def:dimension:phi-l",
      name: "ΦL — Luminance Schema",
      specSection: "State Dimensions > ΦL",
      content:
        "Encodes pattern health and state through visual properties. Brightness = ΦL (health). Hue = harmonic character. Saturation = εR (exploration rate). Pulsation rate = activity. Pulsation phase = ΨH between connected components. ΦL is computed from four observable factors: axiom compliance (w₁=0.4), provenance clarity (w₂=0.2), usage success rate (w₃=0.2), and temporal stability (w₄=0.2). Raw ΦL is adjusted by maturity modifier: ΦL_effective = ΦL_raw × (1 - e^(-k₁ × observations)) × (1 - e^(-k₂ × connections)).",
    },
    {
      id: "def:dimension:psi-h",
      name: "ΨH — Harmonic Signature",
      specSection: "State Dimensions > ΨH",
      content:
        "Encodes relational coherence through structural and runtime properties. ΨH is a two-component metric: Component 1 (Structural Coherence) = λ₂, the algebraic connectivity (Fiedler value) of the composition's subgraph Laplacian. Component 2 (Runtime Friction) = TV_G, Graph Total Variation measuring signal propagation smoothness. ΨH = 0.4 × normalize(λ₂) + 0.6 × (1 - friction). Three outputs from one computation: scalar ΨH, harmonic profile, and spectral position.",
    },
    {
      id: "def:dimension:epsilon-r",
      name: "εR — Exploration Rate",
      specSection: "State Dimensions > εR",
      content:
        "Encodes adaptive capacity through exploration behaviour. The fraction of decisions within a pattern that sample from uncertain alternatives rather than exploiting known-best options. A system that never explores has brittle health — locked into a local optimum, blind to changes in the environment. εR contextualises ΦL: high ΦL with zero εR is a warning — the system works today but is accumulating brittleness. Moderate ΦL with adaptive εR means the system is learning.",
    },
  ];

  for (const dim of dimensions) {
    await writeTransaction(async (tx) => {
      await tx.run(
        `
        MERGE (s:Seed {id: $id})
        ON CREATE SET
          s.name = $name,
          s.seedType = 'state-dimension',
          s.content = $content,
          s.status = 'active',
          s.specVersion = 'v5.0',
          s.specSection = $specSection,
          s.createdAt = datetime()
        ON MATCH SET
          s.content = $content,
          s.specVersion = 'v5.0',
          s.specSection = $specSection,
          s.updatedAt = datetime()
        WITH s
        MATCH (cb:Bloom {id: 'constitutional-bloom'})
        MERGE (cb)-[:CONTAINS]->(s)
        `,
        dim,
      );
    });
    console.log(`  ✓ ${dim.id}`);
  }

  // ── 7. Ten anti-pattern catalogue Seeds ──
  console.log("Creating anti-pattern catalogue Seeds...");
  const antiPatterns = [
    {
      id: "def:antipattern:monitoring-overlay",
      name: "Monitoring Overlay",
      violates: "A2",
      content:
        "A separate entity that observes execution and writes derived results to the graph, rather than execution producing its own observations inline. Violates A2 (Visible State): the pattern's health signal is separated from the pattern itself. Structural signature: a node whose only function is to read other nodes' properties and write derived values back to the graph, with no operational function of its own. Detection: any node with read-only relationships to operational nodes and write relationships to observation stores, that has no operational purpose beyond observation.",
    },
    {
      id: "def:antipattern:intermediary-layer",
      name: "Intermediary Layer",
      violates: "A6",
      content:
        "A signal pipeline, health computation service, or wrapper interposed between execution and the graph. Violates A6 (Minimal Authority): claims authority the graph write path does not need it to have. Structural signature: a Resonator that sits between an operational pattern and the graph write layer, transforming data that the operational pattern could write directly. Detection: any Resonator whose inputs and outputs could be connected directly without loss of information.",
    },
    {
      id: "def:antipattern:dimensional-collapse",
      name: "Dimensional Collapse",
      violates: "A3",
      content:
        'Represents multi-dimensional signal as a single scalar, flag, or binary state. An "error morpheme" when error is already a region of ΦL/ΨH/εR space. A "health score" that merges distinct signals into an opaque composite. Violates A3 (Transparency): the collapsed representation obscures information the existing dimensions were designed to carry. Detection: any computation that aggregates across state dimensions into a single scalar consumed by downstream decisions.',
    },
    {
      id: "def:antipattern:prescribed-behaviour",
      name: "Prescribed Behaviour",
      violates: "Grammar",
      content:
        "Patterns that dictate what other patterns do rather than creating selective pressure through structural properties. Violates the grammar principle: if a prescribed pattern is needed to produce a desired behaviour, the grammar is not expressive enough. Structural signature: a pattern with outbound command Lines to other patterns' internal Resonators, bypassing those patterns' own decision logic. Detection: cross-Bloom Lines that target internal Resonators rather than Bloom boundary interfaces.",
    },
    {
      id: "def:antipattern:governance-theatre",
      name: "Governance Theatre",
      violates: "A1",
      content:
        "Formal governance structures that exist but do not influence actual decisions. Violates A1 (Fidelity): representation does not match reality — the governance structure claims authority it does not exercise. Structural signature: governance nodes with low or zero inbound Lines from operational patterns, indicating decisions flow around rather than through governance. Detection: governance-labelled nodes whose connection density and signal flow are significantly lower than their structural position implies.",
    },
    {
      id: "def:antipattern:shadow-operations",
      name: "Shadow Operations",
      violates: "A2",
      content:
        "State stored or decisions made outside governed channels. Violates A2 (Visible State): health and activity are hidden in places the governance graph cannot inspect. Structural signature: operational outcomes that appear without corresponding governance trail — effects visible in the graph that have no traceable cause within the governed topology. Detection: nodes or property changes with absent or incomplete provenance chains.",
    },
    {
      id: "def:antipattern:defensive-filtering",
      name: "Defensive Filtering",
      violates: "A3",
      content:
        "Feedback loops that exist structurally but systematically exclude high-threat information. Violates A3 (Transparency): signals are interpretable in theory but filtered in practice so that threatening information never reaches decision points. Structural signature: ΨH divergence between governance Lines and operational Lines. Detection: runtime friction (TV_G) computed across governance Lines diverges significantly from TV_G computed across operational Lines within the same Bloom. Causal: causally prior to Governance Theatre.",
    },
    {
      id: "def:antipattern:skilled-incompetence",
      name: "Skilled Incompetence",
      violates: "A8",
      content:
        "Sophisticated compliance architectures that satisfy every formal requirement while systematically preserving existing arrangements and preventing genuine adaptation. Violates A8 (Adaptive Pressure): the governance apparatus grows but what it governs does not change. Structural signature: the Constitutional Bloom's Merkle signature is static while governance Blooms' containment grows. Detection: Constitutional Bloom signature unchanged across multiple Learning Helix iterations while governance node/Line counts grow.",
    },
    {
      id: "def:antipattern:undiscussable-accumulation",
      name: "Undiscussable Accumulation",
      violates: "A2, A8",
      content:
        "Issues that cannot be raised through formal governance channels accumulate until they produce system failure. The formal channels exist but the cost of using them exceeds the perceived benefit of raising the issue. Violates A2 (Visible State) and A8 (Adaptive Pressure). Structural signature: growing divergence between formal reports and informal signals. Detection: temporal gap between earliest matching observation Seed and the issue Seed's creation measures the accumulation period. Causal: second-order extension of Shadow Operations.",
    },
    {
      id: "def:antipattern:pathological-autopoiesis",
      name: "Pathological Autopoiesis",
      violates: "Ω₁–Ω₃",
      content:
        "A system optimising for self-maintenance rather than its stated purpose. Internal coherence rises while structural coupling with external purpose weakens. Violates Ω₁–Ω₃ (Heuristic Imperatives): the system maintains its own governance structures but ceases to serve the purposes those structures were built for. Structural signature: ΨH trending upward while ΦL trends flat or downward, combined with εR contraction. Detection: compound signal — ΨH ↑ while ΦL ↓ or flat, plus εR contraction sustained beyond Learning Helix iteration period. Causal: terminal state of unchecked Skilled Incompetence.",
    },
  ];

  for (const ap of antiPatterns) {
    await writeTransaction(async (tx) => {
      await tx.run(
        `
        MERGE (s:Seed {id: $id})
        ON CREATE SET
          s.name = $name,
          s.seedType = 'anti-pattern',
          s.content = $content,
          s.status = 'active',
          s.violates = $violates,
          s.specVersion = 'v5.0',
          s.specSection = 'Anti-Patterns',
          s.createdAt = datetime()
        ON MATCH SET
          s.content = $content,
          s.violates = $violates,
          s.specVersion = 'v5.0',
          s.updatedAt = datetime()
        WITH s
        MATCH (cb:Bloom {id: 'constitutional-bloom'})
        MERGE (cb)-[:CONTAINS]->(s)
        `,
        ap,
      );
    });
    console.log(`  ✓ ${ap.id}`);
  }

  // ── 8. Six escalation trajectory Seeds ──
  console.log("Creating escalation trajectory Seeds...");
  const escalations = [
    {
      id: "def:escalation:refinement-futility",
      name: "Refinement Futility",
      content:
        "Damped oscillation in ΦL that does not converge upward. ΨH stable or rising. εR flat. Refinements are applied (ΦL rises) but the underlying cause reasserts (ΦL falls back). The refinement mechanism works (ΨH says the parts agree) but the governing variable is wrong. The system isn't exploring alternatives (εR flat). Requires temporal correlation between refinement events and ΦL peaks.",
    },
    {
      id: "def:escalation:pattern-recurrence",
      name: "Pattern Recurrence",
      content:
        "Repeated identical excursions in ΦL across different components, with matching ΨH signatures at each excursion. The same structural problem manifests in different places.",
    },
    {
      id: "def:escalation:psi-h-phi-l-divergence",
      name: "ΨH/ΦL Divergence",
      content:
        "ΨH trending upward while ΦL trends flat or downward. εR contracting. The system is becoming more internally coherent while its actual outcomes stagnate or decline. Increasingly resonant but increasingly dim.",
    },
    {
      id: "def:escalation:epsilon-r-floor-breach",
      name: "εR Floor Breach",
      content:
        "εR below constitutional minimum, sustained. ΦL may be high (false confidence). The system has stopped exploring — locked into a local optimum with no mechanism to detect environmental change.",
    },
    {
      id: "def:escalation:temporal-stagnation",
      name: "Temporal Stagnation",
      content:
        "ΨH shows high frequency but persistently low scope in its temporal decomposition. ΦL varies locally but is flat globally. A narrow part of the system is learning actively while the broader composition stagnates.",
    },
    {
      id: "def:escalation:memory-stratum-blockage",
      name: "Memory Stratum Blockage",
      content:
        "Stratum 2 (Observational) Grid growing but Stratum 3 (Distilled) Grid static. The distillation Resonator's own ΦL declining. The system is collecting observations but not distilling them into lessons.",
    },
  ];

  for (const esc of escalations) {
    await writeTransaction(async (tx) => {
      await tx.run(
        `
        MERGE (s:Seed {id: $id})
        ON CREATE SET
          s.name = $name,
          s.seedType = 'escalation-trajectory',
          s.content = $content,
          s.status = 'active',
          s.specVersion = 'v5.0',
          s.specSection = 'Scale Escalation > Trajectory Signatures',
          s.createdAt = datetime()
        ON MATCH SET
          s.content = $content,
          s.specVersion = 'v5.0',
          s.updatedAt = datetime()
        WITH s
        MATCH (cb:Bloom {id: 'constitutional-bloom'})
        MERGE (cb)-[:CONTAINS]->(s)
        `,
        esc,
      );
    });
    console.log(`  ✓ ${esc.id}`);
  }

  // ── 9. Autopoietic closure ──
  console.log("Creating autopoietic closure...");
  await writeTransaction(async (tx) => {
    await tx.run(`
      MATCH (cb:Bloom {id: 'constitutional-bloom'})
      MATCH (def:Seed {id: 'def:morpheme:bloom'})
      MERGE (cb)-[:INSTANTIATES]->(def)
    `);
  });
  console.log("  ✓ Constitutional Bloom INSTANTIATES def:morpheme:bloom");

  console.log("\n─── Phase A complete ───\n");
}

// ─── Phase A.5: Governance Resonators + Observation Grids ──────────

async function phaseA5() {
  console.log("\n═══ Phase A.5: Governance Resonators + Observation Grids ═══\n");

  // ── Three governance Resonators ──
  const resonators = [
    {
      id: "resonator:instantiation",
      name: "Instantiation Resonator",
      content:
        "The sole entry point for morpheme creation. Enforces morpheme hygiene, grammatical shape, CONTAINS wiring, and INSTANTIATES wiring atomically.",
    },
    {
      id: "resonator:mutation",
      name: "Mutation Resonator",
      content:
        "The sole entry point for morpheme property updates. Preserves required properties, prevents orphaning, maintains provenance trail.",
    },
    {
      id: "resonator:line-creation",
      name: "Line Creation Resonator",
      content:
        "The sole entry point for Line creation. Enforces endpoint hygiene, grammatical shape, direction rules, and computes initial conductivity.",
    },
  ];

  for (const res of resonators) {
    await writeTransaction(async (tx) => {
      await tx.run(
        `
        MERGE (r:Resonator {id: $id})
        ON CREATE SET
          r.name = $name,
          r.type = 'governance',
          r.content = $content,
          r.status = 'active',
          r.specVersion = 'v5.0',
          r.createdAt = datetime()
        ON MATCH SET
          r.content = $content,
          r.updatedAt = datetime()
        WITH r
        MATCH (cb:Bloom {id: 'constitutional-bloom'})
        MERGE (cb)-[:CONTAINS]->(r)
        WITH r
        MATCH (def:Seed {id: 'def:morpheme:resonator'})
        MERGE (r)-[:INSTANTIATES]->(def)
        `,
        res,
      );
    });
    console.log(`  ✓ ${res.id}`);
  }

  // ── Three observation Grids ──
  const grids = [
    {
      id: "grid:instantiation-observations",
      name: "Instantiation Observations",
      content:
        "Records every morpheme creation event. Feeds Scale 2 learning about creation patterns.",
      resonatorId: "resonator:instantiation",
    },
    {
      id: "grid:mutation-observations",
      name: "Mutation Observations",
      content:
        "Records every morpheme update event. Provenance trail for all mutations.",
      resonatorId: "resonator:mutation",
    },
    {
      id: "grid:line-creation-observations",
      name: "Line Creation Observations",
      content:
        "Records every Line creation event. Tracks conductivity patterns.",
      resonatorId: "resonator:line-creation",
    },
  ];

  for (const grid of grids) {
    await writeTransaction(async (tx) => {
      await tx.run(
        `
        MERGE (g:Grid {id: $id})
        ON CREATE SET
          g.name = $name,
          g.type = 'observation',
          g.content = $content,
          g.status = 'active',
          g.specVersion = 'v5.0',
          g.createdAt = datetime()
        ON MATCH SET
          g.content = $content,
          g.updatedAt = datetime()
        WITH g
        MATCH (cb:Bloom {id: 'constitutional-bloom'})
        MERGE (cb)-[:CONTAINS]->(g)
        WITH g
        MATCH (def:Seed {id: 'def:morpheme:grid'})
        MERGE (g)-[:INSTANTIATES]->(def)
        WITH g
        MATCH (r:Resonator {id: $resonatorId})
        MERGE (r)-[:OBSERVES]->(g)
        `,
        grid,
      );
    });
    console.log(`  ✓ ${grid.id} (← OBSERVES from ${grid.resonatorId})`);
  }

  console.log("\n─── Phase A.5 complete ───\n");
}

// ─── Verification ──────────────────────────────────────────────────

async function verify() {
  console.log("\n═══ Verification ═══\n");

  // Count by seedType
  const seedCounts = await readTransaction(async (tx) => {
    const result = await tx.run(`
      MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS]->(child:Seed)
      RETURN child.seedType AS seedType, count(*) AS count
      ORDER BY child.seedType
    `);
    return result.records.map((r) => ({
      seedType: r.get("seedType"),
      count: typeof r.get("count") === "object" ? r.get("count").toNumber() : r.get("count"),
    }));
  });
  console.log("Seeds by type:");
  let totalSeeds = 0;
  for (const { seedType, count } of seedCounts) {
    console.log(`  ${seedType}: ${count}`);
    totalSeeds += count;
  }
  console.log(`  TOTAL: ${totalSeeds} (expected: 41)`);

  // Total constitutional bloom contents
  const contentCounts = await readTransaction(async (tx) => {
    const result = await tx.run(`
      MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS]->(child)
      RETURN labels(child)[0] AS type, count(*) AS count
      ORDER BY type
    `);
    return result.records.map((r) => ({
      type: r.get("type"),
      count: typeof r.get("count") === "object" ? r.get("count").toNumber() : r.get("count"),
    }));
  });
  console.log("\nAll contained by type:");
  for (const { type, count } of contentCounts) {
    console.log(`  ${type}: ${count}`);
  }

  // Autopoietic closure
  const closure = await readTransaction(async (tx) => {
    const result = await tx.run(`
      MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:INSTANTIATES]->(def)
      RETURN cb.id AS cbId, def.id AS defId
    `);
    return result.records.map((r) => ({
      cbId: r.get("cbId"),
      defId: r.get("defId"),
    }));
  });
  console.log("\nAutopoietic closure:");
  for (const { cbId, defId } of closure) {
    console.log(`  ${cbId} -[:INSTANTIATES]-> ${defId}`);
  }

  // Axiom DAG
  const axiomDag = await readTransaction(async (tx) => {
    const result = await tx.run(`
      MATCH (a:Seed)-[:DEPENDS_ON]->(b:Seed)
      WHERE a.id STARTS WITH 'def:axiom:'
      RETURN a.id AS from, b.id AS to
      ORDER BY a.id
    `);
    return result.records.map((r) => ({
      from: r.get("from"),
      to: r.get("to"),
    }));
  });
  console.log("\nAxiom DAG:");
  for (const { from, to } of axiomDag) {
    console.log(`  ${from} -[:DEPENDS_ON]-> ${to}`);
  }

  // Governance Resonators INSTANTIATES
  const resInst = await readTransaction(async (tx) => {
    const result = await tx.run(`
      MATCH (r:Resonator {type: 'governance'})-[:INSTANTIATES]->(def)
      RETURN r.id AS rId, def.id AS defId
    `);
    return result.records.map((r) => ({
      rId: r.get("rId"),
      defId: r.get("defId"),
    }));
  });
  console.log("\nResonator INSTANTIATES:");
  for (const { rId, defId } of resInst) {
    console.log(`  ${rId} -[:INSTANTIATES]-> ${defId}`);
  }

  // Grid INSTANTIATES
  const gridInst = await readTransaction(async (tx) => {
    const result = await tx.run(`
      MATCH (g:Grid {type: 'observation'})-[:INSTANTIATES]->(def)
      WHERE g.id STARTS WITH 'grid:'
      RETURN g.id AS gId, def.id AS defId
    `);
    return result.records.map((r) => ({
      gId: r.get("gId"),
      defId: r.get("defId"),
    }));
  });
  console.log("\nGrid INSTANTIATES:");
  for (const { gId, defId } of gridInst) {
    console.log(`  ${gId} -[:INSTANTIATES]-> ${defId}`);
  }

  // OBSERVES wiring
  const observes = await readTransaction(async (tx) => {
    const result = await tx.run(`
      MATCH (r:Resonator {type: 'governance'})-[:OBSERVES]->(g:Grid)
      RETURN r.id AS rId, g.id AS gId
    `);
    return result.records.map((r) => ({
      rId: r.get("rId"),
      gId: r.get("gId"),
    }));
  });
  console.log("\nOBSERVES wiring:");
  for (const { rId, gId } of observes) {
    console.log(`  ${rId} -[:OBSERVES]-> ${gId}`);
  }

  // Summary
  const allGood =
    totalSeeds === 41 &&
    contentCounts.length >= 3 &&
    closure.length === 1 &&
    axiomDag.length === 7 &&
    resInst.length === 3 &&
    gridInst.length === 3 &&
    observes.length === 3;

  console.log(
    `\n${allGood ? "✅ ALL CHECKS PASSED" : "❌ SOME CHECKS FAILED"}\n`,
  );

  return allGood;
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  try {
    await phaseA();
    await phaseA5();
    const ok = await verify();
    process.exit(ok ? 0 : 1);
  } catch (error) {
    console.error("FATAL:", error);
    process.exit(1);
  }
}

main();
