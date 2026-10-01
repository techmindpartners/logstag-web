// GA4 conversion tracking (LGSTG-1657)
// All events go through track() so consent gating (LGSTG-1644) can be added in one place.
(function() {
    const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const INTENTS = ['trial', 'demo', 'sales', 'support', 'other'];
    const STORAGE_KEY = 'logstag_attribution';
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // matches GA4's default session timeout

    function track(name, params) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', name, params || {});
        }
    }

    // URL parameters are user-controlled: only accept known intents and short slugs
    function cleanIntent(value) {
        return INTENTS.indexOf(value) !== -1 ? value : '';
    }

    function cleanSlug(value) {
        return value && /^[a-z0-9-]{1,50}$/i.test(value) ? value.toLowerCase() : '';
    }

    function cleanUtm(value) {
        return value ? String(value).slice(0, 100) : '';
    }

    // First-touch attribution: landing page + UTM parameters.
    // Stored in localStorage (not sessionStorage) so it survives CTAs opened in a new tab.
    function readAttribution(now) {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (stored && now - stored.last_seen < SESSION_TIMEOUT_MS) return stored;
        } catch (e) {
            // Storage unavailable or corrupt - start a new attribution
        }
        return null;
    }

    function captureAttribution() {
        const now = Date.now();
        let attribution = readAttribution(now);

        if (!attribution) {
            const params = new URLSearchParams(window.location.search);
            attribution = { landing_page: window.location.pathname };
            UTM_KEYS.forEach(key => {
                const value = cleanUtm(params.get(key));
                if (value) attribution[key] = value;
            });
        }

        attribution.last_seen = now;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
        } catch (e) {
            // Storage unavailable (private mode etc.) - attribution still works for this page
        }
        return attribution;
    }

    const attribution = captureAttribution();

    // Slug of a page path: "/" -> "home", "/faq/" -> "faq"
    function pageSlug(pathname) {
        const parts = pathname.replace(/index\.html$/, '').split('/').filter(Boolean);
        return parts.length ? parts[parts.length - 1] : 'home';
    }

    function sourcePage(url) {
        return cleanSlug(url.searchParams.get('from')) || pageSlug(window.location.pathname);
    }

    function isContactUrl(url) {
        return url.origin === window.location.origin && /\/contact\/?(index\.html)?$/.test(url.pathname);
    }

    function classifyLink(link, url) {
        if (url.hostname === 'app.logstag.com') return 'signin_click';
        if (url.hostname === 'docs.logstag.com') return 'docs_click';
        if (isContactUrl(url)) {
            const intent = url.searchParams.get('intent');
            if (intent === 'trial') return 'trial_cta_click';
            if (intent === 'demo' || link.id === 'book-demo-btn') return 'demo_cta_click';
        }
        return null;
    }

    function handleLinkClick(event) {
        // auxclick also fires for right-clicks; only count the middle button (open in new tab)
        if (event.type === 'auxclick' && event.button !== 1) return;

        const link = event.target.closest && event.target.closest('a[href]');
        if (!link) return;

        let url;
        try {
            url = new URL(link.href, window.location.href);
        } catch (e) {
            return;
        }

        const eventName = classifyLink(link, url);
        if (!eventName) return;

        track(eventName, {
            source_page: sourcePage(url),
            link_url: url.href,
            transport_type: 'beacon'
        });
    }

    document.addEventListener('click', handleLinkClick);
    document.addEventListener('auxclick', handleLinkClick);

    if (/^\/security(\/|$)/.test(window.location.pathname)) {
        track('security_page_view', { landing_page: attribution.landing_page });
    }

    window.logstagAnalytics = {
        track: track,
        pageSlug: pageSlug,
        cleanIntent: cleanIntent,
        cleanSlug: cleanSlug,
        attribution: function() {
            const copy = Object.assign({}, attribution);
            delete copy.last_seen;
            return copy;
        }
    };
})();
