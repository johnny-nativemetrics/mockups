/**
 * zippy-pill-entry.js  (v2)
 *
 * Changes from v1:
 *   - Watches .zippy-window via MutationObserver; when the chatbot is closed
 *     the pill resets and bounces back into view.
 *   - Pill is no longer permanently hidden after a send — it returns.
 */

(function () {
    'use strict';

    /* ── Config ─────────────────────────────────────────── */
    var PILL_LABEL        = 'Ask Anything About This Topic';
    var INPUT_PLACEHOLDER = 'Ask anything about this topic\u2026';
    var SEND_LABEL        = 'Send';
    var OPEN_DELAY_MS     = 320; /* wait for chatbot open animation before injecting text */


    /* ── Build HTML ─────────────────────────────────────── */

    var container = document.createElement('div');
    container.id = 'zippy-pill-container';

    container.innerHTML =
        '<div id="zippy-pill" class="zippy-pill" role="button" tabindex="0" aria-label="' + PILL_LABEL + '">' +
            '<span class="zippy-pill-dots" aria-hidden="true">' +
                '<span class="zippy-pill-dot"></span>' +
                '<span class="zippy-pill-dot"></span>' +
                '<span class="zippy-pill-dot"></span>' +
            '</span>' +
            '<span class="zippy-pill-label">' + PILL_LABEL + '</span>' +
        '</div>' +
        '<div id="zippy-pill-expanded" class="zippy-pill-input-wrapper" role="search">' +
            '<input id="zippy-pill-input" class="zippy-pill-input-field"' +
                ' type="text"' +
                ' placeholder="' + INPUT_PLACEHOLDER + '"' +
                ' autocomplete="off"' +
                ' aria-label="' + INPUT_PLACEHOLDER + '"' +
            ' />' +
            '<button id="zippy-pill-send" class="zippy-pill-send-btn">' + SEND_LABEL + '</button>' +
        '</div>';


    /* ── DOM references ──────────────────────────────────── */
    var pill, expanded, inputField, sendBtn;


    /* ── State ───────────────────────────────────────────── */
    var chatbotOpen = false;  /* tracks whether we opened the chatbot */


    /* ── Show pill (used on init and on chatbot close) ───── */

    function showPill(isReturn) {
        container.style.display = '';

        /* Reset to pill state */
        expanded.classList.remove('zippy-pill-active');
        inputField.value = '';
        pill.style.display = '';

        if (isReturn) {
            /* Bounce-back animation */
            container.classList.remove('zippy-pill-leaving');
            container.classList.remove('zippy-pill-returning'); /* reset if mid-flight */
            void container.offsetWidth;                          /* force reflow         */
            container.classList.add('zippy-pill-returning');

            container.addEventListener('animationend', function onEnd(e) {
                if (e.animationName === 'zippyPillReturn' ||
                    e.animationName === 'zippyPillReturnMobile') {
                    container.classList.remove('zippy-pill-returning');
                    container.removeEventListener('animationend', onEnd);
                }
            });
        }
    }


    /* ── Watch the chatbot window for open/close ─────────── */

    function watchChatbotWindow() {
        /*
         * The chatbot shows/hides .zippy-window by toggling display: flex / none.
         * MutationObserver on the style attribute catches this reliably.
         */
        var win = document.querySelector('.zippy-window');
        if (!win) return;

        var observer = new MutationObserver(function () {
            var isNowOpen = win.style.display === 'flex';

            if (!isNowOpen && chatbotOpen) {
                /* Chatbot was just closed — bring the pill back */
                chatbotOpen = false;
                showPill(true);
            }

            if (isNowOpen) {
                chatbotOpen = true;
            }
        });

        observer.observe(win, { attributes: true, attributeFilter: ['style'] });
    }


    /* ── Open chatbot + inject message ──────────────────── */

    function openChatbotWithMessage(text) {
        /* Play leave animation */
        container.classList.add('zippy-pill-leaving');

        /* Open chatbot window */
        var toggle = document.querySelector('.zippy-toggle');
        if (toggle) {
            var win = document.querySelector('.zippy-window');
            if (!win || win.style.display !== 'flex') {
                toggle.click();
            }
        }

        /* Inject text after the window animation completes */
        setTimeout(function () {
            container.style.display = 'none';

            var chatInput = document.querySelector('.zippy-input');
            var chatSend  = document.querySelector('.zippy-send-btn');

            if (chatInput && chatSend) {
                /* Use native setter so React/framework listeners fire */
                var descriptor = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'value'
                );
                if (descriptor && descriptor.set) {
                    descriptor.set.call(chatInput, text);
                } else {
                    chatInput.value = text;
                }
                chatInput.dispatchEvent(new Event('input',  { bubbles: true }));
                chatInput.dispatchEvent(new Event('change', { bubbles: true }));
                chatSend.click();
            }
        }, OPEN_DELAY_MS);
    }


    /* ── Expand pill → input ─────────────────────────────── */

    function expandPill() {
        pill.style.display = 'none';
        expanded.classList.add('zippy-pill-active');
        inputField.focus();
    }


    /* ── Send handler ────────────────────────────────────── */

    function handleSend() {
        var text = inputField.value.trim();
        if (!text) { inputField.focus(); return; }
        openChatbotWithMessage(text);
    }


    /* ── Init ────────────────────────────────────────────── */

    function init() {
        document.body.appendChild(container);

        pill       = document.getElementById('zippy-pill');
        expanded   = document.getElementById('zippy-pill-expanded');
        inputField = document.getElementById('zippy-pill-input');
        sendBtn    = document.getElementById('zippy-pill-send');

        /* Pill interactions */
        pill.addEventListener('click', expandPill);
        pill.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); expandPill(); }
        });

        /* Send */
        sendBtn.addEventListener('click', handleSend);
        inputField.addEventListener('keydown', function (e) {
            if (e.key === 'Enter')  { e.preventDefault(); handleSend(); }
            if (e.key === 'Escape') {
                expanded.classList.remove('zippy-pill-active');
                inputField.value = '';
                pill.style.display = '';
            }
        });

        /*
         * Start watching the chatbot window.
         * If chatbot.js loads async the window element may not exist yet —
         * retry until it appears.
         */
        var watchAttempts = 0;
        var watchInterval = setInterval(function () {
            if (document.querySelector('.zippy-window') || ++watchAttempts > 20) {
                clearInterval(watchInterval);
                watchChatbotWindow();
            }
        }, 250);
    }


    /* ── Boot ─────────────────────────────────────────────── */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

}());
