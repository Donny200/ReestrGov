# reestrTask

Spring Boot microservices with PostgreSQL, Eureka and an API Gateway. Secrets are not stored in the repository: provide them through the deployment environment or an untracked local `.env` file.

## Required security configuration

| Variable | Used by | Purpose |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | Docker Compose | PostgreSQL password shared with the service containers |
| `POSTGRES_USER` | Docker Compose | PostgreSQL user; defaults to `postgres` for local Compose only |
| `IDENTITY_DB_PASSWORD` | identity-service outside Compose | Identity database password |
| `REFERENCE_DB_PASSWORD` | reference-service outside Compose | Reference database password |
| `FUNCTION_CATALOG_DB_PASSWORD` | function-catalog-service outside Compose | Function catalog database password |
| `JWT_PRIVATE_KEY` | identity-service only | PKCS#8 RSA private key used to sign JWTs |
| `JWT_PUBLIC_KEY` | identity-service, reference-service, function-catalog-service | X.509 RSA public key used to verify JWTs |
| `APP_COOKIE_SECURE` | identity-service | Use `true` for HTTPS deployments |
| `APP_COOKIE_SAME_SITE` | identity-service | Cookie SameSite policy selected for the deployment |

Standard Spring variables such as `SPRING_DATASOURCE_URL` and `SPRING_DATASOURCE_USERNAME` may override the non-secret local defaults. Docker Compose maps `POSTGRES_PASSWORD` to each service-specific database variable.

Generate the RSA pair outside the repository. For example, an operator can run:

```shell
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out jwt-private.pem
openssl pkey -in jwt-private.pem -pubout -out jwt-public.pem
```

Keep `jwt-private.pem` in a secrets manager available only to identity-service. Other services receive only `jwt-public.pem`. PEM values may contain real line breaks or escaped `\n`. Never commit either key file; `.gitignore` excludes common private-key and keystore formats.

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

Previously committed database passwords and the old shared HMAC JWT secret must be treated as compromised. DevOps must rotate the PostgreSQL password, generate a new RSA key pair, replace deployment secrets and restart the services. During that coordinated rotation, revoke every existing refresh session (for example, run `UPDATE refresh_tokens SET revoked = TRUE WHERE revoked = FALSE;` against the identity database in an operator-controlled transaction). Otherwise an old opaque refresh token could obtain a newly signed RS256 access token. Every access and refresh token issued before the rotation must be treated as compromised and invalidated. Secret generation, rotation and deployment are intentionally not performed by this repository change.
