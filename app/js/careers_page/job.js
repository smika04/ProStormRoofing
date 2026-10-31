export function initCareersJobs() {
    const list = document.querySelector('[data-jobs-list]');
    const count = document.querySelector('[data-jobs-count]');
    const empty = document.querySelector('[data-jobs-empty]');

    if (!list) return;

    const dropdown = document.querySelector('[data-career-dropdown]');
    const positionInput = dropdown?.querySelector('[name="position"]');
    const positionText = dropdown?.querySelector('[data-career-position-text]');
    const positionOptions = dropdown?.querySelector('[data-career-position-options]');
    const positionButton = dropdown?.querySelector('.service-dropdown__button');
    function setPositionOpen(open) {
        dropdown?.classList.toggle('is-open', open);
        positionButton?.setAttribute('aria-expanded', String(open));
    }
    positionButton?.addEventListener('click', () => {
        setPositionOpen(positionButton.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('click', event => {
        if (dropdown && !dropdown.contains(event.target)) setPositionOpen(false);
    });
    dropdown?.addEventListener('keydown', event => {
        if (event.key === 'Escape') { setPositionOpen(false); positionButton?.focus(); }
    });
    dropdown?.closest('form')?.addEventListener('reset', () => {
        if (positionInput) positionInput.value = '';
        if (positionText) positionText.textContent = 'Select a position';
        setPositionOpen(false);
    });
    function populatePositions(items, failed = false) {
        if (!positionInput || !positionText || !positionOptions) return;
        positionInput.value = '';
        positionOptions.replaceChildren();
        positionText.textContent = failed ? 'Unable to load positions' : 'Select a position';
        const titles = [...new Set(items.map(item => String(item.Title || item.Position || '').trim()).filter(Boolean))];
        if (!failed && !titles.includes('General application')) titles.push('General application');
        titles.forEach(title => {
            const option = document.createElement('button');
            option.type = 'button';
            option.textContent = title;
            option.dataset.value = title;
            option.addEventListener('click', () => {
                positionInput.value = title;
                positionText.textContent = title;
                positionInput.dispatchEvent(new Event('change', { bubbles: true }));
                setPositionOpen(false);
                positionButton?.focus();
            });
            positionOptions.append(option);
        });
    }

    const jobsUrl = list.dataset.jobsUrl || '../json/jobs.json';

    function createListItems(items) {
        return items.map(function (item, index) {
            const title = item.Title || 'Open role';
            const position = item.Position || 'Position';
            const location = item.Location || 'Location';
            const description = item.Description || '';
            const salary = item.Salary || '';
            const requirements = Array.isArray(item.Requirements) ? item.Requirements : [];
            const duties = Array.isArray(item.Duties) ? item.Duties : [];

            return `
                <article class="career-job" data-career-job>
                    <button
                        class="career-job__button"
                        type="button"
                        aria-expanded="false"
                        aria-controls="career-job-panel-${index}"
                    >
                        <span class="career-job__title">${title}</span>
                        <span class="career-job__meta">${position}</span>
                        <span class="career-job__meta">${location}</span>
                        <span class="career-job__icon" aria-hidden="true">→</span>
                    </button>

                    <div class="career-job__panel" id="career-job-panel-${index}">
                        <div class="career-job__panel-inner">
                            <div class="career-job__details">
                                <div>
                                    <h3>About the role</h3>
                                    <p>${description}</p>

                                    ${salary ? `
                                        <div class="career-job__salary">
                                            <h3>Salary</h3>
                                            <p>${salary}</p>
                                        </div>
                                    ` : ''}
                                </div>

                                <div>
                                    <h3>Requirements</h3>
                                    <ul>
                                        ${requirements.map(function (requirement) {
                return `<li>${requirement}</li>`;
            }).join('')}
                                    </ul>
                                </div>

                                <div>
                                    <h3>Duties</h3>
                                    <ul>
                                        ${duties.map(function (duty) {
                return `<li>${duty}</li>`;
            }).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    function closeOtherJobs(currentJob) {
        const jobs = list.querySelectorAll('[data-career-job]');

        jobs.forEach(function (job) {
            if (job === currentJob) return;

            const button = job.querySelector('.career-job__button');

            job.classList.remove('is-open');

            if (button) {
                button.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function bindJobEvents() {
        const jobs = list.querySelectorAll('[data-career-job]');

        jobs.forEach(function (job) {
            const button = job.querySelector('.career-job__button');

            if (!button) return;

            button.addEventListener('click', function () {
                const isOpen = job.classList.contains('is-open');

                closeOtherJobs(job);

                job.classList.toggle('is-open', !isOpen);
                button.setAttribute('aria-expanded', String(!isOpen));
            });
        });
    }

    fetch(jobsUrl)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Jobs request failed');
            }

            return response.json();
        })
        .then(function (items) {
            if (!Array.isArray(items)) throw new Error('Invalid jobs response');
            populatePositions(items);
            if (items.length === 0) {
                if (count) count.textContent = '0 open roles';
                if (empty) empty.hidden = false;
                return;
            }

            list.innerHTML = createListItems(items);

            if (count) {
                count.textContent = `${items.length} open ${items.length === 1 ? 'role' : 'roles'}`;
            }

            bindJobEvents();
        })
        .catch(function () {
            populatePositions([], true);
            if (count) count.textContent = 'Unable to load roles';
            if (empty) {
                empty.hidden = false;
                empty.textContent = 'We could not load open roles right now. Please try again later.';
            }
        });
}