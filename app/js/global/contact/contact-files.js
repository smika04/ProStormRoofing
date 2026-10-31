export const MAX_FILE_SIZE = 3 * 1024 * 1024;

export function createFilesController(form) {
    const uploader = form.querySelector('[data-photo-uploader]');
    const list = uploader?.querySelector('[data-photo-list]');
    const add = uploader?.querySelector('[data-photo-add]');
    const input = uploader?.querySelector('[data-photo-input]');
    const selectedFiles = [];
    const accept = (input?.accept || '').toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
    const maxFiles = accept.some(value => ['.pdf', '.doc', '.docx'].includes(value)) ? 1 : 3;
    const error = document.createElement('p');
    error.className = 'form__files-error';
    error.setAttribute('role', 'alert');
    error.hidden = true;
    let initialized = false;

    function showError(message = '') {
        error.textContent = message;
        error.hidden = !message;
    }

    function isAllowedFile(file) {
        const mime = (file.type || '').toLowerCase();
        const name = file.name.toLowerCase();
        return !accept.length || accept.some(type => {
            if (type.startsWith('.')) return name.endsWith(type);
            if (type.endsWith('/*')) return mime.startsWith(type.slice(0, -1));
            return mime === type;
        });
    }

    function getFileError(file) {
        if (file.size > MAX_FILE_SIZE) return `${file.name}: maximum file size is 3 MB.`;
        if (!file.size) return `${file.name}: this file is empty.`;
        if (!isAllowedFile(file)) return `${file.name}: unsupported file type.`;
        return '';
    }

    function renderFiles() {
        if (list) {
            list.replaceChildren();
            selectedFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'form__photo-item';
                if (file.type.startsWith('image/')) {
                    const preview = document.createElement('img');
                    preview.className = 'form__photo-preview';
                    preview.alt = file.name;
                    const url = URL.createObjectURL(file);
                    const release = () => URL.revokeObjectURL(url);
                    preview.addEventListener('load', release, { once: true });
                    preview.addEventListener('error', release, { once: true });
                    preview.src = url;
                    item.append(preview);
                } else {
                    const icon = document.createElement('span');
                    icon.className = 'form__photo-preview';
                    icon.textContent = '📄';
                    item.append(icon);
                }
                const name = document.createElement('span');
                name.className = 'form__photo-name';
                name.textContent = file.name;
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'form__photo-remove';
                remove.textContent = 'Remove';
                remove.setAttribute('aria-label', `Remove ${file.name}`);
                remove.addEventListener('click', () => {
                    selectedFiles.splice(index, 1);
                    showError();
                    renderFiles();
                });
                item.append(name, remove);
                list.append(item);
            });
        }
        add?.classList.toggle('is-hidden', selectedFiles.length >= maxFiles);
    }

    function validate() {
        const message = selectedFiles.length > maxFiles
            ? `You can attach up to ${maxFiles} file(s).`
            : selectedFiles.map(getFileError).find(Boolean) || '';
        showError(message);
        return !message;
    }

    function reset() {
        selectedFiles.length = 0;
        if (input) input.value = '';
        showError();
        renderFiles();
    }

    function init() {
        if (!input || initialized) return;
        initialized = true;
        uploader.append(error);
        input.addEventListener('change', () => {
            const messages = [];
            for (const file of Array.from(input.files || [])) {
                const message = getFileError(file);
                if (message) {
                    messages.push(message);
                } else if (selectedFiles.length >= maxFiles) {
                    messages.push(`You can attach up to ${maxFiles} file(s).`);
                } else {
                    selectedFiles.push(file);
                }
            }
            input.value = '';
            renderFiles();
            showError(messages.join(' '));
        });
        form.addEventListener('reset', reset);
        renderFiles();
    }

    // The native input is cleared after selection; use these files for upload.
    function getFiles() {
        return selectedFiles.slice();
    }

    return { init, reset, validate, getFiles };
}