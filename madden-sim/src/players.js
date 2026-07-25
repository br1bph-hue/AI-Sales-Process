// Players: procedural articulated athletes with team kits and procedural animation.
import * as THREE from 'three';

export const TEAMS = {
  home: { abbr: 'NVY', jersey: 0x163d75, pants: 0xc9cdd4, helmet: 0x102f5c, accent: 0xf0a500, numFill: '#f0c95c', numOutline: '#ffffff', skinTones: [0x8d5a3b, 0x6b4226, 0xc79b74, 0xa9744d] },
  away: { abbr: 'CRM', jersey: 0xececec, pants: 0x7a0c0c, helmet: 0x7a0c0c, accent: 0xd9d9d9, numFill: '#7a0c0c', numOutline: '#2a0404', skinTones: [0x8d5a3b, 0x6b4226, 0xc79b74, 0xa9744d] },
};

function numberTexture(num, fill, outline) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 128);
  g.font = '900 92px "Arial Black", Arial';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = outline;
  g.strokeText(String(num), 64, 70);
  g.fillStyle = fill;
  g.fillText(String(num), 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildPlayer(team, num) {
  const T = TEAMS[team];
  const jerseyMat = new THREE.MeshStandardMaterial({ color: T.jersey, roughness: 0.75 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: T.pants, roughness: 0.7 });
  const skin = new THREE.MeshStandardMaterial({ color: T.skinTones[(Math.random() * T.skinTones.length) | 0], roughness: 0.65 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: T.helmet, roughness: 0.25, metalness: 0.35 });
  const accentMat = new THREE.MeshStandardMaterial({ color: T.accent, roughness: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.5 });

  const root = new THREE.Group();           // positioned at ground, +y up
  const body = new THREE.Group();           // hips pivot
  body.position.y = 1.02;
  root.add(body);

  // torso + shoulder pads
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.5, 6, 12), jerseyMat);
  torso.position.y = 0.42;
  torso.castShadow = true;
  body.add(torso);
  // shoulder pads: wide flared silhouette (local +z is the model's front)
  const pads = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.22, 0.5), jerseyMat);
  pads.position.y = 0.68;
  pads.castShadow = true;
  body.add(pads);
  for (const s of [1, -1]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), jerseyMat);
    cap.scale.set(1, 0.7, 1);
    cap.position.set(s * 0.4, 0.7, 0);
    body.add(cap);
  }
  // number decals front/back
  const numTexF = numberTexture(num, T.numFill, T.numOutline);
  for (const s of [1, -1]) {
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.44, 0.44),
      new THREE.MeshBasicMaterial({ map: numTexF, transparent: true })
    );
    plate.position.set(0, 0.47, s * 0.30);
    if (s < 0) plate.rotation.y = Math.PI;
    body.add(plate);
  }

  // head + helmet + facemask
  const head = new THREE.Group();
  head.position.y = 0.88;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 12), skin);
  skull.position.y = 0.06;
  head.add(skull);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.185, 16, 14), helmetMat);
  helmet.position.y = 0.085;
  helmet.scale.set(1, 1.06, 1.12);
  helmet.castShadow = true;
  head.add(helmet);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.36), accentMat);
  stripe.position.y = 0.27;
  head.add(stripe);
  // facemask bars
  for (let i = 0; i < 3; i++) {
    const bar = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 6, 12, Math.PI), darkMat);
    bar.position.set(0, 0.03 + i * 0.05, 0.12);
    bar.rotation.x = Math.PI / 2;
    head.add(bar);
  }
  body.add(head);

  // limbs: shoulder/hip pivots with upper+lower segments
  const mkLimb = (upperMat, lowerMat, upperLen, lowerLen, radius) => {
    const pivot = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(radius, upperLen, 4, 8), upperMat);
    upper.position.y = -upperLen / 2 - radius / 2;
    upper.castShadow = true;
    pivot.add(upper);
    const knee = new THREE.Group();
    knee.position.y = -upperLen - radius;
    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(radius * 0.8, lowerLen, 4, 8), lowerMat);
    lower.position.y = -lowerLen / 2 - radius / 2;
    lower.castShadow = true;
    knee.add(lower);
    pivot.add(knee);
    return { pivot, knee };
  };

  const armL = mkLimb(jerseyMat, skin, 0.28, 0.26, 0.07);
  const armR = mkLimb(jerseyMat, skin, 0.28, 0.26, 0.07);
  armL.pivot.position.set(0.42, 0.66, 0);
  armR.pivot.position.set(-0.42, 0.66, 0);
  body.add(armL.pivot, armR.pivot);

  const legL = mkLimb(pantsMat, pantsMat, 0.36, 0.36, 0.095);
  const legR = mkLimb(pantsMat, pantsMat, 0.36, 0.36, 0.095);
  legL.pivot.position.set(0.15, 0, 0);
  legR.pivot.position.set(-0.15, 0, 0);
  body.add(legL.pivot, legR.pivot);
  // cleats point forward (+z)
  for (const leg of [legL, legR]) {
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.26), darkMat);
    shoe.position.set(0, -0.46, 0.06);
    leg.knee.add(shoe);
  }

  return {
    root, body, head,
    arms: { L: armL, R: armR },
    legs: { L: legL, R: legR },
    team, num,
    // runtime state
    pos: new THREE.Vector3(), vel: new THREE.Vector3(),
    heading: 0, speed: 0, phase: Math.random() * Math.PI * 2,
    mode: 'idle',       // idle | run | stance | throw | catch | down | celebrate | block
    downTimer: 0,
  };
}

