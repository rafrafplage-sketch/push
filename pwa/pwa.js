/* ===== تطبيق رفراف بلاج (PWA) — يعمل على الهاتف والحاسوب والآيفون =====
   - يسجّل الـ Service Worker (نفس ملف الإشعارات) حتى يصبح الموقع قابلاً للتثبيت
   - Android / الحاسوب: زر «ثبّت التطبيق» عند توفّر التثبيت
   - الآيفون (Safari): شرح «إضافة إلى الشاشة الرئيسية»
   للتجربة: أضف ?pwatest في آخر الرابط */
(function(){
  var KEY = 'rp_pwa_state', DELAY = 15000; /* يظهر الاقتراح بعد 15 ثانية من التصفح */
  var force = location.search.indexOf('pwatest') !== -1;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var ua = navigator.userAgent;
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isSafari = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

  function get(){ try{ return JSON.parse(localStorage.getItem(KEY) || '{}'); }catch(e){ return {}; } }
  function save(o){ try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){} }

  /* 1) Service Worker على كل الصفحات */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' }).catch(function(){});
    });
  }
  if (standalone) { save({ done: 1 }); return; } /* داخل التطبيق المثبّت: لا شيء */

  var st = get();
  if (!force && (st.done || (st.later && Date.now() - st.later < 7 * 864e5))) return; /* «لاحقاً» → بعد 7 أيام */

  var deferred = null;
  window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferred = e; });
  window.addEventListener('appinstalled', function(){ save({ done: 1 }); hide(); });

  var box = null;
  function css(){
    var c = document.createElement('style');
    c.textContent =
      '#rpI{position:fixed;left:12px;right:12px;bottom:-260px;max-width:460px;margin:0 auto;z-index:2147483640;direction:rtl;' +
      'background:#fff;color:#111;border-radius:20px;box-shadow:0 10px 34px rgba(0,0,0,.25);padding:14px;display:flex;gap:12px;align-items:center;' +
      'font-family:-apple-system,Roboto,"Segoe UI",Tahoma,Arial,sans-serif;transition:bottom .4s ease}' +
      '#rpI.on{bottom:calc(14px + env(safe-area-inset-bottom))}' +
      '#rpI img{width:54px;height:54px;border-radius:14px;flex:none}' +
      '#rpI .t{flex:1;min-width:0}' +
      '#rpI b{display:block;font-size:16px;margin-bottom:2px}' +
      '#rpI span{display:block;font-size:13px;color:#555;line-height:1.5}' +
      '#rpI .go{flex:none;border:0;border-radius:12px;background:#0077b6;color:#fff;font-weight:700;font-size:14px;padding:10px 14px;cursor:pointer;font-family:inherit}' +
      '#rpI .x{position:absolute;top:-10px;left:-6px;width:28px;height:28px;border:0;border-radius:50%;background:#333;color:#fff;font-size:14px;line-height:28px;padding:0;cursor:pointer}' +
      '#rpI .ios{display:inline-block;padding:0 4px;border-radius:5px;background:#e8f1fb;font-weight:700;color:#0077b6}' +
      '@media (prefers-color-scheme:dark){#rpI{background:#1f232b;color:#eee}#rpI span{color:#aaa}#rpI .ios{background:#263445;color:#7cc4ff}}';
    document.head.appendChild(c);
  }
  function show(html, btn, onBtn){
    css();
    box = document.createElement('div'); box.id = 'rpI';
    box.innerHTML = '<button class="x" type="button" aria-label="إغلاق">✕</button><img src="/pwa/icon-192.png" alt="">' +
      '<div class="t">' + html + '</div>' + (btn ? '<button class="go" type="button">' + btn + '</button>' : '');
    document.body.appendChild(box);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ box && (box.className = 'on'); }); });
    box.querySelector('.x').onclick = function(){ save({ later: Date.now() }); hide(); };
    if (btn) box.querySelector('.go').onclick = onBtn;
  }
  function hide(){ if (!box) return; var b = box; box = null; b.className = ''; setTimeout(function(){ b.remove(); }, 450); }

  setTimeout(function(){
    if (deferred) { /* Android / Chrome / Edge على الحاسوب */
      show('<b>ثبّت تطبيق رفراف بلاج</b><span>افتح الموقع بضغطة من شاشتك الرئيسية، بدون متصفح.</span>', 'تثبيت', function(){
        hide();
        deferred.prompt();
        deferred.userChoice.then(function(r){ save(r && r.outcome === 'accepted' ? { done: 1 } : { later: Date.now() }); deferred = null; });
      });
    } else if (isSafari) { /* الآيفون */
      show('<b>أضف رفراف بلاج إلى شاشتك</b><span>اضغط زر المشاركة <span class="ios">⎋</span> في الأسفل، ثم <span class="ios">إضافة إلى الشاشة الرئيسية</span>.</span>');
    }
  }, force ? 1500 : DELAY);
})();
