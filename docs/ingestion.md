# Ingestion

## Sources
Initial sources include EAEU technical regulations/registers, KazCSZHT public material, applicable standards available to the project, and user-supplied historical certificates/test programmes.

Assessments must not depend on live external websites.

Manual certificate and test-programme entry is the first vertical slice. When PDF ingestion is added, use this deployable pipeline:

## Pipeline
```text
source document
 -> R2 immutable object
 -> Queue job
 -> Worker consumer
 -> extract
 -> normalise
 -> candidate records
 -> human review where required
 -> PostgreSQL
```

## Documents
Store content hash, source, retrieval/upload date, type, effective dates, language, R2 object key and extraction status. Do not repeatedly process unchanged documents. Replacements create new objects and revisions.

Jobs have explicit states, attempt counts, error details and timestamps. Claiming, retrying and completing a job must be idempotent. The queue is an ingestion boundary, not a general application messaging system.

## AI extraction
Do not use an LLM in the first deterministic assessment path. If later added, use it only to pre-fill certificate fields or create regulatory candidates. A human must confirm results before they affect an assessment.

## Localisation
UI resources: `ru`, `kk`, `en`. Do not use runtime LLM translation for UI strings.

Retain authoritative regulatory text in its source language; store human-approved translations separately when needed.
