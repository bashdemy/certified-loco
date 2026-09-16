# Owner Implementation Plan

This is the part only the project owner should do. It covers accounts, secrets, data approval and production decisions that an AI coding agent must not make for you.

## 1. Confirm the product boundary

- Choose the first product families: locomotive wheelsets and wagon wheelsets are the current default.
- Confirm the first user roles: `admin` and `user`.
- Decide which people may approve regulatory requirements.
- Decide whether the first deployment is private to you or shared with a small team.
- Identify which certificates and source documents may legally be stored.

Do not begin with every Kazakh railway component. The first goal is one trustworthy end-to-end assessment.

## 2. Prepare accounts and services

Create or confirm:

- a Cloudflare account and the domain/subdomain for the application;
- a source-control repository;
- a managed PostgreSQL database compatible with Hyperdrive;
- an R2 bucket for source documents;
- an email delivery option if hosted email login is required.

Use the least expensive suitable plans. Do not add a hosted queue or LLM account until document ingestion reaches that phase.

## 3. Create the deployment secrets

Keep secrets outside the repository. Prepare values for:

- PostgreSQL connection/configuration;
- Hyperdrive binding;
- session or authentication secrets;
- email provider credentials, if used;
- application environment name;
- allowed application origin.

Use separate development and production values. Never paste secrets into tickets, prompts, seed files or committed configuration.

## 4. Prepare approved data

Collect a small, reviewable seed set:

- the first regulation and applicable version;
- the relevant standards and clauses;
- the first product categories;
- a small test catalogue;
- one or two historical certificates/test programmes;
- source page/section/clause for every requirement.

Mark uncertain mappings as pending review. The owner or a qualified reviewer must approve data before it is used in a published dataset.

## 5. Review the AI implementation output

For each phase, review the AI handoff. Specifically check:

- no secret or real personal data was committed;
- migrations preserve the intended history;
- published data cannot be edited in place;
- assessments reference exact revisions;
- audit entries identify who changed what and why;
- no AI output is treated as authoritative without review;
- tests cover the changed domain rule.

Do not approve the next phase when the current phase's acceptance criteria fail.

## 6. Configure the deployed application

When the implementation is ready:

1. Create the production PostgreSQL database.
2. Create the production R2 bucket.
3. Configure Hyperdrive for the database.
4. Add production secrets through the approved secret mechanism.
5. Configure the Worker route and application origin.
6. Run migrations against production.
7. Create the first admin account.
8. Deploy the Worker and static assets.
9. Confirm the health endpoint and login flow.

The AI can prepare configuration files and commands, but you must review and execute the credentialed deployment.

## 7. Run the first production smoke test

Using a non-sensitive test record:

1. sign in as admin;
2. create a part and certificate revision;
3. create a draft regulatory dataset;
4. publish it;
5. sign in as a user;
6. run an assessment;
7. open the evidence behind each result;
8. edit the catalogue and confirm the completed assessment does not change;
9. test an edit conflict in two browser windows;
10. review the audit history.

Do not use the system for real certification decisions until this checklist passes.

## 8. Establish operations

Before inviting users:

- record how to deploy and roll back;
- test database backup and restore;
- decide document retention and deletion rules;
- decide who can publish regulatory datasets;
- record a monthly cost check;
- rotate any temporary credentials;
- document how users report an incorrect result;
- keep a manual regulatory review process outside the application.

## 9. Add later services only by decision

The owner must explicitly approve each of these:

- Queue-backed document extraction;
- LLM usage and its data-handling rules;
- scheduled external data ingestion;
- additional product families;
- public or broader user access;
- paid monitoring or higher database/storage plans.

The trigger should be a measured workflow problem, not a preference for a more elaborate architecture.
