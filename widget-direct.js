/* ===== إشعارات رفراف بلاج — الإذن مباشرة في الموقع (بدون نافذة push.) =====
   يحتاج Cloudflare Worker الذي يقدّم /firebase-messaging-sw.js و /config.js على www.rafrafplage.tn
   يعرض نافذة Chrome الأصلية فقط «السماح بالإشعارات» (بدون صندوق خاص بالموقع)
   للتجربة: أضف ?rptest في آخر الرابط */
(function(){
  var KEY = 'rp_push_state';
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
    /* لا دعم (مثلاً آيفون بدون تثبيت الموقع) → لا شيء */
    if (!supported()) return;

    /* سبق السماح: نتأكد مرة واحدة أن الرمز محفوظ */
    if (Notification.permission === 'granted') {
      var has = null; try{ has = localStorage.getItem('pn_fs'); }catch(e){}
      if (!has) subscribe().catch(function(){});
      return;
    }
    if (Notification.permission === 'denied') return;

    var st = get();
    if (!force && st.later && Date.now() - st.later < 86400000) return; /* أُغلقت النافذة بدون اختيار → نعيد بعد يوم */

    /* نافذة Chrome الأصلية فقط (بدون أي صندوق من الموقع) */
    var asked = false;
    function ask(){
      if (asked || Notification.permission !== 'default') return;
      asked = true;
      off();
      loadLibs().catch(function(){}); /* تحميل مسبق */
      var p = Notification.requestPermission();
      (p && p.then ? p : Promise.resolve(Notification.permission)).then(function(perm){
        if (perm === 'granted') {
          save({ done: 1 });
          subscribe().then(function(){ toast('تم تفعيل الإشعارات ✅'); })
                     .catch(function(e){ console.log('[push]', e); });
        } else if (perm === 'default') {
          save({ later: Date.now() });
        }
      });
    }
    function off(){
      document.removeEventListener('click', ask, true);
      document.removeEventListener('touchend', ask, true);
    }
    /* أول لمسة/نقرة في الصفحة → النافذة (أضمن طريقة في Chrome) */
    document.addEventListener('click', ask, true);
    document.addEventListener('touchend', ask, true);
    /* وإن لم يلمس الزائر شيئاً: نطلب بعد 3 ثوانٍ مثل جوهرة FM */
    setTimeout(ask, force ? 300 : 3000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
