/* ===== إشعارات رفراف بلاج — الإذن مباشرة في الموقع (بدون نافذة push.) =====
   يحتاج Cloudflare Worker الذي يقدّم /firebase-messaging-sw.js و /config.js على www.rafrafplage.tn
   للتجربة: أضف ?rptest في آخر الرابط ليظهر الصندوق دائماً */
(function(){
  var KEY = 'rp_push_state';
  var OLD = 'https://push.rafrafplage.tn/';          /* صفحة الاحتياط (آيفون بدون تثبيت…) */
  var FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var force = location.search.indexOf('rptest') !== -1;

  function get(){ try{ return JSON.parse(localStorage.getItem(KEY) || '{}'); }catch(e){ return {}; } }
  function save(o){ try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){} }
  function load(src){ return new Promise(function(ok, no){ var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function supported(){ return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }

  /* تحميل Firebase + الإعدادات مرة واحدة */
  var libs = null;
  function loadLibs(){
    if (!libs) libs = load('/config.js')
      .then(function(){ return load(FB + 'firebase-app-compat.js'); })
      .then(function(){ return Promise.all([load(FB + 'firebase-messaging-compat.js'), load(FB + 'firebase-firestore-compat.js')]); })
      .then(function(){ if (!firebase.apps.length) firebase.initializeApp(PN_CONFIG.firebase); });
    return libs;
  }

  /* تسجيل الـ Service Worker + أخذ الرمز + حفظه في Firestore (لوحة الأدمن) */
  function subscribe(){
    return loadLibs().then(function(){
      return navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    }).then(function(reg){
      return firebase.messaging().getToken({ vapidKey: PN_CONFIG.vapidKey, serviceWorkerRegistration: reg });
    }).then(function(t){
      if (!t) throw new Error('no token');
      var saved = null; try{ saved = localStorage.getItem('pn_fs'); }catch(e){}
      if (saved === t) return t;
      var ua = navigator.userAgent;
      var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      return firebase.firestore().collection('subscribers').doc(t).set({
        created: firebase.firestore.FieldValue.serverTimestamp(),
        platform: isIOS ? 'ios' : (/Android/i.test(ua) ? 'android' : 'desktop'),
        lang: (navigator.language || '').slice(0, 10)
      }).then(function(){ try{ localStorage.setItem('pn_fs', t); }catch(e){} })
        .catch(function(e){ if (e && e.code === 'permission-denied') { try{ localStorage.setItem('pn_fs', t); }catch(x){} } })
        .then(function(){ return t; });
    });
  }

  function toast(msg){
    var d = document.createElement('div');
    d.textContent = msg;
    d.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111;color:#fff;padding:12px 18px;border-radius:12px;font:600 15px Tahoma,Arial,sans-serif;z-index:2147483647;direction:rtl;box-shadow:0 6px 20px rgba(0,0,0,.25)';
    document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 3000);
  }

  function start(){
    /* متصفح لا يدعم (مثلاً آيفون قبل إضافة الموقع للشاشة الرئيسية) → نترك الطريقة القديمة */
    var noSupport = !supported();

    /* سبق السماح: نتأكد بصمت أن الرمز محفوظ */
    if (!noSupport && Notification.permission === 'granted') {
      var has = null; try{ has = localStorage.getItem('pn_fs'); }catch(e){}
      if (!has) subscribe().catch(function(){});   /* مرة واحدة فقط، ثم لا نحمّل Firebase في كل صفحة */
      if (!force) return;
    }
    if (!noSupport && Notification.permission === 'denied' && !force) return;

    var st = get();
    if (!force) {
      if (st.done) return;
      if (st.later && Date.now() - st.later < 86400000) return; /* يعود بعد يوم */
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
      '<button id="rpY" type="button">السماح</button><button id="rpN" type="button">عدم السماح</button>';
    document.body.appendChild(bg); document.body.appendChild(sh);

    function close(){ sh.className = ''; bg.className = ''; }
    setTimeout(function(){ bg.className = 'on'; sh.className = 'on'; }, 2500);
    if (!noSupport) setTimeout(function(){ loadLibs().catch(function(){}); }, 2600); /* تحميل مسبق حتى يكون التفعيل سريعاً */

    document.getElementById('rpY').onclick = function(){
      close();
      if (noSupport) { /* الطريقة القديمة: صفحة push. (تعليمات الآيفون…) */
        location.href = OLD + '?from=' + encodeURIComponent(location.href);
        return;
      }
      /* نافذة Chrome الأصلية «السماح بالإشعارات» تظهر هنا مباشرة */
      Notification.requestPermission().then(function(perm){
        if (perm === 'granted') {
          save({ done: 1 });
          subscribe().then(function(){ toast('تم تفعيل الإشعارات ✅'); })
                     .catch(function(e){ console.log('[push]', e); toast('تعذّر التفعيل، حاول لاحقاً'); });
        } else if (perm === 'denied') {
          save({ done: 1 });
        } else {
          save({ later: Date.now() });
        }
      });
    };
    document.getElementById('rpN').onclick = function(){ save({ later: Date.now() }); close(); };
    bg.onclick = function(){ save({ later: Date.now() }); close(); };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