// ---------------- procedural animation ----------------
const _up = new THREE.Vector3(0, 1, 0);
export function animatePlayer(p, dt, t) {
  const g = p.root;
  g.position.copy(p.pos);
  // face heading smoothly
  let target = p.heading;
  let d = target - g.rotation.y;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  g.rotation.y += d * Math.min(1, dt * 10);

  const s = p.speed;
  const runAmt = THREE.MathUtils.clamp(s / 6, 0, 1);

  if (p.mode === 'down') {
    // fallen: lie on ground
    p.downTimer += dt;
    const k = Math.min(1, p.downTimer * 5);
    g.rotation.x = -Math.PI / 2 * k;
    g.position.y = 0.35 * k;
    return;
  }
  g.rotation.x = 0;
  g.position.y = 0;

  // Sign conventions (local +z = front): body.rotation.x > 0 leans forward;
  // limb pivot rotation.x < 0 swings the limb forward; knee/elbow bend positive folds back.
  if (p.mode === 'stance') {
    // crouched 3-point-ish stance
    p.body.rotation.x = 0.55;
    p.legs.L.pivot.rotation.x = -0.95; p.legs.L.knee.rotation.x = 1.5;
    p.legs.R.pivot.rotation.x = -0.55; p.legs.R.knee.rotation.x = 1.2;
    p.arms.L.pivot.rotation.x = -1.15; p.arms.R.pivot.rotation.x = -1.15;
    p.arms.L.knee.rotation.x = -0.15; p.arms.R.knee.rotation.x = -0.15;
    p.body.position.y = 0.74;
    return;
  }
  if (p.mode === 'throw') {
    p.body.rotation.x = 0.1;
    p.arms.R.pivot.rotation.x = 2.55;      // cocked back overhead
    p.arms.R.knee.rotation.x = 0.7;
    p.arms.L.pivot.rotation.x = -1.4;
    p.arms.L.knee.rotation.x = -0.4;
    p.body.position.y = 1.02;
    p.legs.L.pivot.rotation.x = -0.3; p.legs.R.pivot.rotation.x = 0.3;
    p.legs.L.knee.rotation.x = 0.3; p.legs.R.knee.rotation.x = 0.5;
    return;
  }
  if (p.mode === 'celebrate') {
    p.body.position.y = 1.02 + Math.abs(Math.sin(t * 6)) * 0.25;
    p.body.rotation.x = -0.08;
    p.arms.L.pivot.rotation.x = 2.9 + Math.sin(t * 6) * 0.2;
    p.arms.R.pivot.rotation.x = 2.9 - Math.sin(t * 6) * 0.2;
    p.arms.L.knee.rotation.x = 0.2; p.arms.R.knee.rotation.x = 0.2;
    p.legs.L.pivot.rotation.x = 0; p.legs.R.pivot.rotation.x = 0;
    p.legs.L.knee.rotation.x = 0; p.legs.R.knee.rotation.x = 0;
    return;
  }

  // idle / run blend
  p.phase += dt * (4 + s * 2.2);
  const swing = Math.sin(p.phase) * (0.25 + runAmt * 0.85);
  p.body.rotation.x = runAmt * 0.34;                            // forward lean
  p.body.position.y = 1.02 + Math.abs(Math.sin(p.phase)) * 0.05 * runAmt;

  p.legs.L.pivot.rotation.x = swing;
  p.legs.R.pivot.rotation.x = -swing;
  p.legs.L.knee.rotation.x = Math.max(0, Math.sin(p.phase + 0.9)) * (0.4 + runAmt * 1.2);
  p.legs.R.knee.rotation.x = Math.max(0, Math.sin(p.phase + Math.PI + 0.9)) * (0.4 + runAmt * 1.2);

  if (p.mode === 'carry') {
    // ball tucked in right arm, left arm pumps
    p.arms.R.pivot.rotation.x = -0.75;
    p.arms.R.knee.rotation.x = -1.9;
    p.arms.L.pivot.rotation.x = swing * 0.9;
    p.arms.L.knee.rotation.x = -0.6;
  } else {
    p.arms.L.pivot.rotation.x = -swing * (0.4 + runAmt * 0.7);
    p.arms.R.pivot.rotation.x = swing * (0.4 + runAmt * 0.7);
    p.arms.L.knee.rotation.x = -(0.4 + runAmt * 0.5);
    p.arms.R.knee.rotation.x = -(0.4 + runAmt * 0.5);
  }
  // subtle idle sway
  if (s < 0.2 && p.mode === 'idle') {
    p.body.rotation.x = 0.1;
    p.body.position.y = 1.0 + Math.sin(t * 1.5 + p.phase) * 0.01;
    p.arms.L.pivot.rotation.x = -0.15; p.arms.R.pivot.rotation.x = -0.15;
    p.arms.L.knee.rotation.x = -0.3; p.arms.R.knee.rotation.x = -0.3;
    p.legs.L.pivot.rotation.x = 0.05; p.legs.R.pivot.rotation.x = -0.05;
    p.legs.L.knee.rotation.x = 0.08; p.legs.R.knee.rotation.x = 0.08;
  }
}

export function buildBall() {
  // rendered ~1.4x real size so it reads from the broadcast camera (Madden does the same)
  const geo = new THREE.SphereGeometry(0.21, 16, 12);
  geo.scale(1.55, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a4a24, roughness: 0.5 });
  const ball = new THREE.Mesh(geo, mat);
  ball.castShadow = true;
  const white = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });
  const laces = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.035), white);
  laces.position.y = 0.2;
  ball.add(laces);
  // end stripes
  for (const s of [1, -1]) {
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.018, 6, 18), white);
    stripe.rotation.y = Math.PI / 2;
    stripe.position.x = s * 0.2;
    stripe.scale.y = 0.95;
    ball.add(stripe);
  }
  return ball;
}
