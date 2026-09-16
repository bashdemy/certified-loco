# AI Implementation Plan

## Purpose

This is the implementation sequence for an AI coding agent. Work in small, reviewable phases. Do not skip acceptance criteria, invent regulatory data or make infrastructure changes that require the owner's credentials.

## Working rules

1. Read the relevant docs before changing files.
2. Inspect the existing repository before choosing libraries or creating folders.
3. Keep domain logic independent of Cloudflare bindings and HTTP request objects.
4. Prefer the smallest implementation that satisfies the current phase.
5. Add or update tests with every domain or data change.
6. Do not use live websites or an LLM to decide authoritative requirements.
7. Do not add a dependency or paid service without recording why it is needed.
8. Stop and ask the owner when a decision involves credentials, real regulatory interpretation, personal data or production deployment.

## Phase 0 — Confirm the baseline

Inspect the repository, package manager, Node/TypeScript versions, existing configuration and documentation. Record any mismatch with `architecture.md` before coding.

**Done when:** the proposed file layout, runtime and package choices are written down and do not conflict with the architecture docs.

## Phase 1 — Application shell

Create the React/Vite web app and TypeScript Worker API in one deployable application. Add a health endpoint, a minimal page, environment configuration and Wrangler configuration. Keep `/api` routes separate from static asset handling.

**Verify:** local Worker runtime serves the web app and returns a successful health response.

## Phase 2 — Database foundation

Add PostgreSQL migrations and Drizzle configuration. Start with users, roles, audit events, parts, certificates, documents, regulations, standards, requirements and assessments. Add foreign keys, unique constraints, status fields, timestamps and revision relationships.

Add seed data for development only. Do not seed unverified regulatory requirements as authoritative.

**Verify:** a clean database can migrate, seed and roll back the test setup; integration tests use real PostgreSQL.

## Phase 3 — Authentication and CRM editing

Implement the smallest closed-system login flow and `admin`/`user` authorization. Add CRUD screens and API operations for parts, certificates, tests, standards and documents. Use revisions for important edits, archive instead of delete, and optimistic concurrency for editable records.

**Verify:** two simulated edits to the same record produce a clear conflict; every material change creates an audit event.

## Phase 4 — Regulatory datasets

Implement draft, review, publish and supersede states. Publishing must run in one transaction, validate references, prevent two current published versions and write an audit event. Users must only read the published dataset.

Use a small, reviewed fixture for the first product family. Store source and clause provenance with each requirement.

**Verify:** invalid references cannot publish; a published dataset cannot be edited in place; users see only published data.

## Phase 5 — Deterministic assessment

Implement the assessment service for the initial product families. It should:

1. use a confirmed certificate revision;
2. resolve a specific product category;
3. select the applicable published dataset by date;
4. retrieve current requirements;
5. retrieve comparable historical programmes;
6. calculate the diff;
7. persist an immutable assessment snapshot;
8. return evidence for each result.

Do not add PDF extraction or an LLM to this phase.

**Verify:** repeated runs with the same revisions produce the same result; changing later catalogue data does not change a completed assessment; insufficient evidence returns `review`.

## Phase 6 — Deployment adapters

Connect the deployed Worker to PostgreSQL through Hyperdrive and configure the R2 bucket. Keep credentials and bindings in deployment configuration, not source code. Add adapter tests for document upload, download and metadata lookup.

Do not introduce Queue processing until there is a document job to process.

**Verify:** a deployed smoke test can sign in, create a certificate revision, publish a dataset and run an assessment against the deployed database.

## Phase 7 — Document ingestion

Add R2 upload, a Queue-backed job, extraction status, retry handling and user confirmation. Begin with deterministic parsing and structured validation. Store reusable extraction results and provenance.

Only after this works may an LLM pre-fill fields or create candidate mappings. All AI-generated regulatory candidates remain pending review.

**Verify:** duplicate uploads are detected by hash; a failed job can retry; a retry cannot duplicate candidate records; a human can approve or reject the result.

## Phase 8 — Release hardening

Add the minimum browser smoke tests, migration check, error handling, backup/restore procedure and deployment checklist. Add more product families only after the first family passes the regression checklist.

**Final definition of done:** the deployed application supports authenticated CRM editing, reviewed regulatory publishing, one reproducible assessment flow, evidence links, audit history and a documented recovery path.

## AI handoff format

After each phase, report:

- files changed;
- decisions made;
- tests run and results;
- migrations or environment changes required;
- open risks or owner actions;
- the next phase.
