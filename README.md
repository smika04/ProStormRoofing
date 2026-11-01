# Storm Pro Roofing

<a href="#EN">EN</a>
<a href="#RUS">RUS</a>

<h2 id="EN">English</h2>

A multipage roofing company website built with Gulp. The static website is hosted on Cloudflare Workers. A separate Worker handles form submissions using Cloudflare Turnstile and Resend.

### Requirements

- Node.js and npm.
- A Cloudflare account for deployment.
- A Resend account for email delivery.

The supported Node.js version is not specified in `package.json`. Check compatibility with the project's Gulp configuration.

### Installation

Run from the project root:

```bash
npm install
```

If the repository contains an up-to-date `package-lock.json`, use:

```bash
npm ci
```

### Local development

```bash
npm run dev
```

This runs the default Gulp task. The development base path is `/`.

Check the terminal output for the BrowserSync address and port.

Stop the development server with `Ctrl+C`.

### Production build

#### Deploy at the domain root

```bash
npm run build
```

Without a `baseHref` argument, the base path is `/`.

Use this for:

```text
https://stormproroofing.ca/
https://blue-hat-0f19.dev-smika04.workers.dev/
```

#### Deploy in a subdirectory

```bash
npm run build -- --baseHref=/ProStromRoofing/
```

This build expects the website at:

```text
https://example.com/ProStromRoofing/
```

Another example:

```bash
npm run build -- --baseHref=/pro/
```

The `--` separator passes arguments from npm to Gulp.

A subdomain does not require a subdirectory base path. If the website is at the root of a subdomain, use `/`.

The output directory is defined in the Gulp configuration. Deploy the generated files, not the source templates. All `@@include(...)` directives must be resolved during the build.

### Available commands

| Command | Description |
| --- | --- |
| `npm install` | Install dependencies |
| `npm ci` | Install dependencies from the lockfile |
| `npm run dev` | Start local development |
| `npm run build` | Build with `/` as the base path |
| `npm run build -- --baseHref=/pro/` | Build for a subdirectory |

`npm test` is currently a placeholder and exits with code `1`.

### Main dependencies

- Gulp 4 — build tasks.
- BrowserSync — local development server and browser synchronization.
- Sass and gulp-sass — stylesheet compilation.
- gulp-file-include — HTML template includes.
- esbuild and gulp-esbuild — JavaScript bundling with `import` and `export`.
- gulp-autoprefixer — CSS vendor prefixes.
- gulp-concat and gulp-rename — file processing.
- gulp-uglify — JavaScript minification.
- jQuery 3.7.1 and Slick Carousel — interface components and sliders.
- normalize.css — browser style normalization.
- svg-injector — SVG injection.

Keep jQuery below version 4.0.0 because of Slick Carousel compatibility. The current `^3.7.1` dependency does not automatically upgrade to jQuery 4.

### Deploying the website to Cloudflare

The project uses separate deployments for the website and the form API:

| Component | URL |
| --- | --- |
| Website | `https://blue-hat-0f19.dev-smika04.workers.dev/` |
| Form API | `https://form-check.dev-smika04.workers.dev/api/contact` |

#### 1. Build the website

For deployment at the root of the current domain:

```bash
npm run build
```

Check the generated output directory. Its root must contain the generated `index.html` and the required asset directories.

Do not upload `node_modules` or unprocessed source templates.

#### 2. Deploy static assets

1. Sign in to Cloudflare Dashboard.
2. Open **Workers & Pages**.
3. Create an application and choose the static-file deployment option available in the dashboard.
4. Upload the generated build directory with `index.html` at its root.
5. Deploy the website.
6. Open the assigned URL.

For an existing deployment, publish a new version of its static assets.

Dashboard labels may change. Workers Static Assets can also be deployed with Wrangler, but Wrangler deployment scripts are not included in the supplied `package.json`.

#### 3. Check page routes

The website uses these public routes:

```text
/
/services/
/our-projects/
/careers/
/about/
```

A static directory layout can provide these routes:

```text
index.html
services/index.html
our-projects/index.html
careers/index.html
about/index.html
```

Alternatively, routing can be handled by Worker code.

A sitemap does not create routes or automatically map `about_us.html` to `/about/`.

Open and reload every page directly. Check that CSS, JavaScript, images and JSON files load without `404` responses.

#### 4. Publish the sitemap

Place these files at the root of the build output:

```text
sitemap.xml
robots.txt
```

