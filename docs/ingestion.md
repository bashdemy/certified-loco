# Ingestion

## Sources
Initial sources include EAEU technical regulations/registers, KazCSZHT public material, applicable standards available to the project, and user-supplied historical certificates/test programmes.

Assessments must not depend on live external websites.

## Pipeline
```text
source document
 -> R2 immutable object
 -> queue
 -> extract
 -> normalise
 -> candidate records
 -> human review where required
 -> PostgreSQL
```

## Documents
Store content hash, source, retrieval/upload date, type, effective dates, language and extraction status. Do not repeatedly send unchanged documents to an LLM.

## AI extraction
AI output uses a validated structured schema. Regulatory extraction creates candidate records only. Certificate extraction may pre-fill CRM fields, which users confirm before assessment.

## Localisation
UI resources: `ru`, `kk`, `en`. Do not use runtime LLM translation for UI strings.

Retain authoritative regulatory text in its source language; store human-approved translations separately when needed.
