/* ===== إشعارات رفراف بلاج — الإذن مباشرة في الموقع (بدون نافذة push.) =====
   يحتاج Cloudflare Worker الذي يقدّم /firebase-messaging-sw.js و /config.js على www.rafrafplage.tn
   يعرض نافذة Chrome الأصلية + شاشة إرشاد عربية (سهم نحو «السماح» + لوحة في الأسفل) مثل kapitalis.com
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

  /* ===== نصوص شاشة الإرشاد (عدّلها كما تريد) ===== */
  var G_SITE    = 'www.rafrafplage.tn';
  var G_TITLE   = 'كن أول من يعلم بآخر أخبار رفراف، الطقس، كراء المنازل وبيع الأراضي.';
  var G_TIP     = 'اختفى الشريط؟ اضغط على الأيقونة بجانب عنوان الموقع في الأعلى للسماح بالإشعارات.';
  var G_NOTE    = 'اضغط «السماح» لتصلك إشعاراتنا حتى والموقع مغلق. لإلغاء الاشتراك أوقفها من إعدادات الإشعارات في جهازك.';
  var G_PRIVACY = '';   /* رابط سياسة الخصوصية (اتركه فارغاً لإخفائه) */
  var G_SECONDS = 10;   /* مدة بقاء شاشة الإرشاد بالثواني (تقريباً مدة شريط Chrome) */

  /* Google Chrome فقط (ليس Samsung Internet أو Edge أو Opera أو Firefox…) */
  function isChrome(){
    try {
      var b = navigator.userAgentData && navigator.userAgentData.brands;
      if (b && b.length) return b.some(function(x){ return x.brand === 'Google Chrome'; });
    } catch(e){}
    var ua = navigator.userAgent;
    return /Chrome\/\d+/.test(ua) && !/Edg|OPR|Opera|SamsungBrowser|YaBrowser|UCBrowser|Vivaldi|Brave|DuckDuckGo|MiuiBrowser|HuaweiBrowser|Firefox|; wv\)/.test(ua);
  }

  /* شاشة الإرشاد: تظهر ما دامت نافذة Chrome مفتوحة، وتختفي بعد الاختيار */
  var guideEl = null;
  function showGuide(onClose){
    if (guideEl) return;
    /* مكان زر «السماح» في شريط Chrome: يمين إذا كانت لغة الهاتف غير عربية، يسار إذا كانت عربية */
    var left = /^(ar|fa|he|ur)/i.test(navigator.language || '');
    var css = document.createElement('style');
    css.id = 'rpgCss';
    css.textContent =
      '#rpg{position:fixed;inset:0;z-index:2147483646;direction:rtl;font-family:-apple-system,Roboto,"Segoe UI",Tahoma,Arial,sans-serif;opacity:0;transition:opacity .35s}' +
      '#rpg.on{opacity:1}' +
      '#rpg .dim{position:absolute;inset:0;background:rgba(40,40,46,.62)}' +
      '#rpg .glow{position:absolute;top:-70px;' + (left ? 'left' : 'right') + ':-60px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(250,204,21,.55),rgba(250,204,21,0) 65%);animation:rpgP 1.6s ease-in-out infinite}' +
      '#rpg .arr{position:absolute;top:70px;' + (left ? 'left' : 'right') + ':40px;width:180px;height:300px;' + (left ? 'transform:scaleX(-1);' : '') + '}' +
      '#rpg .arr path.d{fill:none;stroke:#fff;stroke-width:6;stroke-linecap:round;stroke-dasharray:.1 16;animation:rpgD 1.2s linear infinite}' +
      '#rpg .arr path.h{fill:none;stroke:#facc15;stroke-width:9;stroke-linecap:round;stroke-linejoin:round}' +
      '#rpg .msg{position:absolute;top:385px;left:16px;right:16px;text-align:center;color:#fff;font-size:19px;line-height:1.6;text-shadow:0 1px 6px rgba(0,0,0,.5)}' +
      '#rpg .msg b{color:#facc15}' +
      '#rpg .sheet{position:absolute;left:0;right:0;bottom:0;background:#fff;color:#111;border-radius:28px 28px 0 0;padding:22px 20px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -6px 30px rgba(0,0,0,.25);transform:translateY(100%);transition:transform .4s ease;max-width:640px;margin:0 auto}' +
      '#rpg.on .sheet{transform:none}' +
      '#rpg .site{font-size:14px;color:#6b7280;margin:0 0 6px}' +
      '#rpg h3{margin:0 0 14px;font-size:21px;line-height:1.45;font-weight:800;color:#111}' +
      '#rpg .tip{display:flex;align-items:center;gap:12px;background:#f1f4f9;border-radius:16px;padding:12px 14px;margin:0 0 12px}' +
      '#rpg .tip i{flex:0 0 40px;height:40px;border-radius:50%;background:#2547d0;display:flex;align-items:center;justify-content:center}' +
      '#rpg .tip i svg{width:20px;height:20px;stroke:#fff;fill:none;stroke-width:2}' +
      '#rpg .tip span{font-size:14.5px;line-height:1.55;color:#1f2937}' +
      '#rpg .note{font-size:12.5px;line-height:1.7;color:#6b7280;margin:0}' +
      '#rpg .note a{color:#2547d0}' +
      '#rpg .x{position:absolute;top:12px;left:14px;width:32px;height:32px;border:0;border-radius:50%;background:#f1f4f9;color:#555;font-size:18px;line-height:32px;cursor:pointer;padding:0}' +
      '@keyframes rpgP{50%{transform:scale(1.12);opacity:.75}}' +
      '@keyframes rpgD{to{stroke-dashoffset:-16.1}}' +
      '@media (prefers-color-scheme:dark){#rpg .sheet{background:#1c1f26;color:#eee}#rpg h3{color:#f3f4f6}#rpg .tip{background:#262b35}#rpg .tip span{color:#e5e7eb}#rpg .x{background:#262b35;color:#ccc}}' +
      '@media (max-height:640px){#rpg .arr{height:220px}#rpg .msg{top:300px;font-size:17px}}';
    document.head.appendChild(css);

    guideEl = document.createElement('div');
    guideEl.id = 'rpg';
    guideEl.innerHTML =
      '<div class="dim"></div><div class="glow"></div>' +
      '<svg class="arr" viewBox="0 0 180 300"><path class="d" d="M40 290 C 60 200, 150 170, 150 40"/><path class="h" d="M122 52 L150 22 L178 52"/></svg>' +
      '<div class="msg">للسماح، اضغط على <b>«السماح»</b> في أعلى الشاشة</div>' +
      '<div class="sheet"><button class="x" type="button" aria-label="إغلاق">✕</button>' +
        '<p class="site">' + G_SITE + '</p>' +
        '<h3>' + G_TITLE + '</h3>' +
        '<div class="tip"><i><svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></i><span>' + G_TIP + '</span></div>' +
        '<p class="note">' + G_NOTE + (G_PRIVACY ? ' <a href="' + G_PRIVACY + '">سياسة الخصوصية</a>' : '') + '</p>' +
      '</div>';
    document.body.appendChild(guideEl);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ if (guideEl) guideEl.className = 'on'; }); });
    guideEl.querySelector('.x').onclick = function(){ hideGuide(); if (onClose) onClose(); };
  }
  function hideGuide(){
    if (!guideEl) return;
    var g = guideEl; guideEl = null;
    g.className = '';
    setTimeout(function(){ g.remove(); var c = document.getElementById('rpgCss'); if (c) c.remove(); }, 400);
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

    /* نافذة Chrome الأصلية + شاشة الإرشاد */
    var asked = false;
    function ask(){
      if (asked || Notification.permission !== 'default') return;
      asked = true;
      off();
      loadLibs().catch(function(){}); /* تحميل مسبق */
      save({ later: Date.now() }); /* إن لم يختر شيئاً: لا نطلب مرة أخرى قبل يوم (يُستبدل بـ done عند الاختيار) */
      var p = Notification.requestPermission();
      var finished = false, poll = null;
      function result(perm){
        if (finished) return;
        if (perm === 'granted') {
          finished = true; stop(); hideGuide(); save({ done: 1 });
          subscribe().then(function(){ toast('تم تفعيل الإشعارات ✅'); })
                     .catch(function(e){ console.log('[push]', e); });
        } else if (perm === 'denied') {
          finished = true; stop(); hideGuide(); save({ done: 1 });
        }
        /* 'default' = الشريط ما زال في الأعلى أو صغُر بجانب العنوان → شاشة الإرشاد تبقى */
      }
      function stop(){ clearTimeout(gT); clearTimeout(hT); if (poll) clearInterval(poll); poll = null; }
      /* شاشة الإرشاد: في Google Chrome فقط؛ باقي المتصفحات تكتفي بنافذتها العادية */
      var hT = null;
      var gT = !isChrome() ? null : setTimeout(function(){
        if (finished || Notification.permission !== 'default') return;
        showGuide(function(){ clearTimeout(hT); });
        /* تختفي مع اختفاء شريط Chrome تقريباً (المراقبة تستمر: إن ضغط «السماح» لاحقاً يُسجَّل) */
        hT = setTimeout(hideGuide, G_SECONDS * 1000);
      }, 700);
      /* مراقبة الإذن: Chrome قد يُرجع الطلب فوراً مع الشريط الصغير، فنتابع التغيير بأنفسنا */
      poll = setInterval(function(){ result(Notification.permission); }, 800);
      setTimeout(function(){ if (poll) { clearInterval(poll); poll = null; } }, 180000); /* نوقف المراقبة بعد 3 دقائق */
      try {
        navigator.permissions.query({ name: 'notifications' }).then(function(ps){
          ps.onchange = function(){ result(Notification.permission); };
        }).catch(function(){});
      } catch(e){}
      (p && p.then ? p : Promise.resolve(Notification.permission)).then(result);
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

  window.rpShowGuide = showGuide; /* للمعاينة فقط */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
