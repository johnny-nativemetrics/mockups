/**
 * zippy-pill-entry.js
 *
 * Injects the "Ask Anything About This Topic" pill entry point into the page,
 * manages the pill → input → chatbot transition, and hands off the typed
 * message to the existing Zippy chatbot widget.
 *
 * Load AFTER chatbot.js (and its CSS companions).
 * No other dependencies required.
 *
 * HOW IT WORKS
 *   1. On DOMContentLoaded a pill is inserted into <body>.
 *   2. Clicking the pill hides it and reveals an inline text input + Send button.
 *   3. On Send (button click or Enter key):
 *        a. The container plays its exit animation.
 *        b. The chatbot window is opened by simulating a click on .zippy-toggle.
 *        c. After a brief delay the typed text is injected into .zippy-input
 *           and the send button (.zippy-send-btn) is programmatically clicked.
 *        d. The pill container is hidden permanently for this page session.
 *
 * CUSTOMISATION
 *   • PILL_LABEL      — button copy
 *   • INPUT_PLACEHOLDER — placeholder text in the expanded input
 *   • SEND_LABEL      — Send button label
 *   • OPEN_DELAY_MS   — ms to wait after opening the chatbot before injecting text
 */

(function () {
    'use strict';

    /* ── Config ─────────────────────────────────────────── */
    var PILL_LABEL       = 'Ask Anything About This Topic';
    var INPUT_PLACEHOLDER = 'Ask anything about this topic\u2026';
    var SEND_LABEL       = 'Send';
    var OPEN_DELAY_MS    = 320;   /* time for the chatbot window open animation */


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


    /* ── DOM references (set after insertion) ─────────────── */
    var pill, expanded, inputField, sendBtn;


    /* ── Open chatbot + inject message ─────────────────── */

    function openChatbotWithMessage(text) {
        /* 1. Play leave animation on the pill container */
        container.classList.add('zippy-pill-leaving');

        /* 2. Trigger chatbot open */
        var toggle = document.querySelector('.zippy-toggle');
        if (toggle) {
            var win = document.querySelector('.zippy-window');
            var isOpen = win && win.style.display === 'flex';
            if (!isOpen) {
                toggle.click();
            }
        }

        /* 3. After animation finishes, inject text and fire send */
        setTimeout(function () {
            container.style.display = 'none';

            var chatInput = document.querySelector('.zippy-input');
            var chatSend  = document.querySelector('.zippy-send-btn');

            if (chatInput && chatSend) {
                /* Set value and fire a native input event so any framework
                   listeners (React synthetic events etc.) pick up the change */
                var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'value'
                );
                if (nativeInputValueSetter && nativeInputValueSetter.set) {
                    nativeInputValueSetter.set.call(chatInput, text);
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
        if (!text) {
            inputField.focus();
            return;
        }
        openChatbotWithMessage(text);
    }


    /* ── Wire up events ──────────────────────────────────── */

    function init() {
        document.body.appendChild(container);

        pill      = document.getElementById('zippy-pill');
        expanded  = document.getElementById('zippy-pill-expanded');
        inputField = document.getElementById('zippy-pill-input');
        sendBtn   = document.getElementById('zippy-pill-send');

        /* Pill click / keyboard */
        pill.addEventListener('click', expandPill);
        pill.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                expandPill();
            }
        });

        /* Send button */
        sendBtn.addEventListener('click', handleSend);

        /* Enter key in input */
        inputField.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
            }
        });

        /* Escape: collapse back to pill */
        inputField.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                expanded.classList.remove('zippy-pill-active');
                inputField.value = '';
                pill.style.display = '';
            }
        });
    }


    /* ── Boot ─────────────────────────────────────────────── */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

}());
