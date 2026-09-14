/* ============================================================
   MALAY GROUP — six-concept brand page renderer
   Each /<slug>/index.html sets window.BRAND; this script builds
   the page from js/brand-data.js + the real menu workbook data.
   ============================================================ */
(function () {
  'use strict';

  var slug = window.BRAND || 'malay-restaurant';
  var data = (window.MALY_BRANDS || {})[slug];
  if (!data) {
    document.documentElement.innerHTML = '<h1 style="font:700 22px Georgia">Brand not found</h1>';
    return;
  }

var host = null;
var MENU = (window.MALAY_MENU || {})[data.menuKey];
var hasMenu = !!(MENU && Object.keys(MENU).length);
var others = null;
var menuBlocks = '';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(n) {
    var v = Number(n).toFixed(2);
    return 'Rs. ' + v.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function otherBrands() {
    return window.MALY_BRAND_LIST.filter(function (b) { return b.slug !== slug; });
  }

  function logoMark() {
    if (data.hasLogo && data.logo) {
      return '<img class="b-logo' + (slug === 'malay-restaurant' ? ' b-logo-lg' : '') + '" src="/' + data.logo + '" alt="' + esc(data.name) + ' logo">';
    }
    return '<span class="b-mark" style="--acc:' + data.accent + '">' + data.mark + '</span>';
  }

  function buildBlocks() {
    if (hasMenu) {
      var cats = Object.keys(MENU);
      menuBlocks = cats.map(function (cat) {
        var items = MENU[cat].map(function (d) {
          var price = d.price ? '<span class="dish-price">' + money(d.price) + '</span>' : '';
          return '<li class="dish"><div class="dish-t"><strong>' + esc(d.name) + '</strong>' + price + '</div>' +
                 '<div class="dish-d">' + esc(d.desc || d.ingr || '') + '</div></li>';
        }).join('');
        return '<section class="cat-block" data-cat="' + esc(cat) + '">' +
               '<div class="cat-head"><h3>' + esc(cat) + '</h3><span class="cat-count">' + items.length + ' dishes</span></div>' +
               '<ul class="dish-list">' + items + '</ul></section>';
      }).join('');
    }
  }

  function toHtml() {
    buildBlocks();
    others = otherBrands().map(function (b) {
      return '<a class="other-brand" href="/' + b.slug + '/" data-acc="' + b.accent + '">' +
             '<span class="ob-mark">' + b.mark + '</span>' +
             '<span class="ob-meta"><em>' + b.positioning + '</em><strong>' + esc(b.name) + '</strong></span></a>';
    }).join('');

    var flagHero =
      '<div class="b-hero ' + (data.hasLogo ? 'has-logo' : 'no-logo') + '" id="top" data-acc="' + data.accent + '">' +
        '<div class="b-grain"></div>' +
        '<div class="b-hero-inner">' +
          '<a class="b-eyebrow" href="/">MALAY FAST FOODS &middot; CULINARY PORTFOLIO</a>' +
          logoMark() +
          '<div class="b-pos">' + esc(data.positioning) + '</div>' +
          '<h1 class="b-title">' + esc(data.name) + '</h1>' +
          '<p class="b-tag">' + esc(data.tagline) + '</p>' +
          '<p class="b-note">' + esc(data.heroNote) + '</p>' +
          '<div class="b-cta">' +
            '<a class="btn b-btn-primary" href="#menu">Explore the Menu</a>' +
            '<a class="btn b-btn-ghost" href="/#catering">Request a Quote</a>' +
          '</div>' +
          '<div class="b-meta"><span>' + (hasMenu ? Object.keys(MENU).length + ' menu sections' : 'Bespoke kitchen') + '</span>' +
          '<span>' + data.dine.join(' &middot; ') + '</span></div>' +
        '</div>' +
      '</div>';

    var stories = data.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');

    var hooksChips = [];
    if (MENU) {
      Object.keys(MENU).forEach(function (c) {
        MENU[c].slice(0, 3).forEach(function (d) {
          if (hooksChips.length < 14) hooksChips.push({ n: d.name, p: d.price });
        });
      });
    }

    var flavour;
    if (hasMenu) {
      flavour = '<div class="flavour-wall">' + hooksChips.map(function (d, i) {
        return '<div class="fw-tile fw-' + String(i + 1) + '" style="--acc:' + data.accent2 + '">' +
               '<span class="fw-n">' + esc(d.n) + '</span>' +
               (d.p ? '<span class="fw-p">' + money(d.p) + '</span>' : '') + '</div>';
      }).join('') + '</div>';
    } else {
      flavour = '<div class="flavour-note">' + esc(data.menuLead) + '</div>';
    }
    flavour += '<p class="flavour-caption">' + (hasMenu
      ? 'Flavours lifted straight from the ' + esc(data.name) + ' menu.'
      : 'The kitchen works with fire, spice and tradition. Full spread on request.') + '</p>';

    var dishesSection;
    if (hasMenu) {
      dishesSection =
        '<div class="b-menu-body"><div class="cat-tabs" id="catTabs"></div><div class="cat-panels">' + menuBlocks + '</div></div>';
    } else {
      dishesSection =
        '<div class="menu-on-request"><span class="mor-mark">' + data.mark + '</span>' +
        '<h3>Menu on Request</h3><p>' + esc(data.menuLead) + '</p>' +
        '<a class="btn b-btn-primary" href="/#catering">Enquire for the full spread</a></div>';
    }

    var out =
      '<header class="b-top" id="bTop">' +
        '<a class="b-top-brand" href="/">' + data.short + ' <span>&middot; MALAY GROUP</span></a>' +
        '<nav class="b-top-nav">' +
          '<a href="/">Home</a>' +
          '<a href="/#brands">Six Concepts</a>' +
          '<a href="/#menu">Menu</a>' +
          '<a href="/#catering">Catering</a>' +
        '</nav>' +
        '<div class="b-top-right">' +
          '<a class="b-req" href="/#catering">Request a Quote</a>' +
          '<a class="b-burger" href="#" aria-label="Menu"><span></span><span></span><span></span></a>' +
        '</div>' +
      '</header>' +
      '<nav class="b-drawer" id="bDrawer" hidden>' +
        '<a href="/">Home</a>' +
        '<a href="/#brands">Six Concepts</a>' +
        '<a href="/#menu">Menu</a>' +
        '<a href="/#catering">Request a Quote</a>' +
        '<a href="/admin/login.html">Staff Portal</a>' +
      '</nav>' +
      flagHero +

      '<main id="root">' +

      '<section class="b-sec b-story" id="story">' +
        '<div class="b-sec-head"><span class="kicker">' + data.num + ' / THE STORY</span><h2>The Concept</h2></div>' +
        '<div class="b-story-grid">' +
          '<p class="b-story-p">' + esc(data.story) + '</p>' +
          '<ul class="b-story-points">' + stories + '</ul>' +
        '</div>' +
      '</section>' +

      '<section class="b-sec b-others" id="brands">' +
        '<div class="b-sec-head"><span class="kicker">SIX CONCEPTS, ONE FAMILY</span><h2>Explore the <em>Other</em> Experiences</h2></div>' +
        '<div class="b-others-grid">' + others + '</div>' +
      '</section>' +

      '<section class="b-sec b-menu" id="menu">' +
        '<div class="b-sec-head"><span class="kicker">' + data.num + ' / THE MENU</span><h2>From the Kitchen</h2>' +
          '<p class="b-lead">' + esc(data.menuLead) + '</p>' +
          '<p class="b-order">' + esc(data.orderNote) +
          '<a class="b-order-link" href="' + data.orderUrl + '">' + (slug === 'malay-restaurant' ? 'Order Online \u2192' : 'Call to Order \u2192') + '</a></p>' +
        '</div>' +
        dishesSection +
      '</section>' +

      '<section class="b-sec b-flavour" id="flavours">' +
        '<div class="b-sec-head"><span class="kicker">' + data.num + ' / FLAVOURS</span><h2>The Taste of ' + esc(data.short) + '</h2></div>' +
        flavour +
      '</section>' +

      '<section class="b-sec b-exp" id="experience">' +
        '<div class="b-sec-head"><span class="kicker">' + data.num + ' / EXPERIENCE</span><h2>How You Can Enjoy It</h2></div>' +
        '<div class="b-exp-grid">' +
          data.dine.map(function (m) {
            var ic = m === 'Dine-in' ? '\u2726' : m === 'Catering' ? '\u2756' : m === 'Takeaway' ? '\u29C9' : '\u27F6';
            var txt = m === 'Dine-in' ? 'Sit down and taste the concept at its most personal.' :
                      m === 'Catering' ? 'Bring the table to your event \u2014 group catering available.' :
                      'Malay-group delivery and takeaway, handled through the group order line.';
            return '<div class="exp-tile"><span class="exp-i">' + ic + '</span><h3>' + m + '</h3><p>' + esc(txt) + '</p></div>';
          }).join('') +
        '</div>' +
        '<div class="b-exp-cta"><a class="btn b-btn-primary" href="/#catering">Request a Catering Quote</a></div>' +
      '</section>' +

      '<section class="b-sec b-closing">' +
        '<div class="b-closing-in">' +
          '<p class="kicker">' + data.num + ' &mdash; MALAY FAST FOODS GROUP</p>' +
          '<h2>Good food is heritage at work.</h2>' +
          '<p class="b-addr">' + esc(data.address) + ' &middot; +94 11 777 7999</p>' +
          '<div class="b-cta">' +
            '<a class="btn b-btn-primary" href="/#brands">All Six Concepts</a>' +
            '<a class="btn b-btn-ghost" href="/">Back to Home</a>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '</main>' +

      '<footer class="b-foot">' +
        '<div class="b-foot-inner">' +
          '<div><a class="b-top-brand" href="/">' + data.short + ' <span>&middot; MALAY GROUP</span></a>' +
          '<p class="b-foot-p">A culinary portfolio of six concepts under one family heritage. Respect the food. Respect the customer. Respect the heritage. Keep innovating.</p></div>' +
          '<div class="b-foot-links"><a href="/#brands">Six Concepts</a><a href="/#menu">Menus</a><a href="/#catering">Catering</a><a href="/admin/login.html">Staff Portal</a></div>' +
        '</div>' +
        '<div class="b-foot-bar">&copy; ' + new Date().getFullYear() + ' Malay Fast Foods (Pvt) Ltd. All rights reserved.</div>' +
      '</footer>';

    return out;
  }

  function render() {
    host = document.getElementById('brandRoot');
    host.innerHTML = toHtml();
    document.documentElement.style.setProperty('--acc', data.accent);
    document.documentElement.style.setProperty('--acc2', data.accent2);
    document.documentElement.style.setProperty('--accing', data.ink);
    document.title = data.name + ' \u2014 ' + data.positioning + ' | Malay Fast Foods';

    var m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute('content', data.story);

    initShell();
    if (hasMenu) initMenu();
    initReveal();
  }

  function initShell() {
    var top = document.getElementById('bTop');
    var drawer = document.getElementById('bDrawer');
    var burger = document.querySelector('.b-burger');

    function onScroll() { top.classList.toggle('scrolled', window.scrollY > 40); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (burger) burger.addEventListener('click', function (e) {
      e.preventDefault();
      if (drawer.getAttribute('hidden') === null) drawer.setAttribute('hidden', '');
      else drawer.removeAttribute('hidden');
    });

    var reqBtns = host.querySelectorAll('a[href="/#catering"]');
    reqBtns.forEach(function (a) {
      a.addEventListener('click', function () {
        try { sessionStorage.setItem('cater_brand', data.key); } catch (e) {}
      });
    });
  }

  function initMenu() {
    var cats = Object.keys(MENU);
    var tabs = host.querySelector('#catTabs');
    var blocks = host.querySelectorAll('.cat-block');
    if (!tabs) return;

    function select(i) {
      blocks.forEach(function (b, ix) { b.classList.toggle('active', ix === i); });
      tabs.querySelectorAll('.cat-tab').forEach(function (t, ix) {
        t.classList.toggle('active', ix === i);
        t.setAttribute('aria-selected', ix === i ? 'true' : 'false');
      });
    }

    cats.forEach(function (cat, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cat-tab' + (i === 0 ? ' active' : '');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.textContent = cat;
      b.addEventListener('click', function () { select(i); });
      tabs.appendChild(b);
    });
    if (blocks.length) select(0);
    else tabs.style.display = 'none';
  }

  function initReveal() {
    var els = host.querySelectorAll('.b-sec-head, .b-story-p, .b-story-points, .fw-tile, .exp-tile, .other-brand, .cat-block, .b-closing-in, .menu-on-request');
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  window.addEventListener('DOMContentLoaded', function () { render(); });
})();