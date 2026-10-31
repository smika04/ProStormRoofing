export function createTurnstileController(form, config, messageController) {
    const container = form.querySelector('.cf-turnstile');

    let widgetId = null;
    let token = '';
    let hasShownReadyMessage = false;
    let intervalId = null;

    function getTurnstile() {
        return typeof window !== 'undefined'
            ? window.turnstile || null
            : null;
    }

    function clearToken() {
        token = '';
        hasShownReadyMessage = false;
    }

    function stopWaiting() {
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function showUnavailable() {
        messageController.show(
            config.captchaUnavailableMessage ||
            'Security check is unavailable. Please refresh and try again.',
            true
        );
    }

    function reset() {
        const turnstile = getTurnstile();

        clearToken();

        if (
            widgetId === null ||
            typeof turnstile?.reset !== 'function'
        ) {
            return;
        }

        try {
            turnstile.reset(widgetId);
        } catch {
            showUnavailable();
        }
    }

    function renderIfNeeded() {
        const turnstile = getTurnstile();

        if (!container || typeof turnstile?.render !== 'function') {
            return false;
        }

        if (widgetId !== null) {
            return true;
        }

        if (!config.turnstileSiteKey) {
            stopWaiting();
            showUnavailable();
            return false;
        }

        clearToken();

        try {
            const renderedId = turnstile.render(container, {
                sitekey: config.turnstileSiteKey,
                theme: 'light',
                size: 'flexible',
                appearance: 'always',
                execution: 'render',
                retry: 'auto',
                'retry-interval': 8000,

                callback: function (responseToken) {
                    token = responseToken || '';

                    if (token && !hasShownReadyMessage) {
                        hasShownReadyMessage = true;

                        messageController.show(
                            'Human check completed. You can send the form now.',
                            false,
                            true
                        );
                    }
                },

                'expired-callback': function () {
                    reset();
                },

                'timeout-callback': function () {
                    clearToken();
                },

                'error-callback': function () {
                    clearToken();
                    showUnavailable();

                    return true;
                },

                'unsupported-callback': function () {
                    clearToken();
                    showUnavailable();
                }
            });

            if (renderedId === undefined || renderedId === null) {
                return false;
            }

            widgetId = renderedId;
            stopWaiting();

            return true;
        } catch {
            stopWaiting();
            showUnavailable();

            return false;
        }
    }

    function init() {
        if (!container || intervalId !== null || widgetId !== null) {
            return;
        }

        if (renderIfNeeded() || !config.turnstileSiteKey) {
            return;
        }

        let attempts = 0;

        intervalId = setInterval(function () {
            attempts += 1;

            if (renderIfNeeded()) {
                stopWaiting();
                return;
            }

            if (attempts >= 80) {
                stopWaiting();
                showUnavailable();
            }
        }, 100);
    }

    function getToken() {
        const turnstile = getTurnstile();

        if (
            widgetId === null ||
            typeof turnstile?.getResponse !== 'function'
        ) {
            return '';
        }

        try {
            token = turnstile.getResponse(widgetId) || '';
            return token;
        } catch {
            clearToken();
            showUnavailable();

            return '';
        }
    }

    return {
        init,
        renderIfNeeded,
        getToken,
        reset
    };
}