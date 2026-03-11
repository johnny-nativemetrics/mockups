(function () {
    'use strict';

    function getScriptParams() {
        var script = document.currentScript;
        if (!script || !script.src) {
            var scripts = document.getElementsByTagName('script');
            for (var i = scripts.length - 1; i >= 0; i--) {
                if (scripts[i].src && scripts[i].src.indexOf('summarybot/default.js') !== -1) {
                    script = scripts[i];
                    break;
                }
            }
        }
        if (!script || !script.src) return { style: 'button', cachehours: 168 };
        var url = script.src;
        var qStart = url.indexOf('?');
        if (qStart === -1) return { style: 'button', cachehours: 168 };
        var q = url.slice(qStart + 1);
        var params = {};
        q.split('&').forEach(function (pair) {
            var eq = pair.indexOf('=');
            if (eq !== -1) {
                params[decodeURIComponent(pair.slice(0, eq).replace(/\+/g, ' '))] =
                    decodeURIComponent((pair.slice(eq + 1) || '').replace(/\+/g, ' '));
            }
        });
        var style = (params.style || 'button').toLowerCase();
        if (style !== 'accordion') style = 'button';
        var cachehours = 168;
        if (params.cachehours != null && params.cachehours !== '') {
            var n = parseInt(params.cachehours, 10);
            if (!isNaN(n) && n >= 0) cachehours = n;
        }
        return {
            pubid: params.pubid || '',
            channelid: params.channelid || '',
            style: style,
            cachehours: cachehours
        };
    }

    function getTldrBaseUrl(scriptSrc) {
        if (!scriptSrc) return 'https://chat.popular-searches-now.com';
        try {
            var u = new URL(scriptSrc);
            if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
                return u.protocol + '//' + u.host;
            }
            if (u.hostname.indexOf('popular-searches-now.com') !== -1) {
                return 'https://chat.popular-searches-now.com';
            }
            if (u.hostname.indexOf('staging') !== -1 || u.hostname.indexOf('chat-staging') !== -1) {
                return 'https://chat-staging.popular-searches-now.com';
            }
            return u.protocol + '//' + u.host;
        } catch (e) {
            return 'https://chat.popular-searches-now.com';
        }
    }

    function getPageUrl() {
        return window.location.href.split('#')[0];
    }

    function buildTldrUrl(baseUrl, pageUrl, params) {
        var u = baseUrl.replace(/\/$/, '') + '/tldr?url=' + encodeURIComponent(pageUrl);
        if (params.channelid) u += '&channelid=' + encodeURIComponent(params.channelid);
        if (params.pubid) u += '&pubid=' + encodeURIComponent(params.pubid);
        if (params.cachehours !== 168) u += '&cachehours=' + params.cachehours;
        return u;
    }

    var params = getScriptParams();
    var scriptEl = document.currentScript || (function () {
        var s = document.getElementsByTagName('script');
        for (var i = s.length - 1; i >= 0; i--) {
            if (s[i].src && s[i].src.indexOf('summarybot/default.js') !== -1) return s[i];
        }
        return null;
    })();
    var tldrBase = getTldrBaseUrl(scriptEl ? scriptEl.src : '');
    var pageUrl = getPageUrl();
    var tldrUrl = buildTldrUrl(tldrBase, pageUrl, params);

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
            if (triggerButton && triggerButton.focus) triggerButton.focus();
        }
        close.addEventListener('click', closeOverlay);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeOverlay();
        });
        document.body.appendChild(overlay);
        return overlay;
    }

    function showOverlay(overlay) {
        overlay.inert = false;
        overlay.classList.add('nativemetrics-summarybot-overlay-open');
        document.body.style.overflow = 'hidden';
    }

    if (params.style === 'button') {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nativemetrics-summarybot-btn';
        btn.textContent = 'Summary';
        var overlay = null;
        btn.addEventListener('click', function () {
            if (!overlay) overlay = createOverlay(btn);
            showOverlay(overlay);
        });
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(btn); });
        } else {
            document.body.appendChild(btn);
        }
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
        iconWrap.innerHTML = '&#9889;';
        var toggleLabel = document.createElement('span');
        toggleLabel.className = 'nativemetrics-summarybot-accordion-label';
        toggleLabel.textContent = 'Zipline! Summary';
        var aiTag = document.createElement('span');
        aiTag.className = 'nativemetrics-summarybot-accordion-ai-tag';
        aiTag.textContent = 'AI';
        var tapHint = document.createElement('span');
        tapHint.className = 'nativemetrics-summarybot-accordion-hint';
        tapHint.textContent = 'Tap to expand summary';
        var expandBtn = document.createElement('span');
        expandBtn.className = 'nativemetrics-summarybot-accordion-expand';
        expandBtn.innerHTML = 'Expand <span class="nativemetrics-summarybot-accordion-chevron">&#9660;</span>';
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
        accordionBody.appendChild(iframe);
        accordionWrap.appendChild(accordionToggle);
        accordionWrap.appendChild(accordionBody);
        accordionToggle.addEventListener('click', function () {
            if (!iframeLoaded) {
                iframe.src = tldrUrl;
                iframeLoaded = true;
            }
            var open = accordionWrap.classList.toggle('nativemetrics-summarybot-accordion-open');
            accordionToggle.setAttribute('aria-expanded', open);
            expandBtn.innerHTML = open ? 'Collapse <span class="nativemetrics-summarybot-accordion-chevron">&#9650;</span>' : 'Expand <span class="nativemetrics-summarybot-accordion-chevron">&#9660;</span>';
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
})();