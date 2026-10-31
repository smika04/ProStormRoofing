// Production domain for Turnstile hostname check: stormproroofing.ca

const ALLOWED_HOSTNAMES = [
    "blue-hat-0f19.dev-smika04.workers.dev",
    "stormproroofing.ca",
    "www.stormproroofing.ca",
    "localhost",
    "127.0.0.1"
];

const ALLOWED_ORIGINS = [
    "https://blue-hat-0f19.dev-smika04.workers.dev",
    "https://stormproroofing.ca",
    "https://www.stormproroofing.ca",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:5500",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5500"
];

const RATE_LIMIT_CONFIG = {
    maxSubmissions: 10,
    windowSeconds: 60 * 60,
    keyPrefix: "form-submit"
};

// Configure these in Worker Settings > Variables and Secrets:
// TURNSTILE_SECRET, RESEND_API_KEY (secrets)
// MAIL_FROM, ESTIMATE_TO_EMAIL, CAREERS_TO_EMAIL (variables)
const MAX_FILE_SIZE = 3 * 1024 * 1024;
const MAX_BODY_SIZE = 10 * 1024 * 1024;
class FormError extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}
export default {
    async fetch(request, env) {
        const path = new URL(request.url).pathname;
        const origin = request.headers.get('Origin');
        if (origin && !ALLOWED_ORIGINS.includes(origin)) {
            return new Response('Forbidden origin', { status: 403 });
        }
        if (request.method === 'OPTIONS') return handleCorsPreflightRequest(request);
        if (path !== '/api/contact') return jsonResponse(request, { success: false, message: 'Not found' }, 404);
        if (request.method !== 'POST') return jsonResponse(request, { success: false, message: 'Method not allowed' }, 405);
        try {
            return await submitContact(request, env);
        } catch (error) {
            if (!(error instanceof FormError)) console.error('Contact submission failed:', error.name);
            return jsonResponse(request, { success: false, limited: false,
                message: error instanceof FormError ? error.message : 'Unable to send your request. Please try again.'
            }, error instanceof FormError ? error.status : 502);
        }
    }
};

