# Authentication

## Decision

Use Cloudflare Access for login. Start with email one-time PINs. The application does not store passwords or send login emails.

Cloudflare Access protects the deployed hostname. The Worker still validates the `Cf-Access-Jwt-Assertion` token using the Access signing keys, team domain and application audience.

## Roles

Access answers: “may this person enter the application?”

The application answers: “what may this authenticated person do?”

For this first slice:

- authenticated users can read the catalogue;
- emails listed in `ADMIN_EMAILS` can edit it;
- all other authenticated users are read-only;
- local requests to `localhost`, `127.0.0.1` or `::1` use a development admin identity only for local testing.

Production requests fail closed when Access configuration or a valid JWT is missing.

## Cloudflare setup

1. Create a self-hosted Access application for the deployed hostname.
2. Enable One-time PIN as a login method.
3. Add an Allow policy for specific email addresses or an approved email domain. Do not allow Everyone.
4. Copy the application Audience (AUD) tag.
5. Set Worker variables:

```text
ACCESS_TEAM_DOMAIN=https://your-team.cloudflareaccess.com
ACCESS_AUDIENCE=the-application-audience-tag
ADMIN_EMAILS=admin@example.com
```

Do not commit these values if the deployment configuration is private. `ADMIN_EMAILS` is a first-slice role map; move roles into PostgreSQL when user administration becomes a product feature.

## Local verification

Local API calls continue to work on `http://localhost:5173`. A deployed or non-local hostname must be behind Cloudflare Access before catalogue API calls will succeed.
