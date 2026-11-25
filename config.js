// ====== إعدادات إشعارات rafrafplage.tn ======
var PN_CONFIG = {
  firebase: {
    apiKey: "AIzaSyCA0cr8o_nQi6wkZMayR-u7NgWmelwMTYQ",
    authDomain: "rafrafplage-push.firebaseapp.com",
    projectId: "rafrafplage-push",
    storageBucket: "rafrafplage-push.firebasestorage.app",
    messagingSenderId: "703324782475",
    appId: "1:703324782475:web:4480477b7fe3aec23c798e"
  },
  vapidKey: "BHkSCkbMYUqgVV-SsIeDsP9OZLicPRaaG-hNkrcpQxnxVgvVpSCuiu5B6T0-x5gaz24U6CJZD6TvyvCI2IdN8Vw",
  siteUrl: "https://www.rafrafplage.tn/",
  siteName: "رفراف بلاج"
};

// ====== تفاصيل جهاز المشترك (تظهر في لوحة الأدمن) ======
// يرجع: { model, os, browser, country, tz, screen } — كلها نصوص قصيرة
var PN_TZ_COUNTRY = {
  'Africa/Tunis':'TN','Africa/Algiers':'DZ','Africa/Casablanca':'MA','Africa/El_Aaiun':'MA','Africa/Tripoli':'LY','Africa/Cairo':'EG',
  'Africa/Khartoum':'SD','Africa/Nouakchott':'MR','Africa/Dakar':'SN','Africa/Abidjan':'CI','Africa/Lagos':'NG','Africa/Johannesburg':'ZA',
  'Europe/Paris':'FR','Europe/Brussels':'BE','Europe/Luxembourg':'LU','Europe/Monaco':'MC','Europe/Zurich':'CH','Europe/Berlin':'DE',
  'Europe/Rome':'IT','Europe/Madrid':'ES','Europe/Lisbon':'PT','Europe/London':'GB','Europe/Dublin':'IE','Europe/Amsterdam':'NL',
  'Europe/Vienna':'AT','Europe/Stockholm':'SE','Europe/Oslo':'NO','Europe/Copenhagen':'DK','Europe/Helsinki':'FI','Europe/Warsaw':'PL',
  'Europe/Prague':'CZ','Europe/Budapest':'HU','Europe/Bucharest':'RO','Europe/Athens':'GR','Europe/Istanbul':'TR','Europe/Moscow':'RU',
  'Europe/Kiev':'UA','Europe/Kyiv':'UA','Europe/Malta':'MT','Asia/Riyadh':'SA','Asia/Dubai':'AE','Asia/Qatar':'QA','Asia/Kuwait':'KW',
  'Asia/Bahrain':'BH','Asia/Muscat':'OM','Asia/Amman':'JO','Asia/Beirut':'LB','Asia/Damascus':'SY','Asia/Baghdad':'IQ','Asia/Gaza':'PS',
  'Asia/Hebron':'PS','Asia/Aden':'YE','Asia/Tehran':'IR','Asia/Karachi':'PK','Asia/Kolkata':'IN','Asia/Calcutta':'IN','Asia/Shanghai':'CN',
  'Asia/Tokyo':'JP','Asia/Seoul':'KR','Asia/Jakarta':'ID','Asia/Kuala_Lumpur':'MY','Asia/Singapore':'SG','Australia/Sydney':'AU',
  'America/New_York':'US','America/Chicago':'US','America/Denver':'US','America/Los_Angeles':'US','America/Phoenix':'US',
  'America/Toronto':'CA','America/Montreal':'CA','America/Vancouver':'CA','America/Mexico_City':'MX','America/Sao_Paulo':'BR'
};
function pnDeviceInfo() {
  var nav = (typeof navigator !== 'undefined') ? navigator : {};
  var ua = nav.userAgent || '';
  var cut = function (s) { return String(s || '').replace(/[<>"]/g, '').trim().slice(0, 60); };
  var info = { model: '', os: '', browser: '', country: '', tz: '', screen: '' };

  // البلد: من المنطقة الزمنية للجهاز (لا يحتاج أي خدمة خارجية)
  try { info.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  info.country = PN_TZ_COUNTRY[info.tz] || '';
  if (!info.country) { var m = /-([A-Z]{2})$/.exec(nav.language || ''); if (m && !/^Africa|^Europe|^Asia|^America/.test(info.tz)) info.country = m[1]; }
  try { if (typeof screen !== 'undefined') info.screen = screen.width + '×' + screen.height; } catch (e) {}

  // النظام
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  var m;
  if (isIOS) {
    m = /OS (\d+)[_.](\d+)/.exec(ua);
    info.os = 'iOS' + (m ? ' ' + m[1] + '.' + m[2] : '');
    info.model = /iPad/.test(ua) || (nav.platform === 'MacIntel') ? 'iPad' : 'iPhone';
  } else if ((m = /Android (\d+(\.\d+)?)/.exec(ua))) {
    info.os = 'Android ' + m[1];
    m = /Android [^;)]*; ([^;)]+?)(?: Build\/[^;)]*)?\)/.exec(ua);
    if (m && m[1] !== 'K' && !/^[a-z]{2}-[a-z]{2}$/i.test(m[1])) info.model = m[1];
  } else if (/Windows NT 10/.test(ua)) info.os = 'Windows 10';
  else if ((m = /Windows NT ([\d.]+)/.exec(ua))) info.os = 'Windows ' + m[1];
  else if ((m = /Mac OS X (\d+)[_.](\d+)/.exec(ua))) info.os = 'macOS ' + m[1] + '.' + m[2];
  else if (/CrOS/.test(ua)) info.os = 'ChromeOS';
  else if (/Linux/.test(ua)) info.os = 'Linux';

  // المتصفح
  var B = [[/SamsungBrowser\/(\d+)/, 'Samsung Internet'], [/EdgA?\/(\d+)/, 'Edge'], [/OPR\/(\d+)/, 'Opera'],
           [/MiuiBrowser\/(\d+)/, 'Mi Browser'], [/YaBrowser\/(\d+)/, 'Yandex'], [/Firefox\/(\d+)/, 'Firefox'],
           [/FxiOS\/(\d+)/, 'Firefox'], [/CriOS\/(\d+)/, 'Chrome'], [/Chrome\/(\d+)/, 'Chrome'], [/Version\/(\d+).*Safari/, 'Safari']];
  for (var i = 0; i < B.length; i++) { if ((m = B[i][0].exec(ua))) { info.browser = B[i][1] + ' ' + m[1]; break; } }
  if (isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)) info.browser = 'Safari';
  try { if (nav.standalone === true || (typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches)) info.browser += ' (تطبيق)'; } catch (e) {}

  // موديل الهاتف وإصدار Windows الحقيقي (Chrome/Edge فقط)
  var hi = (nav.userAgentData && nav.userAgentData.getHighEntropyValues)
    ? nav.userAgentData.getHighEntropyValues(['model', 'platformVersion']).catch(function () { return {}; })
    : Promise.resolve({});
  return Promise.race([hi, new Promise(function (r) { setTimeout(function () { r({}); }, 800); })]).then(function (h) {
    h = h || {};
    if (h.model) info.model = h.model;
    if (/^Windows/.test(info.os) && h.platformVersion) info.os = parseInt(h.platformVersion, 10) >= 13 ? 'Windows 11' : 'Windows 10';
    if (/^Android/.test(info.os) && h.platformVersion) info.os = 'Android ' + parseInt(h.platformVersion, 10);
    info.model = info.model.replace(/^SAMSUNG /i, '');
    if (/^SM-/.test(info.model)) info.model = 'Samsung ' + info.model;
    for (var k in info) info[k] = cut(info[k]);
    return info;
  });
}
// يحفظ التفاصيل للمشتركين القدامى مرة واحدة (db = firebase.firestore())
function pnSaveInfo(db, token) {
  try { if (!token || localStorage.getItem('pn_info') === token) return Promise.resolve(); } catch (e) { return Promise.resolve(); }
  return pnDeviceInfo().then(function (info) {
    return db.collection('subscribers').doc(token).update(info);
  }).then(function () { try { localStorage.setItem('pn_info', token); } catch (e) {} })
    .catch(function (e) { if (e && e.code === 'not-found') try { localStorage.removeItem('pn_fs'); } catch (x) {} });
}
