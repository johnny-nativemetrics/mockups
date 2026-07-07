(function () {
    'use strict';

    var scriptEl = document.currentScript || (function () {
        var s = document.getElementsByTagName('script');
        for (var i = s.length - 1; i >= 0; i--) {
            if (s[i].src && s[i].src.indexOf('summarybot/default.js') !== -1) return s[i];
        }
        return null;
    })();

    function parseScriptQuery(script) {
        var url = script && script.src ? script.src : '';
        var qStart = url.indexOf('?');
        if (qStart === -1) return {};
        var q = url.slice(qStart + 1);
        var parsed = {};
        q.split('&').forEach(function (pair) {
            var eq = pair.indexOf('=');
            if (eq !== -1) {
                parsed[decodeURIComponent(pair.slice(0, eq).replace(/\+/g, ' '))] =
                    decodeURIComponent((pair.slice(eq + 1) || '').replace(/\+/g, ' '));
            }
        });
        return parsed;
    }

    var rawParams = parseScriptQuery(scriptEl);

    function firstNonEmpty() {
        for (var i = 0; i < arguments.length; i++) {
            var value = arguments[i];
            if (value != null && String(value).trim() !== '') return String(value).trim();
        }
        return '';
    }

    function parseBooleanParam(value, fallback) {
        if (value == null || String(value).trim() === '') return fallback;
        return ['1', 'true', 'yes', 'on'].indexOf(String(value).toLowerCase().trim()) >= 0;
    }

    function getAttributionParams(source) {
        var src = source || {};
        var out = {};
        ['ubid1', 'subid2', 'subid3', 'subid4', 'subid5'].forEach(function (key) {
            if (src[key] != null && String(src[key]).trim() !== '') {
                out[key] = String(src[key]).trim();
            }
        });
        return out;
    }

    function appendQueryParams(url, queryParams) {
        var out = url;
        if (!queryParams || typeof queryParams !== 'object') return out;
        for (var key in queryParams) {
            if (!Object.prototype.hasOwnProperty.call(queryParams, key)) continue;
            var value = queryParams[key];
            if (value == null || String(value).trim() === '') continue;
            out += (out.indexOf('?') >= 0 ? '&' : '?') + encodeURIComponent(key) + '=' + encodeURIComponent(String(value));
        }
        return out;
    }

    function normalizeLauncherVariant(value) {
        var raw = String(value || '').toLowerCase().trim();
        if (raw === 'animated-light' || raw === 'light' || raw === 'button-animated-light') return 'animated-light';
        if (raw === 'animated-dark' || raw === 'dark' || raw === 'button-animated-dark') return 'animated-dark';
        return 'default';
    }

    function getSummarybotAssetBase() {
        if (!scriptEl || !scriptEl.src) return '';
        var scriptUrl = scriptEl.src.indexOf('?') >= 0 ? scriptEl.src.slice(0, scriptEl.src.indexOf('?')) : scriptEl.src;
        return scriptUrl.slice(0, scriptUrl.lastIndexOf('/') + 1);
    }

    function injectDefaultStylesheet() {
        var base = getSummarybotAssetBase();
        if (!base) return;
        var href = base + 'default.css';
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for (var i = 0; i < links.length; i++) {
            var existingHref = links[i].getAttribute('href') || '';
            if (existingHref.indexOf('default.css') !== -1) return;
        }
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.setAttribute('data-nativemetrics-summarybot', 'default');
        document.head.appendChild(link);
    }

    function normalizeEmbedStyle(value) {
        var style = String(value || 'button').toLowerCase().replace(/-/g, '_');
        if (style === 'button_center') return 'button';
        if (style === 'accordion') return 'accordion';
        if (style === 'default') return 'default';
        return 'button';
    }

    function normalizeTargetMode(value) {
        var raw = String(value || '').toLowerCase().trim().replace(/-/g, '_');
        if (raw === 'newtab' || raw === 'new_tab' || raw === '_blank' || raw === 'blank' || raw === 'tab') {
            return 'newtab';
        }
        return 'overlay';
    }

    function getScriptParams() {
        var params = rawParams || {};
        var style = normalizeEmbedStyle(params.style || params.entry_point);
        var cachehours = 24;
        if (params.cachehours != null && params.cachehours !== '') {
            var n = parseInt(params.cachehours, 10);
            if (!isNaN(n) && n >= 0) cachehours = n;
        }
        var rawTheme = (params.theme || params.variant || '').toString().toLowerCase().replace(/\s/g, '');
        var theme = rawTheme.replace(/[^a-z0-9-_]/g, '');
        var attributionParams = getAttributionParams(params);
        var parsed = {
            pubid: params.pubid || '',
            channelid: params.channelid || '',
            psid: params.psid || '',
            style: style,
            target: normalizeTargetMode(params.target || params.open_target),
            cachehours: cachehours,
            theme: theme,
            api_base: firstNonEmpty(params.api_base, params.apiBase, params.tldr_base, params.base_url),
            publisher_api_base: firstNonEmpty(params.publisher_api_base, params.publisherApiBase, params.cms_api_base, params.cmsApiBase),
            launcher_variant: firstNonEmpty(params.launcher_variant, params.button_variant, params.button_theme),
            launcher_cta_text: firstNonEmpty(params.launcher_cta_text, params.cta, params.button_text),
            launcher_primary_color: firstNonEmpty(params.launcher_primary_color, params.primary_color, params.button_primary),
            launcher_secondary_color: firstNonEmpty(params.launcher_secondary_color, params.secondary_color, params.button_secondary),
            launcher_text_color: firstNonEmpty(params.launcher_text_color, params.text_color, params.button_text_color),
            launcher_badge_text: firstNonEmpty(params.launcher_badge_text, params.badge_text, params.button_badge_text),
            launcher_badge_color: firstNonEmpty(params.launcher_badge_color, params.badge_color, params.button_badge_color),
            launcher_badge_text_color: firstNonEmpty(params.launcher_badge_text_color, params.badge_text_color, params.button_badge_text_color),
            exhaust: params.exhaust || '',
            exhaust_idle: params.exhaust_idle || '',
            exhaust_forget_session: params.exhaust_forget_session || '',
            exhaust_debug: params.exhaust_debug || '',
            exhaust_tab_switch: firstNonEmpty(params.exhaust_tab_switch, params.exhaust_on_tab_switch, params.exhaust_on_tab_hide)
        };
        for (var key in attributionParams) {
            if (Object.prototype.hasOwnProperty.call(attributionParams, key)) {
                parsed[key] = attributionParams[key];
            }
        }
        return parsed;
    }

    function buildPublisherApiUrl(path) {
        var base = firstNonEmpty(params.publisher_api_base);
        if (!base) return tldrBase + '/api/v1/' + path.replace(/^\//, '');
        return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
    }

    function isPartnerChatHostname(hostname) {
        return /^(?:chat|tldr)(?:-staging|\d+)?\./.test(hostname || '') && (
            hostname.indexOf('popular-searches-now.com') !== -1 ||
            hostname.indexOf('the-daily-edit.com') !== -1 ||
            hostname.indexOf('the-info-wire.com') !== -1 ||
            hostname.indexOf('summarize-it.ai') !== -1
        );
    }

    function getTldrBaseUrl(scriptSrc) {
        if (!scriptSrc) return 'https://chat.popular-searches-now.com';
        try {
            var u = new URL(scriptSrc);
            if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
                return u.protocol + '//' + u.host;
            }
            if (isPartnerChatHostname(u.hostname)) {
                return u.protocol + '//' + u.host;
            }
            if (u.hostname.indexOf('staging') !== -1 || u.hostname.indexOf('chat-staging') !== -1) {
                if (u.hostname.indexOf('the-daily-edit.com') !== -1) {
                    return 'https://chat-staging.the-daily-edit.com';
                }
                if (u.hostname.indexOf('the-info-wire.com') !== -1) {
                    return 'https://chat-staging.the-info-wire.com';
                }
                return 'https://chat-staging.popular-searches-now.com';
            }
            if (u.hostname.indexOf('popular-searches-now.com') !== -1) {
                return 'https://chat.popular-searches-now.com';
            }
            if (u.hostname.indexOf('the-daily-edit.com') !== -1) {
                return 'https://chat.the-daily-edit.com';
            }
            if (u.hostname.indexOf('the-info-wire.com') !== -1) {
                return 'https://chat.the-info-wire.com';
            }
            return u.protocol + '//' + u.host;
        } catch (e) {
            return 'https://chat.popular-searches-now.com';
        }
    }

    function getPageUrl() {
        return window.location.href.split('#')[0];
    }

    function getTrackingPayload(botType, sessionId, extra) {
        var urlParams = {};
        try {
            new URLSearchParams(window.location.search).forEach(function (v, k) {
                urlParams[k] = v;
            });
        } catch (e) {}
        var domain = '';
        try {
            domain = new URL(getPageUrl()).hostname;
        } catch (e2) {
            domain = window.location.hostname || '';
        }
        var payload = {
            timestamp: new Date().toISOString(),
            url: getPageUrl(),
            domain: domain,
            referrer: document.referrer || '',
            url_parameters: urlParams,
            user_agent: navigator.userAgent,
            language: navigator.language || navigator.userLanguage || '',
            variation: 'SummaryBot Exhaust',
            session_id: sessionId,
            channel_id: params.channelid || '',
            pubid: params.pubid || '',
            api_base: tldrBase,
            bot_type: botType
        };
        var attributionParams = getAttributionParams(params);
        for (var attrKey in attributionParams) {
            if (Object.prototype.hasOwnProperty.call(attributionParams, attrKey)) {
                payload[attrKey] = attributionParams[attrKey];
            }
        }
        if (extra && typeof extra === 'object') {
            for (var key in extra) {
                if (Object.prototype.hasOwnProperty.call(extra, key)) payload[key] = extra[key];
            }
        }
        return payload;
    }

    function sendSummarybotEvent(eventType, payload, useBeacon) {
        var trackingUrl = 'https://e.nativemetrics-svc.com/event';
        var qs = '';
        try {
            qs = new URLSearchParams(window.location.search).toString();
        } catch (e) {}
        fetch(trackingUrl + '/' + eventType + (qs ? '?' + qs : ''), {
            method: 'POST',
            mode: 'no-cors',
            credentials: 'omit',
            keepalive: !!useBeacon,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload || {})
        }).catch(function () {});
    }

    function buildTldrUrl(baseUrl, pageUrl, params) {
        var u = baseUrl.replace(/\/$/, '') + '/tldr?url=' + encodeURIComponent(pageUrl);
        if (params.channelid) u += '&channelid=' + encodeURIComponent(params.channelid);
        if (params.psid) u += '&psid=' + encodeURIComponent(params.psid);
        if (params.pubid) u += '&pubid=' + encodeURIComponent(params.pubid);
        if (params.cachehours !== 24) u += '&cachehours=' + params.cachehours;
        return appendQueryParams(u, getAttributionParams(params));
    }

    function createBoltGlyph(sizePx) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 483.73 483.73');
        svg.setAttribute('width', String(sizePx));
        svg.setAttribute('height', String(sizePx));
        svg.setAttribute('aria-hidden', 'true');
        var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('fill', 'currentColor');
        poly.setAttribute('points', '119.637,282.441 192.449,282.441 165.869,483.73 364.094,189.622 296.631,189.622 325.678,0');
        svg.appendChild(poly);
        return svg;
    }

    var params = getScriptParams();
    var exhaustEnabled = parseBooleanParam(params.exhaust, false);
    var exhaustIdleSec = parseInt(params.exhaust_idle, 10);
    if (isNaN(exhaustIdleSec) || exhaustIdleSec < 5) {
        exhaustIdleSec = 30;
    }
    var exhaustForgetSession = parseBooleanParam(params.exhaust_forget_session, false);
    var exhaustTabSwitchEnabled = parseBooleanParam(params.exhaust_tab_switch, true);
    var tldrBase = firstNonEmpty(params.api_base) || getTldrBaseUrl(scriptEl ? scriptEl.src : '');
    var pageUrl = getPageUrl();
    var tldrUrlStandalone = buildTldrUrl(tldrBase, pageUrl, params);
    var tldrUrlEmbed = tldrUrlStandalone + (tldrUrlStandalone.indexOf('?') >= 0 ? '&' : '?') +
        (params.style === 'accordion' ? 'embed=accordion' : 'embed=button');
    var tldrUrl = tldrUrlEmbed;
    var openInNewTab = params.target === 'newtab';
    var isCenterPillLauncher = params.style === 'button';

    injectDefaultStylesheet();

    if (params.theme) {
        var summarybotBase = getSummarybotAssetBase();
        if (summarybotBase) {
            var themeLink = document.createElement('link');
            themeLink.rel = 'stylesheet';
            themeLink.href = summarybotBase + params.theme + '.css';
            themeLink.setAttribute('data-nativemetrics-summarybot', 'theme');
            document.head.appendChild(themeLink);
        }
    }

    function injectPublisherTheme(config) {
        if (!config || config.entry_point === 'full_tab' || !config.widget_theme_id) return Promise.resolve();
        return fetch(buildPublisherApiUrl('prompts/themes/' + config.widget_theme_id))
            .then(function (tr) { return tr.ok ? tr.json() : null; })
            .then(function (themeRes) {
                if (!themeRes) return;
                var css = (themeRes.data && themeRes.data.css_content) || themeRes.css_content || '';
                if (!css) return;
                var existing = document.getElementById('nativemetrics-summarybot-pub-widget-theme');
                if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
                var style = document.createElement('style');
                style.id = 'nativemetrics-summarybot-pub-widget-theme';
                style.textContent = css;
                document.head.appendChild(style);
            })
            .catch(function () { /* ignore theme load failures */ });
    }

    function loadPublisherConfig() {
        if (!params.pubid || !tldrBase) return Promise.resolve(null);
        var configUrl = firstNonEmpty(params.publisher_api_base)
            ? buildPublisherApiUrl('publishers/config?pubid=' + encodeURIComponent(params.pubid))
            : tldrBase + '/api/v1/publisher-config?pubid=' + encodeURIComponent(params.pubid);
        return fetch(configUrl)
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (config) {
                if (!config) return null;
                return injectPublisherTheme(config).then(function () { return config; });
            })
            .catch(function () { return null; });
    }

    function buildLauncherConfig(publisherConfig) {
        if (isCenterPillLauncher) {
            return {
                variant: 'center-pill',
                ctaText: firstNonEmpty(
                    params.launcher_cta_text,
                    params.cta,
                    params.button_text,
                    publisherConfig && publisherConfig.launcher_cta_text,
                    'Summarize This Article'
                ),
                primaryColor: firstNonEmpty(
                    params.launcher_primary_color,
                    params.primary_color,
                    params.button_primary,
                    publisherConfig && publisherConfig.launcher_primary_color,
                    '#49aff6'
                ),
                secondaryColor: firstNonEmpty(
                    params.launcher_secondary_color,
                    params.secondary_color,
                    params.button_secondary,
                    publisherConfig && publisherConfig.launcher_secondary_color,
                    '#49aff6'
                ),
                textColor: firstNonEmpty(
                    params.launcher_text_color,
                    params.text_color,
                    params.button_text_color,
                    publisherConfig && publisherConfig.launcher_text_color,
                    '#ffffff'
                ),
                badgeText: '',
                badgeColor: '',
                badgeTextColor: ''
            };
        }
        var variant = normalizeLauncherVariant(firstNonEmpty(
            params.launcher_variant,
            publisherConfig && publisherConfig.launcher_variant
        ));
        var isAnimated = variant === 'animated-light' || variant === 'animated-dark';
        return {
            variant: variant,
            ctaText: firstNonEmpty(
                params.launcher_cta_text,
                publisherConfig && publisherConfig.launcher_cta_text,
                isAnimated ? 'Get Fast AI Answers' : 'Summary'
            ),
            primaryColor: firstNonEmpty(
                params.launcher_primary_color,
                publisherConfig && publisherConfig.launcher_primary_color,
                variant === 'animated-dark' ? '#52e5ff' : '#6f84ff'
            ),
            secondaryColor: firstNonEmpty(
                params.launcher_secondary_color,
                publisherConfig && publisherConfig.launcher_secondary_color,
                variant === 'animated-dark' ? '#8b5cf6' : '#9ef3ff'
            ),
            textColor: firstNonEmpty(
                params.launcher_text_color,
                publisherConfig && publisherConfig.launcher_text_color,
                variant === 'animated-dark' ? '#effbff' : '#0f172a'
            ),
            badgeText: firstNonEmpty(
                params.launcher_badge_text,
                publisherConfig && publisherConfig.launcher_badge_text,
                isAnimated ? 'AI' : ''
            ),
            badgeColor: firstNonEmpty(
                params.launcher_badge_color,
                publisherConfig && publisherConfig.launcher_badge_color,
                variant === 'animated-dark' ? 'rgba(7, 15, 34, 0.8)' : 'rgba(255, 255, 255, 0.78)'
            ),
            badgeTextColor: firstNonEmpty(
                params.launcher_badge_text_color,
                publisherConfig && publisherConfig.launcher_badge_text_color,
                variant === 'animated-dark' ? '#9fe8ff' : '#3143b8'
            )
        };
    }

    function applyLauncherStyles(button, launcherConfig) {
        if (!button || !launcherConfig) return;
        button.style.setProperty('--nm-launcher-primary', launcherConfig.primaryColor || '');
        button.style.setProperty('--nm-launcher-secondary', launcherConfig.secondaryColor || '');
        button.style.setProperty('--nm-launcher-text', launcherConfig.textColor || '');
        button.style.setProperty('--nm-launcher-badge-bg', launcherConfig.badgeColor || '');
        button.style.setProperty('--nm-launcher-badge-text', launcherConfig.badgeTextColor || '');
    }

    function createLightTracerSvg() {
        var svgNS = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('class', 'nativemetrics-summarybot-btn-tracer');
        svg.setAttribute('viewBox', '0 0 340 50');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.setAttribute('width', '340');
        svg.setAttribute('height', '50');
        return svg;
    }

    function initLightTracer(svg) {
        if (!svg || svg.__nmTracerInitialized) return;
        svg.__nmTracerInitialized = true;
        var perimeter = 733;
        var layers = [
            { len: 160, color: '#c8c0ff', op: 0.08 },
            { len: 140, color: '#b0a0f8', op: 0.14 },
            { len: 118, color: '#9070f0', op: 0.22 },
            { len: 96, color: '#6040e0', op: 0.32 },
            { len: 76, color: '#4025c8', op: 0.44 },
            { len: 56, color: '#0060c8', op: 0.58 },
            { len: 38, color: '#0090d8', op: 0.72 },
            { len: 22, color: '#40c8f0', op: 0.85 },
            { len: 10, color: '#a8eeff', op: 0.94 },
            { len: 4, color: '#ffffff', op: 1.00 }
        ];
        var rects = [];
        [0, perimeter / 2].forEach(function (delay) {
            layers.forEach(function (layer) {
                var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', '1');
                rect.setAttribute('y', '1');
                rect.setAttribute('width', '338');
                rect.setAttribute('height', '48');
                rect.setAttribute('rx', '24');
                rect.setAttribute('fill', 'none');
                rect.setAttribute('stroke', layer.color);
                rect.setAttribute('stroke-opacity', String(layer.op));
                rect.setAttribute('stroke-width', '1.5');
                rect.setAttribute('stroke-linecap', 'round');
                svg.appendChild(rect);
                rects.push({ el: rect, len: layer.len, delay: delay });
            });
        });

        var startedAt = null;
        function tick(ts) {
            if (!startedAt) startedAt = ts;
            var pos = ((ts - startedAt) * 0.001 / 2.2) * perimeter;
            for (var i = 0; i < rects.length; i++) {
                var layerRect = rects[i];
                var tip = (pos + layerRect.delay) % perimeter;
                var tail = ((tip - layerRect.len) % perimeter + perimeter) % perimeter;
                layerRect.el.setAttribute('stroke-dasharray', layerRect.len + ' ' + (perimeter - layerRect.len));
                layerRect.el.setAttribute('stroke-dashoffset', String(-tail));
            }
            window.requestAnimationFrame(tick);
        }
        window.requestAnimationFrame(tick);
    }

    function createLauncherButton(launcherConfig) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nativemetrics-summarybot-btn';
        applyLauncherStyles(btn, launcherConfig);
        if (launcherConfig.variant === 'animated-light' || launcherConfig.variant === 'animated-dark') {
            btn.className += ' nativemetrics-summarybot-btn-animated nativemetrics-summarybot-btn-' + launcherConfig.variant;
            btn.setAttribute('data-variant', launcherConfig.variant);
            var haloOne = document.createElement('span');
            haloOne.className = 'nativemetrics-summarybot-btn-halo';
            var haloTwo = document.createElement('span');
            haloTwo.className = 'nativemetrics-summarybot-btn-halo nativemetrics-summarybot-btn-halo-b';
            var ringOne = document.createElement('span');
            ringOne.className = 'nativemetrics-summarybot-btn-ring';
            var ringTwo = document.createElement('span');
            ringTwo.className = 'nativemetrics-summarybot-btn-ring nativemetrics-summarybot-btn-ring-b';
            var tracer = createLightTracerSvg();
            var inner = document.createElement('span');
            inner.className = 'nativemetrics-summarybot-btn-inner';
            if (launcherConfig.badgeText) {
                var badge = document.createElement('span');
                badge.className = 'nativemetrics-summarybot-btn-badge';
                badge.textContent = launcherConfig.badgeText;
                inner.appendChild(badge);
            }
            var label = document.createElement('span');
            label.className = 'nativemetrics-summarybot-btn-label';
            label.textContent = launcherConfig.ctaText;
            inner.appendChild(label);
            btn.appendChild(haloOne);
            btn.appendChild(haloTwo);
            btn.appendChild(ringOne);
            btn.appendChild(ringTwo);
            btn.appendChild(tracer);
            btn.appendChild(inner);
            if (launcherConfig.variant === 'animated-light') {
                initLightTracer(tracer);
            }
        } else {
            btn.textContent = launcherConfig.ctaText || 'Summary';
        }
        return btn;
    }

    function createCenterPillButton(launcherConfig) {
        var wrap = document.createElement('div');
        wrap.className = 'nativemetrics-summarybot-center-wrap';
        wrap.setAttribute('data-entry-point', 'button');

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nativemetrics-summarybot-center-pill';
        btn.setAttribute('aria-label', launcherConfig.ctaText || 'Summarize This Article');
        applyLauncherStyles(btn, launcherConfig);

        var dots = document.createElement('span');
        dots.className = 'nativemetrics-summarybot-center-pill-dots';
        dots.setAttribute('aria-hidden', 'true');
        for (var i = 0; i < 3; i++) {
            var dot = document.createElement('span');
            dot.className = 'nativemetrics-summarybot-center-pill-dot';
            dots.appendChild(dot);
        }

        var label = document.createElement('span');
        label.className = 'nativemetrics-summarybot-center-pill-label';
        label.textContent = launcherConfig.ctaText || 'Summarize This Article';

        btn.appendChild(dots);
        btn.appendChild(label);
        wrap.appendChild(btn);
        return wrap;
    }

    function mountLauncherNode(node) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(node); });
        } else {
            document.body.appendChild(node);
        }
    }

    function toStandaloneSummaryUrl(url) {
        var raw = url || tldrUrlStandalone;
        try {
            var parsed = new URL(raw, window.location.href);
            parsed.searchParams.delete('embed');
            return parsed.toString();
        } catch (e) {
            return String(raw).replace(/([?&])embed=[^&]*(&)?/g, function (_match, sep, amp) {
                return amp ? sep : '';
            }).replace(/[?&]$/, '');
        }
    }

    function openSummaryInNewTab(url) {
        var dest = toStandaloneSummaryUrl(url);
        var opened = window.open(dest, '_blank', 'noopener,noreferrer');
        if (!opened) {
            window.location.href = dest;
        }
    }

    function openSummaryExperience(url, overlayRef, triggerButton) {
        if (openInNewTab) {
            openSummaryInNewTab(url);
            return;
        }
        if (!overlayRef.overlay) overlayRef.overlay = createOverlay(triggerButton);
        var ifr = overlayRef.overlay.querySelector('.nativemetrics-summarybot-iframe');
        if (ifr) ifr.src = url || tldrUrlEmbed;
        showOverlay(overlayRef.overlay);
    }

    function wireFloatingButtonLauncher(btn, overlayRef, triggerForFocus) {
        btn.addEventListener('click', function () {
            openSummaryExperience(tldrUrlEmbed, overlayRef, triggerForFocus || btn);
        });
    }

    function createOverlay(triggerButton) {
        var overlay = document.createElement('div');
        overlay.className = 'nativemetrics-summarybot-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Summary');
        overlay.inert = true;
        var panel = document.createElement('div');
        panel.className = 'nativemetrics-summarybot-panel';
        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'nativemetrics-summarybot-close';
        close.setAttribute('aria-label', 'Close');
        close.innerHTML = '&times;';
        var iframe = document.createElement('iframe');
        iframe.className = 'nativemetrics-summarybot-iframe';
        iframe.src = tldrUrl;
        panel.appendChild(close);
        panel.appendChild(iframe);
        overlay.appendChild(panel);
        function closeOverlay() {
            overlay.classList.remove('nativemetrics-summarybot-overlay-open');
            overlay.inert = true;
            document.body.style.overflow = '';
            setCenterLauncherVisible(true);
            if (triggerButton && triggerButton.focus) triggerButton.focus();
        }
        close.addEventListener('click', closeOverlay);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeOverlay();
        });
        document.body.appendChild(overlay);
        return overlay;
    }

    function setCenterLauncherVisible(visible) {
        var wrap = document.querySelector('.nativemetrics-summarybot-center-wrap');
        if (wrap) wrap.style.display = visible ? '' : 'none';
    }

    function showOverlay(overlay) {
        overlay.inert = false;
        overlay.classList.add('nativemetrics-summarybot-overlay-open');
        document.body.style.overflow = 'hidden';
        setCenterLauncherVisible(false);
    }

    function buildQuestionUrl(questionText, botType) {
        var base = openInNewTab ? tldrUrlStandalone : tldrUrlEmbed;
        var u = base + (base.indexOf('?') >= 0 ? '&' : '?') + 'initial_question=' + encodeURIComponent(questionText);
        if (botType) u += '&bot_type=' + encodeURIComponent(botType);
        return u;
    }

    function getExhaustSessionId() {
        try {
            var k = 'nm_summarybot_exhaust_sid';
            var v = sessionStorage.getItem(k);
            if (v) return v;
            v = 'ex_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
            sessionStorage.setItem(k, v);
            return v;
        } catch (e) {
            return 'exhaust-anon';
        }
    }

    function startExhaustTrafficCapture(onPickQuestion) {
        if (!exhaustEnabled) return;
        if (exhaustForgetSession) {
            try {
                sessionStorage.removeItem('nm_summarybot_exhaust_shown');
            } catch (e0) { /* ignore */ }
        }
        try {
            if (sessionStorage.getItem('nm_summarybot_exhaust_shown') === '1') return;
        } catch (e) { /* ignore */ }

        var apiBase = tldrBase;
        if (!apiBase && typeof window.location !== 'undefined' && window.location.origin) {
            apiBase = window.location.origin;
        }
        if (!apiBase) return;

        var state = { done: false, loading: false, cardVisible: false };
        var fetchAttempts = 0;
        var maxFetchAttempts = 3;
        var fetchTimeoutMs = 45000;

        if (params.exhaust_debug === '1' && typeof window !== 'undefined') {
            window.__nm_summarybot_force_exhaust = function () {
                try {
                    sessionStorage.removeItem('nm_summarybot_exhaust_shown');
                } catch (e0) { /* ignore */ }
                state.done = false;
                state.loading = false;
                state.cardVisible = false;
                fetchAttempts = 0;
                tryTrigger();
            };
        }

        function tryTrigger() {
            if (state.done || state.loading || state.cardVisible) return;
            if (fetchAttempts >= maxFetchAttempts) {
                state.done = true;
                return;
            }
            fetchAttempts++;
            state.loading = true;
            var sid = getExhaustSessionId();
            var apiUrl = apiBase.replace(/\/$/, '') + '/api/v1/summarybot/exhaust-questions?url=' + encodeURIComponent(pageUrl) + '&session_id=' + encodeURIComponent(sid);
            if (params.channelid) {
                apiUrl += '&channel_id=' + encodeURIComponent(params.channelid);
            }
            apiUrl = appendQueryParams(apiUrl, getAttributionParams(params));

            var ac = new AbortController();
            var timeoutId = setTimeout(function () {
                ac.abort();
            }, fetchTimeoutMs);

            fetch(apiUrl, { credentials: 'omit', signal: ac.signal })
                .then(function (r) {
                    if (!r.ok) {
                        return Promise.reject(new Error('http'));
                    }
                    return r.json();
                })
                .then(function (data) {
                    if (!data || !data.questions || !data.questions.length) {
                        state.done = true;
                        return;
                    }
                    if (state.cardVisible || state.done) return;
                    try {
                        sessionStorage.setItem('nm_summarybot_exhaust_shown', '1');
                    } catch (e2) { /* ignore */ }
                    state.cardVisible = true;
                    state.done = true;
                    showExhaustQuestionCard(data.questions, onPickQuestion);
                })
                .catch(function () {
                    if (fetchAttempts < maxFetchAttempts) {
                        setTimeout(function () {
                            tryTrigger();
                        }, 800);
                        return;
                    }
                    state.done = true;
                })
                .finally(function () {
                    clearTimeout(timeoutId);
                    state.loading = false;
                });
        }

        function showExhaustQuestionCard(questions, pick) {
            var exhaustSessionId = getExhaustSessionId();
            var exhaustOpenedAt = Date.now();
            var ex = document.createElement('div');
            ex.className = 'nativemetrics-summarybot-exhaust-overlay';
            ex.setAttribute('role', 'dialog');
            ex.setAttribute('aria-modal', 'true');
            ex.setAttribute('aria-labelledby', 'nm-exhaust-title');

            var card = document.createElement('div');
            card.className = 'nativemetrics-summarybot-exhaust-card';

            var head = document.createElement('div');
            head.className = 'nativemetrics-summarybot-exhaust-head';
            var bolt = document.createElement('span');
            bolt.className = 'nativemetrics-summarybot-exhaust-bolt';
            bolt.setAttribute('aria-hidden', 'true');
            bolt.appendChild(createBoltGlyph(18));
            var brand = document.createElement('span');
            brand.className = 'nativemetrics-summarybot-exhaust-brand';
            brand.textContent = 'Explore with AI';
            head.appendChild(bolt);
            head.appendChild(brand);

            var title = document.createElement('h2');
            title.id = 'nm-exhaust-title';
            title.className = 'nativemetrics-summarybot-exhaust-title';
            title.textContent = 'Before you go!';

            var list = document.createElement('div');
            list.className = 'nativemetrics-summarybot-exhaust-list';

            function closeExhaust() {
                if (ex.parentNode) ex.parentNode.removeChild(ex);
                document.body.style.overflow = '';
                state.cardVisible = false;
                var duration = Math.round((Date.now() - exhaustOpenedAt) / 1000);
                sendSummarybotEvent('exhaust_page_duration', getTrackingPayload('exhaust', exhaustSessionId, {
                    duration_seconds: duration < 0 ? 0 : duration
                }), true);
            }

            var closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'nativemetrics-summarybot-exhaust-close';
            closeBtn.setAttribute('aria-label', 'Close');
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', closeExhaust);

            questions.slice(0, 3).forEach(function (text) {
                if (!text || !String(text).trim()) return;
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'nativemetrics-summarybot-exhaust-q';
                b.textContent = String(text).trim();
                b.addEventListener('click', function () {
                    sendSummarybotEvent('exhaust_leading_question_clicked', getTrackingPayload('exhaust', exhaustSessionId, {
                        question: String(text).trim()
                    }));
                    closeExhaust();
                    pick(String(text).trim());
                });
                list.appendChild(b);
            });

            var inputRow = document.createElement('div');
            inputRow.className = 'nativemetrics-summarybot-exhaust-input-row';

            var input = document.createElement('input');
            input.type = 'text';
            input.className = 'nativemetrics-summarybot-exhaust-input';
            input.placeholder = 'Ask Anything...';
            input.setAttribute('aria-label', 'Ask Anything');

            var sendBtn = document.createElement('button');
            sendBtn.type = 'button';
            sendBtn.className = 'nativemetrics-summarybot-exhaust-send';
            sendBtn.textContent = 'Send';

            function submitCustomQuestion() {
                var customQuestion = String(input.value || '').trim();
                if (!customQuestion) return;
                sendSummarybotEvent('exhaust_question_typed', getTrackingPayload('exhaust', exhaustSessionId, {
                    question: customQuestion
                }));
                closeExhaust();
                pick(customQuestion);
            }

            input.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    submitCustomQuestion();
                }
            });
            sendBtn.addEventListener('click', submitCustomQuestion);

            inputRow.appendChild(input);
            inputRow.appendChild(sendBtn);

            card.appendChild(closeBtn);
            card.appendChild(head);
            card.appendChild(title);
            card.appendChild(list);
            card.appendChild(inputRow);
            ex.appendChild(card);
            ex.addEventListener('click', function (e) {
                if (e.target === ex) closeExhaust();
            });
            document.body.appendChild(ex);
            document.body.style.overflow = 'hidden';
            sendSummarybotEvent('exhaust_page_view', getTrackingPayload('exhaust', exhaustSessionId, {
                screen_resolution: window.screen.width + 'x' + window.screen.height,
                viewport_size: window.innerWidth + 'x' + window.innerHeight
            }));
            sendSummarybotEvent('exhaust_leading_questions_viewed', getTrackingPayload('exhaust', exhaustSessionId, {
                questions_count: Math.min(questions.length, 3),
                questions: questions.slice(0, 3)
            }));

            function onKey(e) {
                if (e.key === 'Escape') {
                    closeExhaust();
                    document.removeEventListener('keydown', onKey);
                }
            }
            document.addEventListener('keydown', onKey);
        }

        var idleMs = exhaustIdleSec * 1000;
        var idleTimer = null;
        function armIdle() {
            if (state.done || state.cardVisible) return;
            clearTimeout(idleTimer);
            idleTimer = setTimeout(function () {
                tryTrigger();
            }, idleMs);
        }

        // Omit "scroll": spurious scroll events (layout, trackpad) were resetting the idle timer so 30s rarely fired.
        ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
            window.addEventListener(ev, function () {
                if (!state.done && !state.cardVisible) armIdle();
            }, { passive: true });
        });
        function tryTriggerOnLeave() {
            if (state.done || state.cardVisible) return;
            tryTrigger();
        }
        if (exhaustTabSwitchEnabled) {
            document.addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'hidden') {
                    tryTriggerOnLeave();
                }
            });
            window.addEventListener('pagehide', function () {
                tryTriggerOnLeave();
            });
        }
        armIdle();
    }

    function initSummaryBot(publisherConfig) {
        if (params.style === 'button' || params.style === 'default') {
            var launcherConfig = buildLauncherConfig(publisherConfig);
            var overlayRef = { overlay: null };
            var focusTarget;
            if (params.style === 'button') {
                var centerWrap = createCenterPillButton(launcherConfig);
                focusTarget = centerWrap.querySelector('.nativemetrics-summarybot-center-pill');
                wireFloatingButtonLauncher(focusTarget, overlayRef, focusTarget);
                mountLauncherNode(centerWrap);
            } else {
                focusTarget = createLauncherButton(launcherConfig);
                wireFloatingButtonLauncher(focusTarget, overlayRef, focusTarget);
                mountLauncherNode(focusTarget);
            }
            startExhaustTrafficCapture(function (questionText) {
                openSummaryExperience(buildQuestionUrl(questionText), overlayRef, focusTarget);
                if (!openInNewTab && focusTarget && focusTarget.focus) focusTarget.focus();
            });
        } else {
            var accordionWrap = document.createElement('div');
            accordionWrap.className = 'nativemetrics-summarybot-accordion-wrap';
            var accordionToggle = document.createElement('button');
            accordionToggle.type = 'button';
            accordionToggle.className = 'nativemetrics-summarybot-accordion-toggle';
            accordionToggle.setAttribute('aria-expanded', 'false');
            var iconWrap = document.createElement('span');
            iconWrap.className = 'nativemetrics-summarybot-accordion-icon';
            iconWrap.setAttribute('aria-hidden', 'true');
            iconWrap.appendChild(createBoltGlyph(15));
            var toggleLabel = document.createElement('span');
            toggleLabel.className = 'nativemetrics-summarybot-accordion-label';
            toggleLabel.textContent = 'ZIPLINE! SUMMARY';
            var aiTag = document.createElement('span');
            aiTag.className = 'nativemetrics-summarybot-accordion-ai-tag';
            aiTag.textContent = 'AI';
            var tapHint = document.createElement('span');
            tapHint.className = 'nativemetrics-summarybot-accordion-hint';
            tapHint.textContent = 'TAP TO EXPAND SUMMARY';
            var expandBtn = document.createElement('span');
            expandBtn.className = 'nativemetrics-summarybot-accordion-expand';
            expandBtn.innerHTML = 'EXPAND <span class="nativemetrics-summarybot-accordion-chevron">&#9660;</span>';
            var leftPart = document.createElement('span');
            leftPart.className = 'nativemetrics-summarybot-accordion-toggle-left';
            leftPart.appendChild(iconWrap);
            var textPart = document.createElement('span');
            textPart.className = 'nativemetrics-summarybot-accordion-toggle-text';
            textPart.appendChild(toggleLabel);
            textPart.appendChild(aiTag);
            textPart.appendChild(document.createElement('br'));
            textPart.appendChild(tapHint);
            leftPart.appendChild(textPart);
            accordionToggle.appendChild(leftPart);
            accordionToggle.appendChild(expandBtn);
            var accordionBody = document.createElement('div');
            accordionBody.className = 'nativemetrics-summarybot-accordion-body';
            var iframe = document.createElement('iframe');
            iframe.className = 'nativemetrics-summarybot-iframe';
            var iframeLoaded = false;
            var overlayRef = { overlay: null };
            accordionBody.appendChild(iframe);
            accordionWrap.appendChild(accordionToggle);
            accordionWrap.appendChild(accordionBody);
            function setAccordionExpanded(open) {
                if (open) {
                    accordionWrap.classList.add('nativemetrics-summarybot-accordion-open');
                } else {
                    accordionWrap.classList.remove('nativemetrics-summarybot-accordion-open');
                }
                accordionToggle.setAttribute('aria-expanded', open);
                expandBtn.innerHTML = open
                    ? 'COLLAPSE <span class="nativemetrics-summarybot-accordion-chevron">&#9650;</span>'
                    : 'EXPAND <span class="nativemetrics-summarybot-accordion-chevron">&#9660;</span>';
            }
            accordionToggle.addEventListener('click', function () {
                if (openInNewTab) {
                    openSummaryInNewTab(tldrUrlStandalone);
                    return;
                }
                if (!iframeLoaded) {
                    iframe.src = tldrUrlEmbed;
                    iframeLoaded = true;
                }
                var open = !accordionWrap.classList.contains('nativemetrics-summarybot-accordion-open');
                setAccordionExpanded(open);
            });
            startExhaustTrafficCapture(function (questionText) {
                openSummaryExperience(buildQuestionUrl(questionText), overlayRef, accordionToggle);
                if (!openInNewTab && accordionToggle && accordionToggle.focus) accordionToggle.focus();
            });
            function insertAccordion() {
                if (scriptEl && scriptEl.parentNode) {
                    scriptEl.parentNode.insertBefore(accordionWrap, scriptEl.nextSibling);
                } else {
                    document.body.appendChild(accordionWrap);
                }
            }
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', insertAccordion);
            } else {
                insertAccordion();
            }
        }
    }

    loadPublisherConfig().then(function (publisherConfig) {
        initSummaryBot(publisherConfig);
    });
})();
