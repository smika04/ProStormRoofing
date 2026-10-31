export function createSubmitController({ form, config, messageController,
                                           contactFieldsController, serviceDropdownController, filesController, turnstileController }) {
    const button = form.querySelector('.form__submit');
    const originalLabel = button?.textContent || '';
    let isSubmitting = false;
    function init() {
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (isSubmitting) return;
            if (!form.reportValidity() || !filesController.validate()) return;
            const type = form.querySelector('[name="form_type"]')?.value;
            if (!['estimate', 'careers'].includes(type)) {
                messageController.show('Form type is missing or invalid.', true);
                return;
            }
            if (type === 'careers' && !form.querySelector('[name="position"]')?.value.trim()) {
                messageController.show('Please select a position.', true);
                form.querySelector('[name="position"]')?.focus();
                return;
            }
            if (type === 'estimate' && !serviceDropdownController.hasValue()) {
                serviceDropdownController.setOpen(true);
                messageController.show('Please select a service.', true);
                return;
            }
            if (!turnstileController.renderIfNeeded()) {
                messageController.show(config.captchaLoadingMessage, true);
                return;
            }
            const token = turnstileController.getToken();
            if (!token) {
                messageController.show(config.captchaRequiredMessage, true);
                return;
            }
            isSubmitting = true;
            if (button) { button.disabled = true; button.textContent = 'Sending...'; }
            try {
                const endpoint = config.submitUrl
                    ? new URL(config.submitUrl, window.location.href)
                    : new URL('/api/contact', new URL(config.turnstileVerifyUrl, window.location.href));
                const data = new FormData(form);
                data.set('form_type', type);
                data.set('cf-turnstile-response', token);
                // The file controller clears the native file input after selection.
                data.delete('photos[]');
                filesController.getFiles().forEach(file => data.append('photos[]', file, file.name));
                // Do not set Content-Type: the browser supplies the multipart boundary.
                const response = await fetch(endpoint, { method: 'POST', body: data });
                const result = await response.json();
                if (!response.ok || result.success !== true) {
                    messageController.show(result.message || 'Unable to send your request. Please try again.', true);
                    return;
                }
                form.reset();
                contactFieldsController.update();
                serviceDropdownController.reset();
                filesController.reset();
                messageController.show(result.message || config.successMessage, false);
            } catch {
                messageController.show('Unable to confirm submission. Please contact us if the problem continues.', true);
            } finally {
                turnstileController.reset();
                isSubmitting = false;
                if (button) { button.disabled = false; button.textContent = originalLabel; }
            }
        });
    }
    return { init };
}
