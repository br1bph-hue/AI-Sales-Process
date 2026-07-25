// Field: playing surface, painted markings, goal posts, LOS / first-down overlays.
// World units are yards. x runs goal-to-goal (-60..60 incl. end zones), z across (-26.65..26.65).
import * as THREE from 'three';

export const FIELD = {
  length: 120,        // incl. two 10yd end zones
  width: 53.33,
  goalLineHome: -50,  // offense drives toward +x (away end zone beyond +50)
  goalLineAway: 50,
};

const HOME = { name: 'ADMIRALS', color: '#0b2545', accent: '#f0a500' };
const AWAY = { name: 'REDHAWKS', color: '#7a0c0c', accent: '#d9d9d9' };

function paintFieldTexture() {
  const W = 2400, H = 1100;                 // px canvas for 120 x 53.33 yd
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const ppyX = W / FIELD.length;            // px per yard
  const ppyY = H / FIELD.width;
  const yd = (x) => (x + 60) * ppyX;        // field x (yd) -> px

  // --- turf base: alternating 5yd mow stripes with subtle noise ---
  for (let i = 0; i < 24; i++) {
    const shade = i % 2 ? '#2a6a2f' : '#3d8b43';
    g.fillStyle = shade;
    g.fillRect(yd(-60 + i * 5), 0, 5 * ppyX + 1, H);
  }
  // turf noise
  const noise = g.createImageData(W, H);
  // cheap speckle: draw translucent dots instead of per-pixel
  g.globalAlpha = 0.05;
  for (let i = 0; i < 26000; i++) {
    g.fillStyle = Math.random() > 0.5 ? '#1e4a22' : '#4d9a52';
    g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  g.globalAlpha = 1;

  // --- end zones ---
  const paintEndzone = (x0, team, flip) => {
    g.fillStyle = team.color;
    g.fillRect(yd(x0), 0, 10 * ppyX, H);
    g.globalAlpha = 0.12;
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = '#000';
      g.fillRect(yd(x0) + Math.random() * 10 * ppyX, Math.random() * H, 2, 2);
    }
    g.globalAlpha = 1;
    g.save();
    g.translate(yd(x0 + 5), H / 2);
    g.rotate(flip ? Math.PI / 2 : -Math.PI / 2);
    g.fillStyle = team.accent;
    g.font = `900 ${Math.floor(H * 0.135)}px "Arial Black", Arial, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 4;
    g.strokeText(team.name, 0, 0);
    g.fillText(team.name, 0, 0);
    g.restore();
  };
  paintEndzone(-60, HOME, false);
  paintEndzone(50, AWAY, true);

  // --- yard lines every 5 yds ---
  g.strokeStyle = 'rgba(255,255,255,0.92)';
  g.lineWidth = Math.max(2, ppyX * 0.28);
  for (let x = -50; x <= 50; x += 5) {
    g.beginPath();
    g.moveTo(yd(x), 0); g.lineTo(yd(x), H);
    g.stroke();
  }
  // goal lines thicker
  g.lineWidth = ppyX * 0.4;
  for (const x of [-50, 50]) {
    g.beginPath(); g.moveTo(yd(x), 0); g.lineTo(yd(x), H); g.stroke();
  }
  // sidelines & end lines (6ft border)
  g.lineWidth = ppyY * 1.2;
  g.strokeRect(yd(-60) + g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth);

  // --- hash marks: every yard, at NFL hash positions + sidelines ---
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = Math.max(1.5, ppyX * 0.16);
  const hashLen = ppyY * 0.66;
  const hashRows = [ppyY * 0.9, H * 0.393, H * 0.607, H - ppyY * 0.9];
  for (let x = -49; x < 50; x++) {
    if (x % 5 === 0) continue;
    for (const hy of hashRows) {
      g.beginPath();
      g.moveTo(yd(x), hy - hashLen / 2); g.lineTo(yd(x), hy + hashLen / 2);
      g.stroke();
    }
  }

  // --- yard numbers every 10 yds, both sides, with direction arrows ---
  const numFont = Math.floor(ppyY * 3.4);
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.font = `800 ${numFont}px "Arial Narrow", Arial, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let x = -40; x <= 40; x += 10) {
    const label = 50 - Math.abs(x);
    const txt = label === 50 ? '50' : `${label}`;
    const disp = label === 50 ? '50' : (txt.length === 1 ? `${txt}` : txt);
    const numStr = label === 50 ? '50' : `${label < 10 ? '' : ''}${label}`;
    const drawNum = (yPx, rot) => {
      g.save();
      g.translate(yd(x), yPx);
      g.rotate(rot);
      const s = String(numStr).padStart(2, ' ');
      g.fillText(label === 50 ? '5 0' : `${Math.floor(label / 10)} ${label % 10 === 0 ? 0 : label % 10}`, 0, 0);
      // direction arrow beside numbers (not at 50)
      if (label !== 50) {
        const dir = x < 0 ? -1 : 1;               // arrow points toward nearest goal line
        g.fillStyle = 'rgba(255,255,255,0.92)';
        g.beginPath();
        const ax = dir * numFont * 1.35;
        g.moveTo(ax, -numFont * 0.32);
        g.lineTo(ax, numFont * 0.32);
        g.lineTo(ax + dir * numFont * 0.42, 0);
        g.closePath(); g.fill();
      }
      g.restore();
    };
    drawNum(H * 0.885, Math.PI);   // near sideline (flipped for that side's view)
    drawNum(H * 0.115, 0);
  }

  // --- midfield logo ---
  const cx = yd(0), cy = H / 2, R = ppyY * 7.2;
  g.save();
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
  const grad = g.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
  grad.addColorStop(0, '#14386b'); grad.addColorStop(1, '#081c3a');
  g.fillStyle = grad; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  g.strokeStyle = '#f0a500'; g.lineWidth = R * 0.07;
  g.beginPath(); g.arc(cx, cy, R * 0.93, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#f0a500';
  g.font = `900 ${Math.floor(R * 0.62)}px "Arial Black", Arial, sans-serif`;
  g.save(); g.translate(cx, cy); g.rotate(-Math.PI / 2);
  g.fillText('GP', 0, R * 0.05); g.restore();
  g.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function buildField(scene) {
  const group = new THREE.Group();

  const tex = paintFieldTexture();
  const fieldMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0.0 });
  const field = new THREE.Mesh(new THREE.PlaneGeometry(FIELD.length, FIELD.width, 1, 1), fieldMat);
  field.rotation.x = -Math.PI / 2;
  field.receiveShadow = true;
  group.add(field);

  // surrounding apron (track / concrete ring)
  const apron = new THREE.Mesh(
    new THREE.PlaneGeometry(FIELD.length + 30, FIELD.width + 26),
    new THREE.MeshStandardMaterial({ color: 0x27313d, roughness: 0.95 })
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = -0.02;
  apron.receiveShadow = true;
  group.add(apron);

  // --- goal posts ---
  for (const side of [-1, 1]) {
    group.add(buildGoalPost(side * 60, side));
  }

  // --- LOS (blue) and first-down (yellow) broadcast lines ---
  const mkLine = (color, opacity) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, FIELD.width),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = Math.PI / 2;
    m.position.y = 0.02;
    m.renderOrder = 2;
    group.add(m);
    return m;
  };
  const losLine = mkLine(0x2b6fff, 0.75);
  const fdLine = mkLine(0xffd400, 0.85);

  scene.add(group);
  return {
    group,
    setLines(losX, fdX) {
      losLine.position.x = losX;
      fdLine.position.x = Math.min(fdX, 50);
      fdLine.visible = fdX < 50;
    },
  };
}

function buildGoalPost(x, side) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffc61e, roughness: 0.35, metalness: 0.6 });
  const r = 0.18;
  // base + gooseneck
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.4, r * 1.6, 2.6, 12), mat);
  base.position.set(x + side * 1.6, 1.3, 0);
  g.add(base);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 3.4, 12), mat);
  neck.position.set(x + side * 0.8, 3.2, 0);
  neck.rotation.z = side * 0.5;
  g.add(neck);
  // crossbar at 10ft ≈ 3.33yd... use 3.33
  const cross = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 6.17, 12), mat);
  cross.rotation.x = Math.PI / 2;
  cross.position.set(x, 3.33, 0);
  g.add(cross);
  // uprights 35ft tall ≈ 11.6yd
  for (const zc of [-3.08, 3.08]) {
    const up = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, 11.6, 12), mat);
    up.position.set(x, 3.33 + 5.8, zc);
    up.castShadow = true;
    g.add(up);
  }
  return g;
}
