const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { loadPage, clickLink, ORIGIN } = require('./helpers/load-page');

const STORAGE_KEY = 'logstag_attribution';
const THIRTY_ONE_MINUTES = 31 * 60 * 1000;

let page;
afterEach(() => {
    if (page) page.close();
    page = null;
});

function storedAttribution(p) {
    return JSON.parse(p.storage()[STORAGE_KEY]);
}

function addLink(p, href, attrs = {}) {
    const link = p.document.createElement('a');
    link.href = href;
    Object.assign(link, attrs);
    p.document.body.appendChild(link);
    return link;
}

describe('pages', () => {
    for (const path of ['/', '/faq/', '/pricing/', '/contact/']) {
        test(`${path} loads analytics.js without script errors`, async () => {
            page = await loadPage(path);
            assert.deepEqual(page.errors, []);
            assert.equal(typeof page.window.logstagAnalytics, 'object');
            assert.deepEqual(page.events(), [], 'no events on a plain page view');
        });
    }
});

describe('attribution', () => {
    test('records the landing page and UTM parameters', async () => {
        page = await loadPage('/?utm_source=linkedin&utm_medium=social&utm_campaign=q4&utm_term=pg&utm_content=v1&other=x');
        assert.deepEqual(page.attribution(), {
            landing_page: '/',
            utm_source: 'linkedin',
            utm_medium: 'social',
            utm_campaign: 'q4',
            utm_term: 'pg',
            utm_content: 'v1'
        });
        assert.equal(typeof storedAttribution(page).last_seen, 'number');
    });

    test('keeps first-touch attribution on later pages in the same session', async () => {
        const first = await loadPage('/?utm_source=linkedin');
        const storage = first.storage();
        first.close();

        page = await loadPage('/faq/?utm_source=google', { storage });
        assert.deepEqual(page.attribution(), {
            landing_page: '/',
            utm_source: 'linkedin'
        });
    });

    test('refreshes last_seen on every page view', async () => {
        const lastSeen = Date.now() - 20 * 60 * 1000;
        page = await loadPage('/faq/', {
            storage: { [STORAGE_KEY]: JSON.stringify({ landing_page: '/', last_seen: lastSeen }) }
        });
        assert.ok(storedAttribution(page).last_seen > lastSeen);
    });

    test('starts a new attribution after 30 minutes of inactivity', async () => {
        page = await loadPage('/pricing/?utm_source=google', {
            storage: {
                [STORAGE_KEY]: JSON.stringify({
                    landing_page: '/',
                    utm_source: 'linkedin',
                    last_seen: Date.now() - THIRTY_ONE_MINUTES
                })
            }
        });
        assert.deepEqual(page.attribution(), {
            landing_page: '/pricing/',
            utm_source: 'google'
        });
    });

    test('ignores corrupt stored data', async () => {
        page = await loadPage('/faq/', { storage: { [STORAGE_KEY]: '{not json' } });
        assert.deepEqual(page.errors, []);
        assert.deepEqual(page.attribution(), { landing_page: '/faq/' });
    });

    test('still works when storage is unavailable', async () => {
        page = await loadPage('/?utm_source=linkedin', {
            beforeParse(window) {
                window.Storage.prototype.getItem = () => { throw new Error('denied'); };
                window.Storage.prototype.setItem = () => { throw new Error('denied'); };
            }
        });
        assert.deepEqual(page.errors, []);
        assert.deepEqual(page.attribution(), {
            landing_page: '/',
            utm_source: 'linkedin'
        });
    });

    test('truncates overly long UTM values', async () => {
        page = await loadPage('/?utm_campaign=' + 'x'.repeat(500));
        assert.equal(page.attribution().utm_campaign.length, 100);
    });
});

