# M-9.6 Completion Report — Model Expansion: Vertex AI MaaS Substrate

**Milestone:** M-9.6 — Model Expansion: Vertex AI MaaS Substrate
**Date:** 2026-03-06
**Status:** Complete

---

## Summary

Expanded substrate diversity by adding all available Vertex AI Model Garden MaaS (serverless) models to the Thompson router's candidate pool. 15 new models across 4 tiers: text generation, document processing, speech/audio, and image generation.

## Models Added by Tier

### Tier 1 — Text Generation (Thompson router candidates NOW)

| Internal ID | Publisher Model ID | Endpoint | Status |
|---|---|---|---|
| gpt-oss-120b:default | publishers/openai/models/gpt-oss-120b-maas@001 | rawPredict | Active — executor wired |

**Skipped (already exist):** gemini-2.5-flash-lite:default, gemini-2.5-pro:default, gemini-2.5-flash:default

### Tier 2 — Document Processing (Seed nodes, executor pending)

| Internal ID | Publisher Model ID | Capabilities |
|---|---|---|
| pretrained-ocr-v1:default | pretrained-ocr@001 | ocr, document_processing |
| pretrained-ocr-v2:default | pretrained-ocr@002 | ocr, document_processing |
| imagetext-v1:default | imagetext@001 | image_captioning, visual_qa |
| imagetext-v2:default | imagetext@002 | image_captioning, visual_qa |
| form-parser-v1:default | pretrained-form-parser@001 | document_processing, form_extraction |
| translate-llm:default | translate-llm | translation |

### Tier 3 — Speech & Audio (Seed nodes, executor pending)

| Internal ID | Publisher Model ID | Capabilities |
|---|---|---|
| chirp-2:default | chirp-2@001 | speech_to_text |
| lyria-002:default | lyria-002 | audio_generation |
| video-speech-transcription:default | video-speech-transcription@001 | speech_to_text, transcription |

### Tier 4 — Image Generation (Seed nodes, executor pending)

| Internal ID | Publisher Model ID | Capabilities |
|---|---|---|
| imagen-4.0:default | imagen-4.0-generate-001 | image_generation |
| imagen-4.0-fast:default | imagen-4.0-fast-generate-001 | image_generation |
| imagen-4.0-ultra:default | imagen-4.0-ultra-generate-001 | image_generation |

### Skipped (by design)

- **Legacy Imagen:** imagegeneration@001 through @006 — superseded by Imagen 4.0
- **Preview variants:** imagen-4.0-*-preview-06-06 — GA versions used instead
- **Private preview:** chirp-3@default — not GA yet

## Executor Wiring Status

| Model | Callable | Handler |
|---|---|---|
| GPT-OSS-120B | Yes | `callVertexOpenAI()` — rawPredict with OpenAI chat completion format |
| Tier 2-4 models | No | Seed nodes exist; endpoint: predict; TODO(M-8.INT) for wiring |

## Commits

1. `5868828` — feat(bootstrap): M-9.6 add MaaS models — text, document, speech, image
2. `23dead1` — feat(executor): M-9.6 wire GPT-OSS-120B dispatch via Vertex AI OpenAI publisher
3. `3ab815d` — test(graph): M-9.6 model expansion tests — 17 assertions

## Test Counts

- 79 test files, 1293 tests passing, 19 skipped, 0 failures
- 17 new tests in `tests/graph/model-expansion.test.ts`

## Backlog Items Recorded

- **R-27:** Deployable model substrate — GPU provisioning for Llama 3.1 70B/8B, Llama 3.3 70B, Gemma 3 12B, Gemma 2 27B, Mixtral 8x7B/8x22B, Mistral Nemo/7B, GPT-OSS 20B
- **R-28:** Anti-drift fine-tuning recipe — SFT on real tasks, contrastive negatives, DPO/ORPO, hard gate evaluation set (scoped to M-14+)

## Notes

- Roadmap originally said "Llama 4" — scope expanded to full MaaS roster per Model Garden audit
- `callVertexOpenAI()` mirrors `callVertexMistral()` pattern but uses `publishers/openai` publisher path
- Tier 2-4 models use `endpoint: "predict"` as best guess — TODO comments flag for verification
