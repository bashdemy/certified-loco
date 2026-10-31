# Roadmap

## 1. Foundation

React/Vite and TypeScript Worker shell, Wrangler configuration, `/api/health` endpoint, the first catalogue migration/API boundary, unit tests, Cloudflare Access authorization and audit events are in place. Certificate identity, immutable revisions and source-document metadata/R2 upload boundaries are now in place.

## 2. Knowledge CRM

CRUD/search for product categories, certificates, standards/versions, regulations/versions, tests, requirements and evidence are in place. Archive is used instead of hard delete, with optimistic concurrency and transactional audit events.

## 3. Regulatory publishing

Draft datasets, requirement review, validation, transactional publish and published/superseded history are in place.

## 4. First assessment

Scoped to `ТР ТС 001/2011`, locomotive wheelsets and wagon wheelsets. Manual certificate entry, revision confirmation, historical test programme lookup, current requirement lookup, diff, provenance/evidence chain and immutable assessment snapshots are in place.

## 5. Document ingestion

Add R2 upload, Queue-backed jobs, deterministic extraction where practical, user confirmation and reusable extraction results. Add an LLM only after the deterministic assessment path works and only for pre-filling or candidate generation.

## 6. Expand

Add brake discs, then other KazCSZHT-relevant component families based on real certificates and test programmes.
