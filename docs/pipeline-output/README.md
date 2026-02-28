# Pipeline Output

This directory contains output from Architect pipeline DISPATCH executions.

Each pipeline run creates a timestamped subdirectory:

```
docs/pipeline-output/
  2026-03-01T12-30-00/
    t1-analyze-axioms.md
    t2-evaluate-morphemes.md
    ...
    _manifest.json
```

Output files are the raw LLM responses from each task. They are reference material,
not source code — they should be reviewed by a human before any findings are applied.

These files are committed to the repo as evidence of pipeline execution.
