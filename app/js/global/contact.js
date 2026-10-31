import { CONTACT_FORM_CONFIG } from './contact/contact-config.js';
import { createMessageController } from './contact/contact-message.js';
import { createContactFieldsController } from './contact/contact-fields.js';
import { createServiceDropdownController } from './contact/contact-dropdown.js';
import { createFilesController } from './contact/contact-files.js';
import { createValidationController } from './contact/contact-validation.js';
import { createTurnstileController } from './contact/contact-turnstile.js';
import { createSubmitController } from './contact/contact-submit.js';
export function initContactForm() {
    document.querySelectorAll('#estimateForm').forEach(form => {
        const messageController = createMessageController(form);
        const contactFieldsController = createContactFieldsController(form);
        const serviceDropdownController = form.querySelector('[data-service-dropdown]')
            ? createServiceDropdownController(form)
            : { init() {}, reset() {}, hasValue() { return false; }, setOpen() {} };
        const filesController = createFilesController(form);
        const turnstileController = createTurnstileController(form, CONTACT_FORM_CONFIG, messageController);
        contactFieldsController.init();
        serviceDropdownController.init();
        filesController.init();
        createValidationController(form, filesController).init();
        turnstileController.init();
        createSubmitController({ form, config: CONTACT_FORM_CONFIG, messageController,
            contactFieldsController, serviceDropdownController, filesController, turnstileController }).init();
    });
}
