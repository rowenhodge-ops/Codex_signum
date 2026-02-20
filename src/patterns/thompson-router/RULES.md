# Thompson Router — Constitutional Constraints

## Tier 1 (Mandatory)
- εR floor must be > 0 for all active context clusters
- Force-explore interval must be configured
- Decisions must be recorded to graph BEFORE execution
- Outcomes must be recorded to graph AFTER execution

## Tier 2 (Preferred)
- REVIEW model should differ from EXECUTE model when viable alternatives exist
- Cost-adjusted rewards should use task-category-specific reference costs

## Routing Invariants
- Thompson router queries the graph, never a config file
- New Agent nodes are automatically explored (uniform prior)
- Degraded agents are excluded from candidate set
- Retired agents are never deleted, only status-flagged
