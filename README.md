# ReestrGov

**Корпоративная платформа государственного реестра и сервисного шлюза**

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

## Содержание

1. [Краткий обзор](#1-краткий-обзор)
2. [Архитектура системы](#2-архитектура-системы)
3. [Предварительные требования](#3-предварительные-требования)
4. [Конфигурация окружения](#4-конфигурация-окружения)
5. [Быстрый старт с Docker Compose](#5-быстрый-старт-с-docker-compose)
6. [Локальная разработка без Docker](#6-локальная-разработка-без-docker)
7. [Модель безопасности](#7-модель-безопасности)
8. [Тестирование](#8-тестирование)
9. [Устранение неполадок](#9-устранение-неполадок)
10. [Стандарты чистого кода и участия в разработке](#10-стандарты-чистого-кода-и-участия-в-разработке)
11. [Структура репозитория](#11-структура-репозитория)

---

## 1. Краткий обзор

ReestrGov — это реестр государственных услуг («функций»), предоставляемых государственными организациями. Граждане просматривают публичный многоязычный каталог организаций и услуг без входа в систему: структурированные инструкции, контакты организаций, пошаговый подбор услуги, сохранение услуг в браузере, печать, отправка ссылки и анонимные сообщения о неверной информации. Сотрудники входят в административную консоль для управления организациями, учётными записями сотрудников, ролями и правами, языками интерфейса и переводами, а также для ведения редакционного процесса карточек услуг (черновик, проверка, публикация, деактивация, повторная активация) с возможностью машинного перевода через Azure Translator.

Платформа представляет собой набор микросервисов Spring Boot за Spring Cloud Gateway, зарегистрированных в реестре сервисов Netflix Eureka, каждый из которых владеет собственной базой данных PostgreSQL и собственной историей миграций Flyway. Одностраничное приложение на React, собранное с помощью Vite и обслуживаемое Nginx, обращается к шлюзу через same-origin прокси `/api/`, благодаря чему HttpOnly-cookie аутентификации работают без какой-либо настройки CORS в браузере.

| Слой | Технология |
| --- | --- |
| Среда выполнения бэкенда | Java 17, Spring Boot 3.5.4, Spring Cloud 2025.0.0 |
| Обнаружение сервисов и маршрутизация | Netflix Eureka, Spring Cloud Gateway (WebFlux), Spring Cloud LoadBalancer |
| Безопасность | Spring Security 6, stateless JWT на HMAC-SHA256 (jjwt 0.12.6), HttpOnly-cookie, BCrypt |
| Хранение данных | PostgreSQL 16, Spring Data JPA, Flyway, кэш Caffeine (reference-service) |
| Документация API | springdoc-openapi (Swagger UI по адресу `/swagger` в каждом сервисе) |
| Фронтенд | React 18, Vite 8, TypeScript 5 (strict), Tailwind CSS 3.4, Radix UI, TanStack Query и Table, react-hook-form, zod, framer-motion |
| Тестирование фронтенда | Playwright (UI-набор с мокированными маршрутами и набор с реальным бэкендом) |
| Тестирование бэкенда | JUnit 5, Spring Boot Test, H2 (тесты identity), Testcontainers и браузерные IT на Playwright (function catalog) |
| Упаковка | Многостадийные Dockerfile, кэш-монтирования BuildKit, непривилегированные пользователи среды выполнения, Nginx 1.27 для SPA |

---

## 2. Архитектура системы

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

### 2.1 Каталог сервисов

| Модуль | Порт | Роль | Хранилище данных |
| --- | --- | --- | --- |
| `eureka-server` | 8761 | Реестр сервисов и обнаружение. Не регистрирует сам себя; режим самосохранения отключён для быстрой локальной работы. | нет |
| `api-gateway` | 8082 | Единая публичная точка входа. Маршрутизирует по пути к идентификаторам сервисов `lb://`, разрешаемым через Eureka, применяет глобальный CORS для dev-источников (`localhost:3000`, `localhost:5173`) с учётными данными и устраняет дублирование CORS-заголовков ответа. | нет |
| `identity-service` | 8081 | Аутентификация (вход, обновление токена, выход, смена пароля), выпуск JWT, управление пользователями и сотрудниками, организации, роли, права и реестр языков интерфейса. Создаёт первого `SUPER_ADMIN`. | `adlita_project1` |
| `reference-service` | 8084 | Справочные данные: регионы, словари переводов интерфейса для каждого языка и ключи переводов с отчётами о покрытии и пробелах. Кэширует запросы с помощью Caffeine. | `reference_service_db` |
| `function-catalog-service` | 8085 | Публичный и административный каталог услуг («функций»), категории, редакционный процесс с правами, журнал аудита, импорт CSV, ручные переводы и переводы через Azure. | `function_catalog_db` |
| `front` | 3000 → 80 | SPA на Vite/React, обслуживаемое Nginx с gzip, неизменяемым кэшированием ресурсов, SPA-фолбэком, `/healthz` и same-origin обратным прокси `/api/` на `api-gateway:8082`. | нет |
| `postgres` | 5433 → 5432 | PostgreSQL 16 с init-скриптом, который создаёт три базы данных при первом запуске. | том `pgdata` |

### 2.2 Маршрутизация шлюза

Маршруты объявлены в `api-gateway/src/main/resources/application.yml` и обрабатываются сверху вниз. Маршрут identity является catch-all, поэтому новые сервисы необходимо добавлять выше него.

| Порядок | ID маршрута | Предикаты пути | Цель |
| --- | --- | --- | --- |
| 1 | `reference-service` | `/api/regions/**`, `/api/interface-translations/**`, `/api/translation-keys/**` | `lb://reference-service` |
| 2 | `function-catalog-service` | `/api/functions/**`, `/api/reports/**`, `/api/analytics/**` | `lb://function-catalog-service` |
| 3 | `identity-service` | `/api/**` | `lb://identity-service` |

Шлюз намеренно сделан тонким. Проверка JWT и авторизация выполняются внутри каждого нижестоящего сервиса, а не на шлюзе, и ограничение частоты запросов не настроено. Если для развёртывания требуется проверка токена на уровне шлюза или ограничитель частоты запросов, добавьте `GlobalFilter` или фильтр `RequestRateLimiter` в модуль шлюза и задокументируйте изменение здесь.

### 2.3 Обзор REST-интерфейса

| Сервис | Базовые пути |
| --- | --- |
| identity-service | `/api/auth` (login, refresh, logout, me, change-password), `/api/user`, `/api/admin/moderators`, `/api/admin/org-admins`, `/api/organizations` (вкл. `/{id}/verify`), `/api/public/organizations`, `/api/roles` (вкл. `/assign`, `/{id}/permissions`), `/api/permissions`, `/api/languages` (вкл. `/catalog`) |
| reference-service | `/api/regions`, `/api/interface-translations/{languageCode}` (а также `/exact`, `/missing`, `/coverage`), `/api/translation-keys` |
| function-catalog-service | `/api/functions` (публичный список и детали, `/admin`, `/{id}/admin`, `/pending-review`, `/{id}/submit-for-review`, `/{id}/publish`, `/{id}/reject`, `/{id}/reactivate`, `/{id}/requirements`, `/{id}/translations`, `/{id}/translate`, `/{id}/verify`, `/{id}/audit`, `/import`, `/translation-capabilities`), `/api/functions/categories`, `/api/reports` (анонимный `POST`, `GET`, `GET /{id}`, `GET /{id}/history`, `PUT /{id}/status`, `GET /export`), `/api/analytics` (анонимный `POST /events`, `GET /summary`, `/engagement`, `/engagement/export`, `/quality-queue`, `/quality-queue/export`, `/reminders`, `POST /reminders/{id}/acknowledge`) |

Каждый сервис предоставляет Swagger UI по адресу `http://localhost:<port>/swagger` и документ OpenAPI по адресу `/v3/api-docs`.

### 2.4 Фронтенд-приложение

SPA находится в `front/` и организовано по функциональным областям:

- `src/components/ui` — дизайн-система (Button, Card, DataTable, Field, Input, Select, Modal, DropdownMenu, Tooltip, Badge, Skeleton, Toolbar, ThemeToggle), построенная на токенах Tailwind, примитивах Radix и class-variance-authority.
- `src/features/*` содержит хуки TanStack Query, схемы zod и диалоги для каждого домена (functions, organizations, staff, roles, legacy users, languages, reference).
- `src/pages` содержит публичные страницы (`/`, `/organizations/:id`, `/functions/:id`, `/finder`, `/saved`), `/login` и административную консоль (`/admin`, `/admin/functions`, `/admin/functions/new`, `/admin/functions/:id`, `/admin/reports`, `/admin/organization-dashboard`, `/admin/organizations`, `/admin/moderators`, `/admin/org-admins`, `/admin/roles`, `/admin/languages`, `/admin/users`, `/settings/security`).
- `src/contexts` предоставляет аутентификацию, тему (светлая, тёмная, системная) и i18n. Словарь UI загружается из reference-service для каждой локали, и каждая подпись разрешается через `t('key', 'fallback')`.
- `src/services/http.ts` — единственный HTTP-клиент. Он всегда отправляет `credentials: 'include'`, никогда не хранит токены, сопоставляет `fieldErrors` бэкенда с ошибками формы и выполняет единственное одновременное обновление токена при `401`.

---

## 3. Предварительные требования

| Инструмент | Версия | Для чего нужен |
| --- | --- | --- |
| Docker Desktop (или Docker Engine) с Compose v2 | Docker 24+, Compose 2.20+ | Запуск полного стека; кэш-монтирования BuildKit в Dockerfile |
| Node.js | `^20.19.0 \|\| >=22.12.0` (см. `engines` в `front/package.json`) | Локальная разработка фронтенда и тесты Playwright |
| JDK | 17 (Temurin или Microsoft Build of OpenJDK) | Локальная разработка бэкенда и сборки Maven |
| Maven | 3.9+ | Локальные сборки бэкенда (`mvn`) |
| Клиент PostgreSQL (опционально) | `psql` 16 | Просмотр баз данных на `localhost:5433` |

Docker Engine 29 и новее требует Docker API 1.44; тесты function-catalog фиксируют эту версию для клиента Testcontainers (см. [Тестирование](#8-тестирование)).

---

## 4. Конфигурация окружения

Все секреты передаются через окружение. Ничего чувствительного не коммитится; `.gitignore` исключает `.env`, `.env.*`, PEM-ключи и хранилища ключей, сохраняя при этом `.env.example`.

Создайте файл один раз:

```shell
cp .env.example .env
```

Docker Compose читает корневой `.env` автоматически. Сервисы, запущенные из IDE или через Maven, также читают его, поскольку каждый сервис объявляет `spring.config.import: optional:file:.env[.properties],optional:file:../.env[.properties]`.

### 4.1 Переменные

| Переменная | Обязательна | Кем используется | Описание |
| --- | --- | --- | --- |
| `POSTGRES_USER` | нет (по умолчанию `postgres`) | postgres, все сервисы с данными | Суперпользователь PostgreSQL, используемый init-скриптом и сервисами |
| `POSTGRES_PASSWORD` | **да** | postgres, все сервисы с данными | Пароль для `POSTGRES_USER`. Compose отказывается запускаться без него |
| `JWT_SECRET` | **да** | identity, reference, function-catalog | Общий ключ HMAC-SHA256. Должен быть не короче 32 байт (256 бит). Сгенерируйте с помощью `openssl rand -base64 48` |
| `APP_COOKIE_SECURE` | **да** | identity-service | `false` для локального HTTP-стека за same-origin прокси Nginx, `true` для любого HTTPS-развёртывания |
| `APP_COOKIE_SAME_SITE` | **да** | identity-service | `Lax` для same-origin конфигураций, `None` (вместе с `APP_COOKIE_SECURE=true`), когда SPA обслуживается с другого источника |
| `BOOTSTRAP_SUPER_ADMIN_EMAIL` | только при первом запуске | identity-service | E-mail начального `SUPER_ADMIN`. Обязателен, пока в базе identity нет пользователя с `ROLE_SUPER_ADMIN` |
| `BOOTSTRAP_SUPER_ADMIN_PASSWORD` | только при первом запуске | identity-service | Начальный пароль, сразу хэшируется BCrypt и помечается `mustChangePassword`. Удалите после первого входа |
| `AZURE_TRANSLATOR_ENDPOINT` | нет | function-catalog-service | Endpoint Azure Translator; пустое значение отключает автоматический перевод |
| `AZURE_TRANSLATOR_KEY` | нет | function-catalog-service | Ключ Azure Translator |
| `AZURE_TRANSLATOR_REGION` | нет | function-catalog-service | Регион Azure Translator |
| `IDENTITY_DB_PASSWORD` | нет | identity-service вне Compose | Переопределяет `POSTGRES_PASSWORD` для базы identity |
| `REFERENCE_DB_PASSWORD` | нет | reference-service вне Compose | Переопределяет `POSTGRES_PASSWORD` для базы reference |
| `FUNCTION_CATALOG_DB_PASSWORD` | нет | function-catalog-service вне Compose | Переопределяет `POSTGRES_PASSWORD` для базы каталога |
| `VITE_API_BASE_URL` | нет | front (аргумент сборки) | Публичный источник шлюза, когда SPA не обслуживается за прокси `/api` Nginx или Vite. Оставьте пустым для Compose |
| `APP_DEMO_USERS_ENABLED`, `DEMO_SUPER_ADMIN_EMAIL`, `DEMO_SUPER_ADMIN_PASSWORD` | нет | identity-service, только dev/test | Создание демо-аккаунтов по явному включению. Никогда не включайте в production |

Стандартные свойства Spring, такие как `SPRING_DATASOURCE_URL` и `SPRING_DATASOURCE_USERNAME`, могут переопределять несекретные значения по умолчанию. Compose задаёт их для каждого сервиса, как показано ниже.

### 4.2 Порты и URI баз данных

| Сервис | Порт контейнера | Порт хоста | Источник данных внутри Compose | Источник данных вне Compose (по умолчанию в `application.yml`) |
| --- | --- | --- | --- | --- |
| postgres | 5432 | 5433 | н/д | н/д |
| eureka-server | 8761 | 8761 | н/д | н/д |
| api-gateway | 8082 | 8082 | н/д | н/д |
| identity-service | 8081 | 8081 | `jdbc:postgresql://postgres:5432/adlita_project1` | `jdbc:postgresql://localhost:5433/adlita_project1` |
| reference-service | 8084 | 8084 | `jdbc:postgresql://postgres:5432/reference_service_db` | `jdbc:postgresql://localhost:5433/reference_service_db` |
| function-catalog-service | 8085 | 8085 | `jdbc:postgresql://postgres:5432/function_catalog_db` | `jdbc:postgresql://localhost:5433/function_catalog_db` |
| front | 80 | 3000 | н/д | Dev-сервер Vite на 5173 проксирует `/api` на `localhost:8082` |

Внутри Compose каждый Spring-сервис обнаруживает реестр через `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server:8761/eureka`; вне Compose значение по умолчанию — `http://localhost:8761/eureka`.

### 4.3 Пример `.env`

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

## 5. Быстрый старт с Docker Compose

### Шаг 1: клонирование и настройка

```shell
git clone <repository-url> ReestrGov
cd ReestrGov
cp .env.example .env
openssl rand -base64 48          # paste the output into JWT_SECRET
```

Заполните `POSTGRES_PASSWORD`, `JWT_SECRET`, `APP_COOKIE_SECURE`, `APP_COOKIE_SAME_SITE` и, для первого запуска, оба значения `BOOTSTRAP_SUPER_ADMIN_*`.

### Шаг 2: чистая сборка

```shell
docker compose down --remove-orphans
docker compose build --no-cache
```

Каждый Java-образ собирается в две стадии: `maven:3.9-eclipse-temurin-17` разрешает плагины и зависимости в кэш-монтирование BuildKit (`/root/.m2`), затем упаковывает jar с `-DskipTests`; стадия выполнения — `eclipse-temurin:17-jre`, запускаемая от непривилегированного пользователя `app`. Образ фронтенда выполняет `npm ci` и `npm run build` на `node:22-alpine` и копирует `dist/` в `nginx:1.27-alpine`. Последующие сборки переиспользуют кэш, если не указан `--no-cache`.

### Шаг 3: запуск стека

```shell
docker compose up -d
```

Порядок запуска обеспечивается `depends_on`: сервисы с данными ждут проверки работоспособности PostgreSQL (`pg_isready`), шлюз ждёт сервисы, а фронтенд ждёт шлюз. У каждого контейнера задано `restart: unless-stopped`.

### Шаг 4: проверка работоспособности и логов

```shell
docker compose ps
docker compose logs -f                       # everything
docker compose logs -f identity-service      # one service
curl -s http://localhost:3000/healthz        # nginx -> "ok"
open http://localhost:8761                   # Eureka dashboard, all four services should be UP
```

| URL | Что вы должны увидеть |
| --- | --- |
| `http://localhost:3000` | Публичный каталог; `/login` открывает административную консоль |
| `http://localhost:8761` | Панель Eureka со списком `API-GATEWAY`, `IDENTITY-SERVICE`, `REFERENCE-SERVICE`, `FUNCTION-CATALOG-SERVICE` |
| `http://localhost:8082/api/public/organizations` | JSON через шлюз |
| `http://localhost:8081/swagger`, `:8084/swagger`, `:8085/swagger` | Swagger UI для каждого сервиса |

Войдите под учётной записью bootstrap-администратора. Учётная запись обязана сменить пароль, прежде чем любой другой вызов бэкенда будет выполнен; после этого удалите `BOOTSTRAP_SUPER_ADMIN_PASSWORD` из `.env`.

### Повседневные команды

```shell
docker compose up --build -d front identity-service   # rebuild and restart selected services
docker compose restart api-gateway                     # restart without rebuilding
docker compose down                                    # stop and remove containers, keep the database
docker compose down -v --remove-orphans                # also delete the pgdata volume (destroys all data)
docker builder prune -f                                # free BuildKit cache
docker compose config                                  # validate the merged Compose file
```

---

## 6. Локальная разработка без Docker

### 6.1 База данных

Используйте только PostgreSQL из Compose:

```shell
docker compose up -d postgres
```

Она опубликована на `localhost:5433` и содержит `adlita_project1`, `reference_service_db` и `function_catalog_db`. Нативный PostgreSQL на 5432 — это отдельный экземпляр, который не используется конфигурацией по умолчанию.

### 6.2 Бэкенд-сервисы

Установите `JAVA_HOME` на JDK 17 и запустите сервисы из корня репозитория, каждый в своём терминале, в следующем порядке:

```shell
export JAVA_HOME=$(/usr/libexec/java_home -v 17)   # macOS example

(cd eureka-server && mvn clean spring-boot:run)
(cd identity-service && mvn clean spring-boot:run)
(cd reference-service && mvn clean spring-boot:run)
(cd function-catalog-service && mvn clean spring-boot:run)
(cd api-gateway && mvn clean spring-boot:run)
```

Каждый сервис читает корневой `.env` через `spring.config.import`, подключается к `localhost:5433` и регистрируется в Eureka на `localhost:8761`. Корневой `pom.xml` является агрегатором, поэтому `mvn -q -DskipTests package` из корня собирает все пять модулей.

IntelliJ IDEA: откройте корневой `pom.xml` как Maven-проект, установите SDK проекта на 17 и запустите классы `*Application`. В окне инструмента **Database** подключитесь к `localhost:5433` с `POSTGRES_USER` и `POSTGRES_PASSWORD`; храните пароль в хранилище паролей IDEA, а не в JDBC URL.

### 6.3 Фронтенд

```shell
cd front
npm install
npm run dev          # http://localhost:5173, /api proxied to http://localhost:8082
```

Vite проксирует `/api` на шлюз, поэтому cookie являются same-origin и настройка CORS не требуется. Шлюз и identity-service уже разрешают `http://localhost:5173` с учётными данными для прямых вызовов.

Другие скрипты:

```shell
npm run typecheck    # tsc for the app and for the Playwright tests
npm run lint         # ESLint, zero warnings expected
npm run build        # production bundle into dist/
npm run preview      # serve dist/ locally
```

---

## 7. Модель безопасности

- **Stateless JWT с HttpOnly-cookie.** `POST /api/auth/login` устанавливает `accessToken` (24 ч, путь `/`) и `refreshToken` (7 дней, путь `/api/auth`) как HttpOnly-cookie. SPA никогда не читает и не хранит токены. `POST /api/auth/refresh` ротирует refresh-токен; `POST /api/auth/logout` отзывает его.
- **Один общий HMAC-ключ.** identity-service подписывает токены ключом `JWT_SECRET`; reference-service и function-catalog-service проверяют их локально тем же ключом, поэтому сетевой вызов на каждый запрос не требуется.
- **Обязательная смена пароля.** Подписанный токен содержит `mustChangePassword`. identity-service ограничивает такие сессии профилем, сменой пароля, выходом и входом; остальные сервисы отклоняют токены, у которых этот флаг равен true или отсутствует. Успешная смена выдаёт новые cookie.
- **Отключённые пользователи отклоняются** на уровне JWT-фильтра, даже если у них есть действительный токен.
- **RBAC.** Роли владеют правами; редакционные endpoints используют `@PreAuthorize("hasAuthority(...)")`, например `FUNCTIONS_REVIEW`, `FUNCTIONS_PUBLISH`, `FUNCTIONS_REACTIVATE`, `FUNCTION_CATEGORIES_MANAGE` и `AUDIT_VIEW`. Администраторы организаций ограничены своими организациями. Сообщения посетителей читаются с `REPORTS_VIEW` или `ORG_REPORTS_MANAGE`, а их статус меняется с `ORG_REPORTS_MANAGE` или `REPORTS_VIEW` + `REPORTS_MANAGE`. Панель организации, очередь качества, напоминания и выгрузки требуют `ORG_ANALYTICS_VIEW`. Все проверки и ограничение по организации выполняются на бэкенде (см. [docs/organization-analytics.md](docs/organization-analytics.md)). Проверку карточки услуги отмечает `FUNCTIONS_REVIEW`, проверку организации — `ORGANIZATIONS_EDIT` или `ORGANIZATIONS_EDIT_OWN` для своей организации.
- **Публичные endpoints.** Анонимный доступ ограничен `GET /api/public/**`, `GET /api/languages`, `GET /api/languages/catalog`, `GET /api/regions/**`, `GET /api/interface-translations/{language}`, публичными чтениями `GET /api/functions/**` (варианты admin, pending-review и audit исключены), анонимной отправкой `POST /api/reports` и `POST /api/analytics/events`, точками входа аутентификации и Swagger. Всё остальное требует аутентификации. Отправка сообщений ограничена по частоте в function-catalog-service (на клиента по заголовку `X-Real-IP`, глобально и на один объект в сутки) и защищена скрытым полем-ловушкой; события активности ограничены на клиента и глобально и хранятся только как дневные счётчики; IP-адреса не сохраняются. Порт шлюза 8082 не следует публиковать в production, иначе клиент сможет подменить `X-Real-IP` в обход Nginx.
- **Никаких встроенных учётных данных.** Первый администратор берётся из `BOOTSTRAP_SUPER_ADMIN_EMAIL` и `BOOTSTRAP_SUPER_ADMIN_PASSWORD`; identity-service отказывается запускаться без них, пока не существует ни одного `SUPER_ADMIN`. Демо-аккаунты существуют только при `APP_DEMO_USERS_ENABLED=true` в непродакшен-профиле.
- **Ротация секретов.** При изменении `JWT_SECRET` или пароля базы данных переразверните все три сервиса с данными вместе и отзовите действующие refresh-сессии (`UPDATE refresh_tokens SET revoked = TRUE WHERE revoked = FALSE;` в базе identity), чтобы старый refresh-токен не мог выпустить заново подписанный access-токен.

Перед каждым коммитом проверяйте, что ни один файл с секретами не отслеживается:

```shell
git ls-files | grep -E '(^|/)\.env($|\.)|\.(pem|key|p12|pfx|jks)$'
```

---

## 8. Тестирование

### Бэкенд

| Модуль | Что запускается | Инфраструктура |
| --- | --- | --- |
| identity-service | Модульные и `@SpringBootTest` наборы с профилем `test` (`application-test.yaml`): H2 в памяти в режиме PostgreSQL, Flyway отключён, Eureka отключена | нет |
| reference-service | Модульные тесты и тесты веб-слоя | нет |
| function-catalog-service | Модульные тесты, `CatalogPostgresTest`, `CatalogEnhancementsPostgresTest`, `ReportWorkflowPostgresTest`, `OrganizationInsightsPostgresTest`, `OrganizationDashboardPostgresTest` (Testcontainers PostgreSQL 16) и `AdminFunctionsBrowserIT` (браузерный сценарий Playwright против реального Spring-контекста) | Docker daemon |

```shell
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
(cd identity-service && mvn -q test)
(cd reference-service && mvn -q test)
(cd function-catalog-service && mvn -q test)                                           # needs Docker
(cd function-catalog-service && mvn -q test -Dtest='!*PostgresTest,!AdminFunctionsBrowserIT')   # without Docker
```

`function-catalog-service/src/test/resources/docker-java.properties` фиксирует версию Docker API 1.44 для клиента Testcontainers, поскольку Docker Engine 29 требует её.

### Фронтенд

```shell
cd front
npx playwright install chromium   # once
npm run test                      # UI suite: admin-functions, primitives, public-catalog, admin-enhancements, engagement-tracking and organization-dashboard specs against route mocks
npm run test:backend              # real-backend suite, driven by AdminFunctionsBrowserIT
```

UI-набор запускает Vite на порту 5183 внутри процесса (`tests/start-vite.mjs`) и мокирует каждый вызов `/api/**` в `tests/fixtures.ts`, загружая словарь UI из миграций reference-service, чтобы подписи совпадали с production. Набор с реальным бэкендом требует `CATALOG_TEST_URL` и `CATALOG_TEST_JWT`, которые предоставляет Java-интеграционный тест.

### Критерии готовности

```shell
cd front && npm run typecheck && npm run lint && npm run build && npm run test
```

вместе с зелёными прогонами Maven-тестов для изменённых сервисов.

---

## 9. Устранение неполадок

### Проверка работоспособности PostgreSQL никогда не проходит или сервисы не могут подключиться

- Симптом: `dependency failed to start: container postgres is unhealthy` или повторяющиеся `Connection refused` в логе сервиса.
- Проверка работоспособности выполняет `pg_isready -h 127.0.0.1 -U $POSTGRES_USER -d postgres` каждые 5 с со стартовым периодом 10 с и 12 повторами. На медленных дисках первая инициализация (создание трёх баз данных) может превысить это окно. Выполните `docker compose logs postgres`; если init-скрипт всё ещё выполняется, подождите и снова выполните `docker compose up -d`.
- Если в логе указано `FATAL: password authentication failed`, том `pgdata` был инициализирован с другим `POSTGRES_PASSWORD`. Либо восстановите старое значение, либо сбросьте базу данных (см. ниже).
- Если `init-multiple-dbs.sh` завершается с ошибкой `/bin/bash^M: bad interpreter`, файл был извлечён с окончаниями строк CRLF. Преобразуйте его в LF (`git config core.autocrlf input` и повторное извлечение, либо `sed -i '' 's/\r$//' init-multiple-dbs.sh`).
- Порт `5433` уже занят: измените хостовую сторону сопоставления портов `postgres` в `docker-compose.yml` и URL `localhost:5433` в трёх файлах `application.yml` для локальных запусков.
- Исчерпание пула соединений (`HikariPool ... Connection is not available`) обычно означает, что сервис перезапускается в цикле, пока PostgreSQL ещё прогревается. Проверьте счётчики перезапусков в `docker compose ps` и сначала исправьте исходную ошибку в этом сервисе.

### Разрешение зависимостей Maven внутри Docker завершается ошибкой (401 Unauthorized)

- Симптом: `docker compose build` завершается ошибкой на шаге `mvn dependency:go-offline` с `401 Unauthorized` от `maven.pkg.github.com` или `repo.gradle.org`.
- Причина: родительский POM Flyway объявляет дополнительные репозитории для своих опциональных модулей. `dependency:go-offline` пытается разрешить *каждый* опциональный и транзитивный артефакт, включая те, что существуют только в этих приватных репозиториях, и роняет всю сборку.
- Решение, применённое во всех пяти Dockerfile: слой прогрева теперь `mvn -B -q -Dsilent=true dependency:resolve-plugins dependency:resolve || true`. Он разрешает только то, что действительно нужно проекту, терпимо относится к отсутствующим артефактам, а реальный шаг `mvn clean package -DskipTests` подтягивает всё недостающее из Maven Central. Оба шага используют общее кэш-монтирование BuildKit `/root/.m2`, поэтому пересборки остаются быстрыми.
- Если сборка всё ещё зависает на загрузке зависимостей, выполните `docker builder prune -f` и пересоберите с `--no-cache`; повреждённое кэш-монтирование может хранить наполовину загруженный артефакт.

### Сброс баз данных

```shell
docker compose down -v --remove-orphans
docker compose up -d
```

> **Предупреждение.** `-v` удаляет том `pgdata`, а значит, каждую организацию, пользователя, роль, перевод и карточку услуги. identity-service при следующем запуске снова потребует `BOOTSTRAP_SUPER_ADMIN_EMAIL` и `BOOTSTRAP_SUPER_ADMIN_PASSWORD`. Чтобы изменить только сопоставление портов или переменную окружения, используйте вместо этого `docker compose up -d --no-deps <service>`.

### Другие распространённые проблемы

| Симптом | Причина и решение |
| --- | --- |
| `JWT_SECRET is required` или `POSTGRES_PASSWORD is required` при `docker compose up` | Корневой `.env` отсутствует или пуст. Compose использует защиту `${VAR:?message}` для обязательных значений. |
| identity-service завершается с `No SUPER_ADMIN exists. Set environment variable BOOTSTRAP_SUPER_ADMIN_...` | Свежая база identity. Укажите обе bootstrap-переменные для первого запуска. |
| Вход успешен, но следующий запрос возвращает `401` | Несоответствие политики cookie. На обычном HTTP используйте `APP_COOKIE_SECURE=false` и `APP_COOKIE_SAME_SITE=Lax`; на HTTPS с другого источника используйте `true` и `None`. |
| Шлюз возвращает `503 Service Unavailable` сразу после запуска | Регистрация в Eureka и обновление клиентского кэша занимают до 30 с. Подождите, пока сервис не покажет `UP` на `http://localhost:8761`. |
| `JWT_SECRET` отклонён как слишком короткий | Ключ HMAC-SHA256 должен быть не короче 32 байт. Используйте `openssl rand -base64 48`. |
| Testcontainers завершается ошибкой `client version 1.xx is too old` | Docker Engine 29 требует API 1.44. Файл свойств в `function-catalog-service/src/test/resources` уже фиксирует её; убедитесь, что тесты его подхватывают (запуски с `-Dtest` тоже его читают). |
| `npm run dev` завершается с предупреждением engine | Используйте Node `^20.19.0 \|\| >=22.12.0`. Vite 8 не поддерживает более старые выпуски Node 20. |
| Playwright не находит Chromium | Выполните `npx playwright install chromium` внутри `front/`. |
| Flyway `Migration checksum mismatch` | Был отредактирован уже применённый файл миграции. Никогда не изменяйте применённые миграции; вместо этого добавьте новый `V<n>__*.sql` или восстановите локальную базу с помощью `docker compose down -v`. |
| Кнопка автоматического перевода отсутствует в редакторе | `AZURE_TRANSLATOR_*` пусто. Endpoint возможностей сообщает `available: false`, и UI скрывает действие намеренно. |

---

## 10. Стандарты чистого кода и участия в разработке

**Общие**

- Код — это документация: никаких строчных или блочных комментариев, никакого закомментированного кода, никаких TODO-маркеров. Выражайте намерение через именование и небольшие методы. Повествование ведут README и `docs/`.
- Ноль мёртвого кода: неиспользуемые классы, методы, импорты, props, CSS-классы и feature-флаги удаляются в том же изменении, которое делает их неиспользуемыми.
- Одна ответственность на класс, хук или компонент. Общее поведение выносится, а не копируется (например, `menuStyles.ts` для поверхностей popover, `utils/filters.ts` для фильтров по статусу).
- Каждое изменение поставляется со своими тестами и оставляет `typecheck`, `lint`, `build`, наборы Playwright и Maven зелёными.

**Spring Boot**

- Возможности Java 17: records для DTO и value-объектов, `var` только там, где тип очевиден, switch-выражения, текстовые блоки для SQL в тестах.
- Внедрение через конструктор с помощью Lombok `@RequiredArgsConstructor`; никакого внедрения в поля, никакого `@Autowired`.
- Контроллеры тонкие и валидируют ввод с помощью Jakarta Bean Validation; бизнес-правила живут в сервисах; персистентность остаётся за репозиториями Spring Data.
- Ошибки преобразуются единым `GlobalExceptionHandler` в каждом сервисе в стабильную JSON-форму с `message` и, для ошибок валидации, картой `fieldErrors`, которую фронтенд сопоставляет с полями формы.
- Безопасность stateless: никаких сессий, CSRF отключён для модели cookie + JWT, каждый защищённый endpoint объявляет свою authority.
- Миграции Flyway только добавляются. Применённые файлы миграций никогда не редактируются (контрольные суммы проверяются); изменения схемы получают новый версионированный скрипт.
- Конфигурация вынесена наружу через плейсхолдеры `application.yml`, привязанные к переменным окружения; у секретов никогда нет значений по умолчанию.

**React / TypeScript**

- Включены `strict`, `noUnusedLocals`, `noUnusedParameters` и `noFallthroughCasesInSwitch`; `any` не используется.
- ESLint (`eslint:recommended`, `@typescript-eslint/recommended`, `react-hooks`, `react-refresh`) должен сообщать ноль предупреждений. Экспорты, не являющиеся компонентами, живут в собственных модулях, чтобы Fast Refresh продолжал работать.
- Компоненты — функциональные компоненты с явными интерфейсами props; общий UI живёт в `src/components/ui` и стилизуется дизайн-токенами Tailwind (`bg-surface`, `text-content-muted`, `border-line`, `rounded-control`) вместо сырых цветов палитры.
- Интерактивные оверлеи (селекты, меню, тултипы) строятся на примитивах Radix для навигации с клавиатуры, управления фокусом и ARIA; нативный `<select>` не используется.
- Серверное состояние проходит через TanStack Query с ключами, определёнными в `features/queryKeys.ts`; формы используют react-hook-form со схемами zod из `lib/validation.ts`; серверные ошибки полей применяются с помощью `lib/forms.ts`.
- Каждая видимая пользователю строка разрешается через `t('key', 'English fallback')` и засевается в миграции reference-service для всех поддерживаемых языков.
- Доступность — часть критериев готовности: подписанные элементы управления, сводки `aria-live`, возврат фокуса после диалогов, поддержка reduced-motion.

**Git**

- Небольшие сфокусированные коммиты в повелительном наклонении с префиксом области, когда это уместно (`feat(admin-functions): ...`, `fix(identity): ...`, `chore: ...`).
- Никогда не коммитьте `.env`, ключи или результаты сборки; запускайте проверку отслеживания секретов из раздела [Модель безопасности](#7-модель-безопасности) перед push.
- Открывайте pull request'ы в ветку `doniyor` и включайте команды проверки, которые вы запускали.

---

## 11. Структура репозитория

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

Дополнительное чтение:

- `docs/admin-functions-ui.md` описывает административные экраны карточек услуг.
- `docs/function-editorial-workflow.md` описывает редакционный конечный автомат и его права.
- `docs/public-catalog-enhancements.md` описывает структурированные инструкции, контакты организаций, подбор услуг, сообщения об ошибках, проверку по официальному источнику, сохранение, печать и отправку ссылок.
- `front/README.md` содержит заметки по развёртыванию, специфичные для фронтенда.
