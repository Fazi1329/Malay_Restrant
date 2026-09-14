/* ============================================================
   MALAY RESTAURANT — Interactions, motion & micro-details
   ============================================================ */
(function () {
  'use strict';
  var hasGsap = typeof gsap !== 'undefined' && gsap;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Loader ---------- */
  var loader = document.getElementById('loader');
  var loaderBar = loader && loader.querySelector('.loader-bar span');
  var progress = 0;
  var fake = setInterval(function () {
    if (!loader) { clearInterval(fake); return; }
    progress = Math.min(96, progress + Math.random() * 18);
    if (loaderBar) loaderBar.style.width = progress + '%';
  }, 180);
  window.addEventListener('load', function () { finishLoad(); });
  setTimeout(finishLoad, 2400);
  function finishLoad() {
    if (!loader) return;
    progress = 100;
    if (loaderBar) loaderBar.style.width = '100%';
    setTimeout(function () {
      loader.classList.add('done');
      clearInterval(fake);
    }, 650);
  }

  /* ---------- Nav state ---------- */
  var nav = document.getElementById('nav');
  function onNavScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll();

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  function toggleMenu(open) {
    if (!burger || !mobileMenu) return;
    var isOpen = open !== undefined ? open : burger.classList.contains('open');
    burger.classList.toggle('open', !isOpen);
    mobileMenu.classList.toggle('open', !isOpen);
    burger.setAttribute('aria-expanded', String(!isOpen));
    mobileMenu.setAttribute('aria-hidden', String(isOpen));
    document.body.style.overflow = isOpen ? '' : 'hidden';
  }
  if (burger) burger.addEventListener('click', function () { toggleMenu(); });
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { toggleMenu(true); });
    });
  }

  /* ---------- Reveal system ---------- */
  function initReveals() {
    var all = document.querySelectorAll('.reveal');
    var items = [];
    for (var i = 0; i < all.length; i++) {
      if (!all[i].closest('.hero')) items.push(all[i]);
    }
    var animateIn = function (el) { el.classList.add('in'); };

    var heroReveals = [];
    for (var h = 0; h < all.length; h++) {
      if (all[h].closest('.hero')) heroReveals.push(all[h]);
    }

    if (hasGsap && typeof ScrollTrigger !== 'undefined' && !reduced && 'IntersectionObserver' in window) {
      items.forEach(function (el) {
        gsap.fromTo(el,
          { opacity: 0, y: 36 },
          {
            opacity: 1, y: 0, duration: 1.15, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 86%', once: true }
          }
        );
      });
      heroReveals.forEach(function (el) {
        gsap.fromTo(el,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1.3, ease: 'power3.out', delay: 0.9 }
        );
      });
    } else if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      items.forEach(function (el) { io.observe(el); });
      heroReveals.forEach(function (el) { io.observe(el); });
    } else {
      items.forEach(animateIn);
      heroReveals.forEach(animateIn);
    }
  }

  /* ---------- Values sequential reveal ---------- */
  function initValues() {
    var lines = document.querySelectorAll('.value-line');
    if (!lines.length) return;
    if (!('IntersectionObserver' in window)) { lines.forEach(function (l) { l.classList.add('shown'); }); return; }
    var iv = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var ls = en.target.querySelectorAll('.value-line');
          ls.forEach(function (l, i) {
            setTimeout(function () { l.classList.add('shown'); }, i * 320);
          });
          iv.unobserve(en.target);
        }
      });
    }, { threshold: 0.18 });
    iv.observe(document.querySelector('.values-sticky'));
  }

  /* ---------- Dish card 3D tilt ---------- */
  function initTilt() {
    var cards = document.querySelectorAll('[data-tilt]');
    if (reduced || !window.matchMedia('(hover:hover)').matches) return;
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = 'transform .15s ease-out, box-shadow .6s ease';
        card.style.transform = 'perspective(1000px) rotateX(' + (-y * 5) + 'deg) rotateY(' + (x * 7) + 'deg) translateY(-6px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform .7s cubic-bezier(.22,.61,.36,1), box-shadow .7s';
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  }

  /* ---------- Menu experience (data-driven from menu-data.js) ---------- */
  function initMenuPlate() {
    var tabs = document.getElementById('catTabs');
    var panel = document.getElementById('dishPanel');
    var title = document.getElementById('dpTitle');
    var list = document.getElementById('dpList');
    var count = document.getElementById('dpCount');
    var plateImg = document.getElementById('plateImg');
    var plate = document.getElementById('plate3d');
    if (!tabs || !panel || !list) return;

    var data = (window.MALAY_MENU && window.MALAY_MENU['Malay Restaurant']) || null;
    if (!data) return;

    var categories = Object.keys(data);
    var plateImgs = [
      'assets/hero-food.jpg',
      'assets/restaurant-2.jpg',
      'assets/restaurant-1.jpg'
    ];
    function imgForCat(idx) { return plateImgs[idx % plateImgs.length]; }

    function fmtPrice(p) {
      if (typeof p === 'number') return 'Rs. ' + p.toLocaleString('en-US');
      if (typeof p === 'string' && p) return p;
      return '';
    }

    // Build tabs
    categories.forEach(function (cat, idx) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cat' + (idx === 0 ? ' active' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('data-idx', idx);
      b.textContent = cat;
      b.addEventListener('click', function () { selectCat(idx); });
      tabs.appendChild(b);
    });

    function renderList(cat) {
      var items = data[cat] || [];
      list.innerHTML = '';
      items.forEach(function (item) {
        var li = document.createElement('li');
        li.className = 'dish-row';
        var name = document.createElement('div');
        name.className = 'dr-name';
        name.textContent = item.name;
        if (item.kcal) {
          var k = document.createElement('span');
          k.className = 'dr-kcal';
          k.textContent = item.kcal + ' kcal';
          name.appendChild(k);
        }
        var price = document.createElement('div');
        price.className = 'dr-price';
        price.textContent = fmtPrice(item.price);
        li.appendChild(name);
        li.appendChild(price);
        list.appendChild(li);
      });
      if (title) title.textContent = cat;
      if (count) count.textContent = items.length + (items.length === 1 ? ' item' : ' items');
    }

    var active = 0;
    var rot = 0;
    function selectCat(idx) {
      if (idx === active) return;
      active = idx;
      if (tabs) {
        var btns = tabs.querySelectorAll('.cat');
        for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', i === idx);
      }
      var cat = categories[idx];
      // smooth swap on the plate
      if (plate) {
        rot += 9;
        plate.style.setProperty('--rz', rot + 'deg');
        plate.style.transform = 'scale(0.97)';
        setTimeout(function () { plate.style.transform = 'scale(1)'; }, 180);
      }
      if (plateImg) {
        plateImg.style.opacity = 0.1;
        plateImg.style.transform = 'scale(1.08)';
        setTimeout(function () {
          plateImg.src = imgForCat(idx);
          plateImg.style.opacity = 1;
          plateImg.style.transform = 'scale(1)';
        }, 320);
      }
      if (panel) {
        panel.style.opacity = 0.35;
        panel.style.transform = 'translateY(8px)';
      }
      renderList(cat);
      if (panel) {
        panel.style.opacity = 1;
        panel.style.transform = 'none';
        panel.style.transition = 'opacity .6s ease, transform .6s ease';
      }
    }

    // initial render
    renderList(categories[0]);
    if (title) title.textContent = categories[0];
    if (count) count.textContent = data[categories[0]].length + ' items';

    // auto-cycle plate image every 6 seconds for ambient motion (paused on hover/reduced)
    if (!reduced) {
      var auto = 1;
      setInterval(function () {
        if (auto) {
          var idx = (active + 1) % categories.length;
          if (plateImg) {
            plateImg.style.opacity = 0.35;
            setTimeout(function () {
              plateImg.src = imgForCat(idx);
              plateImg.style.opacity = 1;
            }, 350);
          }
        }
      }, 6000);
      tabs.addEventListener('mouseenter', function () { auto = 0; });
      tabs.addEventListener('mouseleave', function () { auto = 1; });
      panel.addEventListener('mouseenter', function () { auto = 0; });
      panel.addEventListener('mouseleave', function () { auto = 1; });
    }

    // mouse parallax tilt on the plate
    if (!reduced && window.matchMedia('(hover:hover)').matches && plate) {
      var holder = plate.parentElement;
      holder.addEventListener('mousemove', function (e) {
        var r = holder.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        plate.style.transform = 'rotateY(' + x * 12 + 'deg) rotateX(' + (-y * 9) + 'deg) perspective(1200px)';
      });
      holder.addEventListener('mouseleave', function () {
        plate.style.transform = '';
      });
    }
  }

  /* ---------- Flavour wheel breathing ---------- */
  function initFlavours() {
    if (reduced) return;
    var kind = [.02, .03, .025, .035, .018];
    var flavours = document.querySelectorAll('.flavour');
    if (!flavours.length || !window.matchMedia('(hover:hover)').matches) return;
    var rAF;
    function breathe() {
      var t = performance.now() * 0.001;
      flavours.forEach(function (f, i) {
        var base = parseFloat(f.getAttribute('data-bi') || 0);
        var k = kind[i % kind.length];
        f.style.marginLeft = (base + Math.sin(t + i * 1.4) * 6) + 'px';
        f.style.marginTop = (base + Math.cos(t * 0.9 + i * 1.1) * 5) + 'px';
      });
      rAF = requestAnimationFrame(breathe);
    }
    breathe();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(rAF);
      else rAF = requestAnimationFrame(breathe);
    });
  }

  /* ---------- Gallery lightbox ---------- */
  function initGallery() {
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lbImg');
    var lbCap = document.getElementById('lbCap');
    var lbClose = document.getElementById('lbClose');
    if (!lb) return;
    document.querySelectorAll('.gal-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var img = item.querySelector('img');
        if (!img) return;
        if (lbImg) lbImg.src = img.src;
        if (lbCap) lbCap.textContent = item.getAttribute('data-modal') || item.querySelector('figcaption').textContent;
        lb.classList.add('open');
        lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    });
    function close() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    if (lbClose) lbClose.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------- Sticky CTA ---------- */
  function initSticky() {
    var cta = document.querySelector('.sticky-cta');
    if (!cta) return;
    var hero = document.getElementById('home');
    if (!hero) return;
    function onScroll() {
      cta.style.opacity = window.scrollY > hero.offsetHeight * 0.7 ? '1' : '0';
      cta.style.pointerEvents = window.scrollY > hero.offsetHeight * 0.7 ? 'auto' : 'none';
    }
    cta.style.opacity = 0;
    cta.style.pointerEvents = 'none';
    cta.style.transition = 'opacity .5s ease';
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Scroll progress bar ---------- */
  function initProgress() {
    var bar = document.getElementById('progress');
    var span = bar && bar.querySelector('span');
    if (!bar || !span) return;
    function onScroll() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      span.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    var el = document.getElementById('cursor');
    if (!el || reduced) return;
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var x = 0, y = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; }, { passive: true });
    (function loop() {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      el.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
      requestAnimationFrame(loop);
    })();
    var grow = 'a, button, .gal-item, .cat, .brand-card, .value-line, .tl-card, input, select';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(grow)) el.classList.add('grow');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(grow)) el.classList.remove('grow');
    });
  }

  /* ---------- Timeless parallax (experience block, gap-proof) ---------- */
  function initParallax() {
    if (reduced) return;
    var media = document.querySelector('.exp-media');
    var copy = document.querySelector('.exp-copy');
    if (!media && !copy) return;
    if (hasGsap && typeof ScrollTrigger !== 'undefined') {
      if (media) {
        gsap.fromTo(media,
          { y: 34 },
          { y: -24, ease: 'none',
            scrollTrigger: { trigger: '#experience', start: 'top bottom', end: 'bottom top', scrub: 1 } });
      }
      if (copy) {
        gsap.fromTo(copy,
          { y: 0 },
          { y: 20, ease: 'none',
            scrollTrigger: { trigger: '#experience', start: 'top bottom', end: 'bottom top', scrub: 1 } });
      }
      return;
    }
    var el = media;
    window.addEventListener('scroll', function () {
      if (!el) return;
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var min = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
      el.style.transform = 'translateY(' + (30 - min * 54) + 'px)';
    }, { passive: true });
  }

  /* ---------- Active nav highlighting ---------- */
  function initNavSpy() {
    var links = document.querySelectorAll('.nav-link');
    var map = {};
    ['story', 'brands', 'menu', 'catering', 'experience', 'location'].forEach(function (id) {
      var sec = document.getElementById(id);
      var link = Array.prototype.find.call(links, function (a) { return a.getAttribute('href') === '#' + id; });
      if (sec && link) map[id] = { sec: sec, link: link };
    });
    var current = null;
    window.addEventListener('scroll', function () {
      var pos = window.scrollY + 140;
      var found = null;
      for (var id in map) {
        var m = map[id];
        if (m.sec.offsetTop <= pos && m.sec.offsetTop + m.sec.offsetHeight > pos) found = m.link;
      }
      if (found !== current) {
        current = found;
        links.forEach(function (l) { l.classList.remove('active'); });
        if (current) current.classList.add('active');
      }
    }, { passive: true });
    // window resize could change offsetTop values
    window.addEventListener('resize', function () { current = null; }, { passive: true });
  }

  /* ---------- Timeline parallax glow ---------- */
  function initTimeline() {
    var track = document.getElementById('timelineTrack');
    if (!track || reduced) return;
    var cards = track.querySelectorAll('.tl-card');
    if (!window.matchMedia('(hover:hover)').matches) return;
    track.addEventListener('mousemove', function (e) {
      cards.forEach(function (card) {
        var r = card.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = (e.clientX - cx) / (r.width / 2);
        var dy = (e.clientY - cy) / (r.height / 2);
        card.style.transform = 'translateY(' + (-6 + dy * -4) + 'px) rotateX(' + (dy * 3) + 'deg) rotateY(' + (dx * 3) + 'deg)';
      });
    });
    track.addEventListener('mouseleave', function () {
      cards.forEach(function (card) { card.style.transform = ''; });
    });
  }

  /* ---------- Brand switcher (six concepts) ---------- */
  var SLUG_LOOKUP = {
    malay: 'malay-restaurant', asiana: 'cafe-asiana', shanghai: 'shanghai-wok',
    nelum: 'nelum-flower', pdarbar: 'pakistan-darbar', darbar: 'darbar-biryani-bbq'
  };

  function initBrandSwitcher() {
    var cards = document.querySelectorAll('.brand-card[data-brand]');
    var panel = document.getElementById('bsPanel');
    var chips = document.getElementById('bsChips');
    if (!cards.length || !panel) return;

    function brandFood(id) {
      if (!window.MALAY_MENU) return [];
      var name = BRAND_NAME_LOOKUP[id] || id;
      var set = window.MALAY_MENU[name];
      if (!set || !Object.keys(set).length) return [];
      var out = [];
      Object.keys(set).forEach(function (cat) {
        if (out.length >= 6) return;
        (set[cat] || []).slice(0, 2).forEach(function (it) {
          if (out.length >= 6) return;
          out.push({ name: it.name, price: it.price });
        });
      });
      return out;
    }
    var BRAND_NAME_LOOKUP = {
      malay: 'Malay Restaurant', asiana: 'Cafe Asiana', shanghai: 'Shanghai Wok',
      nelum: 'Nelum Flower', pdarbar: 'Pakistan Darbar', darbar: 'Darbar Biryani & BBQ'
    };

    function render(id) {
      var info = window.CRM && window.CRM.BRANDS.find(function (b) { return b.id === id; });
      var name = BRAND_NAME_LOOKUP[id] || id;
      var food = brandFood(id);
      var dishes = food.length
        ? food.map(function (f) {
            return '<div class="bs-dish"><b>' + f.name + '</b><span>' + (f.price ? 'Rs. ' + Number(f.price).toLocaleString('en-LK') : '') + '</span></div>';
          }).join('')
        : '<p class="bs-none">On request &mdash; this kitchen builds menus per event and occasion.</p>';
      panel.innerHTML =
        '<div class="bs-mark" style="--accent:' + (info ? info.tone : '#C9A86A') + '"><b>' + name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase() + '</b></div>' +
        '<div class="bs-main">' +
          '<p class="eyebrow">' + (info ? info.cuisine : 'Culinary concept') + '</p>' +
          '<h3>' + name + '</h3>' +
          '<p class="bs-desc">' + (info ? info.desc : '') + '</p>' +
          '<div class="bs-dishes">' + dishes + '</div>' +
        '</div>' +
        '<div class="bs-actions">' +
          '<a href="/' + SLUG_LOOKUP[id] + '/" class="btn btn-gold">Visit Brand Page &rarr;</a>' +
          '<a href="#catering" class="btn btn-ghost" onclick="cateringPickBrand(\'' + id + '\')">Cater from this concept</a>' +
        '</div>';
      cards.forEach(function (c) { c.classList.toggle('active', c.getAttribute('data-brand') === id); });
      if (chips) chips.querySelectorAll('.bs-chip').forEach(function (ch) {
        ch.classList.toggle('active', ch.getAttribute('data-brand') === id);
      });
    }

    // quick-preview chips (non-navigating)
    if (chips) {
      cards.forEach(function (card) {
        var id = card.getAttribute('data-brand');
        var name = BRAND_NAME_LOOKUP[id] || id;
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'bs-chip';
        chip.setAttribute('data-brand', id);
        chip.setAttribute('aria-label', 'Preview ' + name);
        chip.textContent = name;
        chip.addEventListener('click', function () { render(id); });
        chips.appendChild(chip);
      });
    }

    cards.forEach(function (card, i) {
      card.setAttribute('tabindex', '0');
      if (i === 0) render(card.getAttribute('data-brand'));
    });
  }

  function cateringPickBrand(id) {
    var sel = document.getElementById('cfBrand');
    if (sel) sel.value = id;
    var note = document.getElementById('cfBrandNote');
    if (note) note.style.display = (id === 'any' || id === 'notsure') ? 'block' : 'none';
  }
  window.cateringPickBrand = cateringPickBrand;

  /* ---------- Manifest all mobile-friendly after DOM ---------- */
  window.addEventListener('DOMContentLoaded', function () {
    initReveals();
    initValues();
    initTilt();
    initMenuPlate();
    initFlavours();
    initGallery();
    initSticky();
    initTimeline();
    initParallax();
    initProgress();
    initCursor();
    initNavSpy();
    initBrandSwitcher();
  });
})();