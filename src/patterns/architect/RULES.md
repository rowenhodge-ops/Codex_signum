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
