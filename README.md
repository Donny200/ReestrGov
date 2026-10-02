# ReestrGov

**Enterprise Government Registry & Service Gateway Platform**

![Java 17](https://img.shields.io/badge/Java-17-007396?logo=openjdk&logoColor=white)
![Spring Boot 3.5](https://img.shields.io/badge/Spring%20Boot-3.5.4-6DB33F?logo=springboot&logoColor=white)
![Spring Cloud 2025.0](https://img.shields.io/badge/Spring%20Cloud-2025.0.0-6DB33F?logo=spring&logoColor=white)
![Spring Cloud Gateway](https://img.shields.io/badge/Spring%20Cloud-Gateway-6DB33F?logo=spring&logoColor=white)
![Netflix Eureka](https://img.shields.io/badge/Netflix-Eureka-E50914?logo=netflix&logoColor=white)
![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Flyway](https://img.shields.io/badge/Flyway-migrations-CC0200?logo=flyway&logoColor=white)
![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS 3.4](https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose%20v2-2496ED?logo=docker&logoColor=white)
![Nginx 1.27](https://img.shields.io/badge/Nginx-1.27-009639?logo=nginx&logoColor=white)

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [System architecture](#2-system-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Environment configuration](#4-environment-configuration)
5. [Quick start with Docker Compose](#5-quick-start-with-docker-compose)
6. [Local development without Docker](#6-local-development-without-docker)
7. [Security model](#7-security-model)
8. [Testing](#8-testing)
9. [Troubleshooting](#9-troubleshooting)
10. [Clean code and contribution standards](#10-clean-code-and-contribution-standards)
11. [Repository layout](#11-repository-layout)

---

## 1. Executive summary

ReestrGov is a registry of public services ("functions") offered by government organizations. Citizens browse a public, multilingual catalog of organizations and services. Staff members sign in to an administrative console to manage organizations, staff accounts, roles and permissions, interface languages and translations, and to run an editorial workflow for service cards (draft, review, publish, deactivate, reactivate) with optional machine translation through Azure Translator.

The platform is a set of Spring Boot microservices behind a Spring Cloud Gateway, registered in a Netflix Eureka service registry, each owning its own PostgreSQL database and Flyway migration history. A React single-page application, built with Vite and served by Nginx, talks to the gateway through a same-origin `/api/` proxy so that HttpOnly authentication cookies work without any CORS configuration in the browser.

| Layer | Technology |
| --- | --- |
| Backend runtime | Java 17, Spring Boot 3.5.4, Spring Cloud 2025.0.0 |
| Service discovery and routing | Netflix Eureka, Spring Cloud Gateway (WebFlux), Spring Cloud LoadBalancer |
| Security | Spring Security 6, stateless HMAC-SHA256 JWT (jjwt 0.12.6), HttpOnly cookies, BCrypt |
| Persistence | PostgreSQL 16, Spring Data JPA, Flyway, Caffeine cache (reference-service) |
| API documentation | springdoc-openapi (Swagger UI at `/swagger` on each service) |
| Frontend | React 18, Vite 8, TypeScript 5 (strict), Tailwind CSS 3.4, Radix UI, TanStack Query and Table, react-hook-form, zod, framer-motion |
| Frontend testing | Playwright (route-mocked UI suite and a real-backend suite) |
| Backend testing | JUnit 5, Spring Boot Test, H2 (identity tests), Testcontainers and Playwright browser IT (function catalog) |
| Packaging | Multi-stage Dockerfiles, BuildKit cache mounts, non-root runtime users, Nginx 1.27 for the SPA |

---

## 2. System architecture

```
                 ┌──────────────────────────────────────────────────────────┐
  Browser ──────►│  front  (Nginx 1.27, host port 3000)                     │
                 │  static SPA  +  /api/*  ───proxy───►  api-gateway:8082   │
                 └──────────────────────────────┬───────────────────────────┘
                                                │
                 ┌──────────────────────────────▼───────────────────────────┐
                 │  api-gateway  (Spring Cloud Gateway, port 8082)          │
                 │  path routing via lb:// + Eureka, global CORS            │
                 └───────┬──────────────────────┬────────────────────┬──────┘
                         │                      │                    │
     /api/regions/**     │   /api/functions/**  │   /api/** (rest)   │
     /api/interface-     │                      │                    │
       translations/**   │                      │                    │
     /api/translation-   │                      │                    │
       keys/**           ▼                      ▼                    ▼
   ┌─────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────┐
   │ reference-service :8084 │ │ function-catalog :8085   │ │ identity-service     │
   │ regions, UI dictionary, │ │ service cards, editorial │ │ :8081                │
   │ translation keys        │ │ workflow, categories,    │ │ auth, users, roles,  │
   │                         │ │ audit, Azure translate   │ │ permissions, orgs,   │
   │ reference_service_db    │ │ function_catalog_db      │ │ languages            │
   └─────────────────────────┘ └──────────────────────────┘ │ adlita_project1      │
                         ▲                      ▲           └──────────┬───────────┘
                         │                      │                      │
                         └───── register / discover ───────────────────┘
                                                │
                                 ┌──────────────▼──────────────┐
                                 │ eureka-server :8761         │
                                 └─────────────────────────────┘

                       PostgreSQL 16  (container 5432, host 5433, volume pgdata)
```

### 2.1 Service catalogue

| Module | Port | Role | Datastore |
| --- | --- | --- | --- |
| `eureka-server` | 8761 | Service registry and discovery. Does not register itself; self-preservation is disabled for fast local turnaround. | none |
| `api-gateway` | 8082 | Single public entry point. Routes by path to `lb://` service IDs resolved through Eureka, applies global CORS for the dev origins (`localhost:3000`, `localhost:5173`) with credentials, and dedupes CORS response headers. | none |
| `identity-service` | 8081 | Authentication (login, refresh, logout, password change), JWT issuance, user and staff management, organizations, roles, permissions and the interface-language registry. Bootstraps the first `SUPER_ADMIN`. | `adlita_project1` |
| `reference-service` | 8084 | Reference data: regions, interface translation dictionaries per language and translation keys with coverage and gap reports. Caches lookups with Caffeine. | `reference_service_db` |
| `function-catalog-service` | 8085 | Public and administrative catalog of services ("functions"), categories, editorial workflow with permissions, audit trail, CSV import, manual and Azure-powered translations. | `function_catalog_db` |
| `front` | 3000 → 80 | Vite/React SPA served by Nginx with gzip, immutable asset caching, SPA fallback, `/healthz` and a same-origin `/api/` reverse proxy to `api-gateway:8082`. | none |
| `postgres` | 5433 → 5432 | PostgreSQL 16 with an init script that creates the three databases on first start. | volume `pgdata` |

### 2.2 Gateway routing

Routes are declared in `api-gateway/src/main/resources/application.yml` and evaluated top to bottom. The identity route is the catch-all, so new services must be added above it.

| Order | Route ID | Path predicates | Target |
| --- | --- | --- | --- |
| 1 | `reference-service` | `/api/regions/**`, `/api/interface-translations/**`, `/api/translation-keys/**` | `lb://reference-service` |
| 2 | `function-catalog-service` | `/api/functions/**` | `lb://function-catalog-service` |
| 3 | `identity-service` | `/api/**` | `lb://identity-service` |

The gateway is intentionally thin. JWT verification and authorization happen inside each downstream service, not at the gateway, and no request rate limiting is configured. If a gateway-level token check or a rate limiter is required for a deployment, add a `GlobalFilter` or the `RequestRateLimiter` filter in the gateway module and document the change here.

### 2.3 REST surface at a glance

| Service | Base paths |
| --- | --- |
| identity-service | `/api/auth` (login, refresh, logout, me, change-password), `/api/user`, `/api/admin/moderators`, `/api/admin/org-admins`, `/api/organizations`, `/api/public/organizations`, `/api/roles` (incl. `/assign`, `/{id}/permissions`), `/api/permissions`, `/api/languages` (incl. `/catalog`) |
| reference-service | `/api/regions`, `/api/interface-translations/{languageCode}` (plus `/exact`, `/missing`, `/coverage`), `/api/translation-keys` |
| function-catalog-service | `/api/functions` (public list and detail, `/admin`, `/{id}/admin`, `/pending-review`, `/{id}/submit-for-review`, `/{id}/publish`, `/{id}/reject`, `/{id}/reactivate`, `/{id}/requirements`, `/{id}/translations`, `/{id}/translate`, `/{id}/audit`, `/import`, `/translation-capabilities`), `/api/functions/categories` |

Each service exposes Swagger UI at `http://localhost:<port>/swagger` and the OpenAPI document at `/v3/api-docs`.

### 2.4 Frontend application

The SPA lives in `front/` and is organized by feature:

- `src/components/ui` is the design system (Button, Card, DataTable, Field, Input, Select, Modal, DropdownMenu, Tooltip, Badge, Skeleton, Toolbar, ThemeToggle) built on Tailwind tokens, Radix primitives and class-variance-authority.
- `src/features/*` holds TanStack Query hooks, zod schemas and dialogs per domain (functions, organizations, staff, roles, legacy users, languages, reference).
- `src/pages` contains the public pages (`/`, `/organizations/:id`, `/functions/:id`), `/login`, and the admin console (`/admin`, `/admin/functions`, `/admin/functions/new`, `/admin/functions/:id`, `/admin/organizations`, `/admin/moderators`, `/admin/org-admins`, `/admin/roles`, `/admin/languages`, `/admin/users`, `/settings/security`).
- `src/contexts` provides authentication, theme (light, dark, system) and i18n. The UI dictionary is loaded from reference-service per locale and every label is resolved with `t('key', 'fallback')`.
- `src/services/http.ts` is the single HTTP client. It always sends `credentials: 'include'`, never stores tokens, maps backend `fieldErrors` to form errors and performs a single in-flight token refresh on `401`.

---

## 3. Prerequisites

| Tool | Version | Needed for |
| --- | --- | --- |
| Docker Desktop (or Docker Engine) with Compose v2 | Docker 24+, Compose 2.20+ | Running the full stack; BuildKit cache mounts in the Dockerfiles |
| Node.js | `^20.19.0 \|\| >=22.12.0` (see `front/package.json` `engines`) | Local frontend development and Playwright tests |
| JDK | 17 (Temurin or Microsoft Build of OpenJDK) | Local backend development and Maven builds |
| Maven | 3.9+ | Local backend builds (`mvn`) |
| PostgreSQL client (optional) | `psql` 16 | Inspecting databases on `localhost:5433` |

Docker Engine 29 or newer requires Docker API 1.44; the function-catalog tests pin that version for the Testcontainers client (see [Testing](#8-testing)).

---

## 4. Environment configuration

All secrets are supplied through the environment. Nothing sensitive is committed; `.gitignore` excludes `.env`, `.env.*`, PEM keys and keystores while keeping `.env.example`.

Create the file once:

```shell
cp .env.example .env
```

Docker Compose reads the root `.env` automatically. Services started from an IDE or with Maven also read it because each service declares `spring.config.import: optional:file:.env[.properties],optional:file:../.env[.properties]`.

### 4.1 Variables

| Variable | Required | Used by | Description |
| --- | --- | --- | --- |
| `POSTGRES_USER` | no (default `postgres`) | postgres, all data services | PostgreSQL superuser used by the init script and the services |
| `POSTGRES_PASSWORD` | **yes** | postgres, all data services | Password for `POSTGRES_USER`. Compose refuses to start without it |
| `JWT_SECRET` | **yes** | identity, reference, function-catalog | Shared HMAC-SHA256 key. Must be at least 32 bytes (256 bits). Generate with `openssl rand -base64 48` |
| `APP_COOKIE_SECURE` | **yes** | identity-service | `false` for the local HTTP stack behind the same-origin Nginx proxy, `true` for any HTTPS deployment |
| `APP_COOKIE_SAME_SITE` | **yes** | identity-service | `Lax` for same-origin setups, `None` (with `APP_COOKIE_SECURE=true`) when the SPA is served from another origin |
| `BOOTSTRAP_SUPER_ADMIN_EMAIL` | first start only | identity-service | E-mail of the initial `SUPER_ADMIN`. Required while the identity database has no `ROLE_SUPER_ADMIN` user |
| `BOOTSTRAP_SUPER_ADMIN_PASSWORD` | first start only | identity-service | Initial password, BCrypt-hashed immediately and flagged `mustChangePassword`. Remove after the first login |
| `AZURE_TRANSLATOR_ENDPOINT` | no | function-catalog-service | Azure Translator endpoint; empty disables automatic translation |
| `AZURE_TRANSLATOR_KEY` | no | function-catalog-service | Azure Translator key |
| `AZURE_TRANSLATOR_REGION` | no | function-catalog-service | Azure Translator region |
| `IDENTITY_DB_PASSWORD` | no | identity-service outside Compose | Overrides `POSTGRES_PASSWORD` for the identity database |
| `REFERENCE_DB_PASSWORD` | no | reference-service outside Compose | Overrides `POSTGRES_PASSWORD` for the reference database |
| `FUNCTION_CATALOG_DB_PASSWORD` | no | function-catalog-service outside Compose | Overrides `POSTGRES_PASSWORD` for the catalog database |
| `VITE_API_BASE_URL` | no | front (build argument) | Public gateway origin when the SPA is not served behind the Nginx or Vite `/api` proxy. Leave empty for Compose |
| `APP_DEMO_USERS_ENABLED`, `DEMO_SUPER_ADMIN_EMAIL`, `DEMO_SUPER_ADMIN_PASSWORD` | no | identity-service, dev/test only | Opt-in demo account creation. Never enable in production |

Standard Spring properties such as `SPRING_DATASOURCE_URL` and `SPRING_DATASOURCE_USERNAME` may override the non-secret defaults. Compose sets them per service as shown below.

### 4.2 Ports and database URIs

| Service | Container port | Host port | Datasource inside Compose | Datasource outside Compose (default in `application.yml`) |
| --- | --- | --- | --- | --- |
| postgres | 5432 | 5433 | n/a | n/a |
| eureka-server | 8761 | 8761 | n/a | n/a |
| api-gateway | 8082 | 8082 | n/a | n/a |
| identity-service | 8081 | 8081 | `jdbc:postgresql://postgres:5432/adlita_project1` | `jdbc:postgresql://localhost:5433/adlita_project1` |
| reference-service | 8084 | 8084 | `jdbc:postgresql://postgres:5432/reference_service_db` | `jdbc:postgresql://localhost:5433/reference_service_db` |
| function-catalog-service | 8085 | 8085 | `jdbc:postgresql://postgres:5432/function_catalog_db` | `jdbc:postgresql://localhost:5433/function_catalog_db` |
| front | 80 | 3000 | n/a | Vite dev server on 5173 proxies `/api` to `localhost:8082` |

Inside Compose every Spring service discovers the registry through `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server:8761/eureka`; outside Compose the default is `http://localhost:8761/eureka`.

### 4.3 Example `.env`

```dotenv
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me-locally

# openssl rand -base64 48
JWT_SECRET=REPLACE_WITH_A_RANDOM_BASE64_STRING_OF_AT_LEAST_32_BYTES

APP_COOKIE_SECURE=false
APP_COOKIE_SAME_SITE=Lax

BOOTSTRAP_SUPER_ADMIN_EMAIL=admin@example.uz
BOOTSTRAP_SUPER_ADMIN_PASSWORD=REPLACE_WITH_A_LONG_RANDOM_INITIAL_PASSWORD

AZURE_TRANSLATOR_ENDPOINT=
AZURE_TRANSLATOR_KEY=
AZURE_TRANSLATOR_REGION=
```

---

## 5. Quick start with Docker Compose

### Step 1: clone and configure

```shell
git clone <repository-url> ReestrGov
cd ReestrGov
cp .env.example .env
openssl rand -base64 48          # paste the output into JWT_SECRET
```

Fill in `POSTGRES_PASSWORD`, `JWT_SECRET`, `APP_COOKIE_SECURE`, `APP_COOKIE_SAME_SITE` and, for the first start, both `BOOTSTRAP_SUPER_ADMIN_*` values.

### Step 2: clean build

```shell
docker compose down --remove-orphans
docker compose build --no-cache
```

Each Java image is a two-stage build: `maven:3.9-eclipse-temurin-17` resolves plugins and dependencies into a BuildKit cache mount (`/root/.m2`), then packages the jar with `-DskipTests`; the runtime stage is `eclipse-temurin:17-jre` running as the non-root user `app`. The frontend image runs `npm ci` and `npm run build` on `node:22-alpine` and copies `dist/` into `nginx:1.27-alpine`. Subsequent builds reuse the cache unless `--no-cache` is given.

### Step 3: launch the stack

```shell
docker compose up -d
```

Start order is enforced by `depends_on`: the data services wait for the PostgreSQL health check (`pg_isready`), the gateway waits for the services, and the frontend waits for the gateway. Every container has `restart: unless-stopped`.

### Step 4: verify health and logs

```shell
docker compose ps
docker compose logs -f                       # everything
docker compose logs -f identity-service      # one service
curl -s http://localhost:3000/healthz        # nginx -> "ok"
open http://localhost:8761                   # Eureka dashboard, all four services should be UP
```

| URL | What you should see |
| --- | --- |
| `http://localhost:3000` | The public catalog; `/login` opens the admin console |
| `http://localhost:8761` | Eureka dashboard listing `API-GATEWAY`, `IDENTITY-SERVICE`, `REFERENCE-SERVICE`, `FUNCTION-CATALOG-SERVICE` |
| `http://localhost:8082/api/public/organizations` | JSON through the gateway |
| `http://localhost:8081/swagger`, `:8084/swagger`, `:8085/swagger` | Swagger UI per service |

Sign in with the bootstrap administrator. The account is forced to change its password before any other backend call succeeds; after that, delete `BOOTSTRAP_SUPER_ADMIN_PASSWORD` from `.env`.

### Everyday commands

```shell
docker compose up --build -d front identity-service   # rebuild and restart selected services
docker compose restart api-gateway                     # restart without rebuilding
docker compose down                                    # stop and remove containers, keep the database
docker compose down -v --remove-orphans                # also delete the pgdata volume (destroys all data)
docker builder prune -f                                # free BuildKit cache
docker compose config                                  # validate the merged Compose file
```

---

## 6. Local development without Docker

### 6.1 Database

Use the Compose PostgreSQL only:

```shell
docker compose up -d postgres
```

It is published on `localhost:5433` and contains `adlita_project1`, `reference_service_db` and `function_catalog_db`. A native PostgreSQL on 5432 is a separate instance and is not used by the default configuration.

### 6.2 Backend services

Set `JAVA_HOME` to a JDK 17 and start the services from the repository root, each in its own terminal, in this order:

```shell
export JAVA_HOME=$(/usr/libexec/java_home -v 17)   # macOS example

(cd eureka-server && mvn clean spring-boot:run)
(cd identity-service && mvn clean spring-boot:run)
(cd reference-service && mvn clean spring-boot:run)
(cd function-catalog-service && mvn clean spring-boot:run)
(cd api-gateway && mvn clean spring-boot:run)
```

Each service reads the root `.env` through `spring.config.import`, connects to `localhost:5433` and registers with Eureka on `localhost:8761`. The root `pom.xml` is an aggregator, so `mvn -q -DskipTests package` from the root builds all five modules.

IntelliJ IDEA: open the root `pom.xml` as a Maven project, set the project SDK to 17 and run the `*Application` classes. In the **Database** tool window connect to `localhost:5433` with `POSTGRES_USER` and `POSTGRES_PASSWORD`; store the password in IDEA's password safe, not in the JDBC URL.

### 6.3 Frontend

```shell
cd front
npm install
npm run dev          # http://localhost:5173, /api proxied to http://localhost:8082
```

Vite proxies `/api` to the gateway, so cookies are same-origin and no CORS setup is required. The gateway and identity-service already allow `http://localhost:5173` with credentials for direct calls.

Other scripts:

```shell
npm run typecheck    # tsc for the app and for the Playwright tests
npm run lint         # ESLint, zero warnings expected
npm run build        # production bundle into dist/
npm run preview      # serve dist/ locally
```

---

## 7. Security model

- **Stateless JWT with HttpOnly cookies.** `POST /api/auth/login` sets `accessToken` (24 h, path `/`) and `refreshToken` (7 days, path `/api/auth`) as HttpOnly cookies. The SPA never reads or stores tokens. `POST /api/auth/refresh` rotates the refresh token; `POST /api/auth/logout` revokes it.
- **One shared HMAC key.** identity-service signs tokens with `JWT_SECRET`; reference-service and function-catalog-service verify them locally with the same key, so no network call is needed per request.
- **Mandatory password change.** The signed token carries `mustChangePassword`. identity-service restricts such sessions to profile, password change, logout and login; the other services reject tokens whose flag is true or missing. A successful change issues fresh cookies.
- **Disabled users are rejected** at the JWT filter even if they hold a valid token.
- **RBAC.** Roles own permissions; editorial endpoints use `@PreAuthorize("hasAuthority(...)")` such as `FUNCTIONS_REVIEW`, `FUNCTIONS_PUBLISH`, `FUNCTIONS_REACTIVATE`, `FUNCTION_CATEGORIES_MANAGE` and `AUDIT_VIEW`. Organization administrators are scoped to their own organizations.
- **Public endpoints.** Anonymous access is limited to `GET /api/public/**`, `GET /api/languages`, `GET /api/languages/catalog`, `GET /api/regions/**`, `GET /api/interface-translations/{language}`, the public `GET /api/functions/**` reads (admin, pending-review and audit variants excluded), the auth entry points and Swagger. Everything else requires authentication.
- **No baked-in credentials.** The first administrator comes from `BOOTSTRAP_SUPER_ADMIN_EMAIL` and `BOOTSTRAP_SUPER_ADMIN_PASSWORD`; identity-service refuses to start without them while no `SUPER_ADMIN` exists. Demo accounts exist only when `APP_DEMO_USERS_ENABLED=true` under a non-production profile.
- **Secret rotation.** When `JWT_SECRET` or the database password changes, redeploy all three data services together and revoke outstanding refresh sessions (`UPDATE refresh_tokens SET revoked = TRUE WHERE revoked = FALSE;` in the identity database) so an old refresh token cannot mint a newly signed access token.

Check before every commit that no secret file is tracked:

```shell
git ls-files | grep -E '(^|/)\.env($|\.)|\.(pem|key|p12|pfx|jks)$'
```

---

## 8. Testing

### Backend

| Module | What runs | Infrastructure |
| --- | --- | --- |
| identity-service | Unit and `@SpringBootTest` suites with the `test` profile (`application-test.yaml`): in-memory H2 in PostgreSQL mode, Flyway disabled, Eureka disabled | none |
| reference-service | Unit and web-layer tests | none |
| function-catalog-service | Unit tests, `CatalogPostgresTest` (Testcontainers PostgreSQL) and `AdminFunctionsBrowserIT` (Playwright browser flow against a real Spring context) | Docker daemon |

```shell
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
(cd identity-service && mvn -q test)
(cd reference-service && mvn -q test)
(cd function-catalog-service && mvn -q test)                                           # needs Docker
(cd function-catalog-service && mvn -q test -Dtest='!CatalogPostgresTest,!AdminFunctionsBrowserIT')   # without Docker
```

`function-catalog-service/src/test/resources/docker-java.properties` pins the Docker API version to 1.44 for the Testcontainers client because Docker Engine 29 requires it.

### Frontend

```shell
cd front
npx playwright install chromium   # once
npm run test                      # UI suite: tests/admin-functions.spec.ts against route mocks
npm run test:backend              # real-backend suite, driven by AdminFunctionsBrowserIT
```

The UI suite starts Vite on port 5183 in-process (`tests/start-vite.mjs`) and mocks every `/api/**` call in `tests/fixtures.ts`, loading the UI dictionary from the reference-service migrations so the labels match production. The backend suite requires `CATALOG_TEST_URL` and `CATALOG_TEST_JWT`, which the Java integration test supplies.

### Definition of done

```shell
cd front && npm run typecheck && npm run lint && npm run build && npm run test
```

together with green Maven test runs for the changed services.

---

## 9. Troubleshooting

### PostgreSQL health check never passes or services fail to connect

- Symptom: `dependency failed to start: container postgres is unhealthy` or repeated `Connection refused` in a service log.
- The health check runs `pg_isready -h 127.0.0.1 -U $POSTGRES_USER -d postgres` every 5 s with a 10 s start period and 12 retries. On slow disks the first initialization (creating three databases) can exceed that window. Run `docker compose logs postgres`; if the init script is still running, wait and `docker compose up -d` again.
- If the log shows `FATAL: password authentication failed`, the `pgdata` volume was initialized with a different `POSTGRES_PASSWORD`. Either restore the old value or reset the database (see below).
- If `init-multiple-dbs.sh` fails with `/bin/bash^M: bad interpreter`, the file was checked out with CRLF line endings. Convert it to LF (`git config core.autocrlf input` and re-checkout, or `sed -i '' 's/\r$//' init-multiple-dbs.sh`).
- Port `5433` already in use: change the host side of the `postgres` port mapping in `docker-compose.yml` and the `localhost:5433` URLs in the three `application.yml` files for local runs.
- Connection pool exhaustion (`HikariPool ... Connection is not available`) usually means a service is restarting in a loop while PostgreSQL is still warming up. Check `docker compose ps` for restart counts and fix the underlying error in that service first.

### Maven dependency resolution fails inside Docker (401 Unauthorized)

- Symptom: `docker compose build` fails in the `mvn dependency:go-offline` step with `401 Unauthorized` from `maven.pkg.github.com` or `repo.gradle.org`.
- Cause: the Flyway parent POM declares extra repositories for its optional modules. `dependency:go-offline` tries to resolve *every* optional and transitive artifact, including ones that only exist in those private repositories, and fails the whole build.
- Resolution applied in all five Dockerfiles: the warm-up layer is now `mvn -B -q -Dsilent=true dependency:resolve-plugins dependency:resolve || true`. It resolves only what the project actually needs, tolerates misses, and the real `mvn clean package -DskipTests` step pulls anything missing from Maven Central. Both steps share the `/root/.m2` BuildKit cache mount, so rebuilds stay fast.
- If a build still hangs on dependency downloads, run `docker builder prune -f` and rebuild with `--no-cache`; a corrupted cache mount can keep a half-downloaded artifact.

### Resetting the databases

```shell
docker compose down -v --remove-orphans
docker compose up -d
```

> **Warning.** `-v` deletes the `pgdata` volume and therefore every organization, user, role, translation and service card. identity-service will again require `BOOTSTRAP_SUPER_ADMIN_EMAIL` and `BOOTSTRAP_SUPER_ADMIN_PASSWORD` on the next start. To change only a port mapping or an environment variable, use `docker compose up -d --no-deps <service>` instead.

### Other common issues

| Symptom | Cause and fix |
| --- | --- |
| `JWT_SECRET is required` or `POSTGRES_PASSWORD is required` on `docker compose up` | The root `.env` is missing or empty. Compose uses `${VAR:?message}` guards for mandatory values. |
| identity-service exits with `No SUPER_ADMIN exists. Set environment variable BOOTSTRAP_SUPER_ADMIN_...` | Fresh identity database. Provide both bootstrap variables for the first start. |
| Login succeeds but the next request is `401` | Cookie policy mismatch. On plain HTTP use `APP_COOKIE_SECURE=false` and `APP_COOKIE_SAME_SITE=Lax`; on HTTPS from a different origin use `true` and `None`. |
| Gateway returns `503 Service Unavailable` right after start | Eureka registration and client cache refresh take up to 30 s. Wait until the service shows `UP` on `http://localhost:8761`. |
| `JWT_SECRET` rejected as too short | The HMAC-SHA256 key needs at least 32 bytes. Use `openssl rand -base64 48`. |
| Testcontainers fails with `client version 1.xx is too old` | Docker Engine 29 needs API 1.44. The property file in `function-catalog-service/src/test/resources` already pins it; make sure the tests pick it up (`-Dtest` runs still read it). |
| `npm run dev` fails with an engine warning | Use Node `^20.19.0 \|\| >=22.12.0`. Vite 8 does not support older Node 20 releases. |
| Playwright cannot find Chromium | Run `npx playwright install chromium` inside `front/`. |
| Flyway `Migration checksum mismatch` | A migration file that has already been applied was edited. Never modify applied migrations; add a new `V<n>__*.sql` instead, or repair a local database with `docker compose down -v`. |
| Automatic translation button is missing in the editor | `AZURE_TRANSLATOR_*` is empty. The capability endpoint reports `available: false` and the UI hides the action by design. |

---

## 10. Clean code and contribution standards

**General**

- The code is the documentation: no inline or block comments, no commented-out code, no TODO markers. Express intent through naming and small methods instead. README and `docs/` carry the narrative.
- Zero dead code: unused classes, methods, imports, props, CSS classes and feature flags are removed in the same change that makes them unused.
- One responsibility per class, hook or component. Shared behaviour is extracted, never copy-pasted (for example `menuStyles.ts` for popover surfaces, `utils/filters.ts` for status filters).
- Every change ships with its tests and leaves `typecheck`, `lint`, `build`, Playwright and Maven suites green.

**Spring Boot**

- Java 17 features: records for DTOs and value objects, `var` only where the type is obvious, switch expressions, text blocks for SQL in tests.
- Constructor injection via Lombok `@RequiredArgsConstructor`; no field injection, no `@Autowired`.
- Controllers are thin and validate input with Jakarta Bean Validation; business rules live in services; persistence stays behind Spring Data repositories.
- Errors are translated by a single `GlobalExceptionHandler` per service into a stable JSON shape with `message` and, for validation failures, a `fieldErrors` map the frontend maps onto form fields.
- Security is stateless: no sessions, CSRF disabled for the cookie-plus-JWT model, every protected endpoint declares its authority.
- Flyway migrations are append-only. Applied migration files are never edited (checksums are enforced); schema changes get a new versioned script.
- Configuration is externalized through `application.yml` placeholders bound to environment variables; secrets never have defaults.

**React / TypeScript**

- `strict`, `noUnusedLocals`, `noUnusedParameters` and `noFallthroughCasesInSwitch` are on; `any` is not used.
- ESLint (`eslint:recommended`, `@typescript-eslint/recommended`, `react-hooks`, `react-refresh`) must report zero warnings. Non-component exports live in their own modules so Fast Refresh keeps working.
- Components are function components with explicit prop interfaces; shared UI lives in `src/components/ui` and is styled with Tailwind design tokens (`bg-surface`, `text-content-muted`, `border-line`, `rounded-control`) rather than raw palette colours.
- Interactive overlays (selects, menus, tooltips) are built on Radix primitives for keyboard navigation, focus management and ARIA; native `<select>` is not used.
- Server state goes through TanStack Query with keys defined in `features/queryKeys.ts`; forms use react-hook-form with zod schemas from `lib/validation.ts`; server field errors are applied with `lib/forms.ts`.
- Every user-visible string is resolved through `t('key', 'English fallback')` and seeded in a reference-service migration for all supported languages.
- Accessibility is part of the definition of done: labelled controls, `aria-live` summaries, focus return after dialogs, reduced-motion support.

**Git**

- Small, focused commits in imperative mood with a scope prefix when useful (`feat(admin-functions): ...`, `fix(identity): ...`, `chore: ...`).
- Never commit `.env`, keys or build output; run the secret-tracking check from [Security model](#7-security-model) before pushing.
- Open pull requests against `doniyor` and include the verification commands you ran.

---

## 11. Repository layout

```
ReestrGov/
├── api-gateway/                 Spring Cloud Gateway (routing, CORS)
├── eureka-server/               Netflix Eureka registry
├── identity-service/            Auth, users, roles, permissions, organizations, languages
├── reference-service/           Regions, interface translations, translation keys
├── function-catalog-service/    Service catalog, editorial workflow, categories, audit, translation
├── front/                       React 18 + Vite 8 SPA, Nginx image, Playwright tests
├── docs/                        Functional specifications (admin functions UI, editorial workflow)
├── docker-compose.yml           Full stack: postgres, eureka, 3 services, gateway, front
├── init-multiple-dbs.sh         Creates the three databases on first PostgreSQL start
├── .env.example                 Template for the local environment file
├── pom.xml                      Maven aggregator for the five Java modules
├── frontend-pages-api.json      Historical page-to-endpoint map used during frontend planning
├── section3.patch, .section3-*  Archived snapshot of an earlier security iteration; not part of the build
└── README.md
```

Further reading:

- `docs/admin-functions-ui.md` describes the administrative service-card screens.
- `docs/function-editorial-workflow.md` describes the editorial state machine and its permissions.
- `front/README.md` covers frontend-specific deployment notes.
