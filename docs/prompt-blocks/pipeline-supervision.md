# Pipeline Supervision Block

# Include this section in any prompt that runs the Architect or other LLM-backed pipelines.

## Pipeline Execution Rules

When running the Architect pipeline (`npx tsx scripts/architect.ts plan ...`) or any long-running LLM-backed process:

### 1. Launch with output capture

Always pipe to tee: `2>&1 | tee /tmp/<descriptive-name>.log`

### 2. Report progress at every stage transition

Don't wait for completion. When SURVEY finishes, report SURVEY results. When DECOMPOSE finishes, report the task graph. When each DISPATCH task completes, report its outcome. The user should never wonder "is it still running?"

Key metrics per stage:

- **SURVEY:** doc count, hypothesis count, gaps, confidence
- **DECOMPOSE:** model selected, task count, phase count, LLM duration
- **GATE:** full plan structure for human review
- **DISPATCH:** per-task model selection, pass/fail, output summary
- **ADAPT:** failure count, what was adapted

### 3. Use LLM wait time productively

While waiting for DECOMPOSE or DISPATCH API calls (30-60s each):

- Run `npx tsc --noEmit` to verify compilation
- Run `npm test` to verify test health
- Check `git status` for uncommitted work
- Review the log for earlier warnings

### 4. Monitor streaming heartbeats for liveness

During DECOMPOSE and DISPATCH, the executor streams API calls and logs thinking heartbeats every 15s. If heartbeats are arriving, the model is working — do NOT interrupt even if it takes 5+ minutes. Only investigate if heartbeats stop AND no output for 120s. Check process health and network connections before taking action. Do NOT kill the process without user confirmation.

### 5. On failure: fix the pipeline, not the work

If a stage fails, fix the stage code and retry. Do not perform the stage's work manually. See CLAUDE.md anti-patterns.
