# GCloud + Vertex Auth — Preferred Flow Prompt

Use this prompt when asking Copilot to authenticate Google Cloud + Vertex in this repo.

## Fast Path

Say: `Use saved prompt docs/Prompts/gcloud-vertex-auth-preferred-prompt.md`

## Non-Negotiable Execution Rules

1. Always start with `gcloud auth login --update-adc`.
2. Do not use `--no-launch-browser` unless I explicitly ask for manual fallback.
3. Do not request, accept, or process pasted CLI verification codes unless I explicitly request manual fallback.
4. If any terminal prompt asks for password/code input, abort that attempt and immediately restart browser-first auth.
5. If any auth attempt appears tied to the wrong session (for example invalid code verifier), stop and restart browser-first auth instead of retrying code submission.
6. Only run Vertex verification commands after browser-first auth completes.

## Prompt (copy/paste)

Please authenticate `gcloud` and Vertex AI in this workspace using my preferred flow.

Requirements:
1. Use browser-first auth so I do **not** need to copy a CLI verification code into the terminal.
2. Preferred order:
   - `gcloud auth login --update-adc` (primary; use this first every time)
   - Only if ADC is still missing afterward: `gcloud auth application-default login`
3. Avoid `--no-launch-browser` unless browser-based auth fails and I explicitly approve fallback.
4. If any interactive password/code prompt appears in a non-interactive terminal, abort that attempt and restart browser-first auth immediately.
5. After auth, verify Vertex access with:
   - `gcloud ai models list --project=kore-5e252 --region=us-central1 --limit=1`
   - `gcloud ai endpoints list --project=kore-5e252 --region=us-central1 --limit=5`
   - `gcloud ai model-garden models list --project=kore-5e252 --limit=5`
6. Treat `Listed 0 items` as successful auth if no permission/auth errors occur.
7. If a command fails due to CLI version/flag mismatch, retry with compatible flags (for example `--location` vs `--region`) and continue.
8. Report exact command results and final status.

Success criteria:
- ADC is configured (or explicitly refreshed via `--update-adc` flow)
- `gcloud ai` commands run without reauth/password interruption
- Vertex endpoints/model or model-garden listing returns successfully

## Notes
- Project: `kore-5e252`
- Typical region: `us-central1`
- Manual URL/code flow (`--no-launch-browser`) is last-resort fallback only and requires explicit user approval.
