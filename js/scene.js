/* ============================================================
   MALAY RESTAURANT — Cinematic 3D hero scene (Three.js)
   Warm heritage palette, floating plate, steam + spice particles.
   ============================================================ */
(function () {
  'use strict';
  var canvas = document.getElementById('hero3d');
  if (!canvas) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 720;

  function buildTexture(src, cb) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      var size = 512;
      if (img.width !== img.height) {
        // fit square with circular clip
        var s = Math.min(img.width, img.height);
        var c = document.createElement('canvas');
        c.width = c.height = s;
        var cc = c.getContext('2d');
        cc.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, s, s);
        var tex = new THREE.CanvasTexture(c);
        cb(tex);
        return;
      }
      var tex = new THREE.Texture(img);
      tex.needsUpdate = true;
      cb(tex);
    };
    img.onerror = function () { cb(null); };
    img.src = src;
  }

  function smokeTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,244,225,0.85)');
    grad.addColorStop(0.4, 'rgba(255,244,225,0.35)');
    grad.addColorStop(1, 'rgba(255,244,225,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function spiceTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 32;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(233,207,150,1)');
    grad.addColorStop(0.5, 'rgba(233,207,150,0.5)');
    grad.addColorStop(1, 'rgba(233,207,150,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }

  function init() {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: !isMobile,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (e) { canvas.style.display = 'none'; return; }

    var sWidth = window.innerWidth;
    var sHeight = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.4 : 1.8);
    renderer.setPixelRatio(dpr);
    renderer.setSize(sWidth, sHeight);
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x14110D, 0.022);

    var camera = new THREE.PerspectiveCamera(42, sWidth / sHeight, 0.1, 60);
    camera.position.set(0, 0.2, 6.6);

    // ---- Lights ----
    scene.add(new THREE.HemisphereLight(0xffeed6, 0x241a0f, 1.0));
    var key = new THREE.DirectionalLight(0xffe3bb, 1.35);
    key.position.set(3.5, 5, 2.5);
    scene.add(key);
    var rim = new THREE.PointLight(0xc9a86a, 1.1, 14);
    rim.position.set(-2.6, 1.4, -2.4);
    scene.add(rim);
    var fill = new THREE.PointLight(0x6b5238, 0.5, 10);
    fill.position.set(-2, 0.4, 3.2);
    scene.add(fill);

    // ---- Group that holds the whole still-life ----
    var group = new THREE.Group();
    scene.add(group);
    var centeredDesktop = window.innerWidth > 1000;
    var baseX = centeredDesktop ? 3.05 : 0;
    group.position.set(baseX, 0.05, 0);

    // ---- Plate (lathed ceramic) ----
    (function buildPlate() {
      var pts = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.42, 0.0),
        new THREE.Vector2(0.86, 0.03),
        new THREE.Vector2(1.14, 0.11),
        new THREE.Vector2(1.34, 0.25),
        new THREE.Vector2(1.44, 0.36)
      ];
      var geo = new THREE.LatheGeometry(pts, 96);
      var mat = new THREE.MeshPhysicalMaterial({
        color: 0x8a6a42,
        metalness: 0.38,
        roughness: 0.32,
        sheen: 0.5,
        sheenColor: new THREE.Color(0xc9a86a),
        clearcoat: 0.22,
        clearcoatRoughness: 0.5
      });
      var plate = new THREE.Mesh(geo, mat);
      plate.scale.set(1, 1, 1);
      group.add(plate);

      var rim = new THREE.TorusGeometry(1.44, 0.028, 24, 96);
      var rimMat = new THREE.MeshStandardMaterial({
        color: 0xd8bc82, metalness: 0.85, roughness: 0.28
      });
      var rimM = new THREE.Mesh(rim, rimMat);
      rimM.position.set(0, 0.38, 0);
      rimM.rotation.x = -Math.PI / 2;
      group.add(rimM);
    })();

    // ---- Food disc (authentic photography, clipped circular) ----
    var food = null;
    var heaps = [], dome = null;
    buildTexture('assets/hero-food.jpg', function (tex) {
      if (!tex) return;
      if (tex.encoding !== undefined) tex.encoding = THREE.sRGBEncoding;
      var geo = new THREE.CircleGeometry(0.97, 96);
      var mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.55,
        metalness: 0.02,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25
      });
      food = new THREE.Mesh(geo, mat);
      food.rotation.x = -Math.PI + 0.14;
      food.position.set(0, 0.42, 0);
      group.add(food);
    });

    // ---- Food heap (stylized build-up layers above the photo) ----
    (function buildHeap() {
      var layers = [
        { c: 0xefe1c2, x: 0.0,   z: 0.0,   sx: 1.05, sy: 0.42, sz: 1.05, th: 0.15 },
        { c: 0xd8a64a, x: 0.28,  z: 0.22,  sx: 0.50, sy: 0.30, sz: 0.50, th: 0.35 },
        { c: 0x9c5a2e, x: -0.30, z: 0.10,  sx: 0.45, sy: 0.26, sz: 0.45, th: 0.45 },
        { c: 0xc98f43, x: -0.05, z: -0.34, sx: 0.42, sy: 0.24, sz: 0.42, th: 0.55 },
        { c: 0xb4573a, x: 0.38,  z: -0.26, sx: 0.34, sy: 0.20, sz: 0.34, th: 0.68 },
        { c: 0x7c5a2e, x: -0.42, z: -0.20, sx: 0.30, sy: 0.18, sz: 0.30, th: 0.80 },
        { c: 0xd8bc82, x: 0.12,  z: 0.34,  sx: 0.30, sy: 0.18, sz: 0.30, th: 0.90 }
      ];
      var geo = new THREE.SphereGeometry(1, 20, 14);
      for (var i = 0; i < layers.length; i++) {
        var L = layers[i];
        var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
          color: L.c, roughness: 0.75, metalness: 0,
          transparent: true, opacity: 0
        }));
        m.scale.set(L.sx, L.sy, L.sz);
        m.position.set(L.x, 0.5 + L.sy * 0.5, L.z);
        m.userData.th = L.th;
        m.userData.baseY = m.position.y;
        group.add(m);
        heaps.push(m);
      }
      var domeGeo = new THREE.SphereGeometry(0.5, 24, 12);
      dome = new THREE.Mesh(domeGeo, new THREE.MeshStandardMaterial({
        color: 0xdfc87f, roughness: 0.6, metalness: 0.05,
        transparent: true, opacity: 0
      }));
      dome.scale.set(0.9, 0.42, 0.9);
      dome.position.set(0, 0.62, 0);
      dome.userData.th = 0.25;
      dome.userData.baseY = 0.62;
      group.add(dome);
      heaps.push(dome);
    })();

    function applyFill(f) {
      if (food) {
        var s = 0.45 + 0.55 * f;
        food.scale.set(s, 1, s);
        food.material.opacity = 0.25 + 0.75 * f;
      }
      for (var i = 0; i < heaps.length; i++) {
        var m = heaps[i];
        var k = Math.min(1, Math.max(0, (f - m.userData.th) / 0.4));
        m.material.opacity = 0.12 + 0.88 * k;
        m.position.y = m.userData.baseY - (1 - k) * 0.03;
      }
      steam.material.opacity = 0.1 + f * 0.4;
      spices.material.opacity = 0.35 + f * 0.6;
    }

    // ---- Steam particles ----
    var steamTex = smokeTexture();
    var steamCount = isMobile ? 35 : 70;
    var steamPos = new Float32Array(steamCount * 3);
    var steamSeed = [];
    for (var i = 0; i < steamCount; i++) {
      var a = Math.random() * Math.PI * 2;
      var r = Math.random() * 0.55;
      steamPos[i * 3] = Math.cos(a) * r;
      steamPos[i * 3 + 1] = 0.5 + Math.random() * 1.6;
      steamPos[i * 3 + 2] = Math.sin(a) * r;
      steamSeed.push({ spd: 0.02 + Math.random() * 0.035, ph: Math.random() * 100 });
    }
    var steamGeo = new THREE.BufferGeometry();
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
    var steamMat = new THREE.PointsMaterial({
      size: 0.42,
      map: steamTex,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      color: 0xfff4e1,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    var steam = new THREE.Points(steamGeo, steamMat);
    steam.position.y = 0.4;
    group.add(steam);

    // ---- Spice / dust motes ----
    var spiceTex = spiceTexture();
    var spiceCount = isMobile ? 45 : 90;
    var spicePos = new Float32Array(spiceCount * 3);
    var spiceSeed = [];
    for (var j = 0; j < spiceCount; j++) {
      spicePos[j * 3] = (Math.random() - 0.5) * 4.4;
      spicePos[j * 3 + 1] = (Math.random() - 0.5) * 3.4;
      spicePos[j * 3 + 2] = (Math.random() - 0.5) * 2.6 - 1;
      spiceSeed.push({ spd: 0.004 + Math.random() * 0.012, ph: Math.random() * 100, amp: 0.1 + Math.random() * 0.4 });
    }
    var spiceGeo = new THREE.BufferGeometry();
    spiceGeo.setAttribute('position', new THREE.BufferAttribute(spicePos, 3));
    var spiceMat = new THREE.PointsMaterial({
      size: 0.075,
      map: spiceTex,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      color: 0xe9cf96,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    var spices = new THREE.Points(spiceGeo, spiceMat);
    group.add(spices);

    // ---- Interaction state ----
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var running = !reduced;

    // ---- Progressive food build (scroll / intro) ----
    var fill = 0, introP = 0, lastScrollF = 0.3;   // 0..1 how full the plate is

    function onMouse(e) {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener('mousemove', onMouse, { passive: true });

    // ---- drag / touch rotate (plate spins with the visitor) ----
    var dragRotY = 0, dragging = false, lastX = 0, lastY = 0;
    function onDown(e) {
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      running = true;
      canvas.style.cursor = 'grabbing';
    }
    function onMove(e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      dragRotY += dx * 0.008;
      group.position.y -= dy * 0.008;
    }
    function onUp() {
      dragging = false;
      canvas.style.cursor = '';
    }
    canvas.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });

    function onScroll() {
      var h = window.innerHeight || 1;
      var t = Math.min(1, Math.max(0, window.scrollY / (h * 0.85)));
      var op = 1 - t;
      canvas.style.opacity = op.toFixed(3);
      if (op <= 0.02) canvas.style.pointerEvents = 'none';
      canvas.style.transform = 'translateY(' + (t * 30) + 'px)';
      lastScrollF = 0.3 + t * 0.7;
      if (reduced) { fill = lastScrollF; applyFill(fill); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function onResize() {
      var w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      var center = w > 1000;
      group.position.x = center ? 3.05 : 0;
    }
    window.addEventListener('resize', onResize, { passive: true });

    // visibility pause
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; }
      else if (!reduced) { running = true; requestAnimationFrame(frame); }
    });

    var t0 = 0;

    function easeOutCubic(u) {
      return 1 - Math.pow(1 - u, 3);
    }

    function frame(t) {
      if (!running || reduced) {
        renderer.render(scene, camera);
        return;
      }
      var dt = Math.min(0.05, (t - t0) / 1000 || 0);
      t0 = t;

      // progressive food build: quick intro, then scroll tops it up, never regresses
      introP += dt / 1.15;
      var intent = Math.max(lastScrollF, 0.3 * easeOutCubic(Math.min(1, introP)));
      fill += (intent - fill) * 0.07;
      applyFill(fill);

      // mouse parallax (lerp)
      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;
      group.rotation.y = 0.06 + mouse.x * 0.09 + dragRotY;
      group.rotation.x = mouse.y * 0.04;
      group.position.y = 0.05 - mouse.y * 0.06;

      // slow drift of camera
      var time = t * 0.001;
      camera.position.x = Math.sin(time * 0.12) * 0.16 + mouse.x * 0.28;
      camera.position.y = 0.2 + Math.cos(time * 0.1) * 0.1 + mouse.y * 0.2;
      camera.lookAt(group.position.x * 0.4, 0.35, 0);

      // food gentle sway
      if (food) {
        food.rotation.z = Math.sin(time * 0.8) * 0.015;
        food.position.y = 0.42 + Math.sin(time * 0.9) * 0.015;
      }

      // steam rise
      var sp = steam.geometry.attributes.position.array;
      for (var s = 0; s < steamCount; s++) {
        var seed = steamSeed[s];
        sp[s * 3 + 1] += seed.spd * dt * 8;
        var ph = time * 0.6 + seed.ph;
        sp[s * 3] += Math.sin(ph) * 0.0016;
        sp[s * 3 + 2] += Math.cos(ph * 0.8) * 0.0016;
        if (sp[s * 3 + 1] > 2.6) {
          sp[s * 3 + 1] = 0.42;
          var an = Math.random() * Math.PI * 2;
          var rr = Math.random() * 0.5;
          sp[s * 3] = Math.cos(an) * rr;
          sp[s * 3 + 2] = Math.sin(an) * rr;
        }
      }
      steam.geometry.attributes.position.needsUpdate = true;

      // spice drift
      var pp = spices.geometry.attributes.position.array;
      for (var p = 0; p < spiceCount; p++) {
        var ps = spiceSeed[p];
        pp[p * 3 + 1] += ps.spd * 0.02;
        if (pp[p * 3 + 1] > 2.2) pp[p * 3 + 1] = -1.7;
      }
      spices.geometry.attributes.position.needsUpdate = true;
      spices.rotation.y = time * 0.02;

      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }

    if (running) { requestAnimationFrame(frame); renderer.render(scene, camera); }
    else { renderer.render(scene, camera); }
  }

  if (window.THREE) { init(); }
  else {
    canvas.style.display = 'none';
  }
})();