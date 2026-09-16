# Source layout

The application is one deployable Worker, but its responsibilities stay separated:

- `web/` — React/Vite browser code;
- `worker/` — HTTP entrypoint, routes and Cloudflare bindings;
- `domain/` — certification concepts and deterministic rules;
- `application/` — use cases and transaction boundaries;
- `db/` — PostgreSQL schema, queries and repositories;
- `infrastructure/` — auth, R2, Queue and other external adapters;
- `shared/` — validation schemas and API contracts;
- `i18n/` — UI translation resources.

Keep domain code independent of Worker request objects and Cloudflare bindings.
