const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { loadPage, ORIGIN } = require('./helpers/load-page');

const HIDDEN_FIELDS = ['intent', 'source_page', 'landing_page', 'utm_source', 'utm_medium', 'utm_campaign'];

let page;
afterEach(() => {
    if (page) page.close();
    page = null;
});

function hiddenValues(p) {
    const form = p.document.querySelector('.contact-form');
    return Object.fromEntries(HIDDEN_FIELDS.map(name => [name, form.querySelector(`input[name="${name}"]`).value]));
}

// Loads the contact page with fetch replaced by a stub that records Formspree calls
async function loadContact(urlPath, { response = { ok: true }, ...options } = {}) {
    const requests = [];
    const p = await loadPage(urlPath, {
        ...options,
        beforeParse(window) {
            window.fetch = async (url, init) => {
                requests.push({ url, body: JSON.parse(init.body) });
                if (response instanceof Error) throw response;
                return response;
            };
        }
    });
    p.requests = requests;
    return p;
}

async function submitForm(p) {
    const { document } = p;
    document.getElementById('name').value = 'Ada';
    document.getElementById('email').value = 'ada@example.com';
    document.getElementById('message').value = 'Hello';
    document.querySelector('.contact-form').requestSubmit();
    // Let the async submit handler finish
    await new Promise(resolve => setTimeout(resolve, 20));
}

describe('hidden attribution fields', () => {
    test('are filled from intent, from and the session attribution', async () => {
        const home = await loadPage('/?utm_source=linkedin&utm_medium=social&utm_campaign=q4');
        const storage = home.storage();
        home.close();

        page = await loadContact('/contact/?intent=trial&from=home-hero', { storage });
        assert.deepEqual(hiddenValues(page), {
            intent: 'trial',
            source_page: 'home-hero',
            landing_page: '/',
            utm_source: 'linkedin',
            utm_medium: 'social',
            utm_campaign: 'q4'
        });
    });

    test('treat the legacy ?notify=true as a demo request', async () => {
        page = await loadContact('/contact/?notify=true');
        assert.equal(hiddenValues(page).intent, 'demo');
    });

    test('default intent to "other"', async () => {
        page = await loadContact('/contact/');
        assert.equal(hiddenValues(page).intent, 'other');
    });

    test('reject unknown intents', async () => {
        page = await loadContact('/contact/?intent=' + encodeURIComponent('Buy now!'));
        assert.equal(hiddenValues(page).intent, 'other');
    });

    test('fall back to the same-site referrer when from= is missing', async () => {
        page = await loadContact('/contact/', { referrer: ORIGIN + '/faq/' });
        assert.equal(hiddenValues(page).source_page, 'faq');
    });

    test('fall back to the referrer when from= is unsafe', async () => {
        page = await loadContact('/contact/?from=' + encodeURIComponent('<script>'), { referrer: ORIGIN + '/pricing/' });
        assert.equal(hiddenValues(page).source_page, 'pricing');
    });

    test('ignore an external referrer', async () => {
        page = await loadContact('/contact/', { referrer: 'https://www.google.com/search?q=logstag' });
        assert.equal(hiddenValues(page).source_page, '');
    });

    test('use the contact page as landing page for direct visits', async () => {
        page = await loadContact('/contact/');
        assert.equal(hiddenValues(page).landing_page, '/contact/');
    });
});

describe('form submission', () => {
    test('sends the attribution fields to Formspree and fires contact_submit_success', async () => {
        page = await loadContact('/contact/?intent=demo&from=home-nav&utm_source=newsletter');
        await submitForm(page);

        assert.equal(page.requests.length, 1);
        assert.deepEqual(page.requests[0].body, {
            name: 'Ada',
            email: 'ada@example.com',
            message: 'Hello',
            intent: 'demo',
            source_page: 'home-nav',
            landing_page: '/contact/',
            utm_source: 'newsletter',
            utm_medium: '',
            utm_campaign: '',
            _subject: 'New Contact Form Submission - Logstag'
        });

        assert.deepEqual(page.events(), [{
            name: 'contact_submit_success',
            params: {
                intent: 'demo',
                source_page: 'home-nav',
                landing_page: '/contact/',
                utm_source: 'newsletter',
                utm_medium: '',
                utm_campaign: ''
            }
        }]);
    });

    test('keeps the hidden fields after the form resets', async () => {
        page = await loadContact('/contact/?intent=trial');
        await submitForm(page);
        assert.equal(page.document.getElementById('name').value, '', 'visible fields are reset');
        assert.equal(hiddenValues(page).intent, 'trial');
    });

    test('does not fire the event when Formspree rejects the submission', async () => {
        page = await loadContact('/contact/?intent=demo', { response: { ok: false } });
        await submitForm(page);
        assert.equal(page.requests.length, 1);
        assert.deepEqual(page.events(), []);
        assert.equal(page.document.querySelector('.form-submit').textContent, 'Error - Try Again');
    });

    test('does not fire the event on a network error', async () => {
        page = await loadContact('/contact/?intent=demo', { response: new Error('offline') });
        await submitForm(page);
        assert.deepEqual(page.events(), []);
        assert.equal(page.document.querySelector('.form-submit').textContent, 'Error - Try Again');
    });

    test('still submits when analytics.js fails to load', async () => {
        page = await loadContact('/contact/?intent=demo', { blockedPaths: ['/analytics.js'] });
        assert.equal(page.window.logstagAnalytics, undefined);

        await submitForm(page);
        assert.equal(page.requests.length, 1);
        assert.equal(page.requests[0].body.email, 'ada@example.com');
        assert.equal(page.document.querySelector('.form-submit').textContent, 'Message Sent!');
    });
});
