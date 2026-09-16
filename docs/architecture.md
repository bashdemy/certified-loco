# Architecture

## Goal
`certified-loco` determines tests required to certify railway parts in Kazakhstan.

It combines structured regulatory requirements, historical certificates/test programmes, current standards and document extraction. Regulatory data is authoritative; AI output is not.

## System
```text
React + Vite
     |
Cloudflare Worker API
     |
 Hyperdrive
     |
 PostgreSQL
     |
 +-- R2: PDFs and attachments
 +-- Queue: asynchronous ingestion
```

### Web
React + Vite + TypeScript. Provides the authenticated CRM, assessments, catalogue maintenance, regulatory review and `ru`/`kk`/`en` localisation.

### API
TypeScript on Cloudflare Workers. Keep routes thin; business operations live in application/domain services.

Examples: `createCertificateRevision`, `publishRegulatoryDataset`, `runAssessment`, `approveRequirement`, `archivePart`.

### Database
PostgreSQL is the system of record. Use transactions for multi-record domain operations and optimistic concurrency for ordinary CRM edits. Drizzle is the initial query layer.

### Storage
R2 stores certificates, legislation, standards and attachments. Documents are immutable; replacements create revisions.

## Boundary
Start as a modular monolith. Document extraction is the first likely workload to move behind a queue/worker boundary.