async function readForm(request) {
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('multipart/form-data')) {
        throw new FormError('Expected multipart/form-data.', 415);
    }
    if (Number(request.headers.get('Content-Length')) > MAX_BODY_SIZE) throw new FormError('Request is too large.', 413);
    const reader = request.body?.getReader();
    if (!reader) throw new FormError('Missing form data.');
    const chunks = [];
    let total = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > MAX_BODY_SIZE) {
                await reader.cancel();
                throw new FormError('Request is too large.', 413);
            }
            chunks.push(value);
        }
    } finally { reader.releaseLock(); }
    try {
        return await new Response(new Blob(chunks), { headers: {
                'Content-Type': request.headers.get('Content-Type')
            } }).formData();
    } catch { throw new FormError('Invalid form data.'); }
}
function textField(data, key, max = 5000) {
    const values = data.getAll(key);
    if (values.length > 1 || (values.length && typeof values[0] !== 'string')) throw new FormError(`Invalid ${key}.`);
    const value = (values[0] || '').trim();
    if (value.length > max) throw new FormError(`${key} is too long.`);
    return value;
}
function toBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
}
async function submitContact(request, env) {
    if (!env.TURNSTILE_SECRET || !env.RESEND_API_KEY || !env.MAIL_FROM) {
        throw new FormError('Email service is not configured.', 503);
    }
    const rate = await getRateLimitState(request, env);
    if (!rate.allowed) return jsonResponse(request, { success: false, limited: true,
            message: 'Too many form submissions. Please try again later.' }, 429,
        { 'Retry-After': String(rate.retryAfterSeconds) });
    const data = await readForm(request);
    const type = textField(data, 'form_type', 20);
    if (!['estimate', 'careers'].includes(type)) throw new FormError('Invalid form type.');
    const recipient = type === 'careers' ? env.CAREERS_TO_EMAIL : env.ESTIMATE_TO_EMAIL;
    if (!recipient) throw new FormError('Recipient is not configured.', 503);
    const name = textField(data, 'name', 100);
    const method = textField(data, 'contact_method', 10);
    const phone = textField(data, 'phone', 50);
    const email = textField(data, 'email', 254);
    const message = textField(data, 'message');
    const service = textField(data, 'service', 100);
    const position = textField(data, 'position', 200);
    if (!name) throw new FormError('Please enter your name.');
    if (!['phone', 'email', 'both'].includes(method)) throw new FormError('Choose a contact method.');
    if (method !== 'email' && (!/^\+?[\d\s().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15)) {
        throw new FormError('Please enter a valid phone number.');
    }
    if ((method !== 'phone' || email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new FormError('Please enter a valid email address.');
    if (type === 'estimate' && !['roof-replacement', 'roof-repair', 'inspection-maintenance', 'custom'].includes(service)) throw new FormError('Choose a service.');
    if (type === 'careers' && !position) throw new FormError('Choose a position.');
    const days = data.getAll('callback_days[]');
    if (days.some(day => typeof day !== 'string' || !['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].includes(day))) throw new FormError('Invalid callback day.');
    const time = textField(data, 'callback_time', 20);
    if (method !== 'email' && !['morning','afternoon','evening'].includes(time)) throw new FormError('Choose a callback time.');
    const files = [];
    for (const [key, value] of data) {
        if (typeof value === 'string') continue;
        if (!value.name && value.size === 0) continue;
        if (key !== 'photos[]') throw new FormError('Unexpected attachment field.');
        if (!value.size || value.size > MAX_FILE_SIZE) throw new FormError('Each file must be nonempty and no larger than 3 MB.', 413);
        const allowed = type === 'careers' ? /\.(pdf|doc|docx)$/i.test(value.name) :
            /^image\//i.test(value.type) && /\.(jpe?g|png|gif|webp|avif|heic|heif|bmp|tiff?|svg|ico)$/i.test(value.name);
        if (!allowed) throw new FormError('Unsupported attachment type.');
        files.push(value);
    }
    if (files.length > (type === 'careers' ? 1 : 3)) throw new FormError('Too many attachments.');
    const token = textField(data, 'cf-turnstile-response', 2048);
    if (!token) throw new FormError('Please complete the security check.');
    const captcha = await verifyTurnstileToken(request, env, token);
    if (!captcha.success) throw new FormError('Captcha verification failed. Please try again.', 403);
    // This KV limit is best effort, as in the original Worker (not atomic).
    await incrementRateLimit(rate, env);
    const attachments = await Promise.all(files.map(async file => ({
        filename: file.name.replace(/[\r\n\\/]/g, '_').slice(0, 200),
        content: toBase64(await file.arrayBuffer())
    })));
    const mail = {
        from: env.MAIL_FROM,
        to: [recipient],
        subject: type === 'careers' ? 'New career application — Storm Pro Roofing' : 'New estimate request — Storm Pro Roofing',
        text: [`Form: ${type}`, `Name: ${name}`, `Contact method: ${method}`, `Phone: ${phone}`,
            `Email: ${email}`, (type === 'careers' ? `Position: ${position}` : `Service: ${service}`), `Callback days: ${days.join(', ')}`,
            `Callback time: ${time}`, '', message].join('\n'),
        attachments
    };
    if (email) mail.reply_to = email;
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(mail), signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new FormError('Email could not be sent. Please try again.', 502);
    const result = await response.json();
    if (!result.id) throw new FormError('Email service returned an unexpected response.', 502);
    return jsonResponse(request, { success: true, message: type === 'careers'
            ? 'Thank you! Your application has been submitted.' : 'Thank you! Your estimate request has been submitted.' });
}
function getCorsHeaders(request) {
    const origin = request.headers.get("Origin") || "";

    const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0];

    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin"
    };
}

function handleCorsPreflightRequest(request) {
    return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request)
    });
}

function jsonResponse(request, data, status = 200, extraHeaders = {}) {
    return Response.json(data, {
        status,
        headers: {
            ...getCorsHeaders(request),
            ...extraHeaders
        }
    });
}

function getClientIp(request) {
    return request.headers.get("CF-Connecting-IP") ||
        request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
        "unknown";
}

async function getRateLimitState(request, env) {
    if (!env.FORM_RATE_LIMIT) {
        return {
            allowed: true,
            count: 0,
            resetAt: 0,
            retryAfterSeconds: 0,
            key: "",
            hasBinding: false
        };
    }

    const ip = getClientIp(request);
    const key = `${RATE_LIMIT_CONFIG.keyPrefix}:${ip}`;
    const now = Math.floor(Date.now() / 1000);

    const currentValue = await env.FORM_RATE_LIMIT.get(key, "json");

    if (!currentValue || now >= currentValue.resetAt) {
        return {
            allowed: true,
            count: 0,
            resetAt: now + RATE_LIMIT_CONFIG.windowSeconds,
            retryAfterSeconds: 0,
            key,
            hasBinding: true
        };
    }

    if (currentValue.count >= RATE_LIMIT_CONFIG.maxSubmissions) {
        return {
            allowed: false,
            count: currentValue.count,
            resetAt: currentValue.resetAt,
            retryAfterSeconds: Math.max(currentValue.resetAt - now, 0),
            key,
            hasBinding: true
        };
    }

    return {
        allowed: true,
        count: currentValue.count,
        resetAt: currentValue.resetAt,
        retryAfterSeconds: 0,
        key,
        hasBinding: true
    };
}

async function incrementRateLimit(state, env) {
    if (!state.hasBinding || !state.key) {
        return;
    }

    const now = Math.floor(Date.now() / 1000);
    const expirationTtl = Math.max(state.resetAt - now, 60);

    await env.FORM_RATE_LIMIT.put(
        state.key,
        JSON.stringify({
            count: state.count + 1,
            resetAt: state.resetAt
        }),
        {
            expirationTtl
        }
    );
}

async function verifyTurnstileToken(request, env, token) {
    if (!env.TURNSTILE_SECRET) {
        return {
            success: false,
            hostname: "",
            hostnameAllowed: false,
            errorCodes: ["missing-input-secret"]
        };
    }

    const formData = new FormData();

    formData.append("secret", env.TURNSTILE_SECRET);
    formData.append("response", token);

    const clientIp = request.headers.get("CF-Connecting-IP");

    if (clientIp) {
        formData.append("remoteip", clientIp);
    }

    const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {
        return {
            success: false,
            hostname: "",
            hostnameAllowed: false,
            errorCodes: ["siteverify-request-failed"]
        };
    }

    const result = await response.json();
    const hostname = result.hostname || "";
    const hostnameAllowed = ALLOWED_HOSTNAMES.includes(hostname);

    return {
        success: result.success === true && hostnameAllowed,
        hostname,
        hostnameAllowed,
        errorCodes: result["error-codes"] || []
    };
}