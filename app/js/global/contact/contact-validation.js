export function createValidationController(form, filesController) {
    let initialized = false;
    const name = form.querySelector('[name="name"]');
    const phone = form.querySelector('[name="phone"]');
    const email = form.querySelector('[name="email"]');
    const message = form.querySelector('[name="message"]');


    function updateValidity() {
        const method = form.querySelector('[name="contact_method"]:checked')?.value;
        if (name) {
            const value = name.value.trim();
            name.setCustomValidity(!value ? 'Please enter your name.' :
                value.length > 100 ? 'Your name must be 100 characters or fewer.' : '');
        }
        if (phone) {
            const active = method === 'phone' || method === 'both';
            const value = phone.value.trim();
            const digits = value.replace(/\D/g, '');
            phone.required = active;
            phone.setCustomValidity(active && (!/^\+?[\d\s().-]+$/.test(value) || digits.length < 7 || digits.length > 15)
                ? 'Please enter a valid phone number (7–15 digits).' : '');
        }
        if (email) {
            const active = method === 'email' || method === 'both';
            email.required = active;
            email.setCustomValidity(active && email.value.length > 254
                ? 'Email must be 254 characters or fewer.' : '');
        }
        message?.setCustomValidity(message.value.length > 5000
            ? 'Please keep your message within 5000 characters.' : '');
    }

    function validate() {
        updateValidity();
        const fieldsValid = form.reportValidity();
        const filesValid = filesController.validate();
        return fieldsValid && filesValid;
    }

    function init() {
        if (initialized) return;
        initialized = true;
        // Capture submit so validation runs before the existing submit controller.
        form.noValidate = true;
        form.addEventListener('input', updateValidity);
        form.addEventListener('change', updateValidity);
        form.addEventListener('reset', () => {
            [name, phone, email, message].forEach(input => input?.setCustomValidity(''));
        });
        form.addEventListener('submit', event => {
            if (!validate()) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        }, true);
    }

    return { init, validate };
}

