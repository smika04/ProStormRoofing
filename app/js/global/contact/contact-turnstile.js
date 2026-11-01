export function createTurnstileController(form, config, messageController) {
    const container = form.querySelector('.cf-turnstile');
    let widgetId = null;
    let token = '';
    let pending = null;
    let initialized = false;

    function getTurnstile() {
        return typeof window !== 'undefined' ? window.turnstile : null;
    }

    function settle(value) {
        token = value || '';
        if (!pending) return;
        const current = pending;
        pending = null;
        clearTimeout(current.timer);
        current.resolve(token);
    }

    function unavailable() {
        settle('');
        messageController.show(config.captchaUnavailableMessage ||
            'Security check is unavailable. Please try again.', true);
    }

    function init() {
        if (initialized) return;
        initialized = true;
        // No widget rendering, challenge, or token generation on page load.
        if (container) container.hidden = true;
    }

    function renderIfNeeded() {
        const api = getTurnstile();
        if (!container || !config.turnstileSiteKey || typeof api?.render !== 'function') return false;
        if (widgetId !== null) return true;
        try {
            const id = api.render(container, {
                sitekey: config.turnstileSiteKey,
                theme: 'light',
                size: 'flexible',
                execution: 'execute',
                appearance: 'execute',
                retry: 'never',
                'refresh-expired': 'manual',
                'refresh-timeout': 'manual',
                callback: response => settle(response),
                'expired-callback': () => settle(''),
                'timeout-callback': unavailable,
                'unsupported-callback': unavailable,
                'error-callback': () => {
                    unavailable();
                    return true;
                }
            });
            if (id === undefined || id === null) return false;
            widgetId = id;
            return true;
        } catch {
            return false;
        }
    }

    async function waitForApi() {
        const started = Date.now();
        while (typeof getTurnstile()?.render !== 'function') {
            if (Date.now() - started >= 8000) return false;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return true;
    }

    async function executeAndGetToken() {
        if (pending) return '';
        if (!container || !(await waitForApi())) {
            unavailable();
            return '';
        }
        container.hidden = false;
        if (!renderIfNeeded()) {
            unavailable();
            return '';
        }
        return new Promise(resolve => {
            const timer = setTimeout(() => {
                unavailable();
                reset();
            }, 120000);
            pending = { resolve, timer };
            try {
                const api = getTurnstile();
                token = '';
                api.reset(widgetId);
                api.execute(widgetId);
            } catch {
                unavailable();
            }
        });
    }

    function getToken() {
        return token;
    }

    function reset() {
        settle('');
        try {
            if (widgetId !== null) getTurnstile()?.reset(widgetId);
        } catch {
            // A later submission will report any initialization failure.
        }
        if (container) container.hidden = true;
    }

    return { init, renderIfNeeded, executeAndGetToken, getToken, reset };
}