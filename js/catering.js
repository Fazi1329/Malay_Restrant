/* ============================================================
   MALAY — Catering quote request module (customer-facing)
   Validates, stores into the CRM data layer, shows confirmation.
   Includes automated "Not Sure — Recommend One" logic, labeled.
   ============================================================ */
(function () {
  var ready = function () {
    if (!window.CRM) { window.addEventListener('crm-ready', ready); return; }
    init();
  };
  if (window.CRM) init(); else window.addEventListener('crm-ready', ready);

  function $(s) { return document.querySelector(s); }
  function $all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  function init() {
    var form = $('#cateringForm');
    if (!form) return;

    /* --- occasion cards preselect the event type --- */
    $all('.occasion-card').forEach(function (card) {
      card.addEventListener('click', function () {
        $all('.occasion-card').forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');
        var et = card.getAttribute('data-type');
        var sel = $('#cfEventType');
        if (et && sel) {
          Array.prototype.forEach.call(sel.options, function (o) { o.selected = o.value === et; });
        }
        document.getElementById('cateringFormWrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
        recomputRec();
      });
    });

    /* --- brand preference: "Not sure" reveals guidance + recommendation --- */
    var brandSel = $('#cfBrand');
    if (brandSel) brandSel.addEventListener('change', function () {
      var note = $('#cfBrandNote');
      if (note) note.style.display = brandSel.value === 'any' ? 'none' : 'none';
      recomputRec();
    });

    /* --- cuisine checkboxes keep chosen state --- */
    var cq = $('#cfCuisines');
    if (cq) {
      var hint = $('#cfCuisineHint');
      cq.addEventListener('change', function () {
        var on = $all('#cfCuisines input:checked').length;
        if (hint) hint.textContent = on ? on + ' preferred cuisine' + (on > 1 ? 's' : '') + ' selected' : '';
        recomputRec();
      });
    }

    // live recompute on guests / budget / event type
    var gf = $('#cfGuests'); if (gf) gf.addEventListener('input', recomputRec);
    var bf = $('#cfBudget'); if (bf) bf.addEventListener('input', recomputRec);
    var ef = $('#cfEventType'); if (ef) ef.addEventListener('change', recomputRec);

    /* --- cbr pick: apply the automated recommendation to the select --- */
    var cbrPick = $('#cbrPick');
    if (cbrPick) cbrPick.addEventListener('click', function () {
      var sel = $('#cfBrand');
      if (!sel) return;
      sel.value = recommend().brand;
      var box = $('#cfBrandRec'); if (box) box.hidden = true;
    });

    /* --- lead source --- */
    var src = $('#cfSource');
    if (src) {
      var other = $('#cfSourceOther');
      src.addEventListener('change', function () {
        if (other) other.style.display = src.value === 'Other' ? 'block' : 'none';
      });
    }

    /* --- prefill brand from sessionStorage (cross-page bridge) --- */
    try {
      var pref = sessionStorage.getItem('cater_brand');
      if (pref && brandSel) {
        brandSel.value = pref;
        sessionStorage.removeItem('cater_brand');
        recomputRec();
      }
    } catch (e) {}

    /* --- submit --- */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errs = validate();
      if (errs.length) { showErrors(errs); return; }
      hideErrors();
      submit();
    });

    /* --- set min date to today on the date picker --- */
    var d = $('#cfDate');
    if (d) d.min = new Date().toISOString().slice(0, 10);
  }

  function fieldVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function checkedCuisines() {
    return $all('#cfCuisines input:checked').map(function (i) { return i.value; });
  }

  function validate() {
    var errs = [];
    ['cfName', 'cfPhone', 'cfEmail', 'cfDate', 'cfGuests', 'cfLocation', 'cfEventType', 'cfService'].forEach(function (id) {
      var v = fieldVal(id);
      if (!v) errs.push({ id: id, msg: 'Please fill in this field.' });
    });
    if (fieldVal('cfEmail')) {
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(fieldVal('cfEmail'))) errs.push({ id: 'cfEmail', msg: 'Please enter a valid email address.' });
    }
    if (fieldVal('cfPhone')) {
      var pre = /^[+0-9 ()-]{7,20}$/;
      if (!pre.test(fieldVal('cfPhone'))) errs.push({ id: 'cfPhone', msg: 'Please enter a valid phone number.' });
    }
    var g = parseInt(fieldVal('cfGuests'), 10);
    if (!g || isNaN(g) || g < 1) errs.push({ id: 'cfGuests', msg: 'Please enter the number of guests.' });
    if (fieldVal('cfDate')) {
      var pick = new Date(fieldVal('cfDate'));
      if (isNaN(pick.getTime())) errs.push({ id: 'cfDate', msg: 'Please select a valid event date.' });
      else if (pick < new Date(new Date().toDateString())) errs.push({ id: 'cfDate', msg: 'The event date cannot be in the past.' });
    }
    return errs;
  }

  function showErrors(errs) {
    errs.forEach(function (er) {
      var el = document.getElementById(er.id);
      var box = document.getElementById(er.id + 'Err');
      if (el) el.classList.add('field-error');
      if (box) box.textContent = er.msg;
    });
  }

  function hideErrors() {
    $all('.cf-field').forEach(function (c) {
      c.classList.remove('field-error');
      var box = c.parentElement.querySelector('.cf-err');
      if (box) box.textContent = '';
    });
  }

  /* ---------- automated recommendation ---------- */
  function recommend() {
    var eventType = fieldVal('cfEventType');
    var guests = parseInt(fieldVal('cfGuests'), 10) || 0;
    var cuis = checkedCuisines();
    var brandId = 'malay';
    var reasons = [];

    // 1) Cuisine steer
    if (cuis.indexOf('Pakistani') > -1 || cuis.indexOf('Arabic') > -1) {
      brandId = 'pdarbar';
      reasons.push('your preference for ' + (cuis.indexOf('Pakistani') > -1 ? 'Pakistani' : 'Arabic') + ' cuisine');
    } else if (cuis.indexOf('Biryani') > -1) {
      brandId = 'darbar';
      reasons.push('biryani is the speciality');
    } else if (cuis.indexOf('Chinese') > -1) {
      brandId = 'shanghai';
      reasons.push('Chinese wok cooking');
    } else if (cuis.indexOf('Sri Lankan') > -1) {
      brandId = 'nelum';
      reasons.push('everyday Sri Lankan comfort food');
    } else if (cuis.indexOf('BBQ') > -1) {
      brandId = guests >= 150 ? 'darbar' : 'pdarbar';
      reasons.push('BBQ and grilled meats');
    } else if (cuis.indexOf('Malay') > -1 || cuis.indexOf('Seafood') > -1) {
      brandId = 'malay';
      reasons.push((cuis.indexOf('Malay') > -1 ? 'heritage Malay' : 'seafood') + ' flavours');
    }

    // 2) Scale override: weddings / religious / large gatherings >= 200 guests
    if (guests >= 200 &&
        (eventType === 'Wedding' || eventType === 'Religious Function' || eventType === 'Engagement' || eventType === 'Party') &&
        (brandId === 'malay' || brandId === 'asiana' || brandId === 'shanghai' || brandId === 'nelum')) {
      brandId = 'darbar';
      reasons = ['a guest list of ' + guests + ' suits large dum-biryani and BBQ spreads'];
    }

    // 3) Corporate events >= 120 → biryani/bbq scale
    if (eventType === 'Corporate Event' && guests >= 120 && (brandId === 'malay' || brandId === 'nelum')) {
      brandId = 'darbar';
      reasons = ['corporate catering for ' + guests + ' guests works well with large-format biryani & BBQ'];
    }

    // 4) Default reasons if none matched
    if (!reasons.length) {
      if (guests >= 200) { reasons.push('a guest list of ' + guests + ' is well served by the flagship kitchen\'s full range'); }
      else { reasons.push('this concept best matches your selections'); }
    }

    var name = window.CRM.brandName(brandId);
    return { brand: brandId, name: name, reason: reasons.join('; ') };
  }

  function recomputRec() {
    var sel = $('#cfBrand');
    var box = $('#cfBrandRec');
    if (!sel || !box) return;
    if (sel.value !== 'any') { box.hidden = true; return; }
    var rec = recommend();
    $('#cbrName').textContent = rec.name;
    $('#cbrReason').textContent = 'Why this pick: ' + rec.reason + '. Our team can prepare a tailored proposal for this concept.';
    box.hidden = false;
  }

  /* ---------- submit ---------- */
  function submit() {
    var db = window.CRM.loadDB();
    var reqId = window.CRM.genRequestId();
    var brandVal = fieldVal('cfBrand');
    var request = {
      request_id: reqId,
      customer_id: null,
      customer: {
        name: fieldVal('cfName'),
        phone: fieldVal('cfPhone'),
        email: fieldVal('cfEmail')
      },
      event_type: fieldVal('cfEventType') || 'Private Event',
      event_date: fieldVal('cfDate'),
      guest_count: parseInt(fieldVal('cfGuests'), 10) || 0,
      location: fieldVal('cfLocation'),
      budget: parseInt(String(fieldVal('cfBudget')).replace(/[^\d]/g, ''), 10) || 0,
      preferred_brand: brandVal,
      cuisine_preferences: checkedCuisines(),
      service_type: fieldVal('cfService'),
      message: fieldVal('cfMsg'),
      lead_source: fieldVal('cfSource') || 'Website',
      status: 'New',
      priority: (parseInt(fieldVal('cfGuests'), 10) || 0) >= 200 ? 'High' : 'Normal',
      assigned: '',
      follow_up: '',
      created_at: new Date().toISOString(),
      recommended_brand: '',
      recommendation_reason: ''
    };

    // store automated recommendation (labeled as such) when the visitor asks the system
    if (brandVal === 'any') {
      var rec = recommend();
      request.recommended_brand = rec.brand;
      request.recommendation_reason = 'Automated recommendation: ' + rec.reason;
      request.preferred_brand = rec.brand; // let the desk start from the recommended brand
    }

    // account for existing customer
    var cust = db.customers.find(function (c) { return c.email === request.customer.email; });
    if (!cust) {
      cust = { id: db.customers.length + 1, name: request.customer.name, phone: request.customer.phone, email: request.customer.email, source: request.lead_source, created_at: todayLocal(), notes: '' };
      db.customers.push(cust);
    }
    request.customer_id = cust.id;
    db.requests.unshift(request);
    window.CRM.save(db);

    showConfirmation(request);
    try {
      if (window.gtag) window.gtag('event', 'generate_lead', { transport_type: 'beacon' });
    } catch (e) {}
  }

  function todayLocal() { var d = new Date(); return d.toISOString().slice(0, 10); }

  function showConfirmation(req) {
    var wrap = $('#cateringConfirm');
    if (!wrap) { alert('Thank you — your reference is ' + req.request_id); return; }
    var ref = $('#confirmRef');
    if (ref) ref.textContent = req.request_id;
    wrap.classList.add('show');
    var link = $('#confirmStatusLink');
    if (link) link.href = '/quote.html?ref=' + req.request_id;
    document.body.style.overflow = 'hidden';
    var close = function () {
      wrap.classList.remove('show');
      document.body.style.overflow = '';
      formReset();
    };
    var ok = $('#confirmOk');
    if (ok) ok.addEventListener('click', close);
    var esc = function (ev) { if (ev.key === 'Escape') close(); };
    document.addEventListener('keydown', esc, { once: true });
  }

  function formReset() {
    var form = $('#cateringForm');
    if (form) {
      form.reset();
      var note = $('#cfBrandNote'); if (note) note.style.display = 'none';
      var box = $('#cfBrandRec'); if (box) box.hidden = true;
      var other = $('#cfSourceOther'); if (other) other.style.display = 'none';
      var hint = $('#cfCuisineHint'); if (hint) hint.textContent = '';
    }
  }

  window.Catering = { validate: validate };
})();