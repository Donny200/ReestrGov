# reestrTask

Spring Boot microservices with PostgreSQL, Eureka and an API Gateway. Secrets are not stored in the repository: provide them through the deployment environment or an untracked local `.env` file.

## Running the stack with Docker Compose

1. Create the local environment file and fill in the required values:

   ```shell
   cp .env.example .env
   ```

   `POSTGRES_PASSWORD`, `JWT_SECRET`, `APP_COOKIE_SECURE` and `APP_COOKIE_SAME_SITE` are mandatory; Compose refuses to start without them. `BOOTSTRAP_SUPER_ADMIN_EMAIL` and `BOOTSTRAP_SUPER_ADMIN_PASSWORD` are needed only for the very first start of an empty identity database.

2. Build and start everything:

   ```shell
   docker compose up --build -d
   docker compose logs -f
   ```

   Service containers wait for PostgreSQL to pass its health check before starting. The frontend is served by nginx on `http://localhost:3000` and proxies `/api/*` to the gateway on the same origin, so no CORS configuration is involved. The gateway stays reachable directly on `http://localhost:8082` and Eureka on `http://localhost:8761`.

3. Rebuild after code changes, or reset the stack:

   ```shell
   docker compose up --build -d front identity-service   # rebuild selected services
   docker compose down                                    # stop and remove containers, keep the database
   docker compose down -v --remove-orphans                # also delete the pgdata volume
   docker compose build --no-cache                        # ignore the Maven and npm layer caches
   docker builder prune -f                                # free BuildKit cache
   ```

## Local database and IntelliJ IDEA

Docker PostgreSQL is published on `localhost:5433`. The three application services use
`postgres:5432` inside Docker; their local Spring configuration uses `localhost:5433`
so that launching a service from IDEA connects to the same database. A native Windows
PostgreSQL on port `5432` is a separate instance.

| Database | Data to inspect |
| --- | --- |
| `adlita_project1` | `users`, `organizations`, `languages`, `permissions`, `roles`, `role_permissions` |
| `reference_service_db` | `regions`, `translation_keys`, `translations` |
| `function_catalog_db` | `org_functions` |

In IDEA's **Database** tool window, use host `localhost`, port `5433`, and the database
name above. Use `POSTGRES_USER` (default `postgres`) and `POSTGRES_PASSWORD` from your
local `.env`; save the password through IDEA's password storage, not in the JDBC URL.
Services launched outside Docker also use `POSTGRES_PASSWORD` by default. The optional
`IDENTITY_DB_PASSWORD`, `REFERENCE_DB_PASSWORD` and `FUNCTION_CATALOG_DB_PASSWORD`
variables override it for their respective services.

If IDEA was open when its connection files changed, reopen the project if the old
connections remain visible, then reconnect and use **Test Connection**. In a query
console, `SELECT version(), current_database();` should identify PostgreSQL 16.x and
the selected database. Do not rely on cached metadata from an older connection.

Double-click a table to view its rows. After saving through the application, use
**Reload Page** (`Ctrl+F5`) or set **Update Interval** in the table toolbar, for example
to 5 seconds. The interval refreshes that table's rows; the table tree alone does not
show newly inserted records. See the [IDEA data editor documentation](https://www.jetbrains.com/help/idea/data-editor-and-viewer.html).

Keep the existing Compose project name and `pgdata` volume. When applying only the
PostgreSQL port mapping, run `docker compose up -d --no-deps postgres`; database
connections briefly disconnect while the container is recreated. Do not use
`docker compose down -v` for this operation.

## Required security configuration

| Variable | Used by | Purpose |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | Docker Compose | PostgreSQL password shared with the service containers |
| `POSTGRES_USER` | Docker Compose | PostgreSQL user; defaults to `postgres` for local Compose only |
| `IDENTITY_DB_PASSWORD` | identity-service outside Compose | Identity database password |
| `REFERENCE_DB_PASSWORD` | reference-service outside Compose | Reference database password |
| `FUNCTION_CATALOG_DB_PASSWORD` | function-catalog-service outside Compose | Function catalog database password |
| `JWT_SECRET` | identity-service, reference-service, function-catalog-service | HMAC-SHA256 secret of at least 32 bytes used to sign and verify JWTs |
| `APP_COOKIE_SECURE` | identity-service | Use `true` for HTTPS deployments |
| `APP_COOKIE_SAME_SITE` | identity-service | Cookie SameSite policy selected for the deployment |

Standard Spring variables such as `SPRING_DATASOURCE_URL` and `SPRING_DATASOURCE_USERNAME` may override the non-secret local defaults. Docker Compose maps `POSTGRES_PASSWORD` to each service-specific database variable.

Generate the secret outside the repository. For example, an operator can run:

```shell
openssl rand -base64 48
```

Provide the same value to all three services through a secrets manager or the local `.env` file. Never commit it; `.gitignore` excludes `.env` files, private keys and keystores.

## First SUPER_ADMIN

There is no built-in email or password. On startup, if the database has no `ROLE_SUPER_ADMIN` user, identity-service requires:

- `BOOTSTRAP_SUPER_ADMIN_EMAIL`
- `BOOTSTRAP_SUPER_ADMIN_PASSWORD` — 16 to 200 characters

The password is BCrypt-hashed immediately, is never written to logs, and the new account receives `mustChangePassword=true`. That state is included in the signed access token; reference-service and function-catalog-service reject tokens whose flag is true or missing. Until the password is changed, authenticated backend access is restricted to the profile, password-change, logout and login flow, and no refresh token is issued. A successful password change replaces the access cookie and creates the first refresh cookie. Supply the initial password through a secrets manager and transmit it to the administrator through a separate secure channel.

After the first administrator has changed the password, remove `BOOTSTRAP_SUPER_ADMIN_PASSWORD` from the deployment environment or secret definition. It is bootstrap input, not a permanent application secret.

Demo account creation is unavailable in the production profile. It is opt-in under `dev` or `test` only and requires all three values:

- `APP_DEMO_USERS_ENABLED=true`
- `DEMO_SUPER_ADMIN_EMAIL`
- `DEMO_SUPER_ADMIN_PASSWORD`

## Local environment files

Root and nested `.env` files, `.env.*` variants, PEM private keys and keystores are ignored by Git. Example files named `.env.example` may be committed only with empty values or obvious non-secret placeholders. Check tracking before every commit:

```shell
git ls-files | grep -E '(^|/)\.env($|\.)|\.(pem|key|p12|pfx|jks)$'
```

## Required manual rotation after merge

Previously committed database passwords and the old shared HMAC JWT secret must be treated as compromised. DevOps must rotate the PostgreSQL password, generate a new JWT secret, replace deployment secrets and restart the services. During that coordinated rotation, revoke every existing refresh session (for example, run `UPDATE refresh_tokens SET revoked = TRUE WHERE revoked = FALSE;` against the identity database in an operator-controlled transaction). Otherwise an old opaque refresh token could obtain a newly signed access token. Every access and refresh token issued before the rotation must be treated as compromised and invalidated. Secret generation, rotation and deployment are intentionally not performed by this repository change.

## Function catalog tests

`function-catalog-service/src/test/resources/docker-java.properties` pins the Docker API version to 1.44 for the
Testcontainers client only, because Docker Engine 29 requires API 1.44 or newer.
