// Stadium: bowl seating, instanced crowd, light towers, jumbotron, sky dome.
import * as THREE from 'three';

// shared animated textures, ticked from update()
const scrollingTextures = [];

function ribbonMaterial(len) {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#081228'; g.fillRect(0, 0, 2048, 64);
  g.font = '900 44px "Arial Black", Arial';
  g.textBaseline = 'middle';
  const msg = 'ADMIRALS  ▸▸  GRIDIRON PRIME  ▸▸  DEFENSE!  ▸▸  MAKE SOME NOISE  ▸▸  ';
  g.fillStyle = '#f0c95c';
  for (let x = 0; x < 2048; ) {
    g.fillText(msg, x, 34);
    x += g.measureText(msg).width;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(len / 60, 1);
  scrollingTextures.push({ tex, speed: 0.02 });
  return new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
}

function adBoardMaterial(len) {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 96;
  const g = c.getContext('2d');
  const sponsors = [
    ['#0d1c30', '#7fb2ff', 'NAVY BAY BANK'],
    ['#241010', '#ff9d7a', 'PRIME COLA'],
    ['#101c12', '#8fe3a1', 'TURF+ SPORTS'],
    ['#1e1626', '#c9a6ff', 'GRIDIRON AIR'],
    ['#26200e', '#f0c95c', 'ADMIRALS PRO SHOP'],
  ];
  const w = 2048 / sponsors.length;
  g.font = '800 40px Arial';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  sponsors.forEach(([bg, fg, name], i) => {
    g.fillStyle = bg; g.fillRect(i * w, 0, w, 96);
    g.fillStyle = fg; g.fillText(name, i * w + w / 2, 50);
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.strokeRect(i * w, 0, w, 96);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(len / 120, 1);
  return new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0x9daabb });
}

function glowSpriteTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,248,225,0.9)');
  grad.addColorStop(0.35, 'rgba(255,242,205,0.32)');
  grad.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function buildStadium(scene) {
  const group = new THREE.Group();

  // ---------- sky ----------
  const skyGeo = new THREE.SphereGeometry(900, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {},
    vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vPos;
      void main(){
        float h = normalize(vPos).y;
        vec3 horizon = vec3(0.16, 0.19, 0.30);   // light-pollution glow above the rim
        vec3 zenith  = vec3(0.015, 0.025, 0.06);
        vec3 col = mix(horizon, zenith, smoothstep(-0.02, 0.45, h));
        col += vec3(0.10, 0.09, 0.05) * (1.0 - smoothstep(0.0, 0.18, h)); // warm stadium halo
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  group.add(new THREE.Mesh(skyGeo, skyMat));

  // sparse starfield
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(420 * 3);
  for (let i = 0; i < 420; i++) {
    const a = Math.random() * Math.PI * 2, e = 0.25 + Math.random() * 1.2;
    const R = 820;
    starPos[i * 3] = Math.cos(a) * Math.cos(e) * R;
    starPos[i * 3 + 1] = Math.sin(e) * R;
    starPos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * R;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  group.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xbfc8dc, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.7 })));

  // ---------- seating bowl: two tiers running around an oval ----------
  const bowl = new THREE.Group();
  const standMat = new THREE.MeshStandardMaterial({ color: 0x2a3240, roughness: 0.9 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1c2330, roughness: 0.85 });

  // Lower + upper decks as extruded "ramps" of stacked rows (boxes), on 4 sides.
  const decks = [
    { offset: 6, rows: 22, rise: 0.62, run: 1.05, y0: 1.2 },
    { offset: 31, rows: 24, rise: 0.78, run: 1.05, y0: 16.4 },
  ];
  const sides = [
    { axis: 'z', sign: 1, len: 150 },   // far sideline
    { axis: 'z', sign: -1, len: 150 },  // near sideline
    { axis: 'x', sign: 1, len: 84 },    // away end zone
    { axis: 'x', sign: -1, len: 84 },   // home end zone
  ];
  const fieldHalfX = 66, fieldHalfZ = 33;

  const crowdDummies = [];
  for (const side of sides) {
    for (const deck of decks) {
      const geo = new THREE.BoxGeometry(side.len, deck.rise, deck.run);
      const rowsMesh = new THREE.InstancedMesh(geo, standMat, deck.rows);
      const m = new THREE.Matrix4();
      for (let r = 0; r < deck.rows; r++) {
        const dist = (side.axis === 'z' ? fieldHalfZ : fieldHalfX) + deck.offset + r * deck.run;
        const y = deck.y0 + r * deck.rise;
        const px = side.axis === 'x' ? side.sign * dist : 0;
        const pz = side.axis === 'z' ? side.sign * dist : 0;
        const rotY = side.axis === 'z' ? 0 : Math.PI / 2;
        m.makeRotationY(rotY);
        m.setPosition(px, y, pz);
        rowsMesh.setMatrixAt(r, m);
        // remember crowd anchor rows (rowFrac drives vertical light falloff)
        const rowFrac = (deck === decks[0] ? r / deck.rows * 0.5 : 0.5 + r / deck.rows * 0.5);
        crowdDummies.push({ axis: side.axis, sign: side.sign, dist, y: y + deck.rise / 2 + 0.42, len: side.len, rotY, rowFrac });
      }
      rowsMesh.receiveShadow = true;
      bowl.add(rowsMesh);
    }
    // retaining wall between field and stands
    const wallLen = side.len * 0.98;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wallLen, 2.4, 0.8), wallMat);
    const wd = (side.axis === 'z' ? fieldHalfZ : fieldHalfX) + 5.2;
    wall.position.set(
      side.axis === 'x' ? side.sign * wd : 0,
      1.2,
      side.axis === 'z' ? side.sign * wd : 0
    );
    wall.rotation.y = side.axis === 'z' ? 0 : Math.PI / 2;
    bowl.add(wall);
    // animated LED ribbon board on top of the wall
    const ribbon = new THREE.Mesh(
      new THREE.BoxGeometry(wallLen, 0.7, 0.3),
      ribbonMaterial(wallLen)
    );
    ribbon.position.copy(wall.position); ribbon.position.y = 2.7;
    ribbon.rotation.y = wall.rotation.y;
    bowl.add(ribbon);
    // field-level backlit ad boards at the base of the wall
    const ads = new THREE.Mesh(new THREE.BoxGeometry(wallLen * 0.96, 0.95, 0.22), adBoardMaterial(wallLen));
    const ad2 = (side.axis === 'z' ? fieldHalfZ : fieldHalfX) + 3.6;
    ads.position.set(
      side.axis === 'x' ? side.sign * ad2 : 0,
      0.5,
      side.axis === 'z' ? side.sign * ad2 : 0
    );
    ads.rotation.y = wall.rotation.y;
    bowl.add(ads);
  }
  // sideline benches + staff clusters (near and far sidelines only)
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x3a4350, roughness: 0.6, metalness: 0.3 });
  for (const sz of [1, -1]) {
    for (const half of [-1, 1]) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(22, 0.55, 1.1), benchMat);
      bench.position.set(half * 15, 0.28, sz * 30.4);
      bowl.add(bench);
    }
    // tight rank of sideline personnel standing just behind each bench
    const staff = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 1.35, 0.4), new THREE.MeshLambertMaterial(), 36);
    const sm = new THREE.Matrix4(); const sc = new THREE.Color();
    for (let i = 0; i < 36; i++) {
      const half = i < 18 ? -1 : 1;
      const slot = i % 18;
      sm.makeRotationY(sz > 0 ? Math.PI : 0);
      sm.setPosition(half * 15 - 9.5 + slot * 1.15, 0.68, sz * (31.6 + (slot % 2) * 0.6));
      staff.setMatrixAt(i, sm);
      sc.setHex(sz === 1 ? 0x123a6d : 0x6e1212).offsetHSL(0, 0, (Math.random() - 0.5) * 0.15);
      staff.setColorAt(i, sc);
    }
    bowl.add(staff);
  }
  group.add(bowl);

  // ---------- crowd: instanced boxes with per-instance color ----------
  const crowdGeo = new THREE.BoxGeometry(0.42, 0.78, 0.36);
  const crowdMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const perRow = 110;
  const totalCrowd = Math.min(crowdDummies.length * perRow, 26000);
  const crowd = new THREE.InstancedMesh(crowdGeo, crowdMat, totalCrowd);
  crowd.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const color = new THREE.Color();
  // home-crowd weighting: mostly navy/gold with neutral darks, a sliver of away crimson
  const pickCrowdColor = () => {
    const roll = Math.random();
    if (roll < 0.34) return 0x16305a;      // home navy
    if (roll < 0.46) return 0xc98f14;      // home gold
    if (roll < 0.53) return 0x6b1414;      // away crimson pocket
    if (roll < 0.72) return 0x2a2f38;      // dark jackets
    if (roll < 0.86) return 0x5c6674;      // grays
    return 0x9aa4b4;                        // light layers
  };
  const m4 = new THREE.Matrix4();
  const seats = [];
  let ci = 0;
  outer:
  for (const row of crowdDummies) {
    for (let s = 0; s < perRow; s++) {
      if (ci >= totalCrowd) break outer;
      const along = (s / (perRow - 1) - 0.5) * row.len * 0.96;
      const jitter = (Math.random() - 0.5) * 0.3;
      let px, pz;
      if (row.axis === 'z') { px = along; pz = row.sign * (row.dist + jitter); }
      else { px = row.sign * (row.dist + jitter); pz = along; }
      const baseY = row.y + Math.random() * 0.06;
      seats.push({ px, pz, baseY, phase: Math.random() * Math.PI * 2, amp: 0.03 + Math.random() * 0.05, idx: ci });
      m4.makeRotationY(row.rotY + (Math.random() - 0.5) * 0.4);
      m4.setPosition(px, baseY, pz);
      crowd.setMatrixAt(ci, m4);
      if (Math.random() < 0.07) {
        color.setHex(0x141a24);            // empty seat
      } else {
        color.setHex(pickCrowdColor());
        color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.12);
      }
      // upper rows fall out of the floodlight wash
      color.multiplyScalar(1.0 - row.rowFrac * 0.55);
      crowd.setColorAt(ci, color);
      ci++;
    }
  }
  crowd.count = ci;
  if (crowd.instanceColor) crowd.instanceColor.needsUpdate = true;
  group.add(crowd);

  // ---------- light towers ----------
  const lightTargets = [];
  const towerPositions = [
    [-75, 44], [75, 44], [-75, -44], [75, -44],
  ];
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x39424e, roughness: 0.6, metalness: 0.5 });
  const glowTex = glowSpriteTexture();
  for (const [tx, tz] of towerPositions) {
    const tower = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 46, 10), towerMat);
    pole.position.y = 23;
    tower.add(pole);
    // bank of lamp heads
    const bank = new THREE.Group();
    for (let r = 0; r < 3; r++) for (let cIdx = 0; cIdx < 6; cIdx++) {
      const lamp = new THREE.Mesh(
        new THREE.CircleGeometry(0.55, 12),
        new THREE.MeshBasicMaterial({ color: 0xfff7dc })
      );
      lamp.position.set((cIdx - 2.5) * 1.5, 46 + r * 1.4, 0);
      lamp.lookAt(0, 0, 0);
      bank.add(lamp);
    }
    tower.add(bank);
    // halation: additive glare sprite over the lamp bank
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.85,
    }));
    glow.scale.set(26, 26, 1);
    glow.position.set(0, 47.5, 0);
    tower.add(glow);
    tower.position.set(tx, 0, tz);
    group.add(tower);
    lightTargets.push(new THREE.Vector3(tx, 47, tz));
  }

  // camera-flash pool in the stands
  const flashes = [];
  for (let i = 0; i < 14; i++) {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0,
    }));
    f.scale.set(2.2, 2.2, 1);
    group.add(f);
    flashes.push({ sprite: f, ttl: 0 });
  }

  // ---------- jumbotron (away end) ----------
  const jumbo = buildJumbotron();
  jumbo.group.position.set(96, 30, 0);
  jumbo.group.rotation.y = -Math.PI / 2;
  group.add(jumbo.group);

  scene.add(group);

  return {
    group,
    jumbotron: jumbo,
    lightPositions: lightTargets,
    update(t, excitement = 0, dt = 0.016) {
      // LED ribbons scroll
      for (const s of scrollingTextures) s.tex.offset.x += s.speed * dt * 60 * 0.016;
      // camera flashes: random pops, more when excited
      for (const f of flashes) {
        if (f.ttl > 0) {
          f.ttl -= dt;
          f.sprite.material.opacity = Math.max(0, f.ttl * 8);
        } else if (Math.random() < dt * (0.8 + excitement * 6)) {
          const s = seats[(Math.random() * seats.length) | 0];
          if (s) {
            f.sprite.position.set(s.px, s.baseY + 0.6, s.pz);
            f.ttl = 0.12 + Math.random() * 0.1;
          }
        } else {
          f.sprite.material.opacity = 0;
        }
      }
      // crowd bob — animate a rotating subset each frame to stay cheap
      const n = crowd.count;
      const slice = 2600;
      const start = (Math.floor(t * 60) * slice) % n;
      for (let k = 0; k < slice; k++) {
        const i = (start + k) % n;
        const s = seats[i];
        const y = s.baseY + Math.sin(t * (2 + excitement * 6) + s.phase) * s.amp * (1 + excitement * 3);
        m4.makeRotationY(0);
        m4.setPosition(s.px, y, s.pz);
        crowd.setMatrixAt(i, m4);
      }
      crowd.instanceMatrix.needsUpdate = true;
    },
  };
}

