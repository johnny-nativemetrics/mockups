/**
 * zippy-pill-entry.js  (v3)
 *
 * Changes from v2:
 *   - iOS keyboard fix: uses visualViewport API to float the input above
 *     the software keyboard when it opens on iOS Safari.
 *   - Cleaned up stale reference to removed zippyPillReturnMobile keyframe.
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
    var chatbotOpen   = false;
    var keyboardWatch = false; /* whether we're currently listening for keyboard changes */


    /* ── iOS keyboard fix ────────────────────────────────────
     *
     * When the software keyboard opens on iOS Safari, window.innerHeight stays
     * the same but window.visualViewport.height shrinks. The difference is the
     * keyboard height. We move the container bottom up by that amount so the
     * input floats just above the keyboard rather than hiding behind it.
     *
     * We only activate this listener while the pill input is expanded/focused,
     * and tear it down when the input is dismissed.
     */

    function onViewportResize() {
        var vv = window.visualViewport;
        if (!vv) return;
        var keyboardHeight = window.innerHeight - vv.height - vv.offsetTop;
        if (keyboardHeight > 60) {
            /* Keyboard is open — lift the container above it with a small gap */
            container.style.bottom = (keyboardHeight + 12) + 'px';
        } else {
            /* Keyboard closed — let CSS take over again */
            container.style.bottom = '';
        }
    }

    function startKeyboardWatch() {
        if (keyboardWatch || !window.visualViewport) return;
        keyboardWatch = true;
        window.visualViewport.addEventListener('resize', onViewportResize);
        window.visualViewport.addEventListener('scroll', onViewportResize);
    }

    function stopKeyboardWatch() {
        if (!keyboardWatch || !window.visualViewport) return;
        keyboardWatch = false;
        window.visualViewport.removeEventListener('resize', onViewportResize);
        window.visualViewport.removeEventListener('scroll', onViewportResize);
        container.style.bottom = ''; /* restore CSS-controlled position */
    }


    /* ── Show pill (used on init and on chatbot close) ───── */

    function showPill(isReturn) {
        container.style.display = '';

        /* Reset to pill state */
        expanded.classList.remove('zippy-pill-active');
        inputField.value = '';
        pill.style.display = '';
        stopKeyboardWatch();

        if (isReturn) {
            container.classList.remove('zippy-pill-leaving');
            container.classList.remove('zippy-pill-returning');
            void container.offsetWidth; /* force reflow */
            container.classList.add('zippy-pill-returning');

            container.addEventListener('animationend', function onEnd(e) {
                if (e.animationName === 'zippyPillReturn') {
                    container.classList.remove('zippy-pill-returning');
                    container.removeEventListener('animationend', onEnd);
                }
            });
        }
    }


    /* ── Watch the chatbot window for open/close ─────────── */

    function watchChatbotWindow() {
        var win = document.querySelector('.zippy-window');
        if (!win) return;

        var observer = new MutationObserver(function () {
            var isNowOpen = win.style.display === 'flex';

            if (!isNowOpen && chatbotOpen) {
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
        stopKeyboardWatch();
        container.classList.add('zippy-pill-leaving');

        var toggle = document.querySelector('.zippy-toggle');
        if (toggle) {
            var win = document.querySelector('.zippy-window');
            if (!win || win.style.display !== 'flex') {
                toggle.click();
            }
        }

        setTimeout(function () {
            container.style.display = 'none';

            var chatInput = document.querySelector('.zippy-input');
            var chatSend  = document.querySelector('.zippy-send-btn');

            if (chatInput && chatSend) {
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
        startKeyboardWatch(); /* begin watching for keyboard on iOS */
    }


    /* ── Collapse input → pill ───────────────────────────── */

    function collapsePill() {
        expanded.classList.remove('zippy-pill-active');
        inputField.value = '';
        pill.style.display = '';
        stopKeyboardWatch();
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

        /* Pill */
        pill.addEventListener('click', expandPill);
        pill.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); expandPill(); }
        });

        /* Send */
        sendBtn.addEventListener('click', handleSend);
        inputField.addEventListener('keydown', function (e) {
            if (e.key === 'Enter')  { e.preventDefault(); handleSend(); }
            if (e.key === 'Escape') { collapsePill(); }
        });

        /* iOS: if the user dismisses the keyboard by tapping outside the
           input (but not the send button), collapse back to pill state */
        inputField.addEventListener('blur', function () {
            /* Small delay — if blur was caused by tapping Send, handleSend
               fires first and we don't want to collapse before it runs */
            setTimeout(function () {
                if (document.activeElement !== sendBtn &&
                    document.activeElement !== inputField) {
                    collapsePill();
                }
            }, 200);
        });

        /* Watch chatbot window */
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