Both files must reference the actual public domain and page URLs.

Update them when moving from the `workers.dev` address to a custom domain.

### Configuring the form API

#### 1. Deploy the API Worker

1. Create a separate Worker in Cloudflare.
2. Add the server-side `worker.js`.
3. Deploy it.
4. Use its `/api/contact` endpoint in the frontend configuration.

The endpoint accepts:

```text
POST /api/contact
Content-Type: multipart/form-data
```

Opening the API root in a browser may return `Not found`. Opening `/api/contact` sends a GET request, which does not test form submission.

#### 2. Configure Turnstile

1. Create a widget in Cloudflare **Turnstile**.
2. Add the website hostname:

```text
blue-hat-0f19.dev-smika04.workers.dev
```

3. Add production hostnames when used:

```text
stormproroofing.ca
www.stormproroofing.ca
```

4. Set the public Site Key in `CONTACT_FORM_CONFIG.turnstileSiteKey`.
5. Store the private Secret Key in the API Worker as `TURNSTILE_SECRET`.

Load the Turnstile API once:

```html
<script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    async
    defer
></script>
```

The latest controllers create and execute the widget after the user submits a valid form. The form waits for the token before sending its request.

The Worker validates the token on the server. Tokens are single-use, so do not verify the same token through a separate endpoint before `/api/contact`.

#### 3. Configure Resend

1. Create a Resend account.
2. Open **API Keys**.
3. Create a key with **Sending access**.
4. Copy the full key immediately. Its value cannot be viewed again after creation.
5. For production, verify a sending domain and add the DNS records provided by Resend.

In **API Worker → Settings → Variables and Secrets**, configure:

| Name | Type | Purpose |
| --- | --- | --- |
| `TURNSTILE_SECRET` | Secret | Private Turnstile key |
| `RESEND_API_KEY` | Secret | Resend API key |
| `MAIL_FROM` | Text | Shared sender address |
| `ESTIMATE_TO_EMAIL` | Text | Estimate recipient |
| `CAREERS_TO_EMAIL` | Text | Careers recipient |

Save and apply the changes.

Never include private keys in frontend JavaScript or commit them to the repository.

For testing without a verified sending domain:

```ini
MAIL_FROM=Storm Pro Roofing <onboarding@resend.dev>
ESTIMATE_TO_EMAIL=your-resend-account@gmail.com
CAREERS_TO_EMAIL=your-resend-account@gmail.com
```

Replace the example recipient with the email address associated with your Resend account. The test sender restricts delivery to that address.

#### 4. Configure submission limits

Create a KV namespace and bind it to the API Worker using this name:

```text
FORM_RATE_LIMIT
```

The Worker configuration:

```javascript
const RATE_LIMIT_CONFIG = {
    maxSubmissions: 10,
    windowSeconds: 60 * 60,
    keyPrefix: 'form-submit'
};
```

The current implementation allows up to 10 attempts after successful CAPTCHA verification per IP address during a one-hour window, shared by both form types.

The counter increases before sending through Resend. An email delivery API failure can therefore consume an attempt.

Without the KV binding, this application-level limit is not enforced. The KV implementation is best effort and is not atomic for concurrent requests.

#### 5. Configure the frontend endpoint

Add these properties to the existing `CONTACT_FORM_CONFIG` object:

```javascript
submitUrl: 'https://form-check.dev-smika04.workers.dev/api/contact',
turnstileSiteKey: 'YOUR_PUBLIC_SITE_KEY',
```

Keep the other existing configuration properties.

Rebuild and redeploy the website after changing the frontend configuration.

In the Worker, check:

- `ALLOWED_ORIGINS` includes the full website origin.
- `ALLOWED_HOSTNAMES` includes the hostname where Turnstile runs.
- The site's CSP, if configured, permits the required Turnstile resources and the form API origin.

#### 6. Identify each form

Estimate form:

```html
<input type="hidden" name="form_type" value="estimate">
```

Careers form:

```html
<input type="hidden" name="form_type" value="careers">
```

The Worker selects the recipient using `form_type`.

- Estimate submissions require a `service`.
- Careers submissions require a `position`.
- Estimates allow up to three image attachments.
- Careers allow one PDF, DOC or DOCX resume.
- Each file is limited to `3 * 1024 * 1024` bytes.

### Verification after deployment

