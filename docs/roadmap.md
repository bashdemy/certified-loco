# Roadmap

## 1. Foundation

React/Vite and TypeScript Worker shell, Wrangler configuration, `/api/health` endpoint, the first catalogue migration/API boundary, unit tests and Cloudflare Access authorization are in place. Next add audit events, then expand the CRM beyond product categories.

## 2. Knowledge CRM

CRUD/search for product categories, certificates, standards/versions, regulations/versions, tests, requirements and evidence. Archive instead of hard delete.

## 3. Regulatory publishing

Draft datasets, requirement review, validation, transactional publish and published/superseded history.

## 4. First assessment

Scope to `ТР ТС 001/2011`, locomotive wheelsets and wagon wheelsets. Implement manual certificate entry, historical lookup, current requirement lookup, diff, evidence and immutable assessment snapshots.

## 5. Document ingestion

Add R2 upload, Queue-backed jobs, deterministic extraction where practical, user confirmation and reusable extraction results. Add an LLM only after the deterministic assessment path works and only for pre-filling or candidate generation.

## 6. Expand

Add brake discs, then other KazCSZHT-relevant component families based on real certificates and test programmes.
