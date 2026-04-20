(function () {
  'use strict';

  function hostIsLoopback(hostname) {
    if (!hostname) return false;
    var h = String(hostname).toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  }
  function originStrIsLoopback(originStr) {
    if (!originStr) return false;
    try { return hostIsLoopback(new URL(originStr).hostname); } catch (e) { return false; }
  }
  function resolveSparkScriptElement() {
    var cur = document.currentScript;
    if (cur && cur.src && (cur.src.indexOf('spark.js') !== -1 || cur.src.indexOf('scout.js') !== -1)) return cur;
    var scripts = document.getElementsByTagName('script');
    var list = [];
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i];
      if (!s.src) continue;
      if (s.src.indexOf('spark.js') === -1 && s.src.indexOf('scout.js') === -1) continue;
      list.push(s);
    }
    if (list.length === 0) return null;
    var pageOrigin = '';
    try { pageOrigin = window.location.origin; } catch (e0) {}
    var j;
    for (j = 0; j < list.length; j++) {
      try { if (new URL(list[j].src).origin === pageOrigin) return list[j]; } catch (e1) {}
    }
    var pageHost = '';
    try { pageHost = window.location.hostname || ''; } catch (e2) {}
    if (!hostIsLoopback(pageHost)) {
      for (j = list.length - 1; j >= 0; j--) {
        try { if (!hostIsLoopback(new URL(list[j].src).hostname)) return list[j]; } catch (e3) {}
      }
    }
    return list[list.length - 1];
  }
  function scriptParams() {
    var script = resolveSparkScriptElement();
    var out = {
      api_base:'',title:'More from Zipline Spark',theme:'dark',drawer_width:'420',
      scriptEl:script||null,adsense_client:'',adsense_slot:'',
      afs_pub_id:'',afs_style_id:'',afs_channel_id:'',channel_id:'',pubid:'',
      subid1:'',subid2:'',subid3:'',subid4:'',subid5:''
    };
    if (script && script.src) {
      var qStart = script.src.indexOf('?');
      if (qStart !== -1) {
        script.src.slice(qStart+1).split('&').forEach(function(pair){
          var eq=pair.indexOf('='); if(eq===-1)return;
          var k=decodeURIComponent(pair.slice(0,eq).replace(/\+/g,' ')).toLowerCase();
          var v=decodeURIComponent((pair.slice(eq+1)||'').replace(/\+/g,' '));
          if(k==='api_base'||k==='apibase')out.api_base=v;
          if(k==='title')out.title=v; if(k==='theme')out.theme=v;
          if(k==='drawer_width'||k==='drawerwidth')out.drawer_width=v;
          if(k==='channel_id'||k==='channel')out.channel_id=v; if(k==='pubid')out.pubid=v;
          if(k==='afs_pub_id'||k==='afspubid')out.afs_pub_id=v;
          if(k==='afs_style_id'||k==='afsstyleid')out.afs_style_id=v;
          if(k==='afs_channel_id'||k==='afschannelid'||k==='afs_channel')out.afs_channel_id=v;
          if(k==='subid1')out.subid1=v; if(k==='subid2')out.subid2=v;
          if(k==='subid3')out.subid3=v; if(k==='subid4')out.subid4=v; if(k==='subid5')out.subid5=v;
        });
      }
      if(script.getAttribute('data-api-base'))out.api_base=script.getAttribute('data-api-base');
      if(script.getAttribute('data-title'))out.title=script.getAttribute('data-title');
      if(script.getAttribute('data-theme'))out.theme=script.getAttribute('data-theme');
      if(script.getAttribute('data-drawer-width'))out.drawer_width=script.getAttribute('data-drawer-width');
      var ac=script.getAttribute('data-adsense-client'); if(ac)out.adsense_client=ac.trim();
      var asl=script.getAttribute('data-ad-slot'); if(asl)out.adsense_slot=asl.trim();
      var dch=script.getAttribute('data-channel-id'); if(dch)out.channel_id=dch.trim();
      var dpub=script.getAttribute('data-pubid'); if(dpub)out.pubid=dpub.trim();
      var apub=script.getAttribute('data-afs-pub-id'); if(apub)out.afs_pub_id=apub.trim();
      var ast=script.getAttribute('data-afs-style-id'); if(ast)out.afs_style_id=ast.trim();
      var ach=script.getAttribute('data-afs-channel-id'); if(ach)out.afs_channel_id=ach.trim();
      for(var si=1;si<=5;si+=1){
        var subid=script.getAttribute('data-subid'+si)||script.getAttribute('subid'+si);
        if(subid)out['subid'+si]=subid.trim();
      }
    }
    return out;
  }
  function originFromScript(script){
    if(!script||!script.src)return'';
    try{return new URL(script.src).origin;}catch(e){return'';}
  }
  function pageUrl(){return window.location.href.split('#')[0];}
  function sessionId(){
    try{
      var k='zipline_spark_sid'; var v=localStorage.getItem(k); if(v)return v;
      var legacy=localStorage.getItem('zipline_scout_sid');
      if(legacy){localStorage.setItem(k,legacy);try{localStorage.removeItem('zipline_scout_sid');}catch(e2){}return legacy;}
      v='s_'+Math.random().toString(36).slice(2)+Date.now().toString(36);
      localStorage.setItem(k,v); return v;
    }catch(e){return'anon_'+Date.now();}
  }
  function escapeHtml(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
  function boltSvgMarkup(cls){
    var ca=cls?' class="'+escapeHtml(String(cls))+'"':'';
    return'<svg'+ca+' viewBox="0 0 483.73 483.73" aria-hidden="true"><polygon fill="currentColor" points="119.637,282.441 192.449,282.441 165.869,483.73 364.094,189.622 296.631,189.622 325.678,0"></polygon></svg>';
  }
  function basicMd(s){
    var t=escapeHtml(s);
    t=t.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    t=t.replace(/\*([^*]+)\*/g,'<em>$1</em>');
    t=t.replace(/^### (.+)$/gm,'<h4>$1</h4>'); t=t.replace(/^## (.+)$/gm,'<h3>$1</h3>'); t=t.replace(/^# (.+)$/gm,'<h3>$1</h3>');
    t=t.replace(/^[\-\*] (.+)$/gm,'<li>$1</li>');
    t=t.replace(/(<li>.*<\/li>\n?)+/g,function(m){return'<ul>'+m.replace(/\n/g,'')+'</ul>';});
    t=t.replace(/\n\n+/g,'</p><p>'); t=t.replace(/\n/g,'<br/>');
    return'<p>'+t+'</p>';
  }
  function mountEl(){
    var el=document.getElementById('zipline-spark-root')||document.getElementById('zipline-scout-root');
    if(el)return el;
    el=document.createElement('div'); el.id='zipline-spark-root';
    (document.body||document.documentElement).appendChild(el); return el;
  }
  function getLiveRoot(themeClass,dw){
    var el=document.getElementById('zipline-spark-root')||document.getElementById('zipline-scout-root');
    if(!el)el=mountEl();
    if(themeClass&&el.className.indexOf('zipline-spark')===-1)el.className='zipline-spark '+themeClass;
    if(dw)el.style.setProperty('--zipline-spark-sidebar-width',dw+'px');
    return el;
  }
  function onDomReady(fn){
    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',fn);}else{fn();}
  }
  function waitForMountRoot(done){
    var fired=false;
    function finish(el){if(fired)return;fired=true;done(el);}
    function resolve(){
      var el=document.getElementById('zipline-spark-root')||document.getElementById('zipline-scout-root');
      if(el){finish(el);return true;} return false;
    }
    if(resolve())return;
    var mo=new MutationObserver(function(){if(resolve())mo.disconnect();});
    mo.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('load',function(){mo.disconnect();if(!fired)finish(mountEl());},{once:true});
  }

  var p=scriptParams();
  try{
    var pageQs=new URLSearchParams(window.location.search);
    var urlCh=pageQs.get('channel_id')||pageQs.get('channel');
    if(urlCh&&!p.channel_id)p.channel_id=String(urlCh).trim();
    var urlPub=pageQs.get('pubid');
    if(urlPub&&!p.pubid)p.pubid=String(urlPub).trim();
  }catch(e){}
  var scriptEl=p.scriptEl||resolveSparkScriptElement();
  var fromAttr=(p.api_base||'').replace(/\/$/,'').trim();
  var fromScriptOrigin=(originFromScript(scriptEl)||'').replace(/\/$/,'').trim();
  var apiBase=fromAttr||fromScriptOrigin;
  var pageHost='';try{pageHost=window.location.hostname||'';}catch(ePage){}
  if(fromAttr&&originStrIsLoopback(fromAttr)&&fromScriptOrigin&&!originStrIsLoopback(fromScriptOrigin)&&!hostIsLoopback(pageHost))apiBase=fromScriptOrigin;
  apiBase=apiBase.replace(/\/$/,'');
  if(!apiBase){console.warn('[Zipline Spark] Set data-api-base.');return;}

  function forceVariantFromPage(){
    try{var qs=new URLSearchParams(window.location.search);var v=qs.get('variant')||qs.get('v');return v?String(v).trim():'';}catch(e){return'';}
  }
  function applySparkThemeFromId(themeId,done){
    var tid=parseInt(String(themeId),10);
    if(!tid||tid<=0||!apiBase){done();return;}
    function scopeCss(css){
      var sA='#zipline-spark-root',sB='#zipline-spark-sidebar-host';
      function already(ps){return/^#zipline-spark-root\b/.test(ps)||/^#zipline-spark-sidebar-host\b/.test(ps);}
      return String(css).replace(/(^|})\s*([^@}{][^{]*)\{/g,function(m,brace,sel){
        var s=String(sel||'').trim(); if(!s)return m;
        var parts=s.split(','),out=[];
        for(var i=0;i<parts.length;i++){var ps=parts[i].trim();if(!ps)continue;if(already(ps))out.push(ps);else{out.push(sA+' '+ps);out.push(sB+' '+ps);}}
        return(brace||'')+'\n'+out.join(',\n')+' {\n';
      });
    }
    fetch(apiBase+'/api/v1/prompts/themes/'+encodeURIComponent(String(tid)),{credentials:'omit'})
      .then(function(r){if(!r.ok){if(console&&console.warn)console.warn('[Zipline Spark] Theme fetch failed (id='+tid+', HTTP '+r.status+').');return null;}return r.json();})
      .then(function(resp){
        var css=resp&&(resp.data&&resp.data.css_content?resp.data.css_content:resp.css_content);
        if(css&&typeof css==='string'&&css.trim()){
          var el=document.getElementById('zipline-spark-ab-theme'); if(el)el.remove();
          var style=document.createElement('style'); style.id='zipline-spark-ab-theme';
          style.textContent=scopeCss(css); document.head.appendChild(style);
        }
        done();
      }).catch(function(){done();});
  }
  function fetchSparkAssign(done){
    var fv=forceVariantFromPage();
    var body={session_id:sessionId()};
    if(p.pubid)body.pubid=p.pubid; if(fv)body.force_variant=fv;
    fetch(apiBase+'/api/v1/ab-tests/spark/assign',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body),credentials:'omit'})
      .then(function(r){return r.ok?r.json():null;})
      .then(function(data){
        if(!data||data.configuration==null){done();return;}
        var cfg=data.configuration;
        if(typeof cfg==='string'){try{cfg=JSON.parse(cfg);if(typeof cfg==='string'){try{cfg=JSON.parse(cfg);}catch(e2){cfg=null;}}}catch(e){cfg=null;}}
        if(cfg&&typeof cfg==='object'&&!Array.isArray(cfg)){
          if(cfg.psid)p.afs_style_id=String(cfg.psid).trim();
          var rawTheme=cfg.theme!=null&&cfg.theme!==''?cfg.theme:cfg.theme_id;
          if(rawTheme!=null&&rawTheme!==''){var th=parseInt(String(rawTheme),10);if(th>0)window.__ziplineSparkAbThemeId=th;}
        }
        done();
      }).catch(function(){done();});
  }
  function syncCarouselState(carousel,wrap,track){
    if(!carousel||!wrap||!track)return;
    var cards=track.querySelectorAll('.zipline-spark__card').length;
    carousel.style.setProperty('--zs-card-count',String(cards||1));
    var prev=carousel.querySelector('.zipline-spark__nav--prev');
    var next=carousel.querySelector('.zipline-spark__nav--next');
    var hasOverflow=wrap.scrollWidth>wrap.clientWidth+6;
    carousel.classList.toggle('zipline-spark__carousel--static',!hasOverflow&&cards>0);
    if(!hasOverflow)wrap.scrollLeft=0;
    if(prev)prev.disabled=!hasOverflow||wrap.scrollLeft<=2;
    if(next)next.disabled=!hasOverflow||wrap.scrollLeft+wrap.clientWidth>=wrap.scrollWidth-2;
  }

  /* ── DD helpers ─────────────────────────────────────────── */

  function ddStreamSummary(textEl){
    var accumulated='';
    var ctrl=typeof AbortController!=='undefined'?new AbortController():null;
    fetch(apiBase+'/api/v1/spark/answer',{
      method:'POST',headers:{'Content-Type':'application/json',Accept:'text/event-stream'},credentials:'omit',
      body:JSON.stringify({url:pageUrl(),question:'In 2-3 sentences, summarise the main point or story on this page for a reader who has not read it yet. Be concise and factual.',session_id:sessionId(),conversation_history:[],messages:[]}),
      signal:ctrl?ctrl.signal:undefined
    }).then(function(res){
      if(!res.ok)throw new Error('HTTP '+res.status);
      textEl.classList.remove('zs-dd-summary-text--loading');
      var reader=res.body.getReader(),dec=new TextDecoder(),buf='',finished=false;
      function pump(){
        return reader.read().then(function(chunk){
          if(chunk.done||finished)return;
          buf+=dec.decode(chunk.value,{stream:true});
          var sep;
          while((sep=buf.indexOf('\n\n'))>=0){
            var block=buf.slice(0,sep); buf=buf.slice(sep+2);
            var ev='',data='';
            block.split('\n').forEach(function(line){
              if(line.indexOf('event:')===0)ev=line.slice(6).trim();
              if(line.indexOf('data:')===0)data=line.slice(5).trim();
            });
            if(ev==='chunk'&&data){
              try{var parsed=JSON.parse(data);if(parsed.t){accumulated+=parsed.t;textEl.textContent=accumulated.replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\*([^*]+)\*/g,'$1').replace(/^#+\s*/gm,'').trim();}}catch(e){}
            }
            if(ev==='done'||ev==='error'){finished=true;return;}
          }
          if(!finished)return pump();
        });
      }
      return pump();
    }).catch(function(){
      textEl.classList.remove('zs-dd-summary-text--loading');
      if(!accumulated)textEl.textContent='AI-powered answers to your questions about this page.';
    });
  }

  function applyDDLayout(liveRoot,questions,openSidebarFn){
    /* 1. Title + badge */
    var titleEl=liveRoot.querySelector('.zipline-spark__head-title');
    if(titleEl){
      titleEl.textContent='AI Overview';
      var badge=document.createElement('span');
      badge.className='zs-dd-info-icon'; badge.textContent='i';
      badge.title='AI-generated summary and questions based on this page';
      titleEl.appendChild(badge);
    }

    /* 2. Summary row */
    var carousel=liveRoot.querySelector('.zipline-spark__carousel');
    var summaryRow=document.createElement('div');
    summaryRow.className='zs-dd-summary-row';
    var summaryText=document.createElement('span');
    summaryText.className='zs-dd-summary-text zs-dd-summary-text--loading';
    summaryText.textContent='Loading summary\u2026';
    var fullLink=document.createElement('a');
    fullLink.className='zs-dd-full-link'; fullLink.href='#'; fullLink.textContent='Full Summary \u2192';
    var ddExpanded=false;
    fullLink.addEventListener('click',function(e){
      e.preventDefault(); ddExpanded=!ddExpanded;
      summaryText.classList.toggle('zs-dd-summary-text--expanded',ddExpanded);
      fullLink.textContent=ddExpanded?'Less \u2191':'Full Summary \u2192';
    });
    summaryRow.appendChild(summaryText); summaryRow.appendChild(fullLink);
    if(carousel)carousel.parentNode.insertBefore(summaryRow,carousel);

    /* 3. Ticker input */
    var qList=questions.filter(Boolean).map(String);
    var inputWrap=document.createElement('div');
    inputWrap.className='zs-dd-input-wrap';

    /* Ticker pill */
    var tickerOuter=document.createElement('div');
    tickerOuter.className='zs-dd-ticker-outer';
    tickerOuter.setAttribute('role','button');
    tickerOuter.setAttribute('aria-label','Ask a question');
    tickerOuter.setAttribute('tabindex','0');

    var slotA=document.createElement('span'); slotA.className='zs-dd-ticker-slot';
    var slotB=document.createElement('span'); slotB.className='zs-dd-ticker-slot zs-dd-ticker-slot--standby';
    slotA.textContent=qList[0]||'';
    tickerOuter.appendChild(slotA); tickerOuter.appendChild(slotB);

    /* Real input — hidden until ticker is clicked */
    var realInput=document.createElement('input');
    realInput.type='text'; realInput.className='zs-dd-input';
    realInput.setAttribute('aria-label','Ask a question about this page');
    realInput.setAttribute('placeholder','Ask a question\u2026');

    var submitBtn=document.createElement('button');
    submitBtn.type='button'; submitBtn.className='zs-dd-submit';
    submitBtn.setAttribute('aria-label','Ask'); submitBtn.textContent='\u2192';

    inputWrap.appendChild(tickerOuter);
    inputWrap.appendChild(realInput);
    inputWrap.appendChild(submitBtn);
    if(carousel)carousel.parentNode.insertBefore(inputWrap,carousel.nextSibling);

    /* Ticker cycle logic */
    var tickerIdx=0;
    var activeSlot=slotA, inactiveSlot=slotB;
    var tickerTimer=null;

    function tickerAdvance(){
      if(qList.length<2)return;
      tickerIdx=(tickerIdx+1)%qList.length;

      /* Position incoming slot above (instant, no transition) */
      inactiveSlot.textContent=qList[tickerIdx];
      inactiveSlot.classList.add('zs-dd-ticker-slot--standby');
      inactiveSlot.classList.remove('zs-dd-ticker-slot--exit');

      /* Force reflow so instant position registers before we start transitions */
      inactiveSlot.getBoundingClientRect();

      /* Animate: active exits down, inactive enters from top */
      requestAnimationFrame(function(){
        activeSlot.classList.add('zs-dd-ticker-slot--exit');
        inactiveSlot.classList.remove('zs-dd-ticker-slot--standby');
        /* Swap roles */
        var tmp=activeSlot; activeSlot=inactiveSlot; inactiveSlot=tmp;
      });
    }

    function startTicker(){
      if(tickerTimer||qList.length<2)return;
      tickerTimer=setInterval(tickerAdvance,3000);
    }
    function stopTicker(){
      if(tickerTimer){clearInterval(tickerTimer);tickerTimer=null;}
    }

    /* Clicking the ticker reveals the real input */
    function activateTicker(){
      stopTicker();
      tickerOuter.style.display='none';
      realInput.style.display='block';
      realInput.value=qList[tickerIdx]||'';
      setTimeout(function(){realInput.focus();},0);
    }
    tickerOuter.addEventListener('click',activateTicker);
    tickerOuter.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' ')activateTicker();});

    /* Submit */
    function fire(q){
      q=(q||'').trim(); if(!q)return;
      var cards=carousel?Array.prototype.slice.call(carousel.querySelectorAll('.zipline-spark__card')):[];
      var matched=false;
      cards.forEach(function(c){
        if(matched)return;
        var ct=c.querySelector('.zipline-spark__card-text');
        if(ct&&ct.textContent.trim().toLowerCase()===q.toLowerCase()){matched=true;c.click();}
      });
      if(!matched)openSidebarFn(q,false);
    }
    submitBtn.addEventListener('click',function(){
      var q=realInput.style.display!=='none'?realInput.value:qList[tickerIdx]||'';
      fire(q);
    });
    realInput.addEventListener('keydown',function(e){if(e.key==='Enter')fire(realInput.value);});

    /* Start ticker after a short pause */
    setTimeout(startTicker,1800);

    /* 4. Stream summary */
    ddStreamSummary(summaryText);
  }

  /* ── Main ───────────────────────────────────────────────── */

  onDomReady(function(){
    waitForMountRoot(function(root){
  var themeClass=(p.theme||'dark').toLowerCase()==='light'?'zipline-spark--light':'zipline-spark--dark';
  var dw=parseInt(p.drawer_width,10)||420;
  var liveRootInit=getLiveRoot(themeClass,dw);
  liveRootInit.innerHTML=sparkHeadHtml()+'<div class="zipline-spark__loading">Loading suggestions\u2026</div>';

  var sidebarEl=null,chatScroll=null,paneAnswer=null,paneSources=null,tabSourcesBtn=null;
  var streamAbort=null,streamTarget=null,conversationHistory=[];
  var sidebarWasClosed=true,sparkMonetizationBootstrapped=false;
  var sparkTurnAfsCounter=0,sparkScrollLockTop=0,sparkScrollLocked=false;
  var sparkPageLoadTs=Date.now();
  var trackingUrl=(typeof window!=='undefined'&&window.SPARK_TRACKING_URL)||'https://e.nativemetrics-svc.com/event';
  var sparkVariation='Zipline Spark';
  var resolvedClientIP='',resolvedClientIPReady=null,resolvedClientIPLoaded=false;

  function fetchPublicClientIPFallback(){
    return fetch('https://api.ipify.org?format=json',{method:'GET',credentials:'omit',headers:{'Accept':'application/json'}})
      .then(function(r){if(!r.ok)return null;return r.json();})
      .then(function(d){if(d&&typeof d.ip==='string'&&d.ip.trim())resolvedClientIP=d.ip.trim();})
      .catch(function(){});
  }
  function fetchResolvedClientIP(){
    if(resolvedClientIPReady)return resolvedClientIPReady;
    resolvedClientIPReady=fetch(apiBase.replace(/\/$/,'')+'/api/v1/spark/client-ip',{method:'GET',credentials:'omit',headers:{'Accept':'application/json'}})
      .then(function(r){if(!r.ok)return null;return r.json();})
      .then(function(d){if(d&&typeof d.ip==='string'&&d.ip.trim())resolvedClientIP=d.ip.trim();})
      .catch(function(){})
      .then(function(){if(!resolvedClientIP)return fetchPublicClientIPFallback();return null;})
      .finally(function(){resolvedClientIPLoaded=true;});
    return resolvedClientIPReady;
  }
  function getSparkUserId(){
    var domain='';try{domain=new URL(pageUrl()).hostname;}catch(e){domain=window.location.hostname||'default';}
    var key='zipline_spark_uid_'+domain;
    try{var ex=localStorage.getItem(key);if(ex)return ex;var id='spark_u_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,11);localStorage.setItem(key,id);return id;}
    catch(e){return'spark_anon_'+Date.now();}
  }
  function resolveChannelIdForSpark(){
    var raw=(p.channel_id||'').trim();
    if(!raw){try{var sp=new URLSearchParams(window.location.search);raw=(sp.get('channel_id')||sp.get('channelid')||'').trim();}catch(e){raw='';}}
    var s=String(raw);
    while(s.length>=2&&s[0]==='"'&&s[s.length-1]==='"')s=s.slice(1,-1).trim();
    return s;
  }
  function getTrackingPayload(extra){
    var urlParams={};try{new URLSearchParams(window.location.search).forEach(function(v,k){urlParams[k]=v;});}catch(e){}
    var domain='';try{domain=new URL(pageUrl()).hostname;}catch(e2){domain=window.location.hostname||'';}
    var base={timestamp:new Date().toISOString(),url:pageUrl(),domain:domain,referrer:document.referrer||'',url_parameters:urlParams,user_agent:navigator.userAgent,language:navigator.language,variation:sparkVariation,session_id:sessionId(),user_id:getSparkUserId(),channel_id:resolveChannelIdForSpark(),pubid:(p.pubid||'').trim(),api_base:apiBase};
    for(var si=1;si<=5;si+=1){var subid=(p['subid'+si]||'').trim();if(subid)base['subid'+si]=subid;}
    if(resolvedClientIP){base.user_ip=resolvedClientIP;base.ip=resolvedClientIP;}
    if(extra&&typeof extra==='object'){for(var k in extra){if(Object.prototype.hasOwnProperty.call(extra,k))base[k]=extra[k];}}
    return base;
  }
  function sendSparkEvent(eventType,data,useBeacon){
    if(!resolvedClientIPLoaded&&!useBeacon){fetchResolvedClientIP().finally(function(){sendSparkEvent(eventType,data,useBeacon);});return;}
    var payload=getTrackingPayload(data||{});
    var qs='';try{qs=new URLSearchParams(window.location.search).toString();}catch(e){}
    var url=trackingUrl+'/'+eventType+(qs?'?'+qs:'');
    var navEvents=['spark_bot_page_duration','spark_bot_ad_click','spark_bot_sponsored_link_click'];
    var useKeepalive=!!useBeacon||navEvents.indexOf(eventType)!==-1;
    fetch(url,{method:'POST',mode:'no-cors',keepalive:useKeepalive,credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(function(){});
  }
  var sparkAdMessageListenerAdded=false;
  function ensureSparkAdMessageListener(){
    if(sparkAdMessageListenerAdded)return; sparkAdMessageListenerAdded=true;
    window.addEventListener('message',function(e){
      var ok=['https://www.google.com','https://www.adsensecustomsearchads.com','https://syndicatedsearch.goog'];
      if(ok.indexOf(e.origin)===-1)return;
      var s=e.data; if(!s||typeof s!=='string'||s.indexOf('FSXDC,.aCS')!==0)return;
      sendSparkEvent('spark_bot_ad_click',{origin:e.origin,message:s,source:'afs_iframe'},true);
      sendSparkEvent('spark_bot_sponsored_link_click',{origin:e.origin,message:s,source:'afs_iframe'},true);
    });
  }
  sendSparkEvent('spark_bot_page_view',{referrer:document.referrer,screen_resolution:window.screen.width+'x'+window.screen.height,viewport_size:window.innerWidth+'x'+window.innerHeight});
  var sparkPageDurationReported=false;
  function reportSparkPageDuration(){
    if(sparkPageDurationReported)return; sparkPageDurationReported=true;
    var sec=Math.round((Date.now()-sparkPageLoadTs)/1000);
    sendSparkEvent('spark_bot_page_duration',{duration_seconds:sec<0?0:sec},true);
  }
  window.addEventListener('pagehide',reportSparkPageDuration);
  window.addEventListener('beforeunload',reportSparkPageDuration);
  function scrollChatElementToTop(el){
    if(!chatScroll||!el)return;
    requestAnimationFrame(function(){var cr=chatScroll.getBoundingClientRect();var er=el.getBoundingClientRect();chatScroll.scrollTop+=er.top-cr.top;});
  }
  function ensureSidebar(){
    if(sidebarEl)return;
    document.body.style.setProperty('--zipline-spark-sidebar-width',dw+'px');
    var host=document.createElement('div'); host.id='zipline-spark-sidebar-host';
    host.className='zipline-spark zipline-spark--sidebar-host '+themeClass;
    host.innerHTML=
      '<aside class="zipline-spark__sidebar" id="zipline-spark-sidebar" role="complementary" aria-label="'+escapeHtml(p.title)+'" hidden>'+
      '<div class="zipline-spark__sidebar-top">'+
      '<div class="zipline-spark__sidebar-brand"><span class="zipline-spark__sidebar-star" aria-hidden="true">'+boltSvgMarkup('zipline-spark__bolt-icon')+'</span><span>'+escapeHtml(p.title)+'</span></div>'+
      '<button type="button" class="zipline-spark__sidebar-close" data-spark-close aria-label="Close">\xd7</button></div>'+
      '<div class="zipline-spark__tabs">'+
      '<button type="button" class="zipline-spark__tab zipline-spark__tab--active" data-tab="answer">Answer</button>'+
      '<button type="button" class="zipline-spark__tab" data-tab="sources" id="zipline-spark-tab-sources">Sources (1)</button></div>'+
      '<div class="zipline-spark__sidebar-body">'+
      '<div class="zipline-spark__pane zipline-spark__pane--answer" id="zipline-spark-pane-answer"><div class="zipline-spark__chat" id="zipline-spark-chat"></div></div>'+
      '<div class="zipline-spark__pane zipline-spark__pane--sources" id="zipline-spark-pane-sources" hidden>'+
      '<p class="zipline-spark__sources-intro">Responses use this page as context:</p>'+
      '<a class="zipline-spark__sources-link" id="zipline-spark-source-url" href="#" target="_blank" rel="noopener"></a></div></div></aside>';
    document.body.appendChild(host);
    sidebarEl=document.getElementById('zipline-spark-sidebar');
    chatScroll=document.getElementById('zipline-spark-chat');
    paneAnswer=document.getElementById('zipline-spark-pane-answer');
    paneSources=document.getElementById('zipline-spark-pane-sources');
    tabSourcesBtn=document.getElementById('zipline-spark-tab-sources');
    var sourceUrl=document.getElementById('zipline-spark-source-url');
    sourceUrl.textContent=pageUrl(); sourceUrl.href=pageUrl();
    sidebarEl.querySelectorAll('.zipline-spark__tab').forEach(function(btn){
      btn.addEventListener('click',function(){
        var tab=btn.getAttribute('data-tab');
        sidebarEl.querySelectorAll('.zipline-spark__tab').forEach(function(b){b.classList.toggle('zipline-spark__tab--active',b.getAttribute('data-tab')===tab);});
        paneAnswer.hidden=tab!=='answer'; paneSources.hidden=tab!=='sources';
      });
    });
    sidebarEl.addEventListener('click',function(ev){if(ev.target.hasAttribute('data-spark-close'))closeSidebar();});
    sidebarEl.addEventListener('wheel',stopBackgroundScroll,{passive:false});
    sidebarEl.addEventListener('touchmove',stopBackgroundScroll,{passive:false});
  }
  function isSparkScrollableNode(node){
    while(node&&node!==document.body){
      if(node===chatScroll||node===paneAnswer||node===paneSources||(node.classList&&(node.classList.contains('zipline-spark__chat')||node.classList.contains('zipline-spark__pane')||node.classList.contains('zipline-spark__pane--answer')||node.classList.contains('zipline-spark__pane--sources'))))return true;
      if(node===sidebarEl)return false;
      node=node.parentNode;
    }
    return false;
  }
  function stopBackgroundScroll(ev){if(!sidebarEl||sidebarEl.hidden)return;if(!isSparkScrollableNode(ev.target)){ev.preventDefault();ev.stopPropagation();}}
  function lockPageScrollForSpark(){
    if(sparkScrollLocked)return; sparkScrollLocked=true;
    sparkScrollLockTop=window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0;
    document.body.classList.add('zipline-spark-scroll-locked');
    document.documentElement.style.overflow='hidden';
    document.body.style.position='fixed'; document.body.style.top='-'+sparkScrollLockTop+'px';
    document.body.style.left='0'; document.body.style.right='0'; document.body.style.width='100%';
  }
  function unlockPageScrollForSpark(){
    if(!sparkScrollLocked)return; sparkScrollLocked=false;
    document.body.classList.remove('zipline-spark-scroll-locked');
    document.documentElement.style.overflow='';
    document.body.style.position=''; document.body.style.top='';
    document.body.style.left=''; document.body.style.right=''; document.body.style.width='';
    window.scrollTo(0,sparkScrollLockTop||0);
  }
  function sparkUsesAfs(){return!!(p.afs_pub_id&&p.afs_pub_id.trim()&&p.afs_style_id&&p.afs_style_id.trim());}
  function injectAfsHeadOnce(){
    if(document.querySelector('script[data-zipline-spark-afs]'))return;
    var s1=document.createElement('script'); s1.async=true; s1.src='https://www.google.com/adsense/search/ads.js'; s1.setAttribute('data-zipline-spark-afs','1'); document.head.appendChild(s1);
    var s2=document.createElement('script'); s2.type='text/javascript'; s2.charset='utf-8'; s2.setAttribute('data-zipline-spark-afs','bootstrap');
    s2.textContent="(function(g,o){g[o]=g[o]||function(){(g[o]['q']=g[o]['q']||[]).push(arguments)},g[o]['t']=1*new Date})(window,'_googCsa');"; document.head.appendChild(s2);
  }
  function initSparkMonetization(){if(sparkUsesAfs())injectAfsHeadOnce();}
  function maybeRenderAfsForTurn(question,turnEl){
    if(!sparkUsesAfs())return;
    var wrap=turnEl.querySelector('.zipline-spark__turn-ad-wrap');
    var afsEl=wrap&&wrap.querySelector('.zipline-spark__afs-container');
    var displayInner=wrap&&wrap.querySelector('.zipline-spark__ad-display');
    if(!wrap||!afsEl||!afsEl.id)return;
    if(afsEl.getAttribute('data-zipline-afs-done'))return;
    afsEl.setAttribute('data-zipline-afs-done','1'); injectAfsHeadOnce();
    if(displayInner)displayInner.innerHTML=''; afsEl.innerHTML='';
    var qtext=(question||'').trim()||(document.title||'').trim()||' ';
    if(qtext.length>200)qtext=qtext.slice(0,200);
    var sidebarW=parseInt(String(dw),10)||420; var w=Math.min(700,Math.max(250,sidebarW-32));
    try{
      var pageOptions={pubId:p.afs_pub_id.trim(),query:qtext,styleId:p.afs_style_id.trim()};
      var afsCh=(p.afs_channel_id||'').trim(); if(afsCh)pageOptions.channel=afsCh;
      window._googCsa('ads',pageOptions,{container:afsEl.id,width:w});
    }catch(e){}
  }
  function getSparkAfsNoFillDiagnostics(question,containerId){
    var container=containerId?document.getElementById(containerId):null;
    var iframe=container?container.querySelector('iframe'):null;
    var iframeStyle=iframe?window.getComputedStyle(iframe):null;
    var iframeURL=null,iframeNum='',iframeScStatus='';
    if(iframe&&iframe.src){try{iframeURL=new URL(iframe.src);iframeNum=iframeURL.searchParams.get('num')||'';iframeScStatus=iframeURL.searchParams.get('sc_status')||'';}catch(e){}}
    if((!iframeNum||!iframeScStatus)&&iframe&&iframe.name){
      try{var raw=iframe.name.indexOf('|')!==-1?iframe.name.split('|').pop():iframe.name;var parsed=JSON.parse(raw);var master=parsed&&(parsed['master-1']||parsed.master);if(master){if(!iframeNum&&master.num!=null)iframeNum=String(master.num);if(!iframeScStatus&&master.sc_status!=null)iframeScStatus=String(master.sc_status);}}catch(e2){}
    }
    var rect=iframe?iframe.getBoundingClientRect():null;
    var containerRect=container?container.getBoundingClientRect():null;
    var iH=rect?Math.round(rect.height):null,iV=iframeStyle?iframeStyle.visibility:'',iD=iframeStyle?iframeStyle.display:'';
    var noFill=!!iframe&&(iH===0||iframe.offsetHeight===0||iV==='hidden'||iD==='none'||iframeNum==='0'||iframeScStatus==='6');
    return{container_id:containerId||'',query:question||'',iframe_exists:!!iframe,iframe_count:container?container.querySelectorAll('iframe').length:0,iframe_height:iH,iframe_offset_height:iframe?iframe.offsetHeight:null,iframe_client_height:iframe?iframe.clientHeight:null,iframe_width:rect?Math.round(rect.width):null,iframe_visibility:iV,iframe_display:iD,iframe_style_height:iframe?iframe.style.height||'':'',iframe_style_visibility:iframe?iframe.style.visibility||'':'',iframe_num:iframeNum,iframe_sc_status:iframeScStatus,iframe_src_host:iframeURL?iframeURL.hostname:'',iframe_src_path:iframeURL?iframeURL.pathname:'',container_height:containerRect?Math.round(containerRect.height):null,container_child_count:container?container.childElementCount:0,suspected_no_fill:noFill};
  }
  function trackSparkAfsNoFillIfSuspected(question,containerId,extra){
    var d=getSparkAfsNoFillDiagnostics(question,containerId);
    if(!d.suspected_no_fill)return false;
    sendSparkEvent('spark_bot_afs_no_fill',Object.assign({},d,extra||{})); return true;
  }
  function fillDisplayAdForTurn(turnEl){
    if(sparkUsesAfs())return;
    var client=(p.adsense_client||'').trim(),slot=(p.adsense_slot||'').trim();
    if(!client||!slot)return;
    var wrap=turnEl.querySelector('.zipline-spark__turn-ad-wrap');
    var inner=wrap&&wrap.querySelector('.zipline-spark__ad-display');
    if(!inner||inner.querySelector('.adsbygoogle'))return;
    inner.innerHTML='<ins class="adsbygoogle" style="display:block" data-ad-client="'+escapeHtml(client)+'" data-ad-slot="'+escapeHtml(slot)+'"></ins>';
    function pushUnit(){try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch(e){}}
    if(!document.querySelector('script[data-zipline-spark-ads]')){
      var s=document.createElement('script'); s.async=true; s.setAttribute('data-zipline-spark-ads','1');
      s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(client);
      s.crossOrigin='anonymous'; s.onload=pushUnit; document.head.appendChild(s);
    }else{pushUnit();}
  }
  function appendTurn(question){
    var turn=document.createElement('div'); turn.className='zipline-spark__turn';
    sparkTurnAfsCounter+=1; var afsDomId='zipline-spark-afs-'+sparkTurnAfsCounter;
    turn.innerHTML=
      '<div class="zipline-spark__turn-q">'+escapeHtml(question)+'</div>'+
      '<div class="zipline-spark__turn-body">'+
      '<div class="zipline-spark__loading-block">'+
      '<div class="zipline-spark__loading-row"><span class="zipline-spark__loading-star">'+boltSvgMarkup('zipline-spark__bolt-icon zipline-spark__bolt-icon--sm')+'</span> Checking other sources\u2026</div>'+
      '<div class="zipline-spark__skeleton"></div>'+
      '<div class="zipline-spark__skeleton zipline-spark__skeleton--mid"></div>'+
      '<div class="zipline-spark__skeleton zipline-spark__skeleton--short"></div></div>'+
      '<div class="zipline-spark__turn-answer zipline-spark__answer" hidden></div>'+
      '<div class="zipline-spark__turn-actions" hidden><button type="button" class="zipline-spark__copy-btn zipline-spark__turn-copy" title="Copy answer">Copy</button></div>'+
      '<div class="zipline-spark__turn-ad-wrap" hidden><div class="zipline-spark__ad-label">Advertisement</div><div class="zipline-spark__ad-display"></div><div class="zipline-spark__afs-container" id="'+afsDomId+'" aria-hidden="true"></div></div>'+
      '<div class="zipline-spark__turn-explore"></div></div>'+
      '<div class="zipline-spark__turn-divider"></div>';
    chatScroll.appendChild(turn);
    var ans=turn.querySelector('.zipline-spark__turn-answer');
    turn.querySelector('.zipline-spark__turn-copy').addEventListener('click',function(){var raw=ans.getAttribute('data-raw')||'';if(raw&&navigator.clipboard)navigator.clipboard.writeText(raw);});
    scrollChatElementToTop(turn); return turn;
  }
  function monetizeSparkTurn(question,turnEl){
    var wrap=turnEl.querySelector('.zipline-spark__turn-ad-wrap'); if(!wrap)return;
    wrap.hidden=false;
    if(!sparkMonetizationBootstrapped){sparkMonetizationBootstrapped=true;initSparkMonetization();ensureSparkAdMessageListener();}
    maybeRenderAfsForTurn(question,turnEl); fillDisplayAdForTurn(turnEl);
    var hasAds=sparkUsesAfs()||((p.adsense_client||'').trim()&&(p.adsense_slot||'').trim());
    if(hasAds){
      var afsEl=turnEl.querySelector('.zipline-spark__afs-container');
      var cid=afsEl&&afsEl.id?afsEl.id:'';
      var qtext=(question||'').trim()||(document.title||'').trim()||'';
      setTimeout(function(){sendSparkEvent('spark_bot_ad_viewed',{query:qtext,container_id:cid});},1000);
      setTimeout(function(){trackSparkAfsNoFillIfSuspected(qtext,cid,{check_after_ms:2500});},2500);
      setTimeout(function(){trackSparkAfsNoFillIfSuspected(qtext,cid,{check_after_ms:6000});},6000);
    }
  }
  function applyAnswerTruncation(ansEl){
    if(!ansEl)return;
    var existingBtn=ansEl.parentNode&&ansEl.parentNode.querySelector('.zipline-spark__show-more-btn');
    if(existingBtn)existingBtn.remove();
    ansEl.classList.remove('zipline-spark__answer--collapsed','zipline-spark__answer--streaming-clamp');
    var inner=ansEl.querySelector('.zipline-spark__answer-inner'); if(!inner)return;
    var lineHeight=parseFloat(window.getComputedStyle(inner).lineHeight)||24;
    if(inner.scrollHeight<=lineHeight*8+12){while(inner.firstChild)ansEl.insertBefore(inner.firstChild,inner);inner.remove();return;}
    ansEl.classList.add('zipline-spark__answer--collapsed');
    var btn=document.createElement('button'); btn.type='button'; btn.className='zipline-spark__show-more-btn'; btn.textContent='Show more';
    btn.addEventListener('click',function(){ansEl.classList.remove('zipline-spark__answer--collapsed');btn.remove();});
    ansEl.parentNode.insertBefore(btn,ansEl.nextSibling);
  }
  function setAnswerHtmlStreaming(ansEl,html){
    var inner=ansEl.querySelector('.zipline-spark__answer-inner');
    if(!inner){inner=document.createElement('div');inner.className='zipline-spark__answer-inner';ansEl.appendChild(inner);}
    inner.innerHTML=html; ansEl.classList.add('zipline-spark__answer--streaming-clamp');
  }
  function dispatchSSEBlock(block){
    if(!streamTarget)return;
    var ev='',dataLine='';
    block.split('\n').forEach(function(line){if(line.indexOf('event:')===0)ev=line.slice(6).trim();if(line.indexOf('data:')===0)dataLine=line.slice(5).trim();});
    if(!dataLine)return;
    var data; try{data=JSON.parse(dataLine);}catch(e){return;}
    var ansEl=streamTarget.ansEl,loadEl=streamTarget.loadEl,explEl=streamTarget.explEl;
    if(ev==='chunk'&&data.t){
      var firstChunk=!!(loadEl&&loadEl.style.display!=='none');
      if(firstChunk){loadEl.style.display='none';ansEl.hidden=false;ansEl.closest('.zipline-spark__turn').querySelector('.zipline-spark__turn-actions').hidden=false;var tr=ansEl.closest('.zipline-spark__turn');if(tr&&streamTarget)monetizeSparkTurn(streamTarget.question,tr);}
      var acc=(ansEl.getAttribute('data-raw')||'')+data.t; ansEl.setAttribute('data-raw',acc);
      setAnswerHtmlStreaming(ansEl,basicMd(acc)); if(firstChunk)scrollChatElementToTop(ansEl);
    }
    if(ev==='error'){
      if(loadEl)loadEl.style.display='none'; ansEl.hidden=false;
      ansEl.innerHTML='<p class="zipline-spark__err">'+escapeHtml(data.m||'Error')+'</p>';
      if(streamTarget)sendSparkEvent('spark_bot_answer_error',{question:streamTarget.question,error:data.m||'Error'});
      var errTurn=ansEl.closest('.zipline-spark__turn'); if(errTurn&&streamTarget)monetizeSparkTurn(streamTarget.question,errTurn);
      scrollChatElementToTop(ansEl);
    }
    if(ev==='done'){
      var st=streamTarget,qStr=st&&st.question,start=st&&st.answerStartMs;
      var rt=typeof start==='number'?Date.now()-start:undefined;
      var finalAnswer=data.answer||(st&&st.ansEl&&st.ansEl.getAttribute('data-raw'))||'';
      if(qStr&&finalAnswer){conversationHistory.push({question:qStr,answer:String(finalAnswer)});if(conversationHistory.length>12)conversationHistory=conversationHistory.slice(conversationHistory.length-12);}
      sendSparkEvent('spark_bot_response_rendered',{question:qStr,render_time_ms:rt});
    }
    if(ev==='followups'&&data.questions&&data.questions.length){
      var h='<div class="zipline-spark__explore-title">Explore more</div>';
      data.questions.forEach(function(q){if(!q)return;h+='<button type="button" class="zipline-spark__explore-chip">'+escapeHtml(q)+'<span class="zipline-spark__explore-arrow">\u21a9</span></button>';});
      explEl.innerHTML=h;
      var chips=explEl.querySelectorAll('.zipline-spark__explore-chip');
      data.questions.forEach(function(qtext,idx){
        if(!qtext||!chips[idx])return;
        chips[idx].addEventListener('click',function(){
          sendSparkEvent('spark_bot_followup_question_clicked',{question:qtext});
          if(streamAbort)streamAbort.abort();
          var t=appendTurn(qtext); runStreamIntoTurn(qtext,t);
          if(sidebarEl)sidebarEl.querySelector('[data-tab="answer"]').click();
        });
      });
      scrollChatElementToTop(ansEl);
    }
  }
  function runStreamIntoTurn(question,turnEl){
    if(streamAbort)streamAbort.abort(); streamAbort=new AbortController();
    var ansEl=turnEl.querySelector('.zipline-spark__turn-answer');
    var loadEl=turnEl.querySelector('.zipline-spark__loading-block');
    var explEl=turnEl.querySelector('.zipline-spark__turn-explore');
    ansEl.innerHTML=''; ansEl.removeAttribute('data-raw'); ansEl.hidden=true;
    loadEl.style.display=''; explEl.innerHTML='';
    turnEl.querySelector('.zipline-spark__turn-actions').hidden=true;
    streamTarget={ansEl:ansEl,loadEl:loadEl,explEl:explEl,question:question,answerStartMs:Date.now()};
    fetch(apiBase+'/api/v1/spark/answer',{
      method:'POST',headers:{'Content-Type':'application/json',Accept:'text/event-stream'},
      body:JSON.stringify((function(){
        var payload={url:pageUrl(),question:question,session_id:sessionId(),conversation_history:conversationHistory.slice(),messages:buildMessagesPayload()};
        if(p.channel_id)payload.channel_id=p.channel_id; if(p.pubid)payload.pubid=p.pubid;
        var fv=forceVariantFromPage(); if(fv)payload.force_variant=fv; return payload;
      })()),
      signal:streamAbort.signal
    }).then(function(res){
      if(!res.ok)return res.json().then(function(j){throw new Error((j&&j.detail)||(j&&j.error)||'HTTP '+res.status);},function(){throw new Error('HTTP '+res.status);});
      var reader=res.body.getReader(),dec=new TextDecoder(),buf='';
      function pump(){
        return reader.read().then(function(r){
          if(r.done){if(buf.trim()){var sep=buf.indexOf('\n\n');if(sep>=0)dispatchSSEBlock(buf.slice(0,sep));}if(streamTarget&&streamTarget.ansEl)applyAnswerTruncation(streamTarget.ansEl);streamTarget=null;return;}
          buf+=dec.decode(r.value,{stream:true});
          var sep; while((sep=buf.indexOf('\n\n'))>=0){dispatchSSEBlock(buf.slice(0,sep));buf=buf.slice(sep+2);}
          return pump();
        });
      }
      return pump();
    }).catch(function(e){
      if(e.name==='AbortError')return;
      sendSparkEvent('spark_bot_answer_error',{question:question,error:String(e.message||e)});
      loadEl.style.display='none'; ansEl.hidden=false;
      ansEl.innerHTML='<p class="zipline-spark__err">'+escapeHtml(String(e.message||e))+'</p>';
      var fw=turnEl.querySelector('.zipline-spark__turn-ad-wrap');
      if(fw){fw.hidden=false;monetizeSparkTurn(question,turnEl);}
      streamTarget=null; scrollChatElementToTop(ansEl);
    });
  }
  function buildMessagesPayload(){
    var messages=[];
    conversationHistory.forEach(function(turn){
      if(turn&&turn.question)messages.push({role:'user',content:String(turn.question)});
      if(turn&&turn.answer)messages.push({role:'assistant',content:String(turn.answer)});
    });
    return messages;
  }
  function openSidebar(question,appendOnly){
    ensureSidebar();
    sendSparkEvent('spark_bot_sidebar_open',{question:question});
    if(!appendOnly||sidebarWasClosed){chatScroll.innerHTML='';sidebarWasClosed=false;}
    var turn=appendTurn(question);
    sidebarEl.querySelectorAll('.zipline-spark__tab').forEach(function(b){b.classList.toggle('zipline-spark__tab--active',b.getAttribute('data-tab')==='answer');});
    paneAnswer.hidden=false; paneSources.hidden=true; sidebarEl.hidden=false;
    lockPageScrollForSpark(); document.body.classList.add('zipline-spark-sidebar-visible');
    runStreamIntoTurn(question,turn);
  }
  function closeSidebar(){
    if(!sidebarEl)return;
    if(streamAbort)streamAbort.abort();
    streamTarget=null; sidebarEl.hidden=true; sidebarWasClosed=true;
    document.body.classList.remove('zipline-spark-sidebar-visible');
    unlockPageScrollForSpark();
  }
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&sidebarEl&&!sidebarEl.hidden)closeSidebar();});
  function withServerAfsDefaults(done){
    if((p.afs_pub_id&&p.afs_style_id)||!apiBase){done();return;}
    fetch(apiBase+'/api/v1/spark/public-config',{credentials:'omit'})
      .then(function(r){return r.ok?r.json():{};})
      .then(function(cfg){if(cfg&&typeof cfg==='object'){if(!p.afs_pub_id&&cfg.afs_pub_id)p.afs_pub_id=String(cfg.afs_pub_id).trim();if(!p.afs_style_id&&cfg.afs_style_id)p.afs_style_id=String(cfg.afs_style_id).trim();if(!p.afs_channel_id&&cfg.afs_channel_id)p.afs_channel_id=String(cfg.afs_channel_id).trim();}})
      .catch(function(){}).then(function(){done();});
  }
  var q=new URLSearchParams();
  q.set('url',pageUrl()); q.set('session_id',sessionId());
  if(p.channel_id)q.set('channel_id',p.channel_id); if(p.pubid)q.set('pubid',p.pubid);
  var questionsUrl=apiBase+'/api/v1/spark/questions?'+q.toString();
  function fetchQuestionsOnce(){return fetch(questionsUrl,{credentials:'omit'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});}
  function fetchQuestionsWithRetry(){
    function delay(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
    function parse(data){var qs=(data&&data.questions)||[];if(!qs.length)throw new Error('no questions');return qs;}
    return fetchQuestionsOnce().then(parse)
      .catch(function(){return delay(500).then(fetchQuestionsOnce).then(parse);})
      .catch(function(){return delay(900).then(fetchQuestionsOnce).then(parse);});
  }
  function sparkHeadHtml(){
    return'<div class="zipline-spark__head"><span class="zipline-spark__head-star" aria-hidden="true">'+boltSvgMarkup('zipline-spark__bolt-icon')+'</span><span class="zipline-spark__head-title">'+escapeHtml(p.title)+'</span></div>';
  }
  function renderQuestionCarousel(questions){
    var liveRoot=getLiveRoot(themeClass,dw);
    if(root!==liveRoot&&!root.isConnected){if(console&&console.warn)console.warn('[Zipline Spark] Original root was detached. Using live element.');}
    liveRoot.innerHTML=''; liveRoot.style.display='';
    var head=document.createElement('div'); head.className='zipline-spark__head';
    head.innerHTML='<span class="zipline-spark__head-star" aria-hidden="true">'+boltSvgMarkup('zipline-spark__bolt-icon')+'</span><span class="zipline-spark__head-title">'+escapeHtml(p.title)+'</span>';
    var carousel=document.createElement('div'); carousel.className='zipline-spark__carousel';
    carousel.innerHTML='<button type="button" class="zipline-spark__nav zipline-spark__nav--prev" aria-label="Previous">\u2039</button><div class="zipline-spark__track-wrap"><div class="zipline-spark__track"></div></div><button type="button" class="zipline-spark__nav zipline-spark__nav--next" aria-label="Next">\u203a</button>';
    var track=carousel.querySelector('.zipline-spark__track');
    questions.forEach(function(text){
      if(!text||String(text).length>500)return;
      var card=document.createElement('button'); card.type='button'; card.className='zipline-spark__card';
      card.innerHTML='<span class="zipline-spark__card-text">'+escapeHtml(String(text))+'</span>';
      card.addEventListener('click',function(){
        sendSparkEvent('spark_bot_leading_question_clicked',{question:String(text)});
        openSidebar(String(text),sidebarEl&&!sidebarEl.hidden);
      });
      track.appendChild(card);
    });
    var wrap=carousel.querySelector('.zipline-spark__track-wrap');
    var trackGap=parseFloat(window.getComputedStyle(track).gap)||10;
    function syncCarousel(){syncCarouselState(carousel,wrap,track);}
    carousel.querySelector('.zipline-spark__nav--prev').addEventListener('click',function(){var c=track.querySelector('.zipline-spark__card');wrap.scrollBy({left:-(c?c.offsetWidth+trackGap:200),behavior:'smooth'});});
    carousel.querySelector('.zipline-spark__nav--next').addEventListener('click',function(){var c=track.querySelector('.zipline-spark__card');wrap.scrollBy({left:c?c.offsetWidth+trackGap:200,behavior:'smooth'});});
    wrap.addEventListener('scroll',syncCarousel,{passive:true});
    window.addEventListener('resize',syncCarousel);
    liveRoot.appendChild(head); liveRoot.appendChild(carousel);
    requestAnimationFrame(syncCarousel);
    sendSparkEvent('spark_bot_leading_questions_viewed',{questions_count:questions.length,questions:questions});
    /* DD layout */
    applyDDLayout(liveRoot,questions,openSidebar);
  }
  function loadSparkQuestions(){
    fetchQuestionsWithRetry().then(function(questions){renderQuestionCarousel(questions);})
      .catch(function(err){if(console&&console.warn)console.warn('[Zipline Spark] questions failed:',err&&err.message?err.message:err);var lr=getLiveRoot(themeClass,dw);lr.innerHTML='';lr.style.display='none';});
  }
  fetchSparkAssign(function(){
    withServerAfsDefaults(function(){
      var th=window.__ziplineSparkAbThemeId;
      if(th){applySparkThemeFromId(th,function(){loadSparkQuestions();});}
      else{loadSparkQuestions();}
    });
  });
    });
  });
})();