1. Open every page directly and reload it.
2. Check Network for missing assets.
3. Test required-field validation.
4. Test rejection of files larger than 3 MB.
5. Submit one estimate and one careers application.
6. Inspect the status and JSON response of `POST /api/contact`.
7. Confirm the recipient, form details and attachments.
8. Check email events in Resend.

A successful API response means the email service accepted the message. It does not guarantee delivery to the recipient's Inbox.

### Updating the website

After modifying source files:

1. Run the build with the required base path.
2. Deploy the generated static assets.
3. Deploy API Worker changes separately when necessary.

When changing domains, update:

- Turnstile hostnames.
- Worker `ALLOWED_ORIGINS` and `ALLOWED_HOSTNAMES`.
- Sitemap and robots.txt.
- Canonical URLs, if present.
- The API endpoint if its address changes.

### Troubleshooting

| Problem | Check |
| --- | --- |
| Missing CSS or images | Base path, asset paths, filename case and build output |
| API returns 404 | API hostname, `/api/contact` path and deployed Worker version |
| API returns 429 | Response body, `Retry-After` and submission limit |
| CAPTCHA fails | Site Key, Secret Key, allowed hostname and error callback |
| Email fails | Worker variables, Resend key, verified sender and testing restrictions |
| CSP, WOFF or adapter messages from Cloudflare | Check CAPTCHA completion and the API response; internal widget messages alone do not establish a submission failure |

---

<h2 id="RUS">Русский</h2>

Многостраничный сайт кровельной компании Storm Pro Roofing. Разработка и сборка выполняются через Gulp. Статический сайт размещён на Cloudflare Workers, а отдельный Worker принимает заявки и отправляет письма через Resend с проверкой Cloudflare Turnstile.

### Требования

- Node.js и npm.
- Аккаунт Cloudflare для публикации.
- Аккаунт Resend для отправки писем.

Версия Node.js не зафиксирована в `package.json`. Совместимость следует проверять с текущей конфигурацией Gulp.

### Установка

В корне проекта выполните:

```bash
npm install
```

Если в репозитории есть актуальный `package-lock.json`:

```bash
npm ci
```

### Локальная разработка

```bash
npm run dev
```

Команда запускает стандартную задачу Gulp. Базовый путь в режиме разработки — `/`.

Адрес и порт BrowserSync смотрите в терминале.

Для остановки нажмите `Ctrl+C`.

### Production-сборка

#### Размещение в корне домена

```bash
npm run build
```

Если `baseHref` не передан, используется `/`.

Этот вариант подходит для:

```text
https://stormproroofing.ca/
https://blue-hat-0f19.dev-smika04.workers.dev/
```

#### Размещение в подпапке

```bash
npm run build -- --baseHref=/ProStromRoofing/
```

Пример адреса:

```text
https://example.com/ProStromRoofing/
```

Для подпапки `pro`:

```bash
npm run build -- --baseHref=/pro/
```

Разделитель `--` передаёт последующие параметры от npm в Gulp.

Базовый путь — это путь внутри URL, а не имя домена. Для сайта в корне отдельного поддомена также используется `/`.

Выходная папка задаётся в конфигурации Gulp. Загружайте результат сборки, а не исходные шаблоны. Директивы `@@include(...)` должны быть заменены готовой HTML-разметкой.

### Команды

| Команда | Назначение |
| --- | --- |
| `npm install` | Установка зависимостей |
| `npm ci` | Установка по lock-файлу |
| `npm run dev` | Локальная разработка |
| `npm run build` | Сборка с базовым путём `/` |
| `npm run build -- --baseHref=/pro/` | Сборка для подпапки |

`npm test` пока является заглушкой и завершается с кодом `1`.

### Основные зависимости

- Gulp 4 — задачи сборки.
- BrowserSync — локальный сервер и синхронизация браузера.
- Sass и gulp-sass — обработка стилей.
- gulp-file-include — подключение HTML-фрагментов.
- esbuild и gulp-esbuild — сборка JavaScript-модулей.
- gulp-autoprefixer — CSS-префиксы.
- gulp-concat и gulp-rename — обработка файлов.
- gulp-uglify — минификация JavaScript.
- jQuery 3.7.1 и Slick Carousel — элементы интерфейса и слайдеры.
- normalize.css — нормализация стилей.
- svg-injector — вставка SVG.

Не обновляйте jQuery до 4.x без проверки совместимости Slick Carousel. Ограничение `^3.7.1` не допускает автоматического перехода на четвёртую версию.