function buildJumbotron() {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(30, 15, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x11161d, roughness: 0.4, metalness: 0.6 })
  );
  group.add(frame);
  // screen canvas
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(28.4, 13.6),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  screen.position.z = 0.85;
  group.add(screen);
  // support pylons
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0x2a323d, roughness: 0.7, metalness: 0.4 });
  for (const zc of [-11, 11]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.4, 34, 1.4), pylonMat);
    p.position.set(zc, -19, 0);
    group.add(p);
  }

  function draw(state) {
    ctx.fillStyle = '#04070c';
    ctx.fillRect(0, 0, 1024, 512);
    // header
    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0, '#7a0c0c'); grad.addColorStop(0.5, '#0a0f18'); grad.addColorStop(1, '#0b2545');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 96);
    ctx.fillStyle = '#f0c95c';
    ctx.font = '900 52px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('GRIDIRON PRIME', 512, 50);
    // scores
    ctx.font = '900 150px Arial';
    ctx.fillStyle = '#ff6b6b'; ctx.fillText(String(state.awayScore), 250, 250);
    ctx.fillStyle = '#7fb2ff'; ctx.fillText(String(state.homeScore), 774, 250);
    ctx.fillStyle = '#ffffff'; ctx.font = '700 60px Arial';
    ctx.fillText('CRM', 250, 360); ctx.fillText('NVY', 774, 360);
    ctx.fillStyle = '#cccccc'; ctx.font = '700 70px Arial';
    ctx.fillText('—', 512, 250);
    // clock
    ctx.fillStyle = '#f0c95c'; ctx.font = '800 58px Arial';
    ctx.fillText(`${state.qtrLabel}  ${state.clockLabel}`, 512, 452);
    tex.needsUpdate = true;
  }
  draw({ awayScore: 0, homeScore: 0, qtrLabel: '1st', clockLabel: '5:00' });

  return { group, draw };
}
