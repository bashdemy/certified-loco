# Technical Documentation

- [Architecture](architecture.md) — runtime and service boundaries.
- [Domain model](domain-model.md) — certification concepts.
- [Data integrity](data-integrity.md) — transactions, concurrency, revisions and audit.
- [Assessment engine](assessment-engine.md) — test determination.
- [Ingestion](ingestion.md) — documents, regulatory data and AI.
- [Roadmap](roadmap.md) — implementation order.

## Constraints
- PostgreSQL is the system of record.
- Regulatory data is versioned and reviewed.
- Assessments are reproducible snapshots.
- AI assists extraction/classification; it is not regulatory authority.
- Start as a modular monolith.