### Публикация сайта на Cloudflare

Используются два отдельных развёртывания:

| Компонент | Адрес |
| --- | --- |
| Сайт | `https://blue-hat-0f19.dev-smika04.workers.dev/` |
| API формы | `https://form-check.dev-smika04.workers.dev/api/contact` |

#### 1. Собрать сайт

Для текущего размещения в корне домена:

```bash
npm run build
```

Проверьте выходную папку. Готовый `index.html` должен находиться в её корне вместе с необходимыми каталогами ресурсов.

Не загружайте `node_modules` и необработанные шаблоны.

#### 2. Опубликовать статические файлы

1. Войдите в Cloudflare Dashboard.
2. Откройте **Workers & Pages**.
3. Создайте приложение и выберите доступный вариант публикации статических файлов.
4. Загрузите готовую папку сборки, чтобы `index.html` находился в корне ресурсов.
5. Выполните развёртывание.
6. Откройте полученный URL.

Для существующего сайта опубликуйте новую версию ресурсов.

Названия кнопок могут меняться. Альтернатива — публикация Workers Static Assets через Wrangler. Скрипты развёртывания Wrangler не входят в предоставленный `package.json`.

#### 3. Проверить маршруты

Публичные адреса страниц:

```text
/
/services/
/our-projects/
/careers/
/about/
```

Вариант статической структуры:

```text
index.html
services/index.html
our-projects/index.html
careers/index.html
about/index.html
```

Другой вариант — маршрутизация в Worker.

Карта сайта не создаёт маршруты и сама не преобразует `about_us.html` в `/about/`.

Откройте и перезагрузите каждую страницу напрямую. Проверьте отсутствие ошибок 404 для CSS, JavaScript, изображений и JSON.

#### 4. Добавить карту сайта

В корне результата сборки разместите:

```text
sitemap.xml
robots.txt
```

Укажите в них фактический публичный домен и корректные адреса страниц.

После перехода с `workers.dev` на собственный домен обновите оба файла.

### Настройка API формы

#### 1. Создать API Worker

1. Создайте отдельный Worker в Cloudflare.
2. Добавьте серверный `worker.js`.
3. Опубликуйте Worker.
4. Укажите его `/api/contact` в конфигурации сайта.

API принимает:

```text
POST /api/contact
Content-Type: multipart/form-data
```

При открытии корня API в браузере возможен ответ `Not found`. Обычное открытие `/api/contact` отправляет GET, а не заявку POST.

#### 2. Настроить Turnstile

1. Создайте виджет в Cloudflare **Turnstile**.
2. Добавьте hostname сайта:

```text
blue-hat-0f19.dev-smika04.workers.dev
```

3. При использовании собственного домена добавьте:

```text
stormproroofing.ca
www.stormproroofing.ca
```

4. Публичный Site Key укажите в `CONTACT_FORM_CONFIG.turnstileSiteKey`.
5. Приватный Secret Key сохраните в API Worker как `TURNSTILE_SECRET`.

Подключайте API один раз:

```html
<script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    async
    defer
></script>
```

В последних версиях контроллеров виджет создаётся и проверка запускается после отправки корректно заполненной формы. Затем форма ожидает токен и отправляет запрос.

Worker проверяет токен на сервере. Токен одноразовый: отдельная предварительная проверка того же токена перед `/api/contact` не нужна.

#### 3. Настроить Resend

1. Создайте аккаунт Resend.
2. Откройте **API Keys**.
3. Создайте ключ с разрешением **Sending access**.
4. Сразу скопируйте полный ключ. Повторно просмотреть его значение нельзя.
5. Для production подтвердите домен отправителя и добавьте DNS-записи Resend.

В **API Worker → Settings → Variables and Secrets** добавьте:

| Название | Тип | Назначение |
| --- | --- | --- |
| `TURNSTILE_SECRET` | Secret | Приватный ключ Turnstile |
| `RESEND_API_KEY` | Secret | API-ключ Resend |
| `MAIL_FROM` | Text | Общий адрес отправителя |
| `ESTIMATE_TO_EMAIL` | Text | Получатель заявок на расчёт |
| `CAREERS_TO_EMAIL` | Text | Получатель резюме |

Сохраните и примените изменения.

Не добавляйте приватные ключи в браузерный JavaScript или репозиторий.

Для тестирования без подтверждённого домена:

