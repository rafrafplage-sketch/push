/* 🔔 نافذة تفعيل إشعارات رفراف بلاج — تُحمَّل من https://push.rafrafplage.tn/widget.js */
console.log("[rafraf-push] widget loaded");

/* 🔔 نافذة تفعيل إشعارات رفراف بلاج — تُنشأ بالجافاسكريبت وتُضاف مباشرة إلى body */
(function(){
  var KEY = 'rp_push_state';
  var PUSH = 'https://push.rafrafplage.tn/';
  var force = location.search.indexOf('rptest') !== -1; // للتجربة: ?rptest

  function get(){ try{ return JSON.parse(localStorage.getItem(KEY) || '{}'); }catch(e){ return {}; } }
  function save(o){ try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){} }

  function start(){
    var st = get();
    if(!force){
      if(st.done) return;
      if(st.later){ if(Date.now() - st.later < 259200000) return; } // 3 أيام
    }

    var css = document.createElement('style');
    css.textContent =
      '#rpX{position:fixed;top:-260px;left:0;right:0;margin:0 auto;z-index:2147483647;width:92%;max-width:400px;' +
      'background:#fff;border-radius:16px;box-shadow:0 10px 35px rgba(0,0,0,.3);padding:18px;direction:rtl;text-align:right;' +
      'font-family:Tahoma,Arial,sans-serif;transition:top .5s ease;display:flex;gap:14px;align-items:flex-start;box-sizing:border-box}' +
      '#rpX.on{top:15px}' +
      '#rpX .ic{font-size:38px;line-height:1;animation:rpR 1.5s ease-in-out infinite}' +
      '#rpX h4{margin:0 0 6px;padding:0;font-size:16px;color:#023e8a;font-weight:bold;border:0;background:none}' +
      '#rpX p{margin:0 0 12px;padding:0;font-size:13.5px;color:#555;line-height:1.6}' +
      '#rpX .bt{display:flex;gap:8px}' +
      '#rpX button{border:0;border-radius:25px;padding:9px 20px;font:bold 14px Tahoma,Arial;cursor:pointer;margin:0}' +
      '#rpY{background:#0077b6!important;color:#fff!important}' +
      '#rpN{background:#eef2f5!important;color:#555!important}' +
      '@keyframes rpR{0%,50%,100%{transform:rotate(0)}10%,30%{transform:rotate(-15deg)}20%,40%{transform:rotate(15deg)}}';
    document.head.appendChild(css);

    var box = document.createElement('div');
    box.id = 'rpX';
    box.innerHTML =
      '<div class="ic">🔔</div><div>' +
      '<h4>هل تريد تلقي إشعارات رفراف بلاج؟</h4>' +
      '<p>آخر الأخبار، الطقس، كراء المنازل وبيع الأراضي مباشرة على هاتفك.</p>' +
      '<div class="bt"><button id="rpY">نعم، فعّل</button><button id="rpN">لاحقاً</button></div></div>';
    document.body.appendChild(box);

    setTimeout(function(){ box.className = 'on'; }, 3000);

    document.getElementById('rpY').onclick = function(){
      var w = Math.min(420, screen.width), h = 560;
      var url = PUSH + '?from=' + encodeURIComponent(location.href);
      var win = window.open(url, 'rafrafpush',
        'width=' + w + ',height=' + h + ',left=' + ((screen.width - w) / 2) + ',top=' + ((screen.height - h) / 2));
      if(!win) location.href = url;
      save({done: 1}); box.className = '';
    };
    document.getElementById('rpN').onclick = function(){
      save({later: Date.now()}); box.className = '';
    };
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
