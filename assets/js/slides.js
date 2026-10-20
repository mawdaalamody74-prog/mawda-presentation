/* =========================================================
   مودة العمودي — محرك شرائح العرض
   RTL: السهم الأيسر = التالي، السهم الأيمن = السابق، مسافة = التالي
   ========================================================= */
(function () {
  'use strict';

  var deck = document.getElementById('deck');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var counter = document.getElementById('counter');
  var progressBar = document.getElementById('progressBar');
  var progress = document.getElementById('progress');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var announce = document.getElementById('slideAnnounce');

  if (!deck || !slides.length) return;

  var current = 0;
  var total = slides.length;
  var isAnimating = false;
  var pending = null;

  var PAD = function (n) { return String(n).padStart(2, '0'); };

  /* ------------------------- تحديث الحالة ------------------------- */
  function updateUI() {
    counter.textContent = PAD(current + 1) + ' / ' + PAD(total);

    var pct = ((current + 1) / total) * 100;
    progressBar.style.width = pct + '%';

    progress.setAttribute('aria-valuenow', String(current + 1));
    progress.setAttribute('aria-valuetext', 'الشريحة ' + (current + 1) + ' من ' + total);

    // يُعلِن تغيّر الشريحة لقارئات الشاشة دون سرقة التركيز
    if (announce) announce.textContent = 'الشريحة ' + (current + 1) + ' من ' + total;

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;

    if (location.hash !== '#' + slides[current].id) {
      history.replaceState(null, '', '#' + slides[current].id);
    }
  }

  /* ---------------------------- الانتقال ---------------------------- */
  function goTo(index, options) {
    options = options || {};
    if (index < 0 || index >= total || index === current) return;

    // أثناء الانتقال: نحتفظ بآخر طلب بدل إهمال ضغطات سريعة
    if (isAnimating) {
      pending = { index: index, options: options };
      return;
    }

    var outgoing = slides[current];
    var incoming = slides[index];

    isAnimating = true;
    pending = null;

    outgoing.classList.remove('is-active');
    outgoing.setAttribute('aria-hidden', 'true');
    outgoing.setAttribute('inert', '');

    incoming.classList.add('is-active');
    incoming.removeAttribute('aria-hidden');
    incoming.removeAttribute('inert');

    current = index;
    updateUI();

    if (options.focus) {
      var heading = incoming.querySelector('[data-slide-heading]');
      if (heading) heading.focus({ preventScroll: true });
    }

    window.setTimeout(function () {
      isAnimating = false;
      if (pending) {
        var queued = pending;
        pending = null;
        goTo(queued.index, queued.options);
      }
    }, 460);
  }

  function next() { goTo(current + 1, { focus: false }); }
  function prev() { goTo(current - 1, { focus: false }); }

  /* ------------------------ أزرار السابق/التالي ------------------------ */
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  /* ------------------------- لوحة المفاتيح ------------------------- */
  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    var tag = (event.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    switch (event.key) {
      // RTL: السهم البصري الأيسر = التالي
      case 'ArrowLeft':
        event.preventDefault();
        next();
        break;

      // RTL: السهم البصري الأيمن = السابق
      case 'ArrowRight':
        event.preventDefault();
        prev();
        break;

      case ' ':
      case 'Spacebar':
      case 'PageDown':
        event.preventDefault();
        next();
        break;

      case 'PageUp':
        event.preventDefault();
        prev();
        break;

      case 'Home':
        event.preventDefault();
        goTo(0, { focus: true });
        break;

      case 'End':
        event.preventDefault();
        goTo(total - 1, { focus: true });
        break;
    }
  });

  /* ------------------------- دعم السحب على اللمس ------------------------- */
  var touchStartX = null;
  var touchStartY = null;

  deck.addEventListener('touchstart', function (event) {
    var t = event.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  deck.addEventListener('touchend', function (event) {
    if (touchStartX === null) return;
    var t = event.changedTouches[0];
    var dx = t.clientX - touchStartX;
    var dy = t.clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;

    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.4) return;

    // اتجاه الـ DOM معكوس في RTL: السحب لليسار يكشف العنصر التالي
    if (dx < 0) { prev(); } else { next(); }
  }, { passive: true });

  /* ------------------------- التشغيل الأولي ------------------------- */
  function initFromHash() {
    var hash = location.hash.replace('#', '');
    if (!hash) return -1;
    for (var i = 0; i < total; i++) {
      if (slides[i].id === hash) return i;
    }
    return -1;
  }

  var startIndex = initFromHash();
  if (startIndex > 0) {
    slides[0].classList.remove('is-active');
    slides[0].setAttribute('aria-hidden', 'true');
    slides[0].setAttribute('inert', '');

    slides[startIndex].classList.add('is-active');
    slides[startIndex].removeAttribute('aria-hidden');
    slides[startIndex].removeAttribute('inert');
    current = startIndex;
  }

  updateUI();

  /* إظهار الحالة النهائية بلا انتقال مبدئي */
  deck.classList.add('is-ready');
})();
