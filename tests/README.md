# Tests

- `unit/` — fast domain and application tests;
- `integration/` — PostgreSQL and external-adapter tests;
- `browser/` — a small number of end-to-end smoke tests;
- `fixtures/` — synthetic or redacted data shared by tests.

Keep real certificates, credentials and private documents out of this directory.

Run the current unit suite with:

```bash
npm test
```

Database integration tests will be added separately and must use a dedicated test database.
