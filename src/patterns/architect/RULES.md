# Architect Pattern — Constitutional Rules

## survey_before_decompose

- **Value:** always
- **Consequence:** Decomposition without survey is a constitutional violation
- **Rationale:** Planning without understanding current state is the primary failure mode

## mandatory_human_gate_initial

- **Value:** true (all plans require human gate approval)
- **Evolution:** May relax when architect.phi_l > 0.85
- **Rationale:** Pattern is new; earn trust through demonstrated capability

## max_tasks_per_plan

- **Value:** 30
- **Consequence:** Plans exceeding 30 tasks must be split into sub-plans

## task_description_minimum

- **Value:** description + acceptance_criteria + verification + commit_message
- **Consequence:** Tasks missing required fields fail constitutional check

## commit_push_per_task

- **Value:** always
- **Consequence:** Tasks that don't push to remote are not considered complete
- **Rationale:** Enables async human review without stopping the pipeline

## parallel_decompose_recommended

- **Value:** decomposeAttempts = 3, sequential mode
- **Consequence:** Advisory, not mandatory. Single decompose (N=1) is valid but produces lower-confidence plans.
- **Rationale:** Best-of-N scoring gives log(N) quality improvement. N=3 is the sweet spot — biggest jump from N=1, diminishing returns above N=5. Sequential mode is default because it's easier to debug; parallel mode available for latency-sensitive contexts.
- **Research:** Self-MoA (same strong model N×) outperforms mixing different models. Plan scoring evaluates confidence (35%), consistency (25%), task count reasonableness (20%), gap coverage (20%).

## orchestration_loop_in_core

- **Value:** always
- **Consequence:** Consumer applications call `executePlan()` with injected executors. They do NOT call individual stage functions (classify, sequence, gate, dispatch, adapt) directly.
- **Rationale:** If every consumer re-implements the stage loop, bugs get fixed in N places. Core owns the orchestration; consumers inject behavior through `ModelExecutor`, `TaskExecutor`, and `ArchitectConfig`.

## pre_flight_verification

- **Value:** recommended for consumers
- **Consequence:** Advisory. Consumers should verify correct branch, clean working tree, and correct remote before dispatching tasks.
- **Rationale:** Verification lag creates compound errors. The later a misconfiguration is discovered, the more rework it requires. Pre-flight checks in the consumer's TaskExecutor catch issues before the first task runs.
