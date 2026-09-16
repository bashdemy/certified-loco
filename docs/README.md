# Technical Documentation

- [Architecture](architecture.md) — runtime and service boundaries.
- [Domain model](domain-model.md) — certification concepts.
- [Data integrity](data-integrity.md) — transactions, concurrency, revisions and audit.
- [Assessment engine](assessment-engine.md) — test determination.
- [Ingestion](ingestion.md) — documents, regulatory data and AI.
- [Testing strategy](testing-strategy.md) — free, risk-based checks for the POC.
- [Roadmap](roadmap.md) — implementation order.
- [AI implementation plan](implementation-plan-ai.md) — phased plan for a coding agent.
- [Owner implementation plan](implementation-plan-owner.md) — accounts, deployment and human decisions.
- [Authentication](authentication.md) — Cloudflare Access and application roles.

## Constraints

- PostgreSQL is the system of record.
- Regulatory data is versioned and reviewed.
- Assessments are reproducible snapshots.
- AI assists extraction/classification; it is not regulatory authority.
- Start as a modular monolith.
- The MVP is deployable through Cloudflare with PostgreSQL as the system of record.
- Deployed API access is authenticated through Cloudflare Access.
- Cloud services are added only at the boundary where they provide deployment or scale value.
