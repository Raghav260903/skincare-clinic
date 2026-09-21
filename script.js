/* VaaveDerm — interactions */
(function () {
  'use strict';

  /* ---- CONFIG: point this at your real lead-capture endpoint ---- */
  const LEAD_ENDPOINT = 'https://api.YOURDOMAIN.com/leads';
  /* ---- CONFIG: clinic's WhatsApp number, country code + number, no + or spaces ---- */
  const WHATSAPP_NUMBER = '919444879169';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ---------- Year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile menu ---------- */
  const toggle = $('#mobileToggle');
  const nav = $('#navMenu');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('active');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      toggle.innerHTML = open
        ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    });
    nav.addEventListener('click', e => {
      if (e.target.closest('a')) {
        nav.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('active')) toggle.click();
    });
  }

  /* ---------- Header state, scroll progress, back to top, active link ---------- */
  const header = $('#header');
  const progress = $('#scrollProgress');
  const toTop = $('#toTop');
  const sections = $$('main section[id]');
  const navLinks = $$('.nav-menu a');

  function setHeaderHeightVar() {
    if (header) document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }

  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 10);
    if (toTop) toTop.classList.toggle('show', y > 600);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    let current = '';
    sections.forEach(sec => {
      if (y >= sec.offsetTop - 140) current = sec.id;
    });
    navLinks.forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === '#' + current)
    );
    setHeaderHeightVar();
  }
  window.addEventListener('resize', setHeaderHeightVar);
  setHeaderHeightVar();
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    );
  }

  /* ---------- Doctor photo carousel ---------- */
  const doctorCarousel = $('#doctorCarousel');
  if (doctorCarousel) {
    const slides = $$('.doctor-slide', doctorCarousel);
    const prevBtn = $('#doctorPrev', doctorCarousel);
    const nextBtn = $('#doctorNext', doctorCarousel);
    const dotsWrap = $('#doctorDots', doctorCarousel);
    let idx = slides.findIndex(s => s.classList.contains('active'));
    if (idx < 0) idx = 0;

    if (dotsWrap && slides.length > 1) {
      slides.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'carousel-dot';
        dotsWrap.appendChild(dot);
      });
    }
    const dots = $$('.carousel-dot', dotsWrap || doctorCarousel);

    function showSlide(next) {
      slides[idx].classList.remove('active');
      if (dots[idx]) dots[idx].classList.remove('active');
      idx = (next + slides.length) % slides.length;
      slides[idx].classList.add('active');
      if (dots[idx]) dots[idx].classList.add('active');
    }
    if (dots[idx]) dots[idx].classList.add('active');

    if (nextBtn) nextBtn.addEventListener('click', () => showSlide(idx + 1));
    if (prevBtn) prevBtn.addEventListener('click', () => showSlide(idx - 1));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- Animated stat counters ---------- */
  const counters = $$('.stat-card h3[data-count]');
  function runCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    if (reduce) { el.textContent = target.toLocaleString('en-IN') + suffix; return; }
    const dur = 1400, start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { runCounter(en.target); obs.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => co.observe(el));
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- FAQ accordion ---------- */
  const headers = $$('.accordion-header');
  function contentFor(header) {
    const item = header.closest('.accordion-item');
    return item ? $('.accordion-content', item) : null;
  }
  function closeAll(except) {
    headers.forEach(h => {
      if (h === except) return;
      h.setAttribute('aria-expanded', 'false');
      const c = contentFor(h);
      if (c) c.style.maxHeight = null;
    });
  }
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const content = contentFor(header);
      if (!content) return;
      const open = header.getAttribute('aria-expanded') === 'true';
      closeAll(header);
      header.setAttribute('aria-expanded', String(!open));
      content.style.maxHeight = open ? null : content.scrollHeight + 'px';
    });
  });
  window.addEventListener('resize', () => {
    headers.forEach(h => {
      if (h.getAttribute('aria-expanded') === 'true') {
        const c = contentFor(h);
        if (c) c.style.maxHeight = c.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Prefill concern from service cards ---------- */
  const concernSelect = $('#patientConcern');
  $$('[data-prefill]').forEach(link => {
    link.addEventListener('click', () => {
      if (!concernSelect) return;
      const val = link.dataset.prefill;
      const match = Array.from(concernSelect.options).find(o => o.value === val || o.text === val);
      if (match) concernSelect.value = match.value;
      setTimeout(() => $('#patientName') && $('#patientName').focus({ preventScroll: true }), 600);
    });
  });

  /* ---------- Date-aware slot availability ---------- */
  // Lets a patient pick the day they want (never a day in the past), and
  // automatically greys out any time slot that has already ended today —
  // e.g. once it's past 1 PM, "Morning (10 AM – 1 PM)" can no longer be
  // picked for today's date; picking a future date makes every slot
  // available again.
  const dateField = $('#patientDate');
  const slotField = $('#patientSlot');

  function pad2(n) { return String(n).padStart(2, '0'); }
  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function toMinutes(hhmm) {
    const parts = String(hhmm).split(':');
    return Number(parts[0]) * 60 + Number(parts[1]);
  }
  function formatDateLabel(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (dateField) {
    dateField.min = todayISO();

    // Calendar-picker-only: the patient should never be able to type a day,
    // month or year (e.g. keying in a stray "2025") straight into the
    // field — the date can only come from picking it on the native
    // calendar. "readonly" (set in the HTML) already stops typed input in
    // most browsers; this backs that up everywhere and makes sure a click
    // or focus always opens the calendar instead of just sitting there.
    function openDatePicker() {
      if (typeof dateField.showPicker === 'function') {
        try { dateField.showPicker(); } catch (_) { /* ignore: needs a user gesture in some browsers */ }
      }
    }
    dateField.addEventListener('keydown', e => {
      if (e.key !== 'Tab') e.preventDefault();
    });
    dateField.addEventListener('paste', e => e.preventDefault());
    dateField.addEventListener('mousedown', openDatePicker);
    dateField.addEventListener('focus', openDatePicker);
  }

  function updateSlotAvailability() {
    if (!slotField) return;
    const dateVal = dateField ? dateField.value : '';
    const isToday = Boolean(dateVal) && dateVal === todayISO();
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    let anyEnabled = false;
    $$('option', slotField).forEach(opt => {
      const end = opt.dataset.end;
      const pastForToday = isToday && end && toMinutes(end) <= nowMinutes;
      opt.disabled = Boolean(pastForToday);
      if (!opt.disabled) anyEnabled = true;
    });

    // If the slot that was selected just aged out, clear the selection
    // so the patient has to actively pick a slot that's still open.
    const selected = slotField.selectedOptions[0];
    if (slotField.value && selected && selected.disabled) {
      slotField.value = '';
    }

    setError('patientSlot', isToday && !anyEnabled ? 'No slots left for today — please pick another date.' : '');
  }

  if (dateField) {
    dateField.addEventListener('change', updateSlotAvailability);
  }
  updateSlotAvailability();

  /* ---------- Lead form ---------- */
  const form = $('#leadForm');
  const successBox = $('#bookingSuccess');
  let pendingRedirect = null;

  function setError(id, msg) {
    const field = document.getElementById(id);
    if (!field) return;
    const group = field.closest('.form-group');
    group.classList.toggle('invalid', Boolean(msg));
    const err = group.querySelector('.err');
    if (err) err.textContent = msg || '';
  }

  if (form) {
    ['patientName', 'patientPhone', 'patientConcern', 'patientDate', 'patientSlot'].forEach(id => {
      const f = document.getElementById(id);
      if (f) f.addEventListener('input', () => setError(id, ''));
      if (f && f.tagName === 'SELECT') f.addEventListener('change', () => setError(id, ''));
    });

    const phoneField = $('#patientPhone');
    if (phoneField) {
      phoneField.addEventListener('input', () => {
        phoneField.value = phoneField.value.replace(/\D/g, '').slice(0, 10);
      });
    }

    const nameField = $('#patientName');
    if (nameField) {
      nameField.addEventListener('input', () => {
        nameField.value = nameField.value.replace(/[^A-Za-z ]/g, '');
      });
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      if ($('#company') && $('#company').value) return; // honeypot: silent drop

      const name = $('#patientName').value.trim();
      const phone = $('#patientPhone').value.trim();
      const concern = $('#patientConcern').value;
      const dateVal = $('#patientDate') ? $('#patientDate').value : '';
      const slot = $('#patientSlot') ? $('#patientSlot').value : '';
      let ok = true;

      if (!/^[A-Za-z ]{2,}$/.test(name.trim())) { setError('patientName', 'Use letters only, no numbers or symbols.'); ok = false; }
      if (!/^[6-9]\d{9}$/.test(phone)) { setError('patientPhone', 'Enter a valid 10-digit Indian mobile number.'); ok = false; }
      if (!concern) { setError('patientConcern', 'Pick the concern you want treated.'); ok = false; }
      if (!dateVal) { setError('patientDate', 'Pick the date you want to visit.'); ok = false; }
      else if (dateVal < todayISO()) { setError('patientDate', 'Please pick today or a future date from the calendar.'); ok = false; }
      if (!slot) { setError('patientSlot', 'Pick a time slot, or choose another date.'); ok = false; }
      if (!ok) {
        const firstBad = form.querySelector('.form-group.invalid input, .form-group.invalid select');
        if (firstBad) firstBad.focus();
        return;
      }

      const btn = $('#leadSubmit');
      btn.disabled = true;
      btn.textContent = 'Redirecting to WhatsApp…';

      const dateLabel = formatDateLabel(dateVal);

      // Optional: log the lead to your own backend/CRM in the background.
      // This never blocks the WhatsApp redirect below, so a dead endpoint
      // (or none configured yet) won't stop the patient from reaching you.
      try {
        fetch(LEAD_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, phone: '+91' + phone, concern, date: dateVal, slot,
            source: 'website-hero-form', submittedAt: new Date().toISOString()
          })
        }).catch(() => {});
      } catch (_) {}

      if (window.gtag) window.gtag('event', 'generate_lead', { concern: concern });

      const message =
        'Hi VaaveDerm, I would like to book a consultation.\n' +
        'Name: ' + name + '\n' +
        'Phone: +91' + phone + '\n' +
        'Concern: ' + concern + '\n' +
        'Preferred date: ' + dateLabel + '\n' +
        'Preferred time: ' + slot;

      const waLink = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);

      $('#successMsg').textContent =
        name + ', your ' + concern.toLowerCase() +
        ' request has been sent to WhatsApp for ' + dateLabel + ', ' + slot.toLowerCase() + '.';
      form.hidden = true;
      successBox.hidden = false;
      const waBtn = $('#waConfirmBtn');
      if (waBtn) waBtn.href = waLink;
      successBox.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });

      sessionStorage.setItem('vd_slot_sent', JSON.stringify({ name, concern, date: dateVal, slot }));
      pendingRedirect = setTimeout(() => { window.location.href = waLink; }, 3000);
    });
  }

  const resetBtn = $('#resetForm');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      clearTimeout(pendingRedirect);
      sessionStorage.removeItem('vd_slot_sent');
      form.reset();
      ['patientName', 'patientPhone', 'patientConcern', 'patientDate', 'patientSlot'].forEach(id => setError(id, ''));
      updateSlotAvailability();
      successBox.hidden = true;
      form.hidden = false;
      const successHeading = $('#successHeading');
      if (successHeading) successHeading.textContent = 'Your appointment request has been sent';
      const submitBtn = $('#leadSubmit');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Request my slot'; }
      $('#patientName').focus();
    });
  }

  // If the person already submitted and got redirected to WhatsApp earlier in
  // this browser tab (session), coming back here (via back button, bfcache,
  // or a fresh reload of the same tab) should show a completed state instead
  // of replaying the transient "sending…" message.
  (function restoreSentState() {
    const raw = sessionStorage.getItem('vd_slot_sent');
    if (!raw || !form || !successBox) return;
    let data;
    try { data = JSON.parse(raw); } catch (_) { return; }
    const successHeading = $('#successHeading');
    if (successHeading) successHeading.textContent = 'Your appointment request has been sent';
    const msg = $('#successMsg');
    if (msg && data) {
      const dateLabel = data.date ? formatDateLabel(data.date) : '';
      msg.textContent =
        data.name + ', your ' + String(data.concern).toLowerCase() +
        ' request for ' + (dateLabel ? dateLabel + ', ' : '') + String(data.slot).toLowerCase() +
        ' has already been sent to WhatsApp.';
    }
    form.hidden = true;
    successBox.hidden = false;
  })();

  /* ---------- Bag / cart drawer ---------- */
  const countEl = $('#cartCount');
  const cartBtn = $('#cartBtn');
  const cartOverlay = $('#cartOverlay');
  const cartDrawer = $('#cartDrawer');
  const cartClose = $('#cartClose');
  const cartItemsEl = $('#cartItems');
  const cartEmptyEl = $('#cartEmpty');
  const cartFooterEl = $('#cartFooter');
  const cartTotalEl = $('#cartTotal');
  const cartWaBtn = $('#cartWaBtn');

  let bag = []; // { name, price, qty }

  function bagQty() { return bag.reduce((s, i) => s + i.qty, 0); }
  function bagTotal() { return bag.reduce((s, i) => s + i.qty * i.price, 0); }

  function renderCountBadge() {
    if (!countEl) return;
    const qty = bagQty();
    countEl.textContent = String(qty);
    countEl.hidden = qty === 0;
  }

  function renderDrawer() {
    if (!cartItemsEl) return;
    cartItemsEl.innerHTML = '';
    const hasItems = bag.length > 0;
    cartEmptyEl.hidden = hasItems;
    cartFooterEl.hidden = !hasItems;

    bag.forEach(item => {
      const safeName = item.name.replace(/"/g, '&quot;');
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML =
        '<div class="cart-item-top">' +
          '<span class="cart-item-name">' + item.name + '</span>' +
          '<button class="cart-item-remove" data-name="' + safeName + '" aria-label="Remove ' + item.name + '">&times;</button>' +
        '</div>' +
        '<div class="cart-item-bottom">' +
          '<div class="qty-stepper">' +
            '<button class="qty-btn qty-minus" data-name="' + safeName + '" aria-label="Decrease quantity of ' + item.name + '">&minus;</button>' +
            '<span class="qty-value">' + item.qty + '</span>' +
            '<button class="qty-btn qty-plus" data-name="' + safeName + '" aria-label="Increase quantity of ' + item.name + '">+</button>' +
          '</div>' +
          '<span class="cart-item-total">₹' + (item.qty * item.price).toLocaleString('en-IN') + ' <small>(₹' + item.price.toLocaleString('en-IN') + ' each)</small></span>' +
        '</div>';
      cartItemsEl.appendChild(row);
    });

    if (cartTotalEl) cartTotalEl.textContent = '₹' + bagTotal().toLocaleString('en-IN');
  }

  function renderBag() {
    renderCountBadge();
    renderDrawer();
  }

  function openCart() {
    if (!cartDrawer) return;
    cartOverlay.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cartOverlay.classList.add('open');
        cartDrawer.classList.add('open');
      });
    });
    cartDrawer.setAttribute('aria-hidden', 'false');
    cartBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
  }
  function closeCart() {
    if (!cartDrawer) return;
    cartOverlay.classList.remove('open');
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    cartBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    setTimeout(() => { if (!cartDrawer.classList.contains('open')) cartOverlay.hidden = true; }, 350);
  }

  $$('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name || 'Item';
      const price = Number(btn.dataset.price || 0);
      const existing = bag.find(i => i.name === name);
      if (existing) existing.qty += 1;
      else bag.push({ name, price, qty: 1 });
      renderBag();

      const original = btn.textContent;
      btn.textContent = 'Added ✓';
      btn.classList.add('added');
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('added');
        btn.disabled = false;
      }, 1800);
    });
  });

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && cartDrawer && cartDrawer.classList.contains('open')) closeCart();
  });

  if (cartItemsEl) {
    cartItemsEl.addEventListener('click', e => {
      const removeBtn = e.target.closest('.cart-item-remove');
      const plusBtn = e.target.closest('.qty-plus');
      const minusBtn = e.target.closest('.qty-minus');

      if (removeBtn) {
        const name = removeBtn.dataset.name;
        bag = bag.filter(i => i.name !== name);
        renderBag();
        return;
      }

      if (plusBtn) {
        const item = bag.find(i => i.name === plusBtn.dataset.name);
        if (item) { item.qty += 1; renderBag(); }
        return;
      }

      if (minusBtn) {
        const name = minusBtn.dataset.name;
        const item = bag.find(i => i.name === name);
        if (!item) return;
        item.qty -= 1;
        if (item.qty <= 0) {
          bag = bag.filter(i => i.name !== name);
        }
        renderBag();
      }
    });
  }

  if (cartWaBtn) {
    cartWaBtn.addEventListener('click', e => {
      e.preventDefault();
      if (!bag.length) return;
      const lines = bag.map(i =>
        '- ' + i.name + ' x' + i.qty + ' — ₹' + (i.qty * i.price).toLocaleString('en-IN')
      );
      const message =
        'Hi VaaveDerm, I would like to order these products:\n' +
        lines.join('\n') + '\n' +
        'Total: ₹' + bagTotal().toLocaleString('en-IN');
      const waLink = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
      window.location.href = waLink;
    });
  }

  /* ---------- Before / after comparison ---------- */
  $$('[data-ba]').forEach(ba => {
    const range = $('.ba-range', ba);
    const before = $('.ba-before', ba);
    const handle = $('.ba-handle', ba);
    const divider = $('.ba-divider', ba);
    if (!range || !before) return;
    function sync() {
      const v = Number(range.value);
      before.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
      if (handle) handle.style.left = v + '%';
      if (divider) divider.style.left = v + '%';
    }
    range.addEventListener('input', sync);
    sync();
  });

  /* ---------- Reviews slider ---------- */
  const track = $('#reviewTrack');
  if (track) {
    const step = () => Math.min(380, track.clientWidth * 0.86);
    const prev = $('#revPrev'), next = $('#revNext');
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  }
})();