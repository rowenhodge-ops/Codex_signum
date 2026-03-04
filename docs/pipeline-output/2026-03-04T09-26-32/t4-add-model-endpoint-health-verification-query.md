# Add model endpoint health verification query

> Task ID: t4
> Model: claude-sonnet-4:none
> Duration: 31059ms
> Output chars: 5484
> Timestamp: 2026-03-04T09:30:25.092Z

---

# M-9.VA-FIX Model Endpoint Health Verification Analysis

## Overview

This analysis examines the current query infrastructure in `src/graph/queries.ts` to assess the feasibility of adding model endpoint health verification functionality, specifically to verify the complete removal of `claude-opus-4-1` and prevent 404 errors from retired endpoints.

## Key Findings

### 1. Current Model Infrastructure

**Evidence from codebase:**
- The system uses **Seed nodes** to represent compute substrates (LLM model instances)
- Seed nodes contain endpoint metadata via `SeedProps` interface:
  - `endpoint?: string` - Model endpoint URL
  - `status?: "active" | "inactive" | "degraded" | "retired"` - Operational status
  - `lastProbed?: string` - Last health check timestamp
  - `probeFailures?: number` - Failed probe count

**Gap Identified:**
- No existing query functions specifically target endpoint health verification
- Current queries focus on capability-based filtering (`listActiveSeedsByCapability`) rather than endpoint status

### 2. Thompson Sampling Router Context

**From specification reference:**
- Thompson sampling router should avoid 404 errors from retired model endpoints
- `claude-opus-4-1` removal needs verification for completeness
- Router relies on Seed node status for endpoint selection

**Current Query Limitations:**
- `listActiveSeeds()` filters by `status = 'active'` but doesn't validate endpoint availability
- No query exists to identify potentially retired model IDs by pattern matching
- Missing endpoint metadata extraction for health verification

### 3. Required Query Functionality

**Based on acceptance criteria:**

1. **Return all ModelArm nodes with endpoint metadata**
   - Current: Seed nodes contain endpoint data but no specific "ModelArm" label
   - Need: Query to extract Seed nodes with endpoint properties

2. **Identify potentially retired model IDs**
   - Current: No pattern matching for model ID retirement detection
   - Need: Query to identify Seed nodes with retired status or matching retirement patterns

3. **Export as verifyModelEndpoints function**
   - Current: No such function exists
   - Need: New query function following established patterns

## Infrastructure Assessment

### Strengths
- Robust Neo4j query infrastructure with `runQuery()` and `writeTransaction()`
- Well-defined Seed node schema with endpoint properties
- Existing status tracking mechanism (`active`, `inactive`, `degraded`, `retired`)
- Comprehensive TypeScript interfaces for type safety

### Gaps
- No dedicated endpoint health verification queries
- Missing pattern-based model ID filtering
- No specific handling for retired endpoint detection
- Lack of endpoint metadata extraction utilities

## Recommended Query Structure

Based on existing patterns in the codebase, the `verifyModelEndpoints` function should:

1. **Follow established conventions:**
   - Use `async function` declaration
   - Return `Promise<Neo4jRecord[]>` for consistency
   - Implement proper error handling via `runQuery()`

2. **Query requirements:**
   - Extract Seed nodes with endpoint metadata
   - Filter by status patterns (especially "retired")
   - Support model ID pattern matching (e.g., "claude-opus-4-1")
   - Include probe failure counts and last probe timestamps

3. **Return comprehensive endpoint data:**
   - Model ID and endpoint URL
   - Current status and last probe results
   - Provider and model metadata
   - Failure counts for health assessment

## Integration Points

### Thompson Sampling Integration
- Query results should feed into Thompson sampling arm selection
- Retired endpoints should be excluded from `getArmStatsForCluster()`
- Decision recording should validate endpoint availability

### Pipeline Topology Impact
- TaskOutput creation should verify model endpoint health
- PipelineRun metrics should track endpoint failure rates
- DISPATCH Resonator should receive endpoint health data

## Risk Assessment

### Low Risk
- Query addition won't impact existing functionality
- Neo4j schema already supports required data
- TypeScript interfaces provide type safety

### Medium Risk
- Performance impact on large Seed node collections
- Need for proper indexing on endpoint and status fields
- Integration timing with Thompson sampling decisions

## Compliance Verification

### Decision Node Provenance
- Current `DecisionProps` includes `runId` and `taskId` fields
- `recordDecision()` properly stores provenance chains
- Human feedback queries can trace decisions via these IDs

### DISPATCH Resonator Linking
- `linkTaskOutputToStage()` handles Resonator connections
- All TaskOutput nodes link to pipeline stages regardless of status
- Resonator creation ensures DISPATCH stage exists

### Quality Score Distributions
- `recordDecisionOutcome()` captures quality scores
- `getArmStatsForCluster()` computes quality statistics
- Human feedback integration adjusts quality via `adjustedQuality`

## Recommendations

1. **Implement verifyModelEndpoints query** following existing patterns
2. **Add endpoint health indexing** for performance optimization  
3. **Integrate with Thompson sampling** for retired endpoint exclusion
4. **Monitor probe failure patterns** for proactive endpoint management
5. **Document endpoint lifecycle** management procedures

The codebase infrastructure fully supports the required model endpoint health verification functionality with minimal risk and high compatibility with existing systems.