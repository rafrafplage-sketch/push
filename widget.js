(function(){
  var KEY = 'rp_push_state';
  var PUSH = 'https://push.rafrafplage.tn/';
  var force = location.search.indexOf('rptest') !== -1;

  function get(){ try{ return JSON.parse(localStorage.getItem(KEY) || '{}'); }catch(e){ return {}; } }
  function save(o){ try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){} }

  function start(){
    var st = get();
    if(!force){
      if(st.done) return;
      if(st.later && Date.now() - st.later < 86400000) return; // يعود بعد يوم
    }

    var css = document.createElement('style');
    css.textContent =
      '#rpBg{position:fixed;inset:0;background:rgba(0,0,0,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
      'z-index:2147483646;opacity:0;transition:opacity .3s;pointer-events:none}' +
      '#rpBg.on{opacity:1;pointer-events:auto}' +
      '#rpS{position:fixed;left:0;right:0;bottom:-420px;margin:0 auto;width:calc(100% - 24px);max-width:440px;z-index:2147483647;' +
      'background:#fbfbfd;border-radius:28px;padding:30px 20px 14px;text-align:center;direction:rtl;box-sizing:border-box;' +
      'font-family:-apple-system,Roboto,"Segoe UI",Tahoma,Arial,sans-serif;box-shadow:0 -4px 30px rgba(0,0,0,.2);transition:bottom .35s ease}' +
      '#rpS.on{bottom:12px}' +
      '#rpS svg{width:40px;height:40px;stroke:#2f6fe4;fill:none;stroke-width:1.8}' +
      '#rpS p{margin:14px 6px 18px;font-size:17px;line-height:1.5;color:#222}' +
      '#rpS p b{font-weight:700}' +
      '#rpS button{display:block;width:100%;background:none!important;border:0;padding:15px;font:600 19px -apple-system,Roboto,Tahoma,Arial,sans-serif;' +
      'color:#111!important;cursor:pointer;border-radius:14px;margin:0}' +
      '#rpS button:active{background:#eee!important}';
    document.head.appendChild(css);

    var bg = document.createElement('div'); bg.id = 'rpBg';
    var sh = document.createElement('div'); sh.id = 'rpS';
    sh.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>' +
      '<p>السماح لـ <b>رفراف بلاج</b> بإرسال إشعارات إليك؟</p>' +
      '<button id="rpY">السماح</button><button id="rpN">عدم السماح</button>';
    document.body.appendChild(bg); document.body.appendChild(sh);

    function close(){ sh.className = ''; bg.className = ''; }
    setTimeout(function(){ bg.className = 'on'; sh.className = 'on'; }, 2500);

    document.getElementById('rpY').onclick = function(){
      var url = PUSH + '?auto=1&from=' + encodeURIComponent(location.href);
      var w = Math.min(420, screen.width), h = 560;
      var win = window.open(url, 'rafrafpush',
        'width=' + w + ',height=' + h + ',left=' + ((screen.width - w) / 2) + ',top=' + ((screen.height - h) / 2));
      if(!win) location.href = url;
      save({done: 1}); close();
    };
    document.getElementById('rpN').onclick = function(){ save({later: Date.now()}); close(); };
    bg.onclick = function(){ save({later: Date.now()}); close(); };
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
