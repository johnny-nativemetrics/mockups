(function () {
  'use strict';

  function scriptParams() {
    var script = document.currentScript;
    if (!script || !script.src) {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (
          scripts[i].src &&
          (scripts[i].src.indexOf('spark.js') !== -1 || scripts[i].src.indexOf('scout.js') !== -1)
        ) {
          script = scripts[i];
          break;
        }
      }
    }
    var out = {
      api_base: '',
      title: 'More from Zipline Spark',
      theme: 'dark',
      drawer_width: '420',
      scriptEl: script || null,
      adsense_client: '',
      adsense_slot: '',
      afs_pub_id: '',
      afs_style_id: '',
      afs_channel_id: '',
      channel_id: '',
      pubid: ''
    };
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
          if (k === 'channel_id' || k === 'channel') out.channel_id = v;
          if (k === 'pubid') out.pubid = v;
          if (k === 'afs_pub_id' || k === 'afspubid') out.afs_pub_id = v;
          if (k === 'afs_style_id' || k === 'afsstyleid') out.afs_style_id = v;
          if (k === 'afs_channel_id' || k === 'afschannelid' || k === 'afs_channel') out.afs_channel_id = v;
        });
      }
      if (script.getAttribute('data-api-base')) out.api_base = script.getAttribute('data-api-base');
      if (script.getAttribute('data-title')) out.title = script.getAttribute('data-title');
      if (script.getAttribute('data-theme')) out.theme = script.getAttribute('data-theme');
      if (script.getAttribute('data-drawer-width')) out.drawer_width = script.getAttribute('data-drawer-width');
      var ac = script.getAttribute('data-adsense-client');
      var asl = script.getAttribute('data-ad-slot');
      if (ac) out.adsense_client = ac.trim();
      if (asl) out.adsense_slot = asl.trim();
      var dch = script.getAttribute('data-channel-id');
      if (dch) out.channel_id = dch.trim();
      var dpub = script.getAttribute('data-pubid');
      if (dpub) out.pubid = dpub.trim();
      var apub = script.getAttribute('data-afs-pub-id');
      if (apub) out.afs_pub_id = apub.trim();
      var ast = script.getAttribute('data-afs-style-id');
      if (ast) out.afs_style_id = ast.trim();
      var ach = script.getAttribute('data-afs-channel-id');
      if (ach) out.afs_channel_id = ach.trim();
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
      var k = 'zipline_spark_sid';
      var v = localStorage.getItem(k);
      if (v) return v;
      var legacy = localStorage.getItem('zipline_scout_sid');
      if (legacy) {
        localStorage.setItem(k, legacy);
        try {
          localStorage.removeItem('zipline_scout_sid');
        } catch (e2) {}
        return legacy;
      }
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
    var el = document.getElementById('zipline-spark-root') || document.getElementById('zipline-scout-root');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'zipline-spark-root';
    (document.body || document.documentElement).appendChild(el);
    return el;
  }

  /**
   * FIX: Always re-query the live DOM for the root element.
   * The closed-over reference captured at init time may be a detached node
   * after Next.js (or any SSR framework) tears down and replaces the DOM
   * during hydration. Re-querying at render time guarantees we write to the
   * element that is actually in the live document.
   */
  function getLiveRoot(themeClass, dw) {
    var el = document.getElementById('zipline-spark-root') || document.getElementById('zipline-scout-root');
    if (!el) {
      el = mountEl();
    }
    // Re-apply class/style in case hydration wiped them out
    if (themeClass && el.className.indexOf('zipline-spark') === -1) {
      el.className = 'zipline-spark ' + themeClass;
    }
    if (dw) {
      el.style.setProperty('--zipline-spark-sidebar-width', dw + 'px');
    }
    return el;
  }

  function onDomReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // Prefer #zipline-spark-root in the page; if missing, watch for late injection then append to body.
  function waitForMountRoot(done) {
    var fired = false;
    function finish(el) {
      if (fired) return;
      fired = true;
      done(el);
    }
    function resolve() {
      var el = document.getElementById('zipline-spark-root') || document.getElementById('zipline-scout-root');
      if (el) {
        finish(el);
        return true;
      }
      return false;
    }
    if (resolve()) return;
    var mo = new MutationObserver(function () {
      if (resolve()) mo.disconnect();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener(
      'load',
      function () {
        mo.disconnect();
        if (!fired) finish(mountEl());
      },
      { once: true }
    );
  }

  var p = scriptParams();
  try {
    var pageQs = new URLSearchParams(window.location.search);
    var urlCh = pageQs.get('channel_id') || pageQs.get('channel');
    if (urlCh && !p.channel_id) p.channel_id = String(urlCh).trim();
    var urlPub = pageQs.get('pubid');
    if (urlPub && !p.pubid) p.pubid = String(urlPub).trim();
  } catch (e) {}
  var scriptEl = p.scriptEl || document.currentScript;
  var apiBase = (p.api_base || originFromScript(scriptEl) || '').replace(/\/$/, '');
  if (!apiBase) {
    console.warn('[Zipline Spark] Set data-api-base.');
    return;
  }

  onDomReady(function () {
    waitForMountRoot(function (root) {
  var themeClass = (p.theme || 'dark').toLowerCase() === 'light' ? 'zipline-spark--light' : 'zipline-spark--dark';
  root.className = 'zipline-spark ' + themeClass;
  var dw = parseInt(p.drawer_width, 10) || 420;
  root.style.setProperty('--zipline-spark-sidebar-width', dw + 'px');

  root.innerHTML =
    sparkHeadHtml() + '<div class="zipline-spark__loading">Loading suggestions…</div>';

  var sidebarEl = null;
  var chatScroll = null;
  var paneAnswer = null;
  var paneSources = null;
  var tabSourcesBtn = null;
  var streamAbort = null;
  var streamTarget = null;
  var sidebarWasClosed = true;
  var sparkMonetizationBootstrapped = false;
  var sparkTurnAfsCounter = 0;

  /** Align an element's top with the top of the chat scroller (avoids jumping to AFS below the answer). */
  function scrollChatElementToTop(el) {
    if (!chatScroll || !el) return;
    requestAnimationFrame(function () {
      var chatRect = chatScroll.getBoundingClientRect();
      var elRect = el.getBoundingClientRect();
      chatScroll.scrollTop += elRect.top - chatRect.top;
    });
  }

  function ensureSidebar() {
    if (sidebarEl) return;
    document.body.style.setProperty('--zipline-spark-sidebar-width', dw + 'px');
    var host = document.createElement('div');
    host.id = 'zipline-spark-sidebar-host';
    host.className = 'zipline-spark zipline-spark--sidebar-host';
    host.innerHTML =
      '<aside class="zipline-spark__sidebar" id="zipline-spark-sidebar" role="complementary" aria-label="' +
      escapeHtml(p.title) +
      '" hidden>' +
      '  <div class="zipline-spark__sidebar-top">' +
      '    <div class="zipline-spark__sidebar-brand">' +
      '      <span class="zipline-spark__sidebar-star" aria-hidden="true">✦</span>' +
      '      <span>' + escapeHtml(p.title) + '</span></div>' +
      '    <button type="button" class="zipline-spark__sidebar-close" data-spark-close aria-label="Close">×</button>' +
      '  </div>' +
      '  <div class="zipline-spark__tabs">' +
      '    <button type="button" class="zipline-spark__tab zipline-spark__tab--active" data-tab="answer">Answer</button>' +
      '    <button type="button" class="zipline-spark__tab" data-tab="sources" id="zipline-spark-tab-sources">Sources (1)</button>' +
      '  </div>' +
      '  <div class="zipline-spark__sidebar-body">' +
      '    <div class="zipline-spark__pane zipline-spark__pane--answer" id="zipline-spark-pane-answer">' +
      '      <div class="zipline-spark__chat" id="zipline-spark-chat"></div>' +
      '    </div>' +
      '    <div class="zipline-spark__pane zipline-spark__pane--sources" id="zipline-spark-pane-sources" hidden>' +
      '      <p class="zipline-spark__sources-intro">Responses use this page as context:</p>' +
      '      <a class="zipline-spark__sources-link" id="zipline-spark-source-url" href="#" target="_blank" rel="noopener"></a>' +
      '    </div>' +
      '  </div>' +
      '</aside>';
    document.body.appendChild(host);
    sidebarEl = document.getElementById('zipline-spark-sidebar');
    chatScroll = document.getElementById('zipline-spark-chat');
    paneAnswer = document.getElementById('zipline-spark-pane-answer');
    paneSources = document.getElementById('zipline-spark-pane-sources');
    tabSourcesBtn = document.getElementById('zipline-spark-tab-sources');
    var sourceUrl = document.getElementById('zipline-spark-source-url');
    sourceUrl.textContent = pageUrl();
    sourceUrl.href = pageUrl();

    sidebarEl.querySelectorAll('.zipline-spark__tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-tab');
        sidebarEl.querySelectorAll('.zipline-spark__tab').forEach(function (b) {
          b.classList.toggle('zipline-spark__tab--active', b.getAttribute('data-tab') === tab);
        });
        paneAnswer.hidden = tab !== 'answer';
        paneSources.hidden = tab !== 'sources';
      });
    });

    sidebarEl.addEventListener('click', function (ev) {
      if (ev.target.hasAttribute('data-spark-close')) closeSidebar();
    });
  }

  function sparkUsesAfs() {
    return !!(p.afs_pub_id && p.afs_pub_id.trim() && p.afs_style_id && p.afs_style_id.trim());
  }

  function injectAfsHeadOnce() {
    if (document.querySelector('script[data-zipline-spark-afs]')) return;
    var s1 = document.createElement('script');
    s1.async = true;
    s1.src = 'https://www.google.com/adsense/search/ads.js';
    s1.setAttribute('data-zipline-spark-afs', '1');
    document.head.appendChild(s1);
    var s2 = document.createElement('script');
    s2.type = 'text/javascript';
    s2.charset = 'utf-8';
    s2.setAttribute('data-zipline-spark-afs', 'bootstrap');
    s2.textContent =
      "(function(g,o){g[o]=g[o]||function(){(g[o]['q']=g[o]['q']||[]).push(arguments)},g[o]['t']=1*new Date})(window,'_googCsa');";
    document.head.appendChild(s2);
  }

  function initSparkMonetization() {
    if (sparkUsesAfs()) {
      injectAfsHeadOnce();
    }
  }

  function maybeRenderAfsForTurn(question, turnEl) {
    if (!sparkUsesAfs()) return;
    var wrap = turnEl.querySelector('.zipline-spark__turn-ad-wrap');
    var afsEl = wrap && wrap.querySelector('.zipline-spark__afs-container');
    var displayInner = wrap && wrap.querySelector('.zipline-spark__ad-display');
    if (!wrap || !afsEl || !afsEl.id) return;
    if (afsEl.getAttribute('data-zipline-afs-done')) return;
    afsEl.setAttribute('data-zipline-afs-done', '1');
    injectAfsHeadOnce();
    if (displayInner) displayInner.innerHTML = '';
    afsEl.innerHTML = '';
    var qtext = (question || '').trim() || (document.title || '').trim() || ' ';
    if (qtext.length > 200) qtext = qtext.slice(0, 200);
    var sidebarW = parseInt(String(dw), 10) || 420;
    var w = Math.min(700, Math.max(250, sidebarW - 32));
    try {
      var pageOptions = {
        pubId: p.afs_pub_id.trim(),
        query: qtext,
        styleId: p.afs_style_id.trim()
      };
      var afsCh = (p.afs_channel_id || '').trim();
      if (afsCh) pageOptions.channel = afsCh;
      var adblock = { container: afsEl.id, width: w };
      window._googCsa('ads', pageOptions, adblock);
    } catch (e) {}
  }

  function fillDisplayAdForTurn(turnEl) {
    if (sparkUsesAfs()) return;
    var client = (p.adsense_client || '').trim();
    var slot = (p.adsense_slot || '').trim();
    if (!client || !slot) return;
    var wrap = turnEl.querySelector('.zipline-spark__turn-ad-wrap');
    var inner = wrap && wrap.querySelector('.zipline-spark__ad-display');
    if (!inner || inner.querySelector('.adsbygoogle')) return;
    inner.innerHTML =
      '<ins class="adsbygoogle" style="display:block" data-ad-client="' +
      escapeHtml(client) +
      '" data-ad-slot="' +
      escapeHtml(slot) +
      '"></ins>';
    var loaderSel = 'script[data-zipline-spark-ads]';
    function pushUnit() {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {}
    }
    if (!document.querySelector(loaderSel)) {
      var s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-zipline-spark-ads', '1');
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
      s.crossOrigin = 'anonymous';
      s.onload = pushUnit;
      document.head.appendChild(s);
    } else {
      pushUnit();
    }
  }

  function appendTurn(question) {
    var turn = document.createElement('div');
    turn.className = 'zipline-spark__turn';
    sparkTurnAfsCounter += 1;
    var afsDomId = 'zipline-spark-afs-' + sparkTurnAfsCounter;
    var adBlock =
      '  <div class="zipline-spark__turn-ad-wrap" hidden>' +
      '    <div class="zipline-spark__ad-label">Advertisement</div>' +
      '    <div class="zipline-spark__ad-display"></div>' +
      '    <div class="zipline-spark__afs-container" id="' +
      afsDomId +
      '" aria-hidden="true"></div>' +
      '  </div>';
    turn.innerHTML =
      '<div class="zipline-spark__turn-q">' +
      escapeHtml(question) +
      '</div>' +
      '<div class="zipline-spark__turn-body">' +
      '  <div class="zipline-spark__loading-block">' +
      '    <div class="zipline-spark__loading-row"><span class="zipline-spark__loading-star">✦</span> Checking other sources…</div>' +
      '    <div class="zipline-spark__skeleton"></div>' +
      '    <div class="zipline-spark__skeleton zipline-spark__skeleton--mid"></div>' +
      '    <div class="zipline-spark__skeleton zipline-spark__skeleton--short"></div>' +
      '  </div>' +
      '  <div class="zipline-spark__turn-answer zipline-spark__answer" hidden></div>' +
      '  <div class="zipline-spark__turn-actions" hidden>' +
      '    <button type="button" class="zipline-spark__icon-btn zipline-spark__turn-copy" title="Copy answer">📋</button>' +
      '  </div>' +
      adBlock +
      '  <div class="zipline-spark__turn-explore"></div>' +
      '</div>' +
      '<div class="zipline-spark__turn-divider"></div>';
    chatScroll.appendChild(turn);
    var ans = turn.querySelector('.zipline-spark__turn-answer');
    var copyBtn = turn.querySelector('.zipline-spark__turn-copy');
    copyBtn.addEventListener('click', function () {
      var raw = ans.getAttribute('data-raw') || '';
      if (raw && navigator.clipboard) navigator.clipboard.writeText(raw);
    });
    scrollChatElementToTop(turn);
    return turn;
  }

  function monetizeSparkTurn(question, turnEl) {
    var wrap = turnEl.querySelector('.zipline-spark__turn-ad-wrap');
    if (!wrap) return;
    wrap.hidden = false;
    if (!sparkMonetizationBootstrapped) {
      sparkMonetizationBootstrapped = true;
      initSparkMonetization();
    }
    maybeRenderAfsForTurn(question, turnEl);
    fillDisplayAdForTurn(turnEl);
  }

  /** After stream ends: unwrap short answers; keep 8-line clamp + Show more only when long. Inner exists from streaming clamp. */
  function applyAnswerTruncation(ansEl) {
    if (!ansEl) return;

    var existingBtn = ansEl.parentNode && ansEl.parentNode.querySelector('.zipline-spark__show-more-btn');
    if (existingBtn) existingBtn.remove();
    ansEl.classList.remove('zipline-spark__answer--collapsed');
    ansEl.classList.remove('zipline-spark__answer--streaming-clamp');

    var inner = ansEl.querySelector('.zipline-spark__answer-inner');
    if (!inner) {
      return;
    }

    var lineHeight = parseFloat(window.getComputedStyle(inner).lineHeight) || 24;
    var maxBeforeClamp = lineHeight * 8 + 12;
    if (inner.scrollHeight <= maxBeforeClamp) {
      while (inner.firstChild) {
        ansEl.insertBefore(inner.firstChild, inner);
      }
      inner.remove();
      return;
    }

    ansEl.classList.add('zipline-spark__answer--collapsed');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'zipline-spark__show-more-btn';
    btn.textContent = 'Show more';
    btn.addEventListener('click', function () {
      ansEl.classList.remove('zipline-spark__answer--collapsed');
      btn.remove();
    });
    ansEl.parentNode.insertBefore(btn, ansEl.nextSibling);
  }

  function setAnswerHtmlStreaming(ansEl, html) {
    var inner = ansEl.querySelector('.zipline-spark__answer-inner');
    if (!inner) {
      inner = document.createElement('div');
      inner.className = 'zipline-spark__answer-inner';
      ansEl.appendChild(inner);
    }
    inner.innerHTML = html;
    ansEl.classList.add('zipline-spark__answer--streaming-clamp');
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
      var firstChunk = !!(loadEl && loadEl.style.display !== 'none');
      if (firstChunk) {
        loadEl.style.display = 'none';
        ansEl.hidden = false;
        ansEl.closest('.zipline-spark__turn').querySelector('.zipline-spark__turn-actions').hidden = false;
        var turnRoot = ansEl.closest('.zipline-spark__turn');
        if (turnRoot && streamTarget) {
          monetizeSparkTurn(streamTarget.question, turnRoot);
        }
      }
      var acc = (ansEl.getAttribute('data-raw') || '') + data.t;
      ansEl.setAttribute('data-raw', acc);
      setAnswerHtmlStreaming(ansEl, basicMd(acc));
      if (firstChunk) {
        scrollChatElementToTop(ansEl);
      }
    }
    if (ev === 'error') {
      if (loadEl) loadEl.style.display = 'none';
      ansEl.hidden = false;
      ansEl.innerHTML = '<p class="zipline-spark__err">' + escapeHtml(data.m || 'Error') + '</p>';
      var errTurn = ansEl.closest('.zipline-spark__turn');
      if (errTurn && streamTarget) {
        monetizeSparkTurn(streamTarget.question, errTurn);
      }
      scrollChatElementToTop(ansEl);
    }
    if (ev === 'followups' && data.questions && data.questions.length) {
      var h = '<div class="zipline-spark__explore-title">Explore more</div>';
      data.questions.forEach(function (q) {
        if (!q) return;
        h +=
          '<button type="button" class="zipline-spark__explore-chip">' +
          escapeHtml(q) +
          '<span class="zipline-spark__explore-arrow">↩</span></button>';
      });
      explEl.innerHTML = h;
      var chips = explEl.querySelectorAll('.zipline-spark__explore-chip');
      data.questions.forEach(function (qtext, idx) {
        if (!qtext || !chips[idx]) return;
        chips[idx].addEventListener('click', function () {
          if (streamAbort) streamAbort.abort();
          var t = appendTurn(qtext);
          runStreamIntoTurn(qtext, t);
          if (sidebarEl) sidebarEl.querySelector('[data-tab="answer"]').click();
        });
      });
      // Keep the answer pinned at top; explore + ads sit below (user scrolls to them).
      scrollChatElementToTop(ansEl);
    }
  }

  function runStreamIntoTurn(question, turnEl) {
    if (streamAbort) streamAbort.abort();
    streamAbort = new AbortController();

    var ansEl = turnEl.querySelector('.zipline-spark__turn-answer');
    var loadEl = turnEl.querySelector('.zipline-spark__loading-block');
    var explEl = turnEl.querySelector('.zipline-spark__turn-explore');
    ansEl.innerHTML = '';
    ansEl.removeAttribute('data-raw');
    ansEl.hidden = true;
    loadEl.style.display = '';
    explEl.innerHTML = '';
    turnEl.querySelector('.zipline-spark__turn-actions').hidden = true;

    streamTarget = { ansEl: ansEl, loadEl: loadEl, explEl: explEl, question: question };

    fetch(apiBase + '/api/v1/spark/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(
        (function () {
          var payload = { url: pageUrl(), question: question };
          if (p.channel_id) payload.channel_id = p.channel_id;
          if (p.pubid) payload.pubid = p.pubid;
          return payload;
        })()
      ),
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
              if (streamTarget && streamTarget.ansEl) {
                applyAnswerTruncation(streamTarget.ansEl);
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
        ansEl.innerHTML = '<p class="zipline-spark__err">' + escapeHtml(String(e.message || e)) + '</p>';
        var fetchWrap = turnEl.querySelector('.zipline-spark__turn-ad-wrap');
        if (fetchWrap) {
          fetchWrap.hidden = false;
          monetizeSparkTurn(question, turnEl);
        }
        streamTarget = null;
        scrollChatElementToTop(ansEl);
      });
  }

  function openSidebar(question, appendOnly) {
    ensureSidebar();
    if (!appendOnly || sidebarWasClosed) {
      chatScroll.innerHTML = '';
      sidebarWasClosed = false;
    }
    var turn = appendTurn(question);
    sidebarEl.querySelectorAll('.zipline-spark__tab').forEach(function (b) {
      b.classList.toggle('zipline-spark__tab--active', b.getAttribute('data-tab') === 'answer');
    });
    paneAnswer.hidden = false;
    paneSources.hidden = true;
    sidebarEl.hidden = false;
    document.body.classList.add('zipline-spark-sidebar-visible');
    runStreamIntoTurn(question, turn);
  }

  function closeSidebar() {
    if (!sidebarEl) return;
    if (streamAbort) streamAbort.abort();
    streamTarget = null;
    sidebarEl.hidden = true;
    sidebarWasClosed = true;
    document.body.classList.remove('zipline-spark-sidebar-visible');
  }

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && sidebarEl && !sidebarEl.hidden) closeSidebar();
  });

  function withServerAfsDefaults(done) {
    if ((p.afs_pub_id && p.afs_style_id) || !apiBase) {
      done();
      return;
    }
    fetch(apiBase + '/api/v1/spark/public-config', { credentials: 'omit' })
      .then(function (r) {
        return r.ok ? r.json() : {};
      })
      .then(function (cfg) {
        if (cfg && typeof cfg === 'object') {
          if (!p.afs_pub_id && cfg.afs_pub_id) p.afs_pub_id = String(cfg.afs_pub_id).trim();
          if (!p.afs_style_id && cfg.afs_style_id) p.afs_style_id = String(cfg.afs_style_id).trim();
          if (!p.afs_channel_id && cfg.afs_channel_id) p.afs_channel_id = String(cfg.afs_channel_id).trim();
        }
      })
      .catch(function () {})
      .then(function () {
        done();
      });
  }

  var q = new URLSearchParams();
  q.set('url', pageUrl());
  q.set('session_id', sessionId());
  if (p.channel_id) q.set('channel_id', p.channel_id);
  if (p.pubid) q.set('pubid', p.pubid);

  var questionsUrl = apiBase + '/api/v1/spark/questions?' + q.toString();

  function fetchQuestionsOnce() {
    return fetch(questionsUrl, { credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /** Up to 3 attempts with backoff — reduces blank widget on transient API/network errors. */
  function fetchQuestionsWithRetry() {
    function delay(ms) {
      return new Promise(function (resolve) {
        setTimeout(resolve, ms);
      });
    }
    function parseQuestions(data) {
      var questions = (data && data.questions) || [];
      if (!questions.length) throw new Error('no questions');
      return questions;
    }
    return fetchQuestionsOnce()
      .then(parseQuestions)
      .catch(function () {
        return delay(500).then(fetchQuestionsOnce).then(parseQuestions);
      })
      .catch(function () {
        return delay(900).then(fetchQuestionsOnce).then(parseQuestions);
      });
  }

  /** Same title row as the carousel success state — keeps the block visible while loading or on error. */
  function sparkHeadHtml() {
    return (
      '<div class="zipline-spark__head">' +
      '<span class="zipline-spark__head-star" aria-hidden="true">✦</span>' +
      '<span class="zipline-spark__head-title">' +
      escapeHtml(p.title) +
      '</span></div>'
    );
  }

  /**
   * FIX: Re-query the live DOM for root instead of using the closed-over
   * reference, which may be a detached node after Next.js hydration replaces
   * the DOM. Also re-applies theme class and CSS var in case they were wiped.
   */
  function renderQuestionCarousel(questions) {
    var liveRoot = getLiveRoot(themeClass, dw);

    // Warn in dev if the original root ref is now detached — helps confirm the bug.
    if (typeof root !== 'undefined' && root !== liveRoot && !root.isConnected) {
      console.warn('[Zipline Spark] Original root was detached (hydration race). Re-attached to live element.');
    }

    liveRoot.innerHTML = '';
    liveRoot.style.display = '';

    var head = document.createElement('div');
    head.className = 'zipline-spark__head';
    head.innerHTML =
      '<span class="zipline-spark__head-star" aria-hidden="true">✦</span>' +
      '<span class="zipline-spark__head-title">' +
      escapeHtml(p.title) +
      '</span>';

    var carousel = document.createElement('div');
    carousel.className = 'zipline-spark__carousel';
    carousel.innerHTML =
      '<button type="button" class="zipline-spark__nav zipline-spark__nav--prev" aria-label="Previous">‹</button>' +
      '<div class="zipline-spark__track-wrap"><div class="zipline-spark__track"></div></div>' +
      '<button type="button" class="zipline-spark__nav zipline-spark__nav--next" aria-label="Next">›</button>';

    var track = carousel.querySelector('.zipline-spark__track');
    questions.forEach(function (text) {
      if (!text || String(text).length > 500) return;
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'zipline-spark__card';
      card.innerHTML = '<span class="zipline-spark__card-text">' + escapeHtml(String(text)) + '</span>';
      card.addEventListener('click', function () {
        var sidebarOpen = sidebarEl && !sidebarEl.hidden;
        openSidebar(String(text), sidebarOpen);
      });
      track.appendChild(card);
    });

    var wrap = carousel.querySelector('.zipline-spark__track-wrap');
    var trackGap = 16; /* matches .zipline-spark__track { gap } in spark.css */
    carousel.querySelector('.zipline-spark__nav--prev').addEventListener('click', function () {
      var card = track.querySelector('.zipline-spark__card');
      var w = card ? card.offsetWidth + trackGap : 200;
      wrap.scrollBy({ left: -w, behavior: 'smooth' });
    });
    carousel.querySelector('.zipline-spark__nav--next').addEventListener('click', function () {
      var card = track.querySelector('.zipline-spark__card');
      var w = card ? card.offsetWidth + trackGap : 200;
      wrap.scrollBy({ left: w, behavior: 'smooth' });
    });

    liveRoot.appendChild(head);
    liveRoot.appendChild(carousel);
  }

  /**
   * FIX: Same live root re-query on the error/hide path.
   */
  function loadSparkQuestions() {
    fetchQuestionsWithRetry()
      .then(function (questions) {
        renderQuestionCarousel(questions);
      })
      .catch(function (err) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[Zipline Spark] questions failed after retries:', err && err.message ? err.message : err);
        }
        var liveRoot = getLiveRoot(themeClass, dw);
        liveRoot.innerHTML = '';
        liveRoot.style.display = 'none';
      });
  }

  withServerAfsDefaults(function () {
    loadSparkQuestions();
  });
    });
  });
})();
