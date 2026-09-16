# Architecture

## In one sentence

`certified-loco` is a private web application that helps certification staff compare a part's previous test programme with the regulatory requirements that apply today.

The system does not make legal decisions by itself. It shows the source, version and evidence behind each result so a qualified person can review it.

## What a user does

1. Sign in.
2. Maintain parts, tests, standards, regulations and certificates.
3. Enter or upload a certificate for a part.
4. Select or confirm the product category.
5. Run an assessment.
6. Review historical tests against the currently published requirements.
7. Open the evidence behind every recommendation.

Administrators maintain the catalogue and publish reviewed regulatory data. Ordinary users can use the published data without changing it.

## What runs where

```text
Browser
   |
Cloudflare Worker
   |-- React + Vite web application
   |-- TypeScript API
   |-- authentication and permissions
   |
   +--> Hyperdrive --> PostgreSQL
   +--> R2: certificates and source documents
   +--> Queue: long-running document work (later)
```

The first deployment is one Worker application, one PostgreSQL database and one R2 bucket. A queue is added when document extraction becomes part of the workflow; it is not needed for manual assessment entry.

## Why this stack

### React + Vite + TypeScript

The web app is an authenticated internal tool. It does not need search-engine rendering or a second server framework, so Next.js would add complexity without helping the core workflow.

TypeScript is used in the browser, API and shared validation/domain code so the project is easier to understand and troubleshoot.

### Cloudflare Worker

The Worker serves the web assets and API from one deployment. It is the boundary for HTTP, authentication, R2 and Queue integrations. The certification rules themselves must remain ordinary TypeScript and must not depend on Worker request objects.

### PostgreSQL

PostgreSQL stores the CRM and regulatory knowledge. It is needed for relationships, transactions, search, audit history and concurrent editing. Hyperdrive connects the deployed Worker to PostgreSQL without replacing PostgreSQL with a platform-specific database.

### R2

R2 stores PDFs and attachments. PostgreSQL stores the document metadata, content hash, source, provenance and review state. Replacing a document creates a revision; it never silently overwrites the old source.

### Localisation

UI labels, buttons, statuses and help text live in TypeScript localisation resources for `ru`, `kk` and `en`. Catalogue and regulatory names are different: they are domain content, so their human-approved translations live with the record in PostgreSQL and are selected using the active UI language. Runtime machine translation is not authoritative.

### Queue

Long-running work such as PDF extraction should not hold an API request open. A Queue-backed job can be retried and processed separately. This is a later boundary, not a reason to split the application into microservices now.

## Core application modules

Keep these modules in one application:

1. parts and catalogue;
2. certificates and revisions;
3. regulations, standards and published datasets;
4. assessments and evidence;
5. users, roles and audit;
6. document ingestion when it is needed.

Routes should be thin. Business operations should be explicit, such as `createCertificateRevision`, `publishRegulatoryDataset`, `runAssessment`, `approveRequirement` and `archivePart`.

## Data rules that must not be weakened

- Use transactions for publishing, revisions and finalising assessments.
- Use optimistic concurrency for ordinary CRM edits.
- Keep regulatory data in draft, published and superseded states.
- Store the exact data revisions used by every assessment.
- Record audit events for material changes.
- Archive important records instead of hard-deleting them.
- Do not depend on live websites during an assessment.
- Treat AI output as a candidate until a human approves it.
- Give every non-`review` result a complete evidence chain.

These rules provide the useful kind of scalability: multiple people can maintain the catalogue without corrupting history or changing completed results.

## MVP and later work

### MVP deployment

- React/Vite web app;
- TypeScript Worker API;
- authenticated `admin` and `user` roles;
- PostgreSQL through Hyperdrive;
- R2 document storage;
- CRM editing with revisions, audit and optimistic concurrency;
- reviewed regulatory dataset;
- manual certificate entry;
- first assessment flow for the initial product families.

### Later, only when justified

- Queue-backed PDF extraction;
- scheduled source synchronisation;
- LLM-assisted extraction or candidate mapping;
- more product families;
- advanced search or observability;
- separate services.

## Environments

- Local development uses the Worker/Vite development runtime and a Docker PostgreSQL database. R2 and Queue bindings use local emulation or test doubles.
- Deployment uses Cloudflare Worker, Hyperdrive, managed PostgreSQL and R2.

The database schema and migrations must be the same in both environments. Cloudflare bindings are tested at adapter boundaries; domain and assessment tests run without Cloudflare.

## Plain-language glossary

- **System of record:** the authoritative database for structured information.
- **Published dataset:** the reviewed set of requirements that assessments are allowed to use.
- **Revision:** a new version of a certificate or source document; old versions remain available.
- **Optimistic concurrency:** reject an edit when someone else changed the record after it was opened.
- **Evidence chain:** the regulation, provision, standard, clause and source that explain a result.
- **Adapter:** the small piece that connects business logic to Cloudflare, PostgreSQL, R2 or a Queue.
