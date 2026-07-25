// Stadium: bowl seating, instanced crowd, light towers, jumbotron, sky dome.
import * as THREE from 'three';

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
        vec3 horizon = vec3(0.10, 0.13, 0.22);
        vec3 zenith  = vec3(0.012, 0.02, 0.05);
        vec3 col = mix(horizon, zenith, smoothstep(-0.05, 0.5, h));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  group.add(new THREE.Mesh(skyGeo, skyMat));

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
        // remember crowd anchor rows
        crowdDummies.push({ axis: side.axis, sign: side.sign, dist, y: y + deck.rise / 2 + 0.45, len: side.len, rotY });
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
    // LED ribbon board on top of the wall
    const ribbon = new THREE.Mesh(
      new THREE.BoxGeometry(wallLen, 0.7, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x061018, emissive: new THREE.Color(0x0e5ed6), emissiveIntensity: 1.6 })
    );
    ribbon.position.copy(wall.position); ribbon.position.y = 2.7;
    ribbon.rotation.y = wall.rotation.y;
    bowl.add(ribbon);
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
  const jerseyColors = [0x0b2545, 0x7a0c0c, 0xf0a500, 0xdddddd, 0x24354f, 0x5a1a1a, 0x8899aa, 0x333a44, 0xc8b46a];
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
      color.setHex(jerseyColors[(Math.random() * jerseyColors.length) | 0]);
      color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.15);
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
    tower.position.set(tx, 0, tz);
    group.add(tower);
    lightTargets.push(new THREE.Vector3(tx, 47, tz));
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
    update(t, excitement = 0) {
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
