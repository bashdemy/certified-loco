# Testing Strategy

## Purpose

The highest risk is a plausible but wrong certification result, lost provenance, or an old assessment changing after catalogue edits. Test the rules, data integrity and evidence chain before testing visual detail.

This strategy uses free/open-source tools and tests the deployable shape locally where possible. It does not require live LLM calls. Cloudflare bindings are tested at their boundaries; core rules are tested without Cloudflare.

## Test layers

### Static checks

Run locally on every change:

- TypeScript type checking;
- lint and formatting checks;
- application build/import checks;
- migrations against an empty PostgreSQL database.

### Unit tests

Keep these fast and independent of network, database and clock. Cover:

- effective-date selection for regulations, standards and requirements;
- product classification and ambiguous/missing matches;
- requirement applicability by category and assessment date;
- historical/current test-programme diff;
- result states: `required`, `additional`, `changed`, `historical_only`, `review`;
- normalisation of test names, units and parameters;
- extraction-schema validation;
- permission decisions;
- assessment snapshot construction;
- content-hash decisions for ingestion, when ingestion exists.

Use table-driven cases for ordinary values, boundary dates, missing evidence, conflicting candidates and invalid input. Freeze time in tests.

### PostgreSQL integration tests

Use real PostgreSQL in a local Docker container. An in-memory database is not sufficient for transaction, constraint or locking behaviour. Reset a dedicated test database/schema between cases. Run migrations through the same schema used by Hyperdrive in deployment.

Cover:

- migrations, foreign keys and unique constraints;
- certificate revisions and immutable source metadata;
- draft -> published -> superseded regulatory datasets;
- validation failure during publish;
- immutable assessments referencing exact data revisions;
- optimistic-concurrency conflicts;
- audit rows with actor, request ID, action and before/after values;
- archive instead of hard delete;
- concurrent publish/update attempts.

These tests protect the rules in `data-integrity.md`.

### API tests

Exercise routes against the application and test PostgreSQL. Check the boundary, not framework internals:

- payload validation and error shape;
- authentication and role checks;
- create, revise and archive flows;
- review and publish flows;
- assessment creation and retrieval;
- evidence/provenance in the response;
- duplicate submissions and retries;
- request IDs in errors and audit records.

Put detailed rule coverage in unit/database tests; keep route coverage focused on contracts.

### Web tests

Use React Testing Library for states with domain meaning:

- insufficient evidence displays `review`, not a guessed answer;
- the selected regulation/dataset version is visible;
- published records cannot be edited;
- concurrency conflicts are actionable;
- certificate extraction is confirmed before assessment;
- Russian, Kazakh and English resource keys resolve;
- failed and retrying jobs are visible.

Do not test every CSS detail.

### Browser smoke tests

Use Playwright against a local Worker runtime and test database. Keep the suite small:

1. sign in as admin;
2. publish a valid requirement dataset;
3. enter a certificate and classify the product;
4. run an assessment;
5. inspect the diff and evidence;
6. publish a new dataset and confirm the old assessment is unchanged;
7. verify insufficient evidence produces `review`.

### Document fixtures

Keep a small versioned set of synthetic or redacted PDFs and structured extraction fixtures. Each fixture records its expected fields, source page/section and review state.

Test parsing and schema validation without a live model. If an LLM is introduced, test retry handling and the human-review boundary; save approved outputs as golden fixtures and change them only with a review reason.

## High-value properties (optional)

Use table-driven or property-based tests for rules that should always hold:

- identical immutable inputs produce identical assessments;
- publishing twice does not create two published versions;
- unrelated catalogue changes do not change an assessment;
- every non-`review` result has a complete provenance chain;
- later edits cannot change a completed assessment.

Use ordinary table-driven tests first. Add `fast-check` only if the date/version rules become difficult to cover manually.

## Free tooling

Use only what is needed:

- Vitest or Jest for unit tests;
- Supertest or the API framework's test client;
- React Testing Library;
- Docker PostgreSQL;
- Wrangler's local Worker runtime and binding test doubles;
- Playwright for one or two deployed-shape smoke tests.

CI is optional initially, but the same commands should run locally and in CI once the repository is shared.

All checks must remain runnable locally. CI should run the same commands, not a second test process.

## Manual regression checklist

Before a pilot, manually verify:

- a representative certificate and test programme;
- a regulation at an effective-date boundary;
- missing or ambiguous product classification;
- a requirement with missing evidence;
- an assessment after a new dataset is published;
- failed upload, failed extraction and retry;
- concurrent edits in two browser windows;
- rendered evidence and source links.

Record the input, expected result, actual result and follow-up issue. This becomes the first regression checklist.

## Implementation order

1. Add type/lint checks, a test runner and repeatable database reset.
2. Test assessment rules before the full UI.
3. Test publishing, revisions, snapshots, audit and concurrency against PostgreSQL.
4. Test the first assessment API flow.
5. Add one browser happy path and one `review` path.
6. Add document and retry tests only when ingestion begins.

Do not expand beyond the first product family or add LLM-assisted ingestion until these checks pass and a domain reviewer completes the manual checklist.
