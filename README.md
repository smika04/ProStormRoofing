# Storm Pro Roofing

[English](#english) | [Русский](#русский)

## English

### Contents

1. [Project structure](#project-structure)
2. [Installation and local development](#installation-and-local-development)
3. [Commands and base path](#commands-and-base-path)
4. [Static JSON data](#static-json-data)
5. [Cloudflare deployment](#cloudflare-deployment)
6. [Form API and email configuration](#form-api-and-email-configuration)
7. [GitHub Pages preview](#github-pages-preview)
8. [Maintenance and troubleshooting](#maintenance-and-troubleshooting)

### Project structure

```text
ProStromRoofing/
├── .github/
│   └── workflows/
│       └── static.yml          # GitHub Pages preview workflow
├── app/
│   ├── components/             # Reusable HTML fragments
│   ├── css/                    # CSS assets
│   ├── images/                 # Photos, logos and icons
│   ├── js/                     # JavaScript modules
│   ├── json/
│   │   ├── company_contacts.json
│   │   ├── jobs.json
│   │   └── projects.json
│   ├── pages/                  # Page templates and content
│   ├── scss/                   # Source SCSS styles
│   └── index.html              # Main HTML entry template
├── worker/
│   └── worker_form.js          # Ready-to-deploy form API Worker
└── package.json                # Dependencies and npm commands
```

The build output directory is defined in the Gulp configuration.

HTML templates use `@@include(...)`. Publish the generated HTML rather than unprocessed source templates.

Before editing files in `app/css/`, check whether they are generated from SCSS by the build.

### Installation and local development

#### Requirements

- Node.js and npm compatible with the project dependencies.
- A Cloudflare account for production deployment.
- A Resend account for sending email.

The provided `package.json` does not specify a Node.js version.

#### Install dependencies

Run from the project root:

```bash
npm install
```

If the repository contains an up-to-date `package-lock.json`, use:

```bash
npm ci
```

Use one installation method, not both.

#### Start development

```bash
npm run dev
```

This runs the default Gulp task.

Open the BrowserSync URL printed in the terminal. The local port is configured in Gulp.

The development base path is:

```text
/
```

Stop the server with:

```text
Ctrl+C
```

### Commands and base path

| Command | Description |
| --- | --- |
| `npm install` | Install dependencies |
| `npm ci` | Install dependencies using the lockfile |
| `npm run dev` | Start local development |
| `npm run build` | Build for the domain root |
| `npm run build -- --baseHref=/ProStromRoofing/` | Build for a subdirectory |

#### Root deployment

```bash
npm run build
```

Without `baseHref`, the base path is `/`.

Use this for a website published at:

```text
https://stormproroofing.ca/
https://blue-hat-0f19.dev-smika04.workers.dev/
```

A separate subdomain also uses `/` when the website is at its root.

#### Subdirectory deployment

```bash
npm run build -- --baseHref=/ProStromRoofing/
```

This expects a public URL such as:

```text
https://example.com/ProStromRoofing/
```

For another directory:

```bash
npm run build -- --baseHref=/pro/
```

The `--` separator passes arguments from npm to Gulp.

The base path is a URL path, not a domain name. To return to a root deployment, run the build without the argument.

#### Tests

```bash
npm test
```

This is currently a placeholder that exits with code `1`. Automated tests are not configured through this command.

#### Main dependencies

| Dependency | Purpose |
| --- | --- |
| Gulp 4 | Build tasks |
| BrowserSync | Local server and browser synchronization |
| Sass / gulp-sass | Stylesheet compilation |
| gulp-file-include | HTML template includes |
| esbuild / gulp-esbuild | JavaScript module bundling |
| gulp-autoprefixer | CSS vendor prefixes |
| gulp-concat / gulp-rename | File processing |
| gulp-uglify | JavaScript minification |
| jQuery | Interface dependencies |
| Slick Carousel | Sliders |
| normalize.css | Browser style normalization |
| svg-injector | SVG injection |

Keep jQuery below version `4.0.0` because of Slick Carousel compatibility. The configured dependency is `^3.7.1`.

### Static JSON data

Public website content is stored in:

```text
app/json/
```

After editing source JSON, rebuild and redeploy the website.

#### Company contacts

File:

```text
app/json/company_contacts.json
```

Example:

```json
{
  "fax_numbers": [],
  "phone_numbers": [
    "(604) 799-4080"
  ],
  "emails": [
    "info@stormproroofing.ca",
    "contact@stormproroofing.ca",
    "careers@stormproroofing.ca"
  ],
  "address_office": [
    {
      "address": "5480 Pebble Ln, Chilliwack, BC V2R 6B8",
      "map_url": "https://www.google.com/maps/search/?api=1&query=Storm+Pro+Roofing+Chilliwack"
    }
  ]
}
```

| Property | Type | Description |
| --- | --- | --- |
| `fax_numbers` | String array | Fax numbers; leave `[]` if unavailable |
| `phone_numbers` | String array | Public phone numbers |
| `emails` | String array | Email addresses displayed on the website |
| `address_office` | Object array | Office locations |
| `address` | String | Office address |
| `map_url` | String | Google Maps link |

You can retain the existing Google Maps place URL instead of the shorter example above.

The `emails` array controls displayed contacts. It does not change form recipients.

Form recipients are configured separately in the API Worker:

```text
ESTIMATE_TO_EMAIL
CAREERS_TO_EMAIL
```

#### Jobs

File:

```text
app/json/jobs.json
```

Example:

```json
[
  {
    "Title": "Experienced Roofer",
    "Position": "Full-time",
    "Location": "Chilliwack & Fraser Valley",
    "Description": "We are looking for an experienced roofer to join our team at Storm Pro Roofing.",
    "Requirements": [
      "Previous roofing experience is required",
      "Knowledge of roofing materials and installation techniques",
      "Ability to work safely at heights",
      "Strong work ethic and reliability",
      "Must have reliable transportation"
    ],
    "Salary": "",
    "Duties": [
      "Install, repair and replace roofing systems",
      "Prepare roof surfaces",
      "Inspect completed work",
      "Maintain a clean job site",
      "Follow workplace safety procedures"
    ]
  },
  {
    "Title": "Roofing Laborer",
    "Position": "Full-time",
    "Location": "Chilliwack & Fraser Valley",
    "Description": "We are looking for a dependable roofing laborer to support our team.",
    "Requirements": [
      "Previous experience is helpful but not required",
      "Comfortable working at heights",
      "Ability to follow directions",
      "Reliable and willing to learn",
      "Must have reliable transportation"
    ],
    "Salary": "",
    "Duties": [
      "Assist with tear-offs and material handling",
      "Prepare and clean job sites",
      "Load and unload materials",
      "Support roofers during installation",
      "Follow safety procedures"
    ]
  }
]
```

| Property | Description |
| --- | --- |
| `Title` | Job title |
| `Position` | Employment type, such as `Full-time` |
| `Location` | Work location |
| `Description` | Role description |
| `Requirements` | Array of requirements |
| `Salary` | Salary information |
| `Duties` | Array of responsibilities |

To add a vacancy, add another object to the array.

To remove a vacancy, remove its object.

Property names are case-sensitive. Keep the existing capitalization.

In the supplied careers renderer:

- An empty `Salary` hides the salary block.
- `Title` populates the application position list.
- `Position` is used as a fallback when `Title` is empty.
- The updated position list includes a general application option.

The renderer uses HTML templates. Only trusted maintainers should edit these values; use plain text rather than embedded HTML.

#### Projects

File:

```text
app/json/projects.json
```

Example:

```json
[
  {
    "id": "1",
    "service_type": "replacement",
    "main_photo_path": "replacement/roof1-abbosford/photo_3_2026-10-18_07-50-47.jpg",
    "list_photos_path": [
      "replacement/roof1-abbosford/photo_1_2026-10-18_07-50-47.jpg",
      "replacement/roof1-abbosford/photo_2_2026-10-18_07-50-47.jpg",
      "replacement/roof1-abbosford/photo_3_2026-10-18_07-50-47.jpg"
    ],
    "title": "Roof Replacement",
    "city": "Abbotsford, BC",
    "description": "Residential roof replacement project.",
    "materials": [
      {
        "name": "Roofing shingles",
        "brand": "",
        "color": "",
        "description": ""
      }
    ]
  },
  {
    "id": "2",
    "service_type": "replacement",
    "main_photo_path": "replacement/roof2-chilliwack/photo_4_2026-10-18_07-52-16.jpg",
    "list_photos_path": [
      "replacement/roof2-chilliwack/photo_3_2026-10-18_07-52-16.jpg",
      "replacement/roof2-chilliwack/photo_2_2026-10-18_07-52-16.jpg",
      "replacement/roof2-chilliwack/photo_1_2026-10-18_07-52-16.jpg"
    ],
    "title": "Residential Roofing Project",
    "city": "Chilliwack, BC",
    "description": "",
    "materials": []
  }
]
```

| Property | Description |
| --- | --- |
| `id` | Unique project identifier |
| `service_type` | Category supported by the filtering code |
| `main_photo_path` | Main project image |
| `list_photos_path` | Gallery images |
| `title` | Project title |
| `city` | Location |
| `description` | Project description |
| `materials` | Array of material objects |
| `materials[].name` | Material name |
| `materials[].brand` | Brand |
| `materials[].color` | Color |
| `materials[].description` | Material description |

When editing projects:

1. Use a unique `id`.
2. Keep categories consistent with the project filtering code.
3. Preserve the image path convention expected by the renderer.
4. Match filename capitalization and extension.
5. Upload all referenced images.
6. Update JSON paths after converting images to WebP or another format.
7. Include the main image in `list_photos_path` if it should also appear in the gallery.

Display behavior for empty fields and arrays depends on the project renderer.

#### JSON rules

- Use double quotes.
- Do not add comments.
- Do not leave trailing commas.
- Keep contacts as an object and jobs/projects as arrays.
- Close every object and array.
- Do not publish API keys, passwords or private applicant information.

### Cloudflare deployment

The production-style setup uses separate deployments:

| Component | URL |
| --- | --- |
| Static website | `https://blue-hat-0f19.dev-smika04.workers.dev/` |
| Form API | `https://form-check.dev-smika04.workers.dev/api/contact` |

#### 1. Build

For the current root deployment:

```bash
npm run build
```

Check the output directory configured in Gulp.

Its root must contain the generated `index.html`, with the required CSS, JavaScript, images and JSON files available at the expected paths.

#### 2. Publish static assets

1. Sign in to Cloudflare Dashboard.
2. Open **Workers & Pages**.
3. Create a static-assets deployment using the available dashboard workflow, or open the existing website.
4. Publish the generated build output.
5. Ensure `index.html` is at the root of the deployed assets.
6. Deploy and open the assigned URL.

Do not upload `node_modules` or unprocessed templates as the website.

Dashboard labels may change. Wrangler is an alternative, but its deployment commands are not configured by the supplied npm scripts.

#### 3. Verify routes

Expected public routes:

```text
/
/services/
/our-projects/
/careers/
/about/
```

The build structure or server routing must provide these addresses.

A static layout can use:

```text
index.html
services/index.html
our-projects/index.html
careers/index.html
about/index.html
```

A sitemap does not create routes or automatically rename source files.

Open and reload each page directly. Check for missing resources in DevTools → Network.

#### 4. Publish the sitemap

Place these files at the build root:

```text
sitemap.xml
robots.txt
```

Use the actual public domain and working routes. Submit the sitemap through Google Search Console.

### Form API and email configuration

#### Worker source

The ready server script is:

```text
worker/worker_form.js
```

Deploy it to the separate form API Worker.

Do not replace the static website deployment with this API script.

The endpoint accepts:

```text
POST /api/contact
Content-Type: multipart/form-data
```

Opening the API root may return `Not found`. Opening the endpoint in a browser sends GET, which does not test form submission.

#### Variables and secrets

Configure these in the API Worker's **Settings → Variables and Secrets**:

| Name | Type | Purpose |
| --- | --- | --- |
| `TURNSTILE_SECRET` | Secret | Private Turnstile key |
| `RESEND_API_KEY` | Secret | Resend sending key |
| `MAIL_FROM` | Text | Shared sender address |
| `ESTIMATE_TO_EMAIL` | Text | Estimate recipient |
| `CAREERS_TO_EMAIL` | Text | Careers recipient |

Keep secrets out of frontend JavaScript, public JSON and Git.

#### Resend testing

Create a Resend API key with **Sending access**.

Without a verified sending domain, use:

```ini
MAIL_FROM=Storm Pro Roofing <onboarding@resend.dev>
ESTIMATE_TO_EMAIL=your-resend-account@gmail.com
CAREERS_TO_EMAIL=your-resend-account@gmail.com
```

Both test recipients must be the email address associated with the Resend account.

For production, verify the sender domain in Resend and use an address on that domain.

#### Turnstile

Create a Turnstile widget and allow the website hostname:

```text
blue-hat-0f19.dev-smika04.workers.dev
```

Add custom-domain hostnames when used.

The public Site Key belongs in the existing frontend configuration:

Fiile script : .app\js\global\contact\contact-config.js

```javascript
export const CONTACT_FORM_CONFIG = {
    submitUrl: 'https://form-check.dev-smika04.workers.dev/api/contact',
    turnstileSiteKey: 'YOUR_PUBLIC_SITE_KEY'
};
```

Keep the other properties of `CONTACT_FORM_CONFIG`.

The private key belongs only in the Worker secret:

```text
TURNSTILE_SECRET
```

Load the official script once:

```html
<script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    async
    defer
></script>
```

The latest controllers start verification after a valid Submit attempt, wait for the token and send it with the form.

The Worker validates the token before sending the email. Tokens are single-use; do not verify the same token separately before submitting the form.

#### Origins and hostnames

Check these Worker lists:

```text
ALLOWED_ORIGINS
ALLOWED_HOSTNAMES
```

`ALLOWED_ORIGINS` contains complete origins, such as:

```text
https://blue-hat-0f19.dev-smika04.workers.dev
```

`ALLOWED_HOSTNAMES` contains hostnames without the protocol or path.

If a CSP is configured, it must allow the required Turnstile resources and the API origin.

#### Rate limiting

Create a KV namespace and bind it to the API Worker as:

```text
FORM_RATE_LIMIT
```

The prepared configuration:

```javascript
const RATE_LIMIT_CONFIG = {
    maxSubmissions: 10,
    windowSeconds: 60 * 60,
    keyPrefix: 'form-submit'
};
```

The limit is shared by both form types and is based on IP address.

The prepared implementation counts attempts after successful CAPTCHA and before the email request. A Resend failure may consume an attempt.

Without the KV binding, this application-level limit is disabled. KV updates are not atomic, so concurrent requests may exceed the intended limit.

#### Form routing

Estimate:

```html
<input type="hidden" name="form_type" value="estimate">
```

Careers:

```html
<input type="hidden" name="form_type" value="careers">
```

The server selects recipients from its environment variables.

- Estimate forms use `service`.
- Careers forms use `position`.
- Estimates allow up to three images.
- Careers allow one PDF, DOC or DOCX resume.
- Each file is limited to `3 * 1024 * 1024` bytes.

#### Verification

After deployment:

1. Test required fields.
2. Test oversized file rejection.
3. Submit one form of each type.
4. Inspect `POST /api/contact` in Network.
5. Check the status and JSON response.
6. Confirm recipient, content and attachments.
7. Check delivery events in Resend.

`success: true` means the mail service accepted the message, not that it necessarily reached the Inbox.

### GitHub Pages preview

Workflow file:

```text
.github/workflows/static.yml
```

The project also supports a GitHub Pages deployment for visual preview.

In the current project configuration, this is a display/demo environment:

- Static pages and layout can be reviewed.
- The Cloudflare API is not deployed by GitHub Pages.
- Form submission and external widgets are not configured as working features in this preview.
- Use the Cloudflare deployment for full form testing.

This is a limitation of the current preview configuration, not a universal restriction on client-side widgets hosted on GitHub Pages.

#### Running the preview

1. Push the project to GitHub.
2. Open **Settings → Pages**.
3. Select **GitHub Actions** as the publishing source.
4. Open the repository's **Actions** tab.
5. Select the workflow defined in `static.yml`.
6. Run it manually if `workflow_dispatch` is enabled, or trigger the configured branch/event.
7. Wait for the build and deployment to finish.
8. Open the Pages URL shown by GitHub.

For a repository project site such as:

```text
https://USERNAME.github.io/ProStromRoofing/
```

the workflow build must use the matching base path:

```bash
npm run build -- --baseHref=/ProStromRoofing/
```

Use the repository's exact name and capitalization. For deployment at the root of a user site or custom domain, build with `/`.

The workflow's build output/artifact directory must match the actual Gulp output directory.

Check `static.yml` for its real triggers, Node.js version, build command and artifact path.

### Maintenance and troubleshooting

After editing source files:

```bash
npm run build
```

Use `baseHref` when required, then redeploy the generated output.

Worker code and secrets are updated separately.

When changing domains, update:

- Turnstile hostnames.
- Worker origin and hostname allowlists.
- Frontend API URL if changed.
- Sitemap and robots.txt.
- Canonical URLs where present.

| Symptom | Check |
| --- | --- |
| Missing CSS or images | Base path, output paths, filename case |
| API 404 | API hostname, endpoint and deployed Worker version |
| API 429 | Response body, `Retry-After`, submission counter |
| CAPTCHA failure | Keys, hostname and callbacks |
| Email failure | Resend key, sender verification and recipient restrictions |
| GitHub preview forms do not work | Expected for the current visual-preview configuration |
| Console messages from Cloudflare | Check token generation and API results; messages alone do not establish failed submission |

---

## Русский

### Содержание

1. [Структура проекта](#структура-проекта)
2. [Установка и локальный запуск](#установка-и-локальный-запуск)
3. [Команды и базовый путь](#команды-и-базовый-путь)
4. [Статические JSON-данные](#статические-json-данные)
5. [Публикация на Cloudflare](#публикация-на-cloudflare)
6. [API формы и отправка писем](#api-формы-и-отправка-писем)
7. [Предпросмотр на GitHub Pages](#предпросмотр-на-github-pages)
8. [Обновление и диагностика](#обновление-и-диагностика)

### Структура проекта

```text
ProStromRoofing/
├── .github/
│   └── workflows/
│       └── static.yml          # Предпросмотр через GitHub Pages
├── app/
│   ├── components/             # Повторно используемые HTML-фрагменты
│   ├── css/                    # CSS-ресурсы
│   ├── images/                 # Фото, логотипы и иконки
│   ├── js/                     # JavaScript-модули
│   ├── json/
│   │   ├── company_contacts.json
│   │   ├── jobs.json
│   │   └── projects.json
│   ├── pages/                  # Шаблоны и содержимое страниц
│   ├── scss/                   # Исходные SCSS-стили
│   └── index.html              # Главный HTML-шаблон
├── worker/
│   └── worker_form.js          # Готовый API Worker для заявок
└── package.json                # Зависимости и npm-команды
```

Выходная папка определяется конфигурацией Gulp.

Шаблоны используют `@@include(...)`. Публикуйте обработанный результат, а не исходную разметку.

Перед редактированием `app/css/` проверьте, не генерируются ли эти файлы из SCSS.

### Установка и локальный запуск

#### Требования

- Node.js и npm, совместимые с зависимостями проекта.
- Аккаунт Cloudflare для публикации.
- Аккаунт Resend для отправки писем.

Версия Node.js не зафиксирована в предоставленном `package.json`.

#### Установка зависимостей

Из корня проекта:

```bash
npm install
```

При наличии актуального `package-lock.json`:

```bash
npm ci
```

Используйте один способ установки.

#### Запуск разработки

```bash
npm run dev
```

Команда запускает стандартную задачу Gulp.

Откройте адрес BrowserSync из терминала. Порт задаётся в конфигурации Gulp.

Базовый путь в dev:

```text
/
```

Остановка сервера:

```text
Ctrl+C
```

### Команды и базовый путь

| Команда | Назначение |
| --- | --- |
| `npm install` | Установка зависимостей |
| `npm ci` | Установка по lock-файлу |
| `npm run dev` | Локальная разработка |
| `npm run build` | Сборка для корня домена |
| `npm run build -- --baseHref=/ProStromRoofing/` | Сборка для подпапки |

#### Корень домена

```bash
npm run build
```

Если `baseHref` не передан, используется `/`.

Подходит для:

```text
https://stormproroofing.ca/
https://blue-hat-0f19.dev-smika04.workers.dev/
```

Для сайта в корне отдельного поддомена также нужен `/`.

#### Подпапка

```bash
npm run build -- --baseHref=/ProStromRoofing/
```

Пример публичного адреса:

```text
https://example.com/ProStromRoofing/
```

Другой пример:

```bash
npm run build -- --baseHref=/pro/
```

Разделитель `--` передаёт параметры от npm в Gulp.

Базовый путь — это путь URL, а не доменное имя. Для возврата к корневому размещению запустите build без аргумента.

#### Тесты

```bash
npm test
```

Пока это заглушка, которая завершается с кодом `1`. Автоматические тесты этой командой не запускаются.

#### Основные зависимости

| Зависимость | Назначение |
| --- | --- |
| Gulp 4 | Задачи сборки |
| BrowserSync | Локальный сервер и синхронизация браузера |
| Sass / gulp-sass | Компиляция стилей |
| gulp-file-include | HTML-включения |
| esbuild / gulp-esbuild | Сборка JavaScript-модулей |
| gulp-autoprefixer | CSS-префиксы |
| gulp-concat / gulp-rename | Обработка файлов |
| gulp-uglify | Минификация JavaScript |
| jQuery | Зависимости интерфейса |
| Slick Carousel | Слайдеры |
| normalize.css | Нормализация стилей |
| svg-injector | Вставка SVG |

Не обновляйте jQuery до `4.x` без проверки совместимости Slick Carousel. Текущая зависимость — `^3.7.1`.

### Статические JSON-данные

Публичное содержимое хранится в:

```text
app/json/
```

После изменения исходных JSON-файлов пересоберите и опубликуйте сайт.

#### Контакты компании

Файл:

```text
app/json/company_contacts.json
```

Пример:

```json
{
  "fax_numbers": [],
  "phone_numbers": [
    "(604) 799-4080"
  ],
  "emails": [
    "info@stormproroofing.ca",
    "contact@stormproroofing.ca",
    "careers@stormproroofing.ca"
  ],
  "address_office": [
    {
      "address": "5480 Pebble Ln, Chilliwack, BC V2R 6B8",
      "map_url": "https://www.google.com/maps/search/?api=1&query=Storm+Pro+Roofing+Chilliwack"
    }
  ]
}
```

| Поле | Тип | Назначение |
| --- | --- | --- |
| `fax_numbers` | Массив строк | Факсы; `[]`, если отсутствуют |
| `phone_numbers` | Массив строк | Публичные телефоны |
| `emails` | Массив строк | Email, отображаемые на сайте |
| `address_office` | Массив объектов | Офисы |
| `address` | Строка | Адрес |
| `map_url` | Строка | Ссылка Google Maps |

Вместо сокращённого примера карты можно оставить существующую ссылку на организацию в Google Maps.

Массив `emails` меняет публичные контакты, но не получателей заявок.

Получатели настраиваются в API Worker:

```text
ESTIMATE_TO_EMAIL
CAREERS_TO_EMAIL
```

#### Вакансии

Файл:

```text
app/json/jobs.json
```

Пример:

```json
[
  {
    "Title": "Experienced Roofer",
    "Position": "Full-time",
    "Location": "Chilliwack & Fraser Valley",
    "Description": "We are looking for an experienced roofer to join our team at Storm Pro Roofing.",
    "Requirements": [
      "Previous roofing experience is required",
      "Knowledge of roofing materials and installation techniques",
      "Ability to work safely at heights",
      "Strong work ethic and reliability",
      "Must have reliable transportation"
    ],
    "Salary": "",
    "Duties": [
      "Install, repair and replace roofing systems",
      "Prepare roof surfaces",
      "Inspect completed work",
      "Maintain a clean job site",
      "Follow workplace safety procedures"
    ]
  },
  {
    "Title": "Roofing Laborer",
    "Position": "Full-time",
    "Location": "Chilliwack & Fraser Valley",
    "Description": "We are looking for a dependable roofing laborer to support our team.",
    "Requirements": [
      "Previous experience is helpful but not required",
      "Comfortable working at heights",
      "Ability to follow directions",
      "Reliable and willing to learn",
      "Must have reliable transportation"
    ],
    "Salary": "",
    "Duties": [
      "Assist with tear-offs and material handling",
      "Prepare and clean job sites",
      "Load and unload materials",
      "Support roofers during installation",
      "Follow safety procedures"
    ]
  }
]
```

| Поле | Назначение |
| --- | --- |
| `Title` | Название вакансии |
| `Position` | Тип занятости |
| `Location` | Место работы |
| `Description` | Описание |
| `Requirements` | Массив требований |
| `Salary` | Информация о зарплате |
| `Duties` | Массив обязанностей |

Для добавления вакансии создайте объект в массиве. Для удаления уберите соответствующий объект.

Регистр ключей важен.

В предоставленном скрипте careers:

- Пустой `Salary` скрывает блок зарплаты.
- `Title` используется в списке должностей формы.
- `Position` используется как резервное значение.
- В обновлённом списке есть вариант общей заявки.

Скрипт использует HTML-шаблоны. Данные должны редактировать только доверенные пользователи; используйте обычный текст без HTML.

#### Проекты

Файл:

```text
app/json/projects.json
```

Пример:

```json
[
  {
    "id": "1",
    "service_type": "replacement",
    "main_photo_path": "replacement/roof1-abbosford/photo_3_2026-10-18_07-50-47.jpg",
    "list_photos_path": [
      "replacement/roof1-abbosford/photo_1_2026-10-18_07-50-47.jpg",
      "replacement/roof1-abbosford/photo_2_2026-10-18_07-50-47.jpg",
      "replacement/roof1-abbosford/photo_3_2026-10-18_07-50-47.jpg"
    ],
    "title": "Roof Replacement",
    "city": "Abbotsford, BC",
    "description": "Residential roof replacement project.",
    "materials": [
      {
        "name": "Roofing shingles",
        "brand": "",
        "color": "",
        "description": ""
      }
    ]
  },
  {
    "id": "2",
    "service_type": "replacement",
    "main_photo_path": "replacement/roof2-chilliwack/photo_4_2026-10-18_07-52-16.jpg",
    "list_photos_path": [
      "replacement/roof2-chilliwack/photo_3_2026-10-18_07-52-16.jpg",
      "replacement/roof2-chilliwack/photo_2_2026-10-18_07-52-16.jpg",
      "replacement/roof2-chilliwack/photo_1_2026-10-18_07-52-16.jpg"
    ],
    "title": "Residential Roofing Project",
    "city": "Chilliwack, BC",
    "description": "",
    "materials": []
  }
]
```

| Поле | Назначение |
| --- | --- |
| `id` | Уникальный идентификатор |
| `service_type` | Категория, поддерживаемая фильтром |
| `main_photo_path` | Главное изображение |
| `list_photos_path` | Изображения галереи |
| `title` | Название проекта |
| `city` | Местоположение |
| `description` | Описание |
| `materials` | Массив материалов |
| `materials[].name` | Название материала |
| `materials[].brand` | Бренд |
| `materials[].color` | Цвет |
| `materials[].description` | Описание материала |

При редактировании:

1. Используйте уникальный `id`.
2. Сохраняйте категории, поддерживаемые фильтром.
3. Соблюдайте формат путей, ожидаемый скриптом.
4. Проверяйте регистр и расширения файлов.
5. Загружайте все указанные изображения.
6. Обновляйте JSON при замене JPG на WebP.
7. Добавляйте главное фото в галерею, если оно должно отображаться там.

Отображение пустых полей и массивов зависит от скрипта проектов.

#### Правила JSON

- Используйте двойные кавычки.
- Не добавляйте комментарии.
- Не ставьте запятую после последнего элемента.
- Контакты должны оставаться объектом, вакансии и проекты — массивами.
- Закрывайте все объекты и массивы.
- Не публикуйте ключи, пароли и личные данные соискателей.

### Публикация на Cloudflare

Сайт и API размещаются отдельно:

| Компонент | Адрес |
| --- | --- |
| Статический сайт | `https://blue-hat-0f19.dev-smika04.workers.dev/` |
| API формы | `https://form-check.dev-smika04.workers.dev/api/contact` |

#### 1. Собрать

Для текущего размещения:

```bash
npm run build
```

Используйте выходную папку из конфигурации Gulp.

В её корне должен находиться готовый `index.html`. CSS, JS, изображения и JSON должны быть доступны по ожидаемым путям.

#### 2. Опубликовать статику

1. Войдите в Cloudflare Dashboard.
2. Откройте **Workers & Pages**.
3. Создайте развёртывание статических ресурсов или откройте существующий сайт.
4. Опубликуйте готовый результат сборки.
5. Убедитесь, что `index.html` находится в корне ресурсов.
6. Выполните развёртывание и откройте выданный URL.

Не загружайте `node_modules` и исходные шаблоны вместо сборки.

Названия кнопок могут меняться. Альтернатива — Wrangler, но его команды не настроены в предоставленных npm-скриптах.

#### 3. Проверить маршруты

```text
/
/services/
/our-projects/
/careers/
/about/
```

Эти адреса должны обеспечиваться структурой сборки или серверной маршрутизацией.

Для статики возможна структура:

```text
index.html
services/index.html
our-projects/index.html
careers/index.html
about/index.html
```

Sitemap не создаёт маршруты и не переименовывает исходные файлы.

Откройте и перезагрузите каждую страницу напрямую. Проверьте ресурсы в DevTools → Network.

#### 4. Добавить карту сайта

В корне сборки:

```text
sitemap.xml
robots.txt
```

Укажите фактический домен и работающие маршруты. Добавьте sitemap в Google Search Console.

### API формы и отправка писем

#### Серверный файл

Готовый скрипт:

```text
worker/worker_form.js
```

Опубликуйте его в отдельном Worker API формы.

Не заменяйте им статический сайт.

Endpoint принимает:

```text
POST /api/contact
Content-Type: multipart/form-data
```

Корень API может возвращать `Not found`. Открытие endpoint в браузере отправляет GET, а не заявку.

#### Переменные и секреты

В **Settings → Variables and Secrets** API Worker:

| Название | Тип | Назначение |
| --- | --- | --- |
| `TURNSTILE_SECRET` | Secret | Приватный ключ Turnstile |
| `RESEND_API_KEY` | Secret | Ключ Resend |
| `MAIL_FROM` | Text | Общий отправитель |
| `ESTIMATE_TO_EMAIL` | Text | Получатель расчётов |
| `CAREERS_TO_EMAIL` | Text | Получатель резюме |

Не помещайте секреты в браузерный JavaScript, публичный JSON и Git.

#### Тестирование Resend

Создайте API-ключ Resend с разрешением **Sending access**.

Без подтверждённого домена:

```ini
MAIL_FROM=Storm Pro Roofing <onboarding@resend.dev>
ESTIMATE_TO_EMAIL=your-resend-account@gmail.com
CAREERS_TO_EMAIL=your-resend-account@gmail.com
```

В обоих получателях укажите email аккаунта Resend.

Для production подтвердите домен отправителя и используйте адрес на этом домене.

#### Turnstile

Создайте виджет и разрешите hostname сайта:

```text
blue-hat-0f19.dev-smika04.workers.dev
```

Добавьте hostnames собственного домена, когда он используется.

В существующем frontend-конфиге:

Fiile script : .app\js\global\contact\contact-config.js

```javascript
export const CONTACT_FORM_CONFIG = {
    submitUrl: 'https://form-check.dev-smika04.workers.dev/api/contact',
    turnstileSiteKey: 'YOUR_PUBLIC_SITE_KEY'
};
```

Остальные свойства `CONTACT_FORM_CONFIG` сохраните.

Приватный ключ хранится только в секрете Worker:

```text
TURNSTILE_SECRET
```

Один раз подключите:

```html
<script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    async
    defer
></script>
```

Последние контроллеры запускают проверку после валидации и Submit. Затем ожидают токен и отправляют его вместе с формой.

Worker проверяет токен перед отправкой письма. Токен одноразовый: не проверяйте его отдельным запросом заранее.

#### Разрешённые адреса

Проверьте списки Worker:

```text
ALLOWED_ORIGINS
ALLOWED_HOSTNAMES
```

В `ALLOWED_ORIGINS` указывается полный origin:

```text
https://blue-hat-0f19.dev-smika04.workers.dev
```

В `ALLOWED_HOSTNAMES` — hostname без протокола и пути.

Если задана CSP, она должна разрешать необходимые ресурсы Turnstile и origin API.

#### Ограничение заявок

Создайте KV namespace и binding API Worker:

```text
FORM_RATE_LIMIT
```

Подготовленная конфигурация:

```javascript
const RATE_LIMIT_CONFIG = {
    maxSubmissions: 10,
    windowSeconds: 60 * 60,
    keyPrefix: 'form-submit'
};
```

Лимит по IP общий для обеих форм.

В подготовленной реализации счётчик увеличивается после успешной CAPTCHA и до почтового запроса. Ошибка Resend может израсходовать попытку.

Без KV binding этот лимит не действует. Обновления KV не атомарны, поэтому одновременные запросы могут превысить границу.

#### Типы форм

Расчёт стоимости:

```html
<input type="hidden" name="form_type" value="estimate">
```

Карьера:

```html
<input type="hidden" name="form_type" value="careers">
```

Сервер выбирает получателей из своих переменных.

- Для estimate используется `service`.
- Для careers используется `position`.
- Для расчёта допускается до трёх изображений.
- Для карьеры — одно резюме PDF, DOC или DOCX.
- Максимум на файл — `3 * 1024 * 1024` байтов.

#### Проверка

После публикации:

1. Проверьте обязательные поля.
2. Проверьте отклонение файлов больше лимита.
3. Отправьте по одной заявке каждого типа.
4. Найдите `POST /api/contact` в Network.
5. Проверьте статус и JSON-ответ.
6. Проверьте получателя, данные и вложения.
7. Проверьте события доставки Resend.

`success: true` означает принятие письма почтовым сервисом, но не гарантирует доставку во входящие.

### Предпросмотр на GitHub Pages

Workflow:

```text
.github/workflows/static.yml
```

Проект также можно опубликовать на GitHub Pages для визуального просмотра.

В текущей конфигурации это демонстрационная версия:

- Можно просматривать страницы и оформление.
- Cloudflare API не развёртывается через GitHub Pages.
- Отправка форм и внешние виджеты не настроены как рабочие функции этого предпросмотра.
- Полную работу форм проверяйте на Cloudflare.

Это ограничение текущей конфигурации проекта, а не универсальный запрет GitHub Pages на клиентские виджеты.

#### Запуск

1. Отправьте проект в GitHub.
2. Откройте **Settings → Pages**.
3. Выберите **GitHub Actions** как источник публикации.
4. Перейдите во вкладку **Actions**.
5. Выберите workflow из `static.yml`.
6. Запустите вручную, если включён `workflow_dispatch`, либо используйте настроенное событие/ветку.
7. Дождитесь завершения сборки и публикации.
8. Откройте URL GitHub Pages.

Для адреса:

```text
https://USERNAME.github.io/ProStromRoofing/
```

команда сборки workflow должна использовать:

```bash
npm run build -- --baseHref=/ProStromRoofing/
```

Название и регистр подпапки должны совпадать с репозиторием.

Для пользовательского сайта или собственного домена с размещением в корне используйте `/`.

Каталог артефакта в workflow должен совпадать с фактической выходной папкой Gulp.

Точные события запуска, версию Node.js, команду сборки и путь артефакта смотрите в `static.yml`.

### Обновление и диагностика

После изменений исходников:

```bash
npm run build
```

При необходимости укажите `baseHref`, затем опубликуйте результат.

Код и секреты Worker обновляются отдельно.

При смене домена обновите:

- Hostnames Turnstile.
- Списки origin и hostname Worker.
- Адрес API, если он изменился.
- Sitemap и robots.txt.
- Canonical URL при наличии.

| Симптом | Что проверить |
| --- | --- |
| Не загружаются CSS или изображения | Базовый путь, пути сборки, регистр имён |
| API 404 | Домен API, endpoint и версию Worker |
| API 429 | Тело ответа, `Retry-After`, счётчик |
| Ошибка CAPTCHA | Ключи, hostname и callbacks |
| Ошибка письма | Ключ Resend, отправителя и ограничения получателей |
| Формы не работают на GitHub | Ожидаемо для текущего визуального предпросмотра |
| Сообщения Cloudflare в Console | Проверить токен и API; сами сообщения не доказывают сбой отправки |

---

## References / Документация

- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Worker variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Turnstile configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/)
- [Resend API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend testing restrictions](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain)

## License / Лицензия

The package declares the ISC license. Third-party images, brand logos and other assets remain subject to their own licenses and permissions.

В package.json указана лицензия ISC. Сторонние фотографии, логотипы и другие материалы используются согласно отдельным лицензиям и разрешениям правообладателей.