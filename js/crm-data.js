/* ============================================================
   MALAY — Catering CRM shared data layer
   localStorage-backed demo database. Replace with a real API
   (Node/Express/Django + Postgres) for production deployment.
   No customer data is exposed publicly; the dashboard is gated.
   ============================================================ */
(function () {
  var STORE_KEY = 'mff_crm_db_v1';
  var SESSION_KEY = 'mff_crm_admin_v1';

  var BRANDS = [
    { id: 'malay', name: 'Malay Restaurant', cuisine: 'Heritage Malay / Sri Lankan / Asian', tone: '#C9A86A', desc: 'The heritage flagship of the group — Malay, Sri Lankan, Chinese, Indian and Arabic dining across fifty years of craft.' },
    { id: 'asiana', name: 'Cafe Asiana', cuisine: 'Contemporary Asian Dining', tone: '#8FA982', desc: 'Modern Asian fusion — nasi goreng, noodles, seafood and wok dishes with a contemporary edge.' },
    { id: 'shanghai', name: 'Shanghai Wok', cuisine: 'Fast-Casual Chinese', tone: '#B4573A', desc: 'Quick, honest Chinese food — fried rice, noodles, chop suey and chilli dishes, made to order.' },
    { id: 'nelum', name: 'Nelum Flower', cuisine: 'Everyday Sri Lankan', tone: '#6B7F9E', desc: 'Daily Sri Lankan dining — rice & curry, kottu, roti and fresh juices at their most comforting.' },
    { id: 'pdarbar', name: 'Pakistan Darbar', cuisine: 'Pakistani BBQ / Arabic', tone: '#7C6A9E', desc: 'Charcoal BBQ, biryani, kabsa and shaorma with bold Pakistani and Arabic flavours.' },
    { id: 'darbar', name: 'Darbar Biryani & BBQ', cuisine: 'Biryani + BBQ Specialist', tone: '#A8864E', desc: 'A focused biryani and barbecue kitchen for delivery-led catering and large orders.' }
  ];

  var STATUSES = ['New', 'Contacted', 'Requirements Confirmed', 'Quote Preparing', 'Quote Sent', 'Negotiation', 'Confirmed', 'Completed', 'Cancelled'];
  var ACTIVE_STATUSES = ['New', 'Contacted', 'Requirements Confirmed', 'Quote Preparing', 'Quote Sent', 'Negotiation', 'Confirmed'];

  var EVENT_TYPES = ['Wedding', 'Corporate Event', 'Birthday', 'Religious Function', 'Office Lunch', 'Private Event', 'Engagement', 'Party', 'Other'];
  var SERVICE_TYPES = ['Food Delivery', 'Buffet', 'Full Catering', 'Drop-off Catering', 'On-site Service', 'Not Sure'];
  var CUISINES = ['Malay', 'Sri Lankan', 'Chinese', 'Indian', 'Pakistani', 'Arabic', 'BBQ', 'Biryani', 'Vegetarian', 'Seafood', 'Halal'];
  var LEAD_SOURCES = ['Website', 'Instagram', 'Facebook', 'Google', 'WhatsApp', 'Referral', 'Other'];
  var PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];

  function pad(n, l) { n = String(n); while (n.length < (l || 4)) n = '0' + n; return n; }

  function genRequestId() {
    var n = (Date.now() % 9000) + 1000 + Math.floor(Math.random() * 90);
    return 'CAT-' + new Date().getFullYear() + '-' + pad(n, 4);
  }

  function genQuoteId() { return 'Q-' + new Date().getFullYear() + '-' + pad(Math.floor(Math.random() * 9000) + 1000, 4); }

  function todayISO(offsetDays) {
    var d = new Date();
    if (offsetDays || offsetDays === 0) d.setDate(d.getDate() + (offsetDays || 0));
    return d.toISOString().slice(0, 10);
  }

  function money(n) { return 'Rs. ' + Number(n || 0).toLocaleString('en-LK'); }

  function loadDB() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    var db = seed();
    persist(db);
    return db;
  }

  function persist(db) { try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) {} }

  function save(db) { persist(db); return db; }

  function emptyDB() {
    return { version: 1, seeded: true, requests: [], customers: [], quotes: [], notes: [], settings: { org: 'Malay Fast Foods', phone: '+94 11 777 7999', email: 'catering@malayfastfoods.lk' } };
  }

  /* ---------- DEMO SEED DATA (clearly marked; replace with production) ---------- */
  function seed() {
    var db = emptyDB();
    var C = [
      { name: 'Ahmed Mubarak', phone: '+94 77 123 4567', email: 'ahmed.m@example.com', source: 'Referral' },
      { name: 'Fernando Family', phone: '+94 71 987 6543', email: 'fernando.fam@example.com', source: 'Website' },
      { name: 'Nuwan Perera', phone: '+94 75 555 2188', email: 'nuwan.p@example.com', source: 'Instagram' },
      { name: 'Rizvi Foundation', phone: '+94 11 234 8890', email: 'events@rizvi.example.org', source: 'WhatsApp' },
      { name: 'Dilani Weerasekara', phone: '+94 70 112 3344', email: 'dilani.w@example.com', source: 'Facebook' },
      { name: 'Mount Crest Hotel', phone: '+94 76 800 1122', email: 'booking@mountcrest.example.com', source: 'Google' },
      { name: 'Samantha Gunawardena', phone: '+94 72 334 5566', email: 'sam.g@example.com', source: 'Referral' },
      { name: 'Al-Falah Mosque Trust', phone: '+94 77 909 0090', email: 'admin@alfalah.example.org', source: 'Other' },
      { name: 'Chaminda Holdings (Pvt) Ltd', phone: '+94 11 440 1212', email: 'hr@chaminda.example.lk', source: 'Website' },
      { name: 'Ishara & Nadia', phone: '+94 78 222 7788', email: 'ishara.and.nadia@example.com', source: 'Instagram' }
    ];
    var SEED = [
      { c: 0, type: 'Wedding', date: todayISO(18), guests: 250, loc: 'Mount Lavinia Hotel', brand: 'malay', bud: 450000, svc: 'Full Catering', cuis: ['Malay', 'Sri Lankan', 'BBQ'], msg: 'Large traditional wedding reception. Would like a Malay dum biryani live counter and a BBQ station.', status: 'Quote Sent', pri: 'High', notes: [{ a: 'Admin', t: 'Wedding party of 250. Customer requested vegetarian options on 3 tables.', d: todayISO(-1) }] },
      { c: 1, type: 'Birthday', date: todayISO(6), guests: 40, loc: 'Home — Dehiwala', brand: 'asiana', bud: 95000, svc: 'Buffet', cuis: ['Chinese', 'Seafood'], msg: '60th birthday at home. Family buffet, mild spicing requested.', status: 'New', pri: 'Normal', notes: [] },
      { c: 2, type: 'Corporate Event', date: todayISO(22), guests: 120, loc: 'Our HQ, Colombo 03', brand: 'shanghai', bud: 180000, svc: 'On-site Service', cuis: ['Chinese', 'Vegetarian'], msg: 'Quarterly all-hands lunch for 120 staff. Need set-up at noon, two serving lines.', status: 'Contacted', pri: 'High', notes: [] },
      { c: 3, type: 'Religious Function', date: todayISO(9), guests: 300, loc: 'Dehiwala', brand: 'pdarbar', bud: 380000, svc: 'Full Catering', cuis: ['Pakistani', 'Biryani', 'Halal'], msg: 'Foundation Iftar gathering. Kabsa, biryani and dates. Strictly halal.', status: 'Requirements Confirmed', pri: 'Urgent', notes: [{ a: 'Staff', t: 'Confirmed halal certs. Menu locked pending final headcount.', d: todayISO(-2) }] },
      { c: 4, type: 'Private Event', date: todayISO(30), guests: 60, loc: 'Family Residence', brand: 'nelum', bud: 120000, svc: 'Drop-off Catering', cuis: ['Sri Lankan'], msg: 'Family milestone dinner. Traditional rice & curry spread plus hoppers counter.', status: 'New', pri: 'Normal', notes: [] },
      { c: 5, type: 'Office Lunch', date: todayISO(4), guests: 85, loc: 'Galle Face Terrace', brand: 'malay', bud: 140000, svc: 'Buffet', cuis: ['Malay', 'Sri Lankan'], msg: 'Weekly catering slot — rotating group menus each Friday.', status: 'Confirmed', pri: 'Normal', notes: [] },
      { c: 6, type: 'Engagement', date: todayISO(15), guests: 90, loc: 'Private Villa, Wellawatte', brand: 'darbar', bud: 175000, svc: 'Full Catering', cuis: ['Biryani', 'BBQ'], msg: 'Engagement dinner. Dum biryani and seekh kebab grill requested.', status: 'Quote Preparing', pri: 'High', notes: [] },
      { c: 7, type: 'Religious Function', date: todayISO(-20), guests: 200, loc: 'Community Hall', brand: 'malay', bud: 220000, svc: 'Full Catering', cuis: ['Sri Lankan', 'Halal'], msg: 'Community supper — completed successfully.', status: 'Completed', pri: 'Normal', notes: [{ a: 'Admin', t: 'Delivered on time. Client happy, asked for repeat booking.', d: todayISO(-18) }] },
      { c: 8, type: 'Corporate Event', date: todayISO(35), guests: 150, loc: 'Taj Samudra', brand: 'asiana', bud: 420000, svc: 'On-site Service', cuis: ['Asian', 'Seafood'], msg: 'Annual dinner. Executive tray service plus live noodle station.', status: 'Negotiation', pri: 'Urgent', notes: [{ a: 'Admin', t: 'Client negotiating menu margin — proposed 12% service discount.', d: todayISO(-1) }] },
      { c: 3, type: 'Party', date: todayISO(12), guests: 55, loc: 'Rooftop, Bambalapitiya', brand: 'pdarbar', bud: 110000, svc: 'Drop-off Catering', cuis: ['BBQ', 'Arabic'], msg: 'Evening rooftop party — shaorma platters and kabab selection.', status: 'New', pri: 'Normal', notes: [] },
      { c: 9, type: 'Wedding', date: todayISO(-9), guests: 180, loc: 'Garden Pavilion', brand: 'nelum', bud: 260000, svc: 'Full Catering', cuis: ['Sri Lankan'], msg: 'Wedding lunch done. Excellent feedback.', status: 'Completed', pri: 'Normal', notes: [{ a: 'Staff', t: 'Post-event feedback collected. High rating for kottu station.', d: todayISO(-7) }] }
    ];

    SEED.forEach(function (s, i) {
      var cst = C[s.c];
      if (!db.customers[i]) {
        var cid = i + 1;
        db.customers.push({ id: cid, name: cst.name, phone: cst.phone, email: cst.email, source: cst.source, created_at: todayISO(-30 + i), notes: '' });
      }
      var req = {
        request_id: 'CAT-' + new Date().getFullYear() + '-' + pad(1000 + i * 37, 4),
        customer_id: i + 1,
        customer: cst,
        event_type: s.type,
        event_date: s.date,
        guest_count: s.guests,
        location: s.loc,
        budget: s.bud,
        preferred_brand: s.brand,
        cuisine_preferences: s.cuis,
        service_type: s.svc,
        message: s.msg,
        lead_source: cst.source,
        status: s.status,
        priority: s.pri,
        assigned: s.pri === 'Urgent' ? 'N. Fayas' : 'Admin Team',
        follow_up: s.status === 'New' ? todayISO(2) : '',
        created_at: todayISO(-5 + (i % 5))
      };
      db.requests.push(req);

      if (s.status === 'Quote Sent' || s.status === 'Negotiation' || s.status === 'Confirmed' || s.status === 'Completed') {
        var est = Math.round(s.guests * (s.bud / s.guests) * 1.0 / 50) * 50 || s.bud;
        var items = [
          { name: 'Dum Biryani with Curries', brand: 'Malay Restaurant', qty: s.guests, unit: Math.round(est / s.guests / 10) * 10 },
          { name: 'Kottu Counter Package', brand: 'Malay Restaurant', qty: Math.ceil(s.guests / 20), unit: 8500 }
        ];
        var sub = items.reduce(function (a, b) { return a + b.qty * b.unit; }, 0);
        var quote = {
          quote_id: genQuoteId(), request_id: req.request_id,
          items: items, subtotal: sub,
          service_charge: Math.round(sub * 0.08), delivery: s.svc.indexOf('Delivery') >= 0 ? 6500 : 0,
          discount: s.status === 'Negotiation' ? Math.round(sub * 0.12) : 0, tax: 0,
          status: s.status === 'Confirmed' ? 'Accepted' : s.status === 'Completed' ? 'Accepted' : 'Sent',
          expiry_date: todayISO(14), created_at: todayISO(-2), notes: 'Standard catering terms apply.'
        };
        quote.total = quote.subtotal + quote.service_charge + quote.delivery - quote.discount + quote.tax;
        db.quotes.push(quote);
      }
    });
    return db;
  }

  /* ---------- auth (demo credentials) ----------
     Demo/dev only. Never printed on any public page.
     Production: replace with a real server-side session. */
  function isAuthed() { return sessionStorage.getItem(SESSION_KEY) === '1'; }
  function login(user, pass) {
    if (String(user).trim() === 'admin1234' && String(pass) === 'admin321') {
      sessionStorage.setItem(SESSION_KEY, '1');
      try { sessionStorage.setItem(SESSION_KEY + '_user', String(user).trim()); } catch (e) {}
      return true;
    }
    return false;
  }
  function logout() { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY + '_user'); }

  /* ---------- helpers ---------- */
  function findRequest(id) { return loadDB().requests.find(function (r) { return r.request_id === id; }); }
  function findCustomer(id) { return loadDB().customers.find(function (c) { return c.id === id; }); }
  function findQuoteByRequest(id) { return loadDB().quotes.find(function (q) { return q.request_id === id; }); }

  window.CRM = {
    BRANDS: BRANDS, STATUSES: STATUSES, ACTIVE_STATUSES: ACTIVE_STATUSES,
    EVENT_TYPES: EVENT_TYPES, SERVICE_TYPES: SERVICE_TYPES, CUISINES: CUISINES,
    LEAD_SOURCES: LEAD_SOURCES, PRIORITIES: PRIORITIES,
    loadDB: loadDB, save: save, emptyDB: emptyDB,
    genRequestId: genRequestId, genQuoteId: genQuoteId,
    todayISO: todayISO, money: money,
    isAuthed: isAuthed, login: login, logout: logout,
    findRequest: findRequest, findCustomer: findCustomer, findQuoteByRequest: findQuoteByRequest,
    DEFAULT_BRAND: 'malay'
  };

  // brand name lookup convenience
  window.CRM.brandName = function (id) {
    var b = BRANDS.find(function (b) { return b.id === id; });
    return b ? b.name : id;
  };

  window.dispatchEvent(new Event('crm-ready'));
})();