/* ============================================================
   MALAY — Catering CRM dashboard
   Premium hospitality CRM rendered against the localStorage data
   layer (js/crm-data.js). Demo-ready; swap persistence for a real
   backend at production time.
   ============================================================ */
(function () {
  if (!window.CRM) { document.addEventListener('DOMContentLoaded', function () { if (!window.CRM) console.error('crm-data.js missing'); }); }
  var CRM = window.CRM;
  if (!CRM) return;

  var db, view = 'dashboard', selectedReq = null, custId = null, calMonth = 0,
      filters = { q: '', brand: '', status: '', type: '', pri: '' };

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var esc = function (s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fmt = function (d) { if (!d) return '—'; return String(d).slice(0, 10); };

  function refresh() { db = CRM.loadDB(); }

  /* ---------- router ---------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    if (h.indexOf('request/') === 0) { view = 'request'; selectedReq = h.split('/')[1]; }
    else if (h.indexOf('customer/') === 0) { view = 'customer'; custId = parseInt(h.split('/')[1], 10); }
    else { view = h || 'dashboard'; selectedReq = null; custId = null; }
    setActiveNav(view);
    render();
  }

  function setActiveNav(v) {
    $$('.crm-nav a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-view') === v || a.getAttribute('data-view') === 'request' && v === 'request' || a.getAttribute('data-view') === 'customer' && v === 'customer');
    });
    $$('.crm-sub a').forEach(function (a) {
      var t = a.getAttribute('data-tab');
      a.classList.toggle('active', (t === v));
    });
  }

  /* ---------- main render dispatch ---------- */
  function render() {
    refresh();
    updateBell();
    var main = $('#crmMain');
    if (!main) return;
    try {
      if (view === 'dashboard') main.innerHTML = viewDashboard();
      else if (view === 'requests') main.innerHTML = viewRequests();
      else if (view === 'request') main.innerHTML = viewRequest(selectedReq);
      else if (view === 'quotes') main.innerHTML = viewQuotes();
      else if (view === 'customers') main.innerHTML = viewCustomers();
      else if (view === 'customer') main.innerHTML = viewCustomer(custId);
      else if (view === 'calendar') main.innerHTML = viewCalendar();
      else if (view === 'analytics') main.innerHTML = viewAnalytics();
      else if (view === 'messages') main.innerHTML = viewMessages();
      else if (view === 'settings') main.innerHTML = viewSettings();
      else { view = 'dashboard'; location.hash = '#/dashboard'; }
    } catch (e) { main.innerHTML = '<div class="empty-state"><h3>Something went wrong</h3><p>' + esc(e.message) + '</p></div>'; }
    bind();
    window.scrollTo(0, 0);
  }

  /* ---------- stat helpers ---------- */
  function count(fn) { return db.requests.filter(fn).length; }
  var isNew = function (r) { return r.status === 'New'; };
  var isUrgent = function (r) { return r.priority === 'Urgent' && r.status !== 'Completed' && r.status !== 'Cancelled'; };
  function pipelineCount() {
    return CRM.STATUSES.map(function (s) {
      return { s: s, n: count(function (r) { return r.status === s; }) };
    });
  }
  function revenuePipeline() {
    return db.quotes.filter(function (q) { return q.status === 'Accepted'; }).reduce(function (a, q) { return a + q.total; }, 0);
  }

  /* ---------- views ---------- */
  function viewDashboard() {
    var tot = db.requests.length;
    var newN = count(isNew);
    var sent = count(function (r) { return r.status === 'Quote Sent' || r.status === 'Negotiation'; });
    var conf = count(function (r) { return r.status === 'Confirmed' || r.status === 'Completed'; });
    var pending = tot - conf;
    var rev = revenuePipeline();
    var urgent = db.requests.filter(isUrgent);
    var recent = db.requests.slice().sort(function (a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); }).slice(0, 6);
    var pipe = pipelineCount().filter(function (p) { return CRM.ACTIVE_STATUSES.indexOf(p.s) >= 0 || p.n > 0; });
    var max = Math.max.apply(null, pipe.map(function (p) { return p.n; })).valueOf();
    if (!max) max = 1;

    return '<div class="crm-head"><div><span class="cap">Hospitality CRM</span><h1>Dashboard</h1></div>' +
      '<div class="head-btns"><span class="demo-badge">DEMO DATA</span><button class="btn-ghost" onclick="document.getElementById(\'crmRefresh\')&&location.reload()">Refresh</button></div></div>' +
      '<div class="stat-grid">' +
      statCard('Total Requests', tot) + statCard('New Requests', newN, 'gold') + statCard('Quotes Sent', sent) + statCard('Confirmed Events', conf, 'green') +
      statCard('Pending Action', pending) + statCard('Est. Revenue', '<span style="font-size:.7em">' + CRM.money(rev) + '</span>', 'gold') +
      '</div>' +
      '<div class="dash-cols">' +
      '<div class="panel"><div class="panel-head"><h3>Request Pipeline</h3><a href="#/requests" class="link">Open requests</a></div>' +
      '<div class="pipe">' + pipe.map(function (p) {
        var pct = Math.round(p.n / max * 100);
        return '<div class="pipe-row"><span class="pipe-lab">' + esc(p.s) + '</span>' +
          '<div class="pipe-bar"><i class="' + (p.n ? 'fill' : '') + '" style="width:' + pct + '%"></i></div><b>' + p.n + '</b></div>';
      }).join('') + '</div></div>' +
      '<div class="panel"><div class="panel-head"><h3>Urgent Leads</h3></div>' +
      (urgent.length ? urgent.map(function (r) {
        return '<div class="mini-row" onclick="location.hash=\'#/request/' + r.request_id + '\'"><b>' + esc(r.customer.name) + '</b><span>' + esc(r.event_type) + ' · ' + r.guest_count + ' guests</span><em>' + esc(r.status) + '</em></div>';
      }).join('') : '<p class="muted">No urgent leads right now.</p>') +
      '</div></div>' +
      '<div class="panel"><div class="panel-head"><h3>Recent Requests</h3><a href="#/requests" class="link">View all</a></div>' +
      table(recent) + '</div>';
  }

  function statCard(label, val, tone) {
    return '<div class="stat ' + (tone || '') + '"><span class="stat-cap">' + esc(label) + '</span><b>' + val + '</b></div>';
  }

  function table(rows) {
    if (!rows.length) return '<div class="empty-state"><h3>No requests found</h3><p>New quotes appear here as they are requested.</p></div>';
    return '<table class="crm-table"><thead><tr><th>Request</th><th>Customer</th><th>Event</th><th>Date</th><th>Guests</th><th>Brand</th><th>Budget</th><th>Status</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr data-ref="' + r.request_id + '" onclick="location.hash=\'#/request/' + r.request_id + '\'">' +
          '<td data-l="Request"><b class="mono">' + r.request_id + '</b></td>' +
          '<td data-l="Customer">' + esc(r.customer.name) + '</td>' +
          '<td data-l="Event">' + esc(r.event_type) + '</td>' +
          '<td data-l="Date" class="mono">' + fmt(r.event_date) + '</td>' +
          '<td data-l="Guests">' + r.guest_count + '</td>' +
          '<td data-l="Brand">' + esc(CRM.brandName(r.preferred_brand)) + '</td>' +
          '<td data-l="Budget">' + (r.budget ? CRM.money(r.budget) : '—') + '</td>' +
          '<td data-l="Status"><span class="st st-' + slug(r.status) + '">' + esc(r.status) + '</span>' + (isUrgent(r) ? '<span class="urg-dot" title="Urgent">!</span>' : '') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

  /* ---------- requests (list + filters) ---------- */
  function viewRequests() {
    var list = db.requests.filter(function (r) {
      var q = filters.q.toLowerCase();
      if (q && (r.customer.name + ' ' + r.customer.phone + ' ' + r.customer.email + ' ' + r.request_id + ' ' + r.event_type + ' ' + r.location).toLowerCase().indexOf(q) < 0) return false;
      if (filters.brand && r.preferred_brand !== filters.brand) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.type && r.event_type !== filters.type) return false;
      if (filters.pri && r.priority !== filters.pri) return false;
      return true;
    });
    refresh();
    return '<div class="crm-head"><div><span class="cap">Leads</span><h1>Catering Requests</h1><p class="sub">' + list.length + ' of ' + db.requests.length + ' requests</p></div>' +
      '<div class="head-btns"><button class="btn" onclick="document.getElementById(\'fq\').focus()">Search</button></div></div>' +
      '<div class="filter-bar">' +
      '<input id="fq" class="in" placeholder="Search name · phone · email · ID · event…" value="' + esc(filters.q) + '" oninput="CRM_UI.setFilter(\'q\',this.value)">' +
      sel('brand', filters.brand, 'All brands', CRM.BRANDS.map(function (b) { return [b.id, b.name]; })) +
      sel('status', filters.status, 'All statuses', CRM.STATUSES.map(function (s) { return [s, s]; })) +
      sel('type', filters.type, 'All event types', CRM.EVENT_TYPES.map(function (t) { return [t, t]; })) +
      sel('pri', filters.pri, 'All priorities', CRM.PRIORITIES.map(function (p) { return [p, p]; })) +
      (Object.keys(filters).some(function (k) { return filters[k]; }) ? '<button class="btn-ghost" onclick="CRM_UI.clearFilters()">Clear</button>' : '') +
      '</div>' + table(list);
  }

  function sel(key, val, ph, opts) {
    return '<select class="in" onchange="CRM_UI.setFilter(\'' + key + '\',this.value)"><option value="">' + esc(ph) + '</option>' +
      opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (val === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
  }

  /* ---------- request detail ---------- */
  function viewRequest(id) {
    var r = CRM.findRequest(id);
    if (!r) return emptyState('Request not found');
    var q = CRM.findQuoteByRequest(id);
    var notes = db.notes.filter(function (n) { return n.request_id === id; });
    var cust = CRM.findCustomer(r.customer_id);
    var quoteLink = q ? '<a class="btn" href="#/quotes" onclick="CRM_UI.openQuote(\'' + q.quote_id + '\')">View Quote ' + q.quote_id + '</a>' : '';

    return '<div class="crm-head"><div><a class="link" href="#/requests">← Back to requests</a><h1 class="mono">' + r.request_id + '</h1>' +
      '<p class="sub">Submitted ' + fmt(r.created_at) + ' · source: ' + esc(r.lead_source) + '</p></div>' +
      '<div class="head-btns">' + quoteLink + '<button class="btn" onclick="CRM_UI.openBuilder(\'' + r.request_id + '\')">Create Quote</button></div></div>' +
      '<div class="detail-grid">' +
      '<div class="panel"><div class="panel-head"><h3>Customer</h3></div>' +
      '<div class="kv"><div><span>Name</span><b>' + esc(r.customer.name) + '</b></div>' +
      '<div><span>Phone</span><b><a href="tel:' + esc(r.customer.phone) + '">' + esc(r.customer.phone) + '</a></b></div>' +
      '<div><span>Email</span><b><a href="mailto:' + esc(r.customer.email) + '">' + esc(r.customer.email) + '</a></b></div>' +
      '<div><span>History</span><b>' + (cust ? (cust.request_count || 0) + ' past requests' : 'First-time lead') + '</b></div></div>' +
      '<div class="kv-actions"><a class="qa" href="tel:' + esc(r.customer.phone) + '">CALL</a><a class="qa" href="https://wa.me/' + esc(r.customer.phone.replace(/[^0-9]/g, '')) + '" target="_blank">WHATSAPP</a><a class="qa" href="mailto:' + esc(r.customer.email) + '">EMAIL</a></div></div>' +
      '<div class="panel"><div class="panel-head"><h3>Event</h3></div>' +
      '<div class="kv"><div><span>Type</span><b>' + esc(r.event_type) + '</b></div>' +
      '<div><span>Date</span><b class="mono">' + fmt(r.event_date) + '</b></div>' +
      '<div><span>Guests</span><b>' + r.guest_count + '</b></div>' +
      '<div><span>Location</span><b>' + esc(r.location) + '</b></div></div></div>' +
      '<div class="panel"><div class="panel-head"><h3>Brand &amp; Budget</h3></div>' +
      '<div class="kv"><div><span>Preferred brand</span><b>' + esc(CRM.brandName(r.preferred_brand)) + '</b></div>' +
      '<div><span>Service type</span><b>' + esc(r.service_type) + '</b></div>' +
      '<div><span>Budget</span><b>' + (r.budget ? CRM.money(r.budget) : '—') + '</b></div>' +
      '<div><span>Priority</span><b><span class="st st-' + slug(r.priority) + '">' + esc(r.priority) + '</span></b></div></div></div>' +
      '<div class="panel span2"><div class="panel-head"><h3>Customer Message</h3></div><p class="quote-blob">“' + esc(r.message) + '”</p></div>' +
      '</div>' +
      '<div class="panel"><div class="panel-head"><h3>Manage</h3></div>' +
      '<div class="manage-row">' +
      '<label>Status<br>' + statusSelect(r) + '</label>' +
      '<label>Assigned staff<br><input class="in" id="assignIn" value="' + esc(r.assigned || '') + '" placeholder="Staff name"></label>' +
      '<label>Next follow-up<br><input class="in" type="date" id="followIn" value="' + esc(r.follow_up || '') + '"></label>' +
      '<label>Priority<br><select class="in" id="priIn">' + CRM.PRIORITIES.map(function (p) { return '<option' + (r.priority === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></label>' +
      '<button class="btn" onclick="CRM_UI.saveManage(\'' + r.request_id + '\')">Save</button>' +
      '</div>' +
      '</div>' +
      '<div class="dash-cols">' +
      '<div class="panel"><div class="panel-head"><h3>Internal Notes</h3><button class="btn-ghost" onclick="CRM_UI.addNote(\'' + r.request_id + '\')">+ Add note</button></div>' +
      (notes.length ? notes.slice().reverse().map(function (n) {
        return '<div class="note"><p>' + esc(n.note) + '</p><span>' + esc(n.author) + ' · ' + fmt(n.date) + '</span></div>';
      }).join('') : '<p class="muted">No internal notes yet. Internal notes are visible to staff only.</p>') +
      '</div>' +
      '<div class="panel"><div class="panel-head"><h3>Status Timeline</h3></div><div class="pipe-vert">' +
      CRM.STATUSES.map(function (s) {
        var stage = CRM.STATUSES.indexOf(r.status);
        var curi = CRM.STATUSES.indexOf(s);
        var cls = curi < stage ? 'done' : curi === stage ? 'now' : '';
        return '<div class="pv ' + cls + '"><i></i><span>' + esc(s) + '</span></div>';
      }).join('') + '</div></div>' +
      '</div>';
  }

  function statusSelect(r) {
    return '<select class="in" id="statusIn">' + CRM.STATUSES.map(function (s) {
      return '<option' + (r.status === s ? ' selected' : '') + '>' + s + '</option>';
    }).join('') + '</select>';
  }

  function viewQuotes() {
    var list = db.quotes.slice().sort(function (a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); });
    return '<div class="crm-head"><div><span class="cap">Proposals</span><h1>Quotes</h1><p class="sub">' + list.length + ' quotes generated</p></div></div>' +
      '<div class="panel">' + (list.length ? '<table class="crm-table"><thead><tr><th>Quote</th><th>Request</th><th>Customer</th><th>Event</th><th>Guests</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>' +
      list.map(function (q) {
        var r = CRM.findRequest(q.request_id);
        return '<tr><td class="mono" data-l="Quote"><b>' + q.quote_id + '</b></td><td class="mono" data-l="Request">' + q.request_id + '</td>' +
          '<td data-l="Customer">' + esc(r ? r.customer.name : '—') + '</td><td data-l="Event">' + esc(r ? r.event_type : '—') + '</td>' +
          '<td data-l="Guests">' + (r ? r.guest_count : '—') + '</td><td data-l="Total"><b>' + CRM.money(q.total) + '</b></td>' +
          '<td data-l="Status"><span class="st st-' + slug(q.status) + '">' + esc(q.status) + '</span></td>' +
          '<td data-l="Actions"><button class="btn-ghost" onclick="CRM_UI.openQuote(\'' + q.quote_id + '\')">Preview</button> <a class="qa" href="/quote.html?ref=' + esc(r ? r.request_id : '') + '" target="_blank">Portal</a></td></tr>';
      }).join('') + '</tbody></table>' : emptyState('No quotes yet — click "Create Quote" on a request.')) + '</div>';
  }

  /* ---------- customers ---------- */
  function viewCustomers() {
    var list = db.customers.slice().sort(function (a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); });
    return '<div class="crm-head"><div><span class="cap">Relationships</span><h1>Customers</h1></div></div>' +
      '<div class="panel"><table class="crm-table"><thead><tr><th>Customer</th><th>Phone</th><th>Email</th><th>Requests</th><th>Confirmed</th><th>Quote Value</th><th>First Seen</th></tr></thead><tbody>' +
      list.map(function (c) {
        var reqs = db.requests.filter(function (r) { return r.customer_id === c.id; });
        var conf = reqs.filter(function (r) { return r.status === 'Confirmed' || r.status === 'Completed'; }).length;
        var val = db.quotes.filter(function (q) { return reqs.some(function (r) { return r.request_id === q.request_id; }); }).reduce(function (a, q) { return a + q.total; }, 0);
        return '<tr onclick="location.hash=\'#/customer/' + c.id + '\'"><td><b>' + esc(c.name) + '</b></td>' +
          '<td class="mono">' + esc(c.phone) + '</td><td>' + esc(c.email) + '</td>' +
          '<td>' + reqs.length + '</td><td>' + conf + '</td><td>' + CRM.money(val) + '</td><td class="mono">' + fmt(c.created_at) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function viewCustomer(id) {
    var c = CRM.findCustomer(id);
    if (!c) return emptyState('Customer not found');
    var reqs = db.requests.filter(function (r) { return r.customer_id === c.id; });
    var val = db.quotes.filter(function (q) { return reqs.some(function (r) { return r.request_id === q.request_id; }); }).reduce(function (a, q) { return a + q.total; }, 0);
    return '<div class="crm-head"><div><a class="link" href="#/customers">← Customers</a><h1>' + esc(c.name) + '</h1>' +
      '<p class="sub">Customer since ' + fmt(c.created_at) + ' · source: ' + esc(c.source) + '</p></div>' +
      '<div class="head-btns"><a class="qa" href="tel:' + esc(c.phone) + '">CALL</a><a class="qa" href="https://wa.me/' + esc(c.phone.replace(/[^0-9]/g, '')) + '" target="_blank">WHATSAPP</a><a class="qa" href="mailto:' + esc(c.email) + '">EMAIL</a></div></div>' +
      '<div class="stat-grid">' + statCard('Total Requests', reqs.length) + statCard('Confirmed Events', reqs.filter(function (r) { return r.status === 'Confirmed' || r.status === 'Completed'; }).length) + statCard('Quote Value', '<span style="font-size:.7em">' + CRM.money(val) + '</span>') + '</div>' +
      '<div class="dash-cols"><div class="panel">' + table(reqs) + '</div></div>' +
      '<div class="panel"><div class="panel-head"><h3>Preferred Cuisine</h3></div>' +
      '<p class="muted">' + esc(reqs.map(function (r) { return r.cuisine_preferences.join(', '); }).filter(Boolean).join(' · ') || 'No cuisine preferences recorded yet.') + '</p></div>';
  }

  /* ---------- calendar ---------- */
  function viewCalendar() {
    var now = new Date();
    var base = new Date(now.getFullYear(), now.getMonth() + calMonth, 1);
    var ym = base.getFullYear() + '-' + String(base.getMonth() + 1).padStart(2, '0');
    var firstDow = new Date(base.getFullYear(), base.getMonth(), 1).getDay(); // 0 Sun
    var days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    var evs = {};
    db.requests.forEach(function (r) {
      if ((r.event_date || '').indexOf(ym) === 0) (evs[r.event_date] = evs[r.event_date] || []).push(r);
    });
    var cells = [];
    for (var i = 0; i < firstDow; i++) cells.push('<div class="cal-cell off"></div>');
    for (var d = 1; d <= days; d++) {
      var iso = ym + '-' + String(d).padStart(2, '0');
      var cur = evs[iso];
      var isToday = iso === new Date().toISOString().slice(0, 10);
      cells.push('<div class="cal-cell' + (cur ? ' has' : '') + (isToday ? ' today' : '') + '"><b>' + d + '</b>' +
        (cur ? cur.map(function (r) {
          return '<button class="cal-ev st-' + slug(r.status) + '" onclick="location.hash=\'#/request/' + r.request_id + '\'" title="' + esc(r.event_type) + ' · ' + r.guest_count + ' guests">' + esc(CRM.brandName(r.preferred_brand).split(' ')[0]) + '</button>';
        }).join('') : '') + '</div>');
    }
    return '<div class="crm-head"><div><span class="cap">Schedule</span><h1>Calendar</h1></div>' +
      '<div class="head-btns"><button class="btn-ghost" onclick="CRM_UI.shiftMonth(-1)">‹ Prev</button><b style="min-width:110px;text-align:center">' + base.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) + '</b><button class="btn-ghost" onclick="CRM_UI.shiftMonth(1)">Next ›</button></div></div>' +
      '<div class="cal-grid">' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(function (h) { return '<div class="cal-h">' + h + '</div>'; }).join('') + cells.join('') + '</div>' +
      '<div class="legend"><span><i class="st-Pending"></i> Pending</span><span><i class="st-Confirmed"></i> Confirmed</span><span><i class="st-Completed"></i> Completed</span><span><i class="st-Cancelled"></i> Cancelled</span></div>';
  }

  /* ---------- analytics ---------- */
  function viewAnalytics() {
    var months = lastMonths(6);
    var byMonth = months.map(function (m) {
      return { m: m.label, n: db.requests.filter(function (r) { return (r.created_at || '').indexOf(m.key) === 0; }).length, v: db.quotes.filter(function (q) { return (q.created_at || '').indexOf(m.key) === 0; }).reduce(function (a, q) { return a + q.total; }, 0) };
    });
    var maxN = Math.max.apply(null, byMonth.map(function (b) { return b.n; })).valueOf() || 1;
    var byBrand = CRM.BRANDS.map(function (b) {
      var rs = db.requests.filter(function (r) { return r.preferred_brand === b.id; });
      var qs = db.quotes.filter(function (q) { return rs.some(function (r) { return r.request_id === q.request_id; }); });
      return { name: b.name, tone: b.tone, n: rs.length, found: qs.length, rev: qs.filter(function (q) { return q.status === 'Accepted'; }).reduce(function (a, q) { return a + q.total; }, 0) };
    });
    var maxB = Math.max.apply(null, byBrand.map(function (b) { return b.n; })).valueOf() || 1;
    var byType = CRM.EVENT_TYPES.map(function (t) { return { t: t, n: db.requests.filter(function (r) { return r.event_type === t; }).length }; }).sort(function (a, b) { return b.n - a.n; });
    var maxT = byType[0].n || 1;
    var conv = db.requests.length ? Math.round(db.quotes.filter(function (q) { return q.status === 'Accepted'; }).length / db.requests.length * 100) : 0;
    var avgGuests = db.requests.length ? Math.round(db.requests.reduce(function (a, r) { return a + r.guest_count; }, 0) / db.requests.length) : 0;
    var avgQuote = db.quotes.length ? Math.round(db.quotes.reduce(function (a, q) { return a + q.total; }, 0) / db.quotes.length) : 0;
    var leadSrc = {};
    db.requests.forEach(function (r) { leadSrc[r.lead_source] = (leadSrc[r.lead_source] || 0) + 1; });
    var leads = Object.keys(leadSrc).map(function (k) { return { k: k, n: leadSrc[k] }; }).sort(function (a, b) { return b.n - a.n; });
    var leadsTot = leads.reduce(function (a, l) { return a + l.n; }, 0) || 1;

    return '<div class="crm-head"><div><span class="cap">Insights</span><h1>Analytics</h1></div></div>' +
      '<div class="stat-grid">' + statCard('Conversion Rate', conv + '%', 'gold') + statCard('Avg Guests', avgGuests) + statCard('Avg Quote Value', '<span style="font-size:.7em">' + CRM.money(avgQuote) + '</span>') + statCard('Revenue Pipeline', '<span style="font-size:.7em">' + CRM.money(revenuePipeline()) + '</span>', 'green') + '</div>' +
      '<div class="dash-cols">' +
      '<div class="panel"><div class="panel-head"><h3>Requests by Month</h3></div>' + bars(byMonth, function (b) { return b.n; }, maxN, function (b) { return b.m; }) + '</div>' +
      '<div class="panel"><div class="panel-head"><h3>Requests by Event Type</h3></div>' + bars(byType, function (b) { return b.n; }, maxT, function (b) { return b.t; }) + '</div>' +
      '</div>' +
      '<div class="panel"><div class="panel-head"><h3>Brand Overview</h3><span class="muted small">Compare catering demand across the six concepts</span></div>' +
      '<table class="crm-table"><thead><tr><th>Concept</th><th>Requests</th><th>Quotes</th><th>Request share</th><th>Confirmed revenue</th></tr></thead><tbody>' +
      byBrand.map(function (b) {
        return '<tr><td><span class="dot" style="background:' + b.tone + '"></span><b>' + esc(b.name) + '</b></td><td>' + b.n + '</td><td>' + b.found + '</td>' +
          '<td><div class="pipe-bar sm"><i style="background:' + b.tone + ';width:' + Math.round(b.n / maxB * 100) + '%"></i></div></td><td>' + CRM.money(b.rev) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="dash-cols">' +
      '<div class="panel"><div class="panel-head"><h3>Lead Sources</h3></div><div class="legend-v">' +
      leads.map(function (l) {
        return '<div class="lead-row"><span>' + esc(l.k) + '</span><div class="pipe-bar"><i style="width:' + Math.round(l.n / leadsTot * 100) + '%"></i></div><b>' + l.n + ' · ' + Math.round(l.n / leadsTot * 100) + '%</b></div>';
      }).join('') + '</div></div>' +
      '<div class="panel"><div class="panel-head"><h3>Status Distribution</h3></div>' +
      donut() + '</div>' +
      '</div>';
  }

  function bars(data, valFn, max, labelFn) {
    return '<div class="bars">' + data.map(function (b, i) {
      var h = Math.round(valFn(b) / max * 100);
      return '<div class="bar-col" title="' + esc(labelFn(b)) + ' · ' + valFn(b) + '"><div class="bar"><i style="height:' + h + '%"></i></div><span>' + (valFn(b) || '') + '</span><em>' + shortLabel(labelFn(b)) + '</em></div>';
    }).join('') + '</div>';
  }

  function shortLabel(s) { return String(s).split(' ').map(function (w) { return w[0]; }).join('').slice(0, 3).toUpperCase(); }

  function donut() {
    var totals = {};
    db.requests.forEach(function (r) { totals[r.status] = (totals[r.status] || 0) + 1; });
    var keys = Object.keys(totals), total = keys.reduce(function (a, k) { return a + totals[k]; }, 0) || 1;
    var colors = { 'New': '#C9A86A', 'Contacted': '#8FA982', 'Requirements Confirmed': '#7C6A9E', 'Quote Preparing': '#B4573A', 'Quote Sent': '#6B7F9E', 'Negotiation': '#A8864E', 'Confirmed': '#3F7D5B', 'Completed': '#2E6F8E', 'Cancelled': '#B0A99A' };
    var segs = []; var acc = 0;
    keys.forEach(function (k) {
      var pct = totals[k] / total * 360;
      segs.push('<i style="background:' + colors[k] + ';transform:rotate(' + acc + 'deg)"></i>');
      acc += pct;
    });
    return '<div class="doughnut"><div class="hole"><b>' + total + '</b><span>requests</span></div>' + segs.join('') + '</div>' +
      '<div class="legend-v">' + keys.map(function (k) { return '<div class="lead-row"><span class="lbl"><i class="dot" style="background:' + colors[k] + '"></i>' + esc(k) + '</span><b>' + totals[k] + '</b></div>'; }).join('') + '</div>';
  }

  /* ---------- messages (lightweight) ---------- */
  function viewMessages() {
    var urgent = db.requests.filter(isUrgent);
    var recentNew = db.requests.filter(isNew);
    return '<div class="crm-head"><div><span class="cap">Inbox</span><h1>Messages</h1></div></div>' +
      '<div class="dash-cols">' +
      '<div class="panel"><div class="panel-head"><h3>New Requests</h3></div>' + (recentNew.length ? recentNew.map(function (r) {
        return '<div class="mini-row" onclick="location.hash=\'#/request/' + r.request_id + '\'"><b>' + esc(r.customer.name) + ' — ' + esc(r.event_type) + '</b><span>' + r.guest_count + ' guests · ' + esc(CRM.brandName(r.preferred_brand)) + '</span><em>' + fmt(r.created_at) + '</em></div>';
      }).join('') : '<p class="muted">No unread requests.</p>') + '</div>' +
      '<div class="panel"><div class="panel-head"><h3>Priority Queue</h3></div>' + (urgent.length ? urgent.map(function (r) {
        return '<div class="mini-row" onclick="location.hash=\'#/request/' + r.request_id + '\'"><b>' + esc(r.customer.name) + '</b><span>' + esc(r.event_type) + ' · ' + esc(r.status) + '</span><em class="urg-em">URGENT</em></div>';
      }).join('') : '<p class="muted">Queue is clear.</p>') + '</div>' +
      '</div>' +
      '<div class="panel"><div class="panel-head"><h3>Connected Channels</h3></div>' +
      '<p class="muted">Email, SMS and WhatsApp integrations can be connected at production time. The quote form already stores every lead with its source.</p>' +
      '<div class="chan-row"><span>WhatsApp Business</span><span class="st st-Pending">Not connected</span></div>' +
      '<div class="chan-row"><span>Email (SMTP)</span><span class="st st-Pending">Not connected</span></div>' +
      '<div class="chan-row"><span>SMS Gateway</span><span class="st st-Pending">Not connected</span></div></div>';
  }

  /* ---------- settings ---------- */
  function viewSettings() {
    var s = { role: 'Super Admin', staff: 'N. Fayas' };
    try { s.role = db.settings.role || s.role; s.staff = db.settings.staff_name || s.staff; } catch (e) {}
    return '<div class="crm-head"><div><span class="cap">Configuration</span><h1>Settings</h1></div></div>' +
      '<div class="dash-cols"><div class="panel"><div class="panel-head"><h3>Organisation</h3></div>' +
      '<div class="kv"><div><span>Business</span><b>Malay Fast Foods (Pvt) Ltd</b></div><div><span>Address</span><b>115 Hill Street, Dehiwala 10350</b></div><div><span>Phone</span><b>+94 11 777 7999</b></div><div><span>Catering email</span><b>catering@malayfastfoods.lk</b></div></div></div>' +
      '<div class="panel"><div class="panel-head"><h3>Access &amp; Roles</h3></div>' +
      '<div class="manage-row"><label>Current user<br><input class="in" id="roleIn" value="' + esc(s.staff) + '"></label>' +
      '<label>Role<br><select class="in" id="roleSel"><option' + (s.role === 'Super Admin' ? ' selected' : '') + '>Super Admin</option><option' + (s.role === 'Manager' ? ' selected' : '') + '>Manager</option><option' + (s.role === 'Staff' ? ' selected' : '') + '>Staff</option><option' + (s.role === 'Viewer' ? ' selected' : '') + '>Viewer</option></select></label>' +
      '<button class="btn" onclick="CRM_UI.saveSettings()">Save</button></div>' +
      '<div class="roles-grid">' + ['Super Admin', 'Manager', 'Staff', 'Viewer'].map(function (r) {
        var ok = [{ a: 'Full access' }, { a: 'Requests, quotes, customers, analytics' }, { a: 'Assigned requests & communication' }, { a: 'Read-only' }][['Super Admin', 'Manager', 'Staff', 'Viewer'].indexOf(r)];
        return '<div class="role-card' + (s.role === r ? ' on' : '') + '"><b>' + r + '</b><span>' + ok.a + '</span></div>';
      }).join('') + '</div>' +
      '<p class="muted">In production, staff sign in with controlled permissions. This demo honours a single local session.</p></div></div>' +
      '<div class="panel"><div class="panel-head"><h3>Data &amp; Deployment</h3></div>' +
      '<p class="muted">Data is stored in this browser as <b>localStorage</b> for the demo. Connect a backend (e.g. Node/Express + Postgres) and swap <code>CRM.loadDB/save</code> for API calls. Never expose credentials on the client.</p>' +
      '<div class="chan-row"><span>Storage backend</span><span class="st st-New">Browser (demo)</span></div></div>';
  }

  function emptyState(t) { return '<div class="empty-state"><h3>' + esc(t) + '</h3></div>'; }

  /* ---------- bell ---------- */
  function updateBell() {
    var n = db.requests.filter(isNew).length + db.requests.filter(isUrgent).length;
    var b = $('#bellCount'); if (b) b.textContent = n; if (b) b.classList.toggle('show', n > 0);
    var mm = $('#msgCount'); if (mm) mm.textContent = db.requests.filter(isNew).length;
  }

  /* ---------- binding / global UI actions ---------- */
  function bind() {
    var notes = $('#noteIn'); if (notes) notes.focus && notes.focus();
  }

  window.CRM_UI = {
    setFilter: function (k, v) { filters[k] = v; render(); },
    clearFilters: function () { filters = { q: '', brand: '', status: '', type: '', pri: '' }; render(); },
    shiftMonth: function (n) { calMonth += n; render(); },
    saveManage: function (id) {
      var r = CRM.findRequest(id); if (!r) return;
      r.status = $('#statusIn').value; r.assigned = $('#assignIn').value; r.follow_up = $('#followIn').value; r.priority = $('#priIn').value;
      CRM.save(db); toast('Request updated'); render();
    },
    addNote: function (id) {
      var txt = prompt('Internal note (staff only):');
      if (!txt || !txt.trim()) return;
      db.notes.push({ request_id: id, note: txt.trim(), author: 'Admin', date: new Date().toISOString().slice(0, 10) });
      CRM.save(db); render();
    },
    saveSettings: function () {
      db.settings.role = $('#roleSel').value; db.settings.staff_name = $('#roleIn').value;
      CRM.save(db); toast('Settings saved'); render();
    },
    openQuote: function (id) { openQuoteOverlay(id); },
    openBuilder: function (reqId) { openQuoteBuilder(reqId); }
  };

  /* ---------- quote builder ---------- */
  function openQuoteBuilder(reqId) {
    var r = CRM.findRequest(reqId); if (!r) return;
    var q = CRM.findQuoteByRequest(reqId);
    var items = q ? q.items.slice() : [
      { name: 'Signature Dum Biryani Platter', brand: 'Malay Restaurant', qty: r.guest_count, unit: Math.max(850, Math.round((r.budget / 1.4) / r.guest_count / 10) * 10) },
      { name: 'Kottu & Noodle Counter', brand: 'Malay Restaurant', qty: Math.ceil(r.guest_count / 20), unit: 9500 },
      { name: 'Malay Sambol & Pappadam Set', brand: 'Malay Restaurant', qty: Math.ceil(r.guest_count / 10), unit: 2200 }
    ];
    var draft = {
      request_id: r.request_id,
      items: items,
      service_charge_pct: q ? Math.round(q.service_charge / sub(items) * 1000) / 10 : 8,
      delivery: q ? q.delivery : (String(r.service_type).indexOf('Delivery') >= 0 ? 6500 : 0),
      discount: q ? q.discount : 0,
      tax_pct: 0,
      notes: q ? q.notes : 'Price valid for 14 days. Requires 50% advance to confirm. Halal & with love, from the Malay Fast Foods family.'
    };
    draft.subtotal = sub(items);
    draft.request_brand = r.preferred_brand;
    overlayContent(quoteBuilderHTML(r, q, draft));
    bindBuilder(draft);
  }

  function sub(items) { return items.reduce(function (a, i) { return a + (parseInt(i.qty, 10) || 0) * (parseInt(i.unit, 10) || 0); }, 0); }
  function calc(d) {
    var s = sub(d.items);
    var sc = Math.round(s * (parseFloat(d.service_charge_pct) || 0) / 100);
    var del = parseInt(d.delivery, 10) || 0;
    var disc = parseInt(d.discount, 10) || 0;
    var tax = Math.round((s + sc + del - disc) * (parseFloat(d.tax_pct) || 0) / 100);
    var total = s + sc + del - disc + tax;
    return { s: s, sc: sc, del: del, disc: disc, tax: tax, total: total };
  }

  function quoteBuilderHTML(r, q, d) {
    return '<div class="overlay"><div class="ov-card wide">' +
      '<button class="ov-x" data-x>×</button>' +
      '<span class="cap">Quote Builder</span><h2>Create Proposal — ' + r.request_id + '</h2>' +
      '<p class="sub">' + esc(r.customer.name) + ' · ' + esc(r.event_type) + ' · ' + fmt(r.event_date) + ' · ' + r.guest_count + ' guests · ' + esc(CRM.brandName(r.preferred_brand)) + '</p>' +
      '<div class="qb-cols">' +
      '<div><div class="qb-head"><h3>Menu Items</h3><button class="btn-ghost" onclick="CRM_UI_BI.addItem()">+ Add dish</button></div>' +
      '<div id="qbItems"><p class="muted">Start from brand dishes or add custom lines.</p></div></div>' +
      '<div><h3>Pricing</h3>' +
      '<label class="lb">Service charge %<input class="in" id="qbSc" type="number" value="' + d.service_charge_pct + '" min="0" max="100"></label>' +
      '<label class="lb">Delivery (LKR)<input class="in" id="qbDel" type="number" value="' + d.delivery + '" min="0"></label>' +
      '<label class="lb">Discount (LKR)<input class="in" id="qbDisc" type="number" value="' + d.discount + '" min="0"></label>' +
      '<label class="lb">Tax % (if applicable)<input class="in" id="qbTax" type="number" value="' + d.tax_pct + '" min="0" max="100"></label>' +
      '<div class="tot-box" id="qbTot"></div>' +
      '<label class="lb">Terms / notes<textarea class="in" id="qbNotes" rows="3">' + esc(d.notes) + '</textarea></label>' +
      '<button class="btn wide" onclick="CRM_UI_BI.save()">Save &amp; Send Quote</button>' +
      '</div></div></div></div>';
  }

  function bindBuilder(d) {
    var items = d.items;
    var renderItems = function () {
      var host = $('#qbItems'); if (!host) return;
      host.innerHTML = items.map(function (i, idx) {
        return '<div class="qb-item"><input class="in" data-it="name" data-i="' + idx + '" value="' + esc(i.name) + '" placeholder="Dish">' +
          '<select class="in" data-it="brand" data-i="' + idx + '">' + CRM.BRANDS.map(function (b) { return '<option' + (i.brand === b.name ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') + '</select>' +
          '<input class="in qty" data-it="qty" data-i="' + idx + '" type="number" min="0" value="' + i.qty + '">' +
          '<input class="in qty" data-it="unit" data-i="' + idx + '" type="number" min="0" value="' + i.unit + '">' +
          '<b class="line-tot">' + CRM.money((parseInt(i.qty, 10) || 0) * (parseInt(i.unit, 10) || 0)) + '</b>' +
          '<button class="btn-ghost del" data-del="' + idx + '">×</button></div>';
      }).join('');
      refreshTotals();
    };
    var refreshTotals = function () {
      d.service_charge_pct = parseFloat(($('#qbSc') && $('#qbSc').value) || 0);
      d.delivery = parseInt(($('#qbDel') && $('#qbDel').value) || 0, 10);
      d.discount = parseInt(($('#qbDisc') && $('#qbDisc').value) || 0, 10);
      d.tax_pct = parseFloat(($('#qbTax') && $('#qbTax').value) || 0);
      var t = calc(d); var el = $('#qbTot');
      if (!el) return;
      el.innerHTML = '<div><span>Subtotal</span><b>' + CRM.money(t.s) + '</b></div>' +
        '<div><span>Service charge</span><b>' + CRM.money(t.sc) + '</b></div>' +
        '<div><span>Delivery</span><b>' + CRM.money(t.del) + '</b></div>' +
        '<div><span>Discount</span><b>− ' + CRM.money(t.disc) + '</b></div>' +
        '<div><span>Tax</span><b>' + CRM.money(t.tax) + '</b></div>' +
        '<div class="grand"><span>Total</span><b>' + CRM.money(t.total) + '</b></div>';
    };
    var readRow = function (idx) {
      var gi = function (sel) { var e = document.querySelector('[data-it="' + sel + '"][data-i="' + idx + '"]'); return e ? e.value : ''; };
      return { name: gi('name'), brand: gi('brand'), qty: parseInt(gi('qty'), 10) || 0, unit: parseInt(gi('unit'), 10) || 0 };
    };
    ['qbSc', 'qbDel', 'qbDisc', 'qbTax'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () { refreshTotals(); });
    });
    var host = $('#qbItems');
    if (host) host.addEventListener('input', function (e) {
      var t = e.target; if (!t.getAttribute('data-it')) return;
      items[parseInt(t.getAttribute('data-i'), 10)] = readRow(parseInt(t.getAttribute('data-i'), 10));
      refreshTotals();
    });
    renderItems();
    window.CRM_UI_BI = {
      addItem: function () { items.push({ name: '', brand: CRM.brandName(d.request_brand || 'malay'), qty: 1, unit: 0 }); renderItems(); },
      save: function () {
        var t = calc(d);
        var r = CRM.findRequest(d.request_id); if (!r) return;
        var existing = CRM.findQuoteByRequest(d.request_id);
        var q = existing || { quote_id: idFromSerial(), request_id: d.request_id, status: 'Sent', created_at: new Date().toISOString().slice(0, 10), expiry_date: getExpiry() };
        q.items = d.items; q.subtotal = t.s; q.service_charge = t.sc; q.delivery = t.del; q.discount = t.disc; q.tax = t.tax; q.total = t.total; q.notes = $('#qbNotes').value || '';
        if (!existing) db.quotes.unshift(q);
        if (CRM.STATUSES.indexOf(r.status) < CRM.STATUSES.indexOf('Quote Sent')) r.status = 'Quote Sent';
        CRM.save(db); closeOv(); toast('Quote ' + q.quote_id + ' generated. Customer can view it at /quote.html?ref=' + r.request_id);
      }
    };
    (function () {
      var b = $('.ov-card .qb-head');
    }());
    d.__bind = true;
  }

  function getExpiry() { var d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().slice(0, 10); }
  var qserial = Date.now() % 100000;
  function idFromSerial() { qserial++; return 'Q-' + new Date().getFullYear() + '-' + String(qserial).slice(-4); }

  /* ---------- quote preview overlay ---------- */
  function openQuoteOverlay(qid) {
    var q = db.quotes.find(function (x) { return x.quote_id === qid; }); if (!q) return;
    var r = CRM.findRequest(q.request_id); if (!r) { closeOv(); return; }
    overlayContent(quoteHTML(r, q, false));
  }

  function quoteHTML(r, q, compact) {
    var statuses = [
      ['Request Received', 0, r.status !== 'New'],
      ['Requirements Reviewed', 1, CRM.STATUSES.indexOf(r.status) >= 1],
      ['Quote Prepared', 2, !!q],
      ['Quote Sent', 3, !!q],
      ['Awaiting Confirmation', 4, q && q.status === 'Accepted']
    ];
    var rows = q.items.map(function (i) {
      return '<tr><td>' + esc(i.name) + '<br><small>' + esc(i.brand) + '</small></td><td class="ta-r">' + i.qty + '</td><td class="ta-r">' + CRM.money(i.unit) + '</td><td class="ta-r"><b>' + CRM.money(i.qty * i.unit) + '</b></td></tr>';
    }).join('');
    return '<div class="quote-sheet">' +
      '<div class="q-head"><span class="cap">CATERING PROPOSAL</span>' +
      '<div class="q-org"><b>MALAY FAST FOODS</b><span>115 Hill Street, Dehiwala 10350 · +94 11 777 7999</span></div></div>' +
      '<hr>' +
      '<h2 class="q-title">Your Catering Proposal</h2>' +
      '<div class="q-meta">' +
      '<div><span>Reference</span><b class="mono">' + q.quote_id + '</b></div>' +
      '<div><span>Request</span><b class="mono">' + r.request_id + '</b></div>' +
      '<div><span>Event</span><b>' + esc(r.event_type) + ' · ' + fmt(r.event_date) + '</b></div>' +
      '<div><span>Venue</span><b>' + esc(r.location) + '</b></div>' +
      '<div><span>Guests</span><b>' + r.guest_count + '</b></div>' +
      '<div><span>Concept</span><b>' + esc(CRM.brandName(r.preferred_brand)) + '</b></div>' +
      '</div>' +
      '<table class="crm-table q-items"><thead><tr><th>Item</th><th class="ta-r">Qty</th><th class="ta-r">Rate</th><th class="ta-r">Total</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="tot-row"><div><span>Subtotal</span><b>' + CRM.money(q.subtotal) + '</b></div>' +
      '<div><span>Service charge</span><b>' + CRM.money(q.service_charge) + '</b></div>' +
      '<div><span>Delivery</span><b>' + CRM.money(q.delivery) + '</b></div>' +
      (q.discount ? '<div><span>Discount</span><b>− ' + CRM.money(q.discount) + '</b></div>' : '') +
      (q.tax ? '<div><span>Tax</span><b>' + CRM.money(q.tax) + '</b></div>' : '') +
      '<div class="grand"><span>Total</span><b>' + CRM.money(q.total) + '</b></div></div>' +
      '<p class="muted small">' + esc(q.notes || '') + '</p>' +
      '<div class="q-status"><h3>Status</h3><div class="pipe-vert">' + statuses.map(function (s) {
        return '<div class="pv ' + (s[2] ? 'done' : s[1] === 2 && q ? 'now' : '') + '"><i></i><span>' + s[0] + '</span></div>';
      }).join('') + '</div></div>' +
      '</div>';
  }

  /* ---------- overlay plumbing ---------- */
  function overlayContent(html) {
    var host = document.createElement('div');
    host.innerHTML = html;
    host.id = 'ovHost';
    var old = $('#ovHost'); if (old) old.remove();
    document.body.appendChild(host);
    var x = host.querySelector('[data-x]');
    if (x) x.addEventListener('click', closeOv);
    document.body.classList.add('ov-open');
  }
  function closeOv() { var h = $('#ovHost'); if (h) h.remove(); document.body.classList.remove('ov-open'); }

  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 20);
    setTimeout(function () { t.classList.add('hide'); setTimeout(function () { t.remove(); }, 300); }, 2600);
  }

  function lastMonths(n) {
    var out = []; var d = new Date();
    for (var i = 0; i < n; i++) {
      d = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      out.unshift({ label: d.toLocaleDateString('en-GB', { month: 'short' }) + ' ' + String(d.getFullYear()).slice(2), key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') });
    }
    return out;
  }

  /* ---------- boot ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var gate = $('#gate');
    if (!CRM.isAuthed()) {
      if (/[?&](demo|relay)=1/.test(location.search)) { CRM.login('admin1234', 'admin321'); enter(); return; }
      if (gate) gate.classList.add('show');
      if ($('#loginBtn')) $('#loginBtn').addEventListener('click', loginGo);
      var lu = $('#loginUser');
      if (lu) lu.addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#loginPass') && $('#loginPass').focus(); });
      if ($('#loginPass')) $('#loginPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') loginGo(); });
      return;
    }
    enter();
  });

  function loginGo() {
    var lu = $('#loginUser'), lp = $('#loginPass');
    if (CRM.login(lu ? lu.value : '', lp ? lp.value : '')) { enter(); return; }
    $('#loginErr').textContent = 'Incorrect username or password.';
  }
  function enter() {
    var gate = $('#gate'); if (gate) gate.remove();
    refresh();
    $$('.crm-nav a').forEach(function (a) {
      a.addEventListener('click', function () { if (a.getAttribute('data-view') === 'log') { CRM.logout(); location.reload(); } });
    });
    $('#crmSidebar') && $('#crmSidebar').addEventListener('click', function (e) {
      var togg = e.target.closest('#sideToggle');
      if (togg) document.body.classList.toggle('side-closed');
    });
    var menuBtn = $('#menuBtn');
    if (menuBtn) menuBtn.addEventListener('click', function () { document.body.classList.add('side-open'); });
    var sideMask = $('#sideMask');
    if (sideMask) sideMask.addEventListener('click', function () { document.body.classList.remove('side-open'); });
    window.addEventListener('hashchange', route);
    if (!location.hash) { history.replaceState(null, '', '#/dashboard'); }
    route();
    $('#crmUserName') && ($('#crmUserName').textContent = (db.settings && db.settings.staff_name) || 'N. Fayas');
  }
})();