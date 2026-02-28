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

### 4. Monitor log file for liveness

During DECOMPOSE and DISPATCH, poll the log file to verify the pipeline is still progressing. Normal LLM calls take 30-180 seconds. Extended thinking models (Opus, Sonnet 4.6) can take 3-5 minutes on complex intents. Only investigate if the log file is unchanged for 120+ seconds after a Thompson selection was logged. Check process health before taking action. Do NOT kill the process without user confirmation.

### 5. On failure: fix the pipeline, not the work

If a stage fails, fix the stage code and retry. Do not perform the stage's work manually. See CLAUDE.md anti-patterns.