describe('link click events', () => {
    const cases = [
        ['https://app.logstag.com', 'signin_click'],
        ['https://app.logstag.com/login?next=/', 'signin_click'],
        ['https://docs.logstag.com/getting-started', 'docs_click'],
        ['/contact/?intent=trial', 'trial_cta_click'],
        ['/contact/?intent=demo', 'demo_cta_click'],
        ['/contact/index.html?intent=demo', 'demo_cta_click']
    ];
    for (const [href, eventName] of cases) {
        test(`${href} sends ${eventName}`, async () => {
            page = await loadPage('/pricing/');
            clickLink(page, addLink(page, href));
            assert.deepEqual(page.events(), [{
                name: eventName,
                params: {
                    source_page: 'pricing',
                    link_url: new URL(href, ORIGIN + '/pricing/').href,
                    transport_type: 'beacon'
                }
            }]);
        });
    }

    const ignored = [
        '/faq/',
        '/contact/',
        '/contact/?intent=support',
        'https://example.com/contact/?intent=demo',
        'https://www.linkedin.com/company/logstag',
        'mailto:hello@logstag.com',
        '#features'
    ];
    for (const href of ignored) {
        test(`${href} sends no event`, async () => {
            page = await loadPage('/');
            clickLink(page, addLink(page, href));
            assert.deepEqual(page.events(), []);
        });
    }

    test('the nav "Request a guided demo" button sends demo_cta_click', async () => {
        page = await loadPage('/faq/');
        clickLink(page, page.document.getElementById('book-demo-btn'));
        const events = page.events();
        assert.equal(events.length, 1);
        assert.equal(events[0].name, 'demo_cta_click');
        assert.equal(events[0].params.source_page, 'faq-nav');
    });

    test('a #book-demo-btn link without intent still counts as a demo click', async () => {
        page = await loadPage('/faq/');
        page.document.getElementById('book-demo-btn').remove();
        clickLink(page, addLink(page, '/contact/', { id: 'book-demo-btn' }));
        assert.deepEqual(page.events().map(e => [e.name, e.params.source_page]), [['demo_cta_click', 'faq']]);
    });

    // The homepage's real CTAs and nav links (LGSTG-1648)
    const homeLinks = [
        ['nav Docs', 'a.nav-link[href="https://docs.logstag.com"]', 'docs_click', 'home'],
        ['nav Sign in', 'a.nav-link[href="https://app.logstag.com"]', 'signin_click', 'home'],
        ['nav demo button', '#book-demo-btn', 'demo_cta_click', 'home-nav'],
        ['hero trial CTA', 'a[href="contact/?intent=trial&from=home-hero"]', 'trial_cta_click', 'home-hero'],
        ['hero demo CTA', 'a[href="contact/?intent=demo&from=home-hero"]', 'demo_cta_click', 'home-hero'],
        ['features trial link', 'a[href="contact/?intent=trial&from=home-features"]', 'trial_cta_click', 'home-features']
    ];
    for (const [label, selector, eventName, sourcePage] of homeLinks) {
        test(`homepage ${label} sends ${eventName}`, async () => {
            page = await loadPage('/');
            const link = page.document.querySelector(selector);
            assert.ok(link, `link not found: ${selector}`);
            clickLink(page, link);
            assert.deepEqual(page.events().map(e => [e.name, e.params.source_page]), [[eventName, sourcePage]]);
        });
    }

    test('uses the link\'s from= parameter as source_page', async () => {
        page = await loadPage('/');
        clickLink(page, addLink(page, '/contact/?intent=trial&from=home-hero'));
        assert.equal(page.events()[0].params.source_page, 'home-hero');
    });

    test('ignores an unsafe from= value and falls back to the current page', async () => {
        page = await loadPage('/');
        clickLink(page, addLink(page, '/contact/?intent=trial&from=' + encodeURIComponent('<b>hi</b>')));
        assert.equal(page.events()[0].params.source_page, 'home');
    });

    test('counts a click on an element inside the link', async () => {
        page = await loadPage('/');
        const link = addLink(page, 'https://docs.logstag.com');
        const icon = page.document.createElement('span');
        link.appendChild(icon);
        link.addEventListener('click', event => event.preventDefault(), { once: true });
        icon.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, cancelable: true }));
        assert.equal(page.events()[0].name, 'docs_click');
    });

    test('counts a middle-click (open in new tab)', async () => {
        page = await loadPage('/');
        clickLink(page, addLink(page, 'https://app.logstag.com'), { type: 'auxclick', button: 1 });
        assert.equal(page.events()[0].name, 'signin_click');
    });

    test('ignores a right-click', async () => {
        page = await loadPage('/');
        clickLink(page, addLink(page, 'https://app.logstag.com'), { type: 'auxclick', button: 2 });
        assert.deepEqual(page.events(), []);
    });

    test('does nothing when gtag is not defined (e.g. blocked by consent)', async () => {
        page = await loadPage('/');
        page.window.gtag = undefined; // a global function declaration can't be deleted
        clickLink(page, addLink(page, 'https://app.logstag.com'));
        assert.deepEqual(page.errors, []);
        assert.deepEqual(page.events(), []);
    });
});

describe('security_page_view', () => {
    // The security page doesn't exist yet (LGSTG-1650), so use a minimal stand-in page
    const securityHtml = `<!DOCTYPE html><html><head><script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
    </script></head><body><script src="/analytics.js"></script></body></html>`;

    for (const path of ['/security', '/security/', '/security/index.html']) {
        test(`fires on ${path}`, async () => {
            page = await loadPage(path, { html: securityHtml });
            assert.deepEqual(page.events(), [{
                name: 'security_page_view',
                params: { landing_page: path }
            }]);
        });
    }

    test('does not fire on other paths', async () => {
        page = await loadPage('/security-news/', { html: securityHtml });
        assert.deepEqual(page.events(), []);
    });
});

describe('helpers', () => {
    test('pageSlug', async () => {
        page = await loadPage('/');
        const { pageSlug } = page.window.logstagAnalytics;
        assert.equal(pageSlug('/'), 'home');
        assert.equal(pageSlug('/index.html'), 'home');
        assert.equal(pageSlug('/faq/'), 'faq');
        assert.equal(pageSlug('/contact/index.html'), 'contact');
        assert.equal(pageSlug('/pricing'), 'pricing');
    });

    test('cleanIntent only accepts known intents', async () => {
        page = await loadPage('/');
        const { cleanIntent } = page.window.logstagAnalytics;
        for (const intent of ['trial', 'demo', 'sales', 'support', 'other']) {
            assert.equal(cleanIntent(intent), intent);
        }
        assert.equal(cleanIntent('TRIAL'), '');
        assert.equal(cleanIntent('free money'), '');
        assert.equal(cleanIntent(null), '');
    });

    test('cleanSlug only accepts short slugs', async () => {
        page = await loadPage('/');
        const { cleanSlug } = page.window.logstagAnalytics;
        assert.equal(cleanSlug('home-hero'), 'home-hero');
        assert.equal(cleanSlug('Pricing-CTA'), 'pricing-cta');
        assert.equal(cleanSlug('a b'), '');
        assert.equal(cleanSlug('x'.repeat(51)), '');
        assert.equal(cleanSlug(null), '');
    });
});
