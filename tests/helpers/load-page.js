// Loads a real site page into jsdom with its scripts running.
// Local files are served from the repo; every external request (gtag, Calendly, fonts, ...)
// gets an empty response, so tests never hit the network or send data to GA.
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole, requestInterceptor } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');
const ORIGIN = 'http://localhost';

const CONTENT_TYPES = {
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.html': 'text/html'
};

// Objects created inside jsdom have the window's prototypes, which deepStrictEqual rejects
function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

function repoFile(pathname) {
    let file = decodeURIComponent(pathname);
    if (file.endsWith('/')) file += 'index.html';
    return path.join(ROOT, file);
}

const serveLocalFiles = (blockedPaths = []) => requestInterceptor(request => {
    const url = new URL(request.url);
    const type = CONTENT_TYPES[path.extname(url.pathname)] || 'text/plain';

    if (url.origin === ORIGIN) {
        if (blockedPaths.includes(url.pathname)) return new Response('', { status: 404 });
        const file = repoFile(url.pathname);
        if (fs.existsSync(file)) {
            return new Response(fs.readFileSync(file), { headers: { 'Content-Type': type } });
        }
        return new Response('', { status: 404 });
    }
    return new Response('', { headers: { 'Content-Type': type } });
});

/**
 * @param {string} urlPath  path + query, e.g. "/contact/?intent=demo"
 * @param {object} [options]
 * @param {string} [options.referrer]  full URL of the referring page
 * @param {object} [options.storage]   localStorage entries to seed before scripts run
 * @param {(window) => void} [options.beforeParse]  extra setup, e.g. stubbing fetch
 * @param {string} [options.html]  page markup to use instead of the repo file at urlPath
 * @param {string[]} [options.blockedPaths]  local paths that should fail to load (404)
 */
async function loadPage(urlPath, options = {}) {
    const url = new URL(urlPath, ORIGIN);
    const html = options.html || fs.readFileSync(repoFile(url.pathname), 'utf8');

    const errors = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', error => errors.push(error));

    const dom = new JSDOM(html, {
        url: url.href,
        referrer: options.referrer,
        runScripts: 'dangerously',
        resources: { interceptors: [serveLocalFiles(options.blockedPaths)] },
        pretendToBeVisual: true,
        virtualConsole,
        beforeParse(window) {
            Object.entries(options.storage || {}).forEach(([key, value]) => {
                window.localStorage.setItem(key, value);
            });
            // Browser APIs the site uses that jsdom doesn't implement
            window.Element.prototype.scrollIntoView = () => {};
            window.IntersectionObserver = class {
                observe() {}
                unobserve() {}
                disconnect() {}
            };
            if (options.beforeParse) options.beforeParse(window);
        }
    });

    await new Promise(resolve => dom.window.addEventListener('load', resolve));

    const window = dom.window;
    return {
        window,
        document: window.document,
        errors,
        // Events sent with gtag('event', name, params), read from the real dataLayer
        events() {
            return plain((window.dataLayer || [])
                .map(entry => Array.from(entry))
                .filter(args => args[0] === 'event')
                .map(([, name, params]) => ({ name, params })));
        },
        attribution() {
            return plain(window.logstagAnalytics.attribution());
        },
        storage() {
            const entries = {};
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                entries[key] = window.localStorage.getItem(key);
            }
            return entries;
        },
        close() {
            window.close();
        }
    };
}

// Clicks a link without letting jsdom navigate
function clickLink(page, link, init = {}) {
    const type = init.type || 'click';
    link.addEventListener(type, event => event.preventDefault(), { once: true });
    link.dispatchEvent(new page.window.MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...init }));
}

module.exports = { loadPage, clickLink, ORIGIN };
