(function () {
  'use strict';

  function scriptParams() {
    var script = document.currentScript;
    if (!script || !script.src) {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.indexOf('scout.js') !== -1) {
          script = scripts[i];
          break;
        }
      }
    }
    var out = { api_base: '', title: 'More from Zipline Scout', theme: 'dark', drawer_width: '420' };
    if (script && script.src) {
      var qStart = script.src.indexOf('?');
      if (qStart !== -1) {
        script.src.slice(qStart + 1).split('&').forEach(function (pair) {
          var eq = pair.indexOf('=');
          if (eq === -1) return;
          var k = decodeURIComponent(pair.slice(0, eq).replace(/\+/g, ' ')).toLowerCase();
          var v = decodeURIComponent((pair.slice(eq + 1) || '').replace(/\+/g, ' '));
          if (k === 'api_base' || k === 'apibase') out.api_base = v;
          if (k === 'title') out.title = v;
          if (k === 'theme') out.theme = v;
          if (k === 'drawer_width' || k === 'drawerwidth') out.drawer_width = v;
        });
      }
      if (script.getAttribute('data-api-base')) out.api_base = script.getAttribute('data-api-base');
      if (script.getAttribute('data-title')) out.title = script.getAttribute('data-title');
      if (script.getAttribute('data-theme')) out.theme = script.getAttribute('data-theme');
      if (script.getAttribute('data-drawer-width')) out.drawer_width = script.getAttribute('data-drawer-width');
    }
    return out;
  }

  function originFromScript(script) {
    if (!script || !script.src) return '';
    try {
      return new URL(script.src).origin;
    } catch (e) {
      return '';
    }
  }

  function pageUrl() {
    return window.location.href.split('#')[0];
  }

  function sessionId() {
    try {
      var k = 'zipline_scout_sid';
      var v = localStorage.getItem(k);
      if (v) return v;
      v = 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(k, v);
      return v;
    } catch (e) {
      return 'anon_' + Date.now();
    }
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function basicMd(s) {
    var t = escapeHtml(s);
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    t = t.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    t = t.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    t = t.replace(/^# (.+)$/gm, '<h3>$1</h3>');
    t = t.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    t = t.replace(/(<li>.*<\/li>\n?)+/g, function (m) {
      return '<ul>' + m.replace(/\n/g, '') + '</ul>';
    });
    t = t.replace(/\n\n+/g, '</p><p>');
    t = t.replace(/\n/g, '<br/>');
    return '<p>' + t + '</p>';
  }

  function mountEl() {
    var el = document.getElementById('zipline-scout-root');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'zipline-scout-root';
    (document.body || document.documentElement).appendChild(el);
    return el;
  }

  var p = scriptParams();
  var scriptEl = document.currentScript;
  var apiBase = (p.api_base || originFromScript(scriptEl) || '').replace(/\/$/, '');
  if (!apiBase) {
    console.warn('[Zipline Scout] Set data-api-base.');
    return;
  }

  var root = mountEl();
  var themeClass = (p.theme || 'dark').toLowerCase() === 'light' ? 'zipline-scout--light' : 'zipline-scout--dark';
  root.className = 'zipline-scout ' + themeClass;
  var dw = parseInt(p.drawer_width, 10) || 420;
  root.style.setProperty('--zipline-scout-sidebar-width', dw + 'px');

  root.innerHTML = '<div class="zipline-scout__loading">Loading suggestions…</div>';

  var sidebarEl = null;
  var chatScroll = null;
  var paneAnswer = null;
  var paneSources = null;
  var tabSourcesBtn = null;
  var streamAbort = null;
  var streamTarget = null;
  var sidebarWasClosed = true;

  function scrollChatToBottom() {
    if (!chatScroll) return;
    requestAnimationFrame(function () {
      chatScroll.scrollTop = chatScroll.scrollHeight;
    });
  }

  function ensureSidebar() {
    if (sidebarEl) return;
    document.body.style.setProperty('--zipline-scout-sidebar-width', dw + 'px');
    var host = document.createElement('div');
    host.id = 'zipline-scout-sidebar-host';
    host.className = 'zipline-scout zipline-scout--sidebar-host';
    host.innerHTML =
      '<aside class="zipline-scout__sidebar" id="zipline-scout-sidebar" role="complementary" aria-label="' +
      escapeHtml(p.title) +
      '" hidden>' +
      '  <div class="zipline-scout__sidebar-top">' +
      '    <div class="zipline-scout__sidebar-brand">' +
      '      <span class="zipline-scout__sidebar-star" aria-hidden="true">✦</span>' +
      '      <span>' + escapeHtml(p.title) + '</span></div>' +
      '    <button type="button" class="zipline-scout__sidebar-close" data-scout-close aria-label="Close">×</button>' +
      '  </div>' +
      '  <div class="zipline-scout__tabs">' +
      '    <button type="button" class="zipline-scout__tab zipline-scout__tab--active" data-tab="answer">Answer</button>' +
      '    <button type="button" class="zipline-scout__tab" data-tab="sources" id="zipline-scout-tab-sources">Sources (1)</button>' +
      '  </div>' +
      '  <div class="zipline-scout__sidebar-body">' +
      '    <div class="zipline-scout__pane zipline-scout__pane--answer" id="zipline-scout-pane-answer">' +
      '      <div class="zipline-scout__chat" id="zipline-scout-chat"></div>' +
      '    </div>' +
      '    <div class="zipline-scout__pane zipline-scout__pane--sources" id="zipline-scout-pane-sources" hidden>' +
      '      <p class="zipline-scout__sources-intro">Responses use this page as context:</p>' +
      '      <a class="zipline-scout__sources-link" id="zipline-scout-source-url" href="#" target="_blank" rel="noopener"></a>' +
      '    </div>' +
      '  </div>' +
      '</aside>';
    document.body.appendChild(host);
    sidebarEl = document.getElementById('zipline-scout-sidebar');
    chatScroll = document.getElementById('zipline-scout-chat');
    paneAnswer = document.getElementById('zipline-scout-pane-answer');
    paneSources = document.getElementById('zipline-scout-pane-sources');
    tabSourcesBtn = document.getElementById('zipline-scout-tab-sources');
    var sourceUrl = document.getElementById('zipline-scout-source-url');
    sourceUrl.textContent = pageUrl();
    sourceUrl.href = pageUrl();

    sidebarEl.querySelectorAll('.zipline-scout__tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-tab');
        sidebarEl.querySelectorAll('.zipline-scout__tab').forEach(function (b) {
          b.classList.toggle('zipline-scout__tab--active', b.getAttribute('data-tab') === tab);
        });
        paneAnswer.hidden = tab !== 'answer';
        paneSources.hidden = tab !== 'sources';
      });
    });

    sidebarEl.addEventListener('click', function (ev) {
      if (ev.target.hasAttribute('data-scout-close')) closeSidebar();
    });
  }

  function appendTurn(question) {
    var turn = document.createElement('div');
    turn.className = 'zipline-scout__turn';
    turn.innerHTML =
      '<div class="zipline-scout__turn-q">' +
      escapeHtml(question) +
      '</div>' +
      '<div class="zipline-scout__turn-body">' +
      '  <div class="zipline-scout__loading-block">' +
      '    <div class="zipline-scout__loading-row"><span class="zipline-scout__loading-star">✦</span> Checking other sources…</div>' +
      '    <div class="zipline-scout__skeleton"></div>' +
      '    <div class="zipline-scout__skeleton zipline-scout__skeleton--mid"></div>' +
      '    <div class="zipline-scout__skeleton zipline-scout__skeleton--short"></div>' +
      '  </div>' +
      '  <div class="zipline-scout__turn-answer zipline-scout__answer" hidden></div>' +
      '  <div class="zipline-scout__turn-actions" hidden>' +
      '    <button type="button" class="zipline-scout__icon-btn zipline-scout__turn-copy" title="Copy answer">📋</button>' +
      '  </div>' +
      '  <div class="zipline-scout__turn-explore"></div>' +
      '</div>' +
      '<div class="zipline-scout__turn-divider"></div>';
    chatScroll.appendChild(turn);
    var ans = turn.querySelector('.zipline-scout__turn-answer');
    var copyBtn = turn.querySelector('.zipline-scout__turn-copy');
    copyBtn.addEventListener('click', function () {
      var raw = ans.getAttribute('data-raw') || '';
      if (raw && navigator.clipboard) navigator.clipboard.writeText(raw);
    });
    scrollChatToBottom();
    return turn;
  }

  function dispatchSSEBlock(block) {
    if (!streamTarget) return;
    var ev = '';
    var dataLine = '';
    block.split('\n').forEach(function (line) {
      if (line.indexOf('event:') === 0) ev = line.slice(6).trim();
      if (line.indexOf('data:') === 0) dataLine = line.slice(5).trim();
    });
    if (!dataLine) return;
    var data;
    try {
      data = JSON.parse(dataLine);
    } catch (e) {
      return;
    }
    var ansEl = streamTarget.ansEl;
    var loadEl = streamTarget.loadEl;
    var explEl = streamTarget.explEl;

    if (ev === 'chunk' && data.t) {
      if (loadEl) {
        loadEl.style.display = 'none';
        ansEl.hidden = false;
        ansEl.closest('.zipline-scout__turn').querySelector('.zipline-scout__turn-actions').hidden = false;
      }
      var acc = (ansEl.getAttribute('data-raw') || '') + data.t;
      ansEl.setAttribute('data-raw', acc);
      ansEl.innerHTML = basicMd(acc);
      scrollChatToBottom();
    }
    if (ev === 'error') {
      if (loadEl) loadEl.style.display = 'none';
      ansEl.hidden = false;
      ansEl.innerHTML = '<p class="zipline-scout__err">' + escapeHtml(data.m || 'Error') + '</p>';
      scrollChatToBottom();
    }
    if (ev === 'followups' && data.questions && data.questions.length) {
      var h = '<div class="zipline-scout__explore-title">Explore more</div>';
      data.questions.forEach(function (q) {
        if (!q) return;
        h +=
          '<button type="button" class="zipline-scout__explore-chip">' +
          escapeHtml(q) +
          '<span class="zipline-scout__explore-arrow">↩</span></button>';
      });
      explEl.innerHTML = h;
      var chips = explEl.querySelectorAll('.zipline-scout__explore-chip');
      data.questions.forEach(function (qtext, idx) {
        if (!qtext || !chips[idx]) return;
        chips[idx].addEventListener('click', function () {
          if (streamAbort) streamAbort.abort();
          var t = appendTurn(qtext);
          runStreamIntoTurn(qtext, t);
          if (sidebarEl) sidebarEl.querySelector('[data-tab="answer"]').click();
        });
      });
      scrollChatToBottom();
    }
  }

  function runStreamIntoTurn(question, turnEl) {
    if (streamAbort) streamAbort.abort();
    streamAbort = new AbortController();

    var ansEl = turnEl.querySelector('.zipline-scout__turn-answer');
    var loadEl = turnEl.querySelector('.zipline-scout__loading-block');
    var explEl = turnEl.querySelector('.zipline-scout__turn-explore');
    ansEl.innerHTML = '';
    ansEl.removeAttribute('data-raw');
    ansEl.hidden = true;
    loadEl.style.display = '';
    explEl.innerHTML = '';
    turnEl.querySelector('.zipline-scout__turn-actions').hidden = true;

    streamTarget = { ansEl: ansEl, loadEl: loadEl, explEl: explEl };

    fetch(apiBase + '/api/v1/scout/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ url: pageUrl(), question: question }),
      signal: streamAbort.signal
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(
            function (j) {
              throw new Error((j && j.detail) || (j && j.error) || 'HTTP ' + res.status);
            },
            function () {
              throw new Error('HTTP ' + res.status);
            }
          );
        }
        var reader = res.body.getReader();
        var dec = new TextDecoder();
        var buf = '';
        function pump() {
          return reader.read().then(function (r) {
            if (r.done) {
              if (buf.trim()) {
                var sep = buf.indexOf('\n\n');
                if (sep >= 0) dispatchSSEBlock(buf.slice(0, sep));
              }
              streamTarget = null;
              return;
            }
            buf += dec.decode(r.value, { stream: true });
            var sep;
            while ((sep = buf.indexOf('\n\n')) >= 0) {
              dispatchSSEBlock(buf.slice(0, sep));
              buf = buf.slice(sep + 2);
            }
            return pump();
          });
        }
        return pump();
      })
      .catch(function (e) {
        if (e.name === 'AbortError') return;
        loadEl.style.display = 'none';
        ansEl.hidden = false;
        ansEl.innerHTML = '<p class="zipline-scout__err">' + escapeHtml(String(e.message || e)) + '</p>';
        streamTarget = null;
        scrollChatToBottom();
      });
  }

  function openSidebar(question, appendOnly) {
    ensureSidebar();
    if (!appendOnly || sidebarWasClosed) {
      chatScroll.innerHTML = '';
      sidebarWasClosed = false;
    }
    var turn = appendTurn(question);
    sidebarEl.querySelectorAll('.zipline-scout__tab').forEach(function (b) {
      b.classList.toggle('zipline-scout__tab--active', b.getAttribute('data-tab') === 'answer');
    });
    paneAnswer.hidden = false;
    paneSources.hidden = true;
    sidebarEl.hidden = false;
    document.body.classList.add('zipline-scout-sidebar-visible');
    runStreamIntoTurn(question, turn);
  }

  function closeSidebar() {
    if (!sidebarEl) return;
    if (streamAbort) streamAbort.abort();
    streamTarget = null;
    sidebarEl.hidden = true;
    sidebarWasClosed = true;
    document.body.classList.remove('zipline-scout-sidebar-visible');
  }

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && sidebarEl && !sidebarEl.hidden) closeSidebar();
  });

  var q = new URLSearchParams();
  q.set('url', pageUrl());
  q.set('session_id', sessionId());

  fetch(apiBase + '/api/v1/scout/questions?' + q.toString())
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var questions = (data && data.questions) || [];
      if (!questions.length) throw new Error('no questions');
      var loading = root.querySelector('.zipline-scout__loading');
      if (loading) loading.remove();

      var head = document.createElement('div');
      head.className = 'zipline-scout__head';
      head.innerHTML =
        '<span class="zipline-scout__head-star" aria-hidden="true">✦</span>' +
        '<span class="zipline-scout__head-title">' +
        escapeHtml(p.title) +
        '</span>';

      var carousel = document.createElement('div');
      carousel.className = 'zipline-scout__carousel';
      carousel.innerHTML =
        '<button type="button" class="zipline-scout__nav zipline-scout__nav--prev" aria-label="Previous">‹</button>' +
        '<div class="zipline-scout__track-wrap"><div class="zipline-scout__track"></div></div>' +
        '<button type="button" class="zipline-scout__nav zipline-scout__nav--next" aria-label="Next">›</button>';

      var track = carousel.querySelector('.zipline-scout__track');
      questions.forEach(function (text) {
        if (!text || String(text).length > 500) return;
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'zipline-scout__card';
        card.innerHTML = '<span class="zipline-scout__card-text">' + escapeHtml(String(text)) + '</span>';
        card.addEventListener('click', function () {
          var sidebarOpen = sidebarEl && !sidebarEl.hidden;
          openSidebar(String(text), sidebarOpen);
        });
        track.appendChild(card);
      });

      var wrap = carousel.querySelector('.zipline-scout__track-wrap');
      // FIX: scroll exactly one card width (was * 1.5 which skipped cards on mobile)
      carousel.querySelector('.zipline-scout__nav--prev').addEventListener('click', function () {
        var card = track.querySelector('.zipline-scout__card');
        var w = card ? card.offsetWidth + 12 : 200;
        wrap.scrollBy({ left: -w, behavior: 'smooth' });
      });
      carousel.querySelector('.zipline-scout__nav--next').addEventListener('click', function () {
        var card = track.querySelector('.zipline-scout__card');
        var w = card ? card.offsetWidth + 12 : 200;
        wrap.scrollBy({ left: w, behavior: 'smooth' });
      });

      root.appendChild(head);
      root.appendChild(carousel);
    })
    .catch(function () {
      root.innerHTML = '';
      root.style.display = 'none';
    });
})();