```ini
MAIL_FROM=Storm Pro Roofing <onboarding@resend.dev>
ESTIMATE_TO_EMAIL=your-resend-account@gmail.com
CAREERS_TO_EMAIL=your-resend-account@gmail.com
```

Замените пример на адрес аккаунта Resend. Тестовый отправитель разрешает отправку только на этот адрес.

#### 4. Настроить ограничение заявок

Создайте KV namespace и добавьте к API Worker привязку:

```text
FORM_RATE_LIMIT
```

Настройка в Worker:

```javascript
const RATE_LIMIT_CONFIG = {
    maxSubmissions: 10,
    windowSeconds: 60 * 60,
    keyPrefix: 'form-submit'
};
```

Текущая реализация допускает до 10 попыток после успешной CAPTCHA с одного IP за часовое окно, суммарно для обеих форм.

Счётчик увеличивается перед обращением к Resend. Ошибка почтового API тоже может израсходовать попытку.

Без KV-привязки этот лимит не действует. Реализация на KV приблизительная и не атомарна при одновременных запросах.

#### 5. Подключить сайт к API

Добавьте в существующий `CONTACT_FORM_CONFIG`:

```javascript
submitUrl: 'https://form-check.dev-smika04.workers.dev/api/contact',
turnstileSiteKey: 'YOUR_PUBLIC_SITE_KEY',
```

Остальные свойства конфигурации сохраните.

После изменения frontend-конфигурации пересоберите и опубликуйте сайт.

В Worker проверьте:

- Наличие полного origin сайта в `ALLOWED_ORIGINS`.
- Наличие hostname страницы в `ALLOWED_HOSTNAMES`.
- Разрешение необходимых ресурсов Turnstile и адреса API в CSP сайта, если она задана.

#### 6. Указать тип формы

Заявка на расчёт:

```html
<input type="hidden" name="form_type" value="estimate">
```

Заявка на работу:

```html
<input type="hidden" name="form_type" value="careers">
```

Worker выбирает получателя по `form_type`.

- Для estimate требуется услуга `service`.
- Для careers требуется должность `position`.
- К заявке на расчёт можно приложить до трёх изображений.
- К заявке на работу — одно резюме PDF, DOC или DOCX.
- Максимальный размер каждого файла — `3 * 1024 * 1024` байтов.

### Проверка после публикации

1. Откройте и перезагрузите все страницы напрямую.
2. Проверьте ресурсы в Network.
3. Проверьте обязательные поля.
4. Проверьте отклонение файлов больше 3 МБ.
5. Отправьте по одной тестовой заявке каждого типа.
6. Проверьте статус и JSON-ответ `POST /api/contact`.
7. Проверьте получателя, данные и вложения.
8. Проверьте события доставки в Resend.

Успешный ответ API означает, что почтовый сервис принял письмо. Он не гарантирует попадание письма во входящие.

### Обновление сайта

После изменения исходников:

1. Запустите сборку с нужным базовым путём.
2. Опубликуйте готовые статические файлы.
3. При необходимости отдельно обновите API Worker.

При смене домена обновите:

- Hostnames в Turnstile.
- `ALLOWED_ORIGINS` и `ALLOWED_HOSTNAMES` Worker.
- Sitemap и robots.txt.
- Canonical URL, если используется.
- Адрес API, если он изменился.

### Типичные проблемы

| Проблема | Что проверить |
| --- | --- |
| Не загружаются CSS или изображения | Базовый путь, пути ресурсов, регистр имён и результат сборки |
| API возвращает 404 | Домен API, путь `/api/contact` и версию Worker |
| API возвращает 429 | JSON-ответ, `Retry-After` и лимит заявок |
| CAPTCHA не проходит | Ключи, разрешённый hostname и error-callback |
| Письмо не отправляется | Переменные Worker, ключ Resend, отправителя и тестовые ограничения |
| CSP, WOFF или adapter-сообщения Cloudflare | Проверить получение токена и ответ API; внутренние сообщения виджета сами по себе не доказывают сбой заявки |

---

## References / Документация

- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Worker environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Turnstile configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/)
- [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Resend Send Email API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend test-domain restrictions](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain)

## License / Лицензия

The package declares the ISC license. Third-party photographs, brand logos and other assets remain subject to their respective licenses and permissions.

В package.json указана лицензия ISC. Права на сторонние фотографии, логотипы и другие материалы регулируются отдельными лицензиями и разрешениями правообладателей.