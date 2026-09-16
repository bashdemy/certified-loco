# certified-loco

Private web application for assessing railway-part certification requirements in Kazakhstan.

The repository contains one deployable Cloudflare Worker application with React/Vite web assets, a TypeScript API, PostgreSQL data access and Cloudflare integration adapters.

## Repository tree

```text
certified-loco/
├── src/
│   ├── web/              React/Vite UI
│   ├── domain/           Certification rules and domain types
│   ├── application/      Use cases and transaction boundaries
│   ├── db/               Drizzle schema and repositories
│   ├── infrastructure/   Cloudflare, auth and storage adapters
│   ├── shared/           Shared validation and API contracts
│   └── i18n/              Russian, Kazakh and English resources
├── worker/               Cloudflare Worker entrypoint and HTTP routes
├── db/
│   ├── migrations/       Database migrations
│   └── seeds/            Development and reviewed seed data
├── data/
│   ├── regulatory/       Reviewed regulatory source data
│   ├── samples/          Redacted or synthetic test documents
│   └── private/          Local-only data; never commit
├── tests/
│   ├── unit/             Pure domain and application tests
│   ├── integration/      PostgreSQL and adapter tests
│   ├── browser/          Small Playwright smoke tests
│   └── fixtures/         Shared test fixtures
├── public/               Static assets
└── docs/                 Planning and implementation documentation
```

See [`docs/README.md`](docs/README.md) for the implementation documentation.

## Formatting

Run `npm run format` to format source, styles, configuration and documentation. Run `npm run format:check` to verify formatting without changing files.
