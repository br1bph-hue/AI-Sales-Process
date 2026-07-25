// Bootstrap: renderer, lighting, game loop, input and state wiring.
import * as THREE from 'three';
import { buildField } from './field.js';
import { buildStadium } from './stadium.js';
import { Game, PLAYBOOK } from './gameplay.js';
import { BroadcastCamera } from './cameras.js';
import { HUD } from './hud.js';
import { commentate } from './commentary.js';

const container = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060a12, 0.0028);

const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.5, 2000);
camera.position.set(0, 26, -62);

// ---------------- lighting: night game under the towers ----------------
scene.add(new THREE.HemisphereLight(0xa8bdde, 0x24331f, 0.72));
const key = new THREE.DirectionalLight(0xfff2d8, 2.0);
key.position.set(60, 80, -40);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -70; key.shadow.camera.right = 70;
key.shadow.camera.top = 70; key.shadow.camera.bottom = -70;
key.shadow.camera.far = 220;
key.shadow.bias = -0.0006;
scene.add(key);
const fill = new THREE.DirectionalLight(0xd8e6ff, 0.7);
fill.position.set(-60, 60, 40);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xaac4ff, 0.45);
rim.position.set(0, 30, 80);
scene.add(rim);

// ---------------- world ----------------
const field = buildField(scene);
const stadium = buildStadium(scene);
const hud = new HUD();
const bcam = new BroadcastCamera(camera);

const game = new Game(scene, onGameEvent);
game.lineUp();
field.setLines(game.losX, game.fdX);

// ---------------- blob shadows: ground every player + the ball ----------------
const blobTex = (() => {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(0,0,0,0.72)');
  grad.addColorStop(0.7, 'rgba(0,0,0,0.38)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const allPlayers = game.all();
const blobs = new THREE.InstancedMesh(
  new THREE.PlaneGeometry(1.5, 1.05),
  new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }),
  allPlayers.length + 1
);
blobs.renderOrder = 1;
scene.add(blobs);
const _bm = new THREE.Matrix4();
const _bq = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const _bs = new THREE.Vector3();
function updateBlobs() {
  allPlayers.forEach((p, i) => {
    _bs.setScalar(p.mode === 'down' ? 1.5 : 1);
    _bm.compose(new THREE.Vector3(p.pos.x, 0.015, p.pos.z), _bq, _bs);
    blobs.setMatrixAt(i, _bm);
  });
  const b = game.ball.position;
  const k = Math.max(0.25, 1 - b.y * 0.12);
  _bs.set(0.5 * k, 0.5 * k, 1);
  _bm.compose(new THREE.Vector3(b.x, 0.02, b.z), _bq, _bs);
  blobs.setMatrixAt(allPlayers.length, _bm);
  blobs.instanceMatrix.needsUpdate = true;
}

// ---------------- events ----------------
let uiState = 'title'; // title | playcall | live | dead | final
bcam.setMode('blimp');

function onGameEvent(type, payload) {
  const c = commentate(type, payload);
  if (c) hud.commentary(c[0], c[1]);

  switch (type) {
    case 'presnap':
      field.setLines(game.losX, game.fdX);
      uiState = 'playcall';
      hud.showPlaycall(true);
      bcam.setMode('broadcast');
      hud.hint('Pick a play — <b>1-6</b> · or click a card');
      break;
    case 'snap':
      uiState = 'live';
      hud.showPlaycall(false);
      hud.hint(payload.play.type === 'pass'
        ? 'Throw: <b>Q</b> WR-left · <b>W</b> slot · <b>E</b> WR-right · <b>R</b> TE<br>After catch: <b>arrows/WASD</b> run · <b>shift</b> sprint'
        : 'Run: <b>arrows/WASD</b> steer · <b>shift</b> sprint');
      break;
    case 'catch':
      bcam.addShake(0.12);
      break;
    case 'tackle': case 'sack':
      bcam.addShake(0.35);
      hud.banner(type === 'sack' ? 'SACKED' : payload.gain > 0 ? `GAIN OF ${payload.gain}` : `LOSS OF ${-payload.gain}`);
      break;
    case 'incomplete':
      hud.banner('INCOMPLETE');
      break;
    case 'firstdown':
      hud.banner('FIRST DOWN', { big: false });
      break;
    case 'td':
      hud.banner('TOUCHDOWN!', { big: true, hold: 3200 });
      bcam.setMode('celebration');
      bcam.addShake(0.3);
      game.excitement = 1;
      setTimeout(() => bcam.setMode('broadcast'), 3400);
      break;
    case 'int':
      hud.banner('INTERCEPTED!', { big: true });
      break;
    case 'turnover':
      hud.banner('TURNOVER ON DOWNS');
      break;
    case 'fg_good':
      hud.banner(`FIELD GOAL IS GOOD — ${payload.dist} YDS`, { big: true });
      break;
    case 'fg_miss':
      hud.banner('NO GOOD', { big: true });
      break;
    case 'opp_drive':
      hud.banner(payload.msg, { hold: 2400 });
      break;
    case 'quarter':
      hud.banner(`END OF QUARTER`, { hold: 2000 });
      break;
    case 'final': {
      const w = game.scores.home >= game.scores.away ? 'ADMIRALS WIN!' : 'REDHAWKS WIN';
      hud.banner(`FINAL — ${w}`, { big: true, hold: 60000 });
      uiState = 'final';
      bcam.setMode('celebration');
      break;
    }
  }
}

// ---------------- input ----------------
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (uiState === 'title') { startGame(); return; }
  if (uiState === 'playcall') {
    const play = PLAYBOOK.find((p) => p.key === e.key);
    if (play) selectPlay(play);
    if (e.key === 'p' || e.key === 'P') selectPlay('punt');
    if (e.key === 'k' || e.key === 'K') selectPlay('fg');
  } else if (uiState === 'live') {
    const throwKeys = { KeyQ: 'WR1', KeyW: 'WR3', KeyE: 'WR2', KeyR: 'TE' };
    if (throwKeys[e.code]) game.throwTo(throwKeys[e.code]);
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

function pollInput() {
  game.input.x = (keys.ArrowUp || keys.KeyI ? 1 : 0) - (keys.ArrowDown || keys.KeyK ? 0.6 : 0);
  // Use WASD relative to broadcast view: up = downfield (+x), left/right = z
  if (keys.KeyW) game.input.x = 1;
  if (keys.KeyS) game.input.x = -0.6;
  game.input.z = (keys.ArrowLeft || keys.KeyA ? 1 : 0) - (keys.ArrowRight || keys.KeyD ? 1 : 0);
  game.input.sprint = !!(keys.ShiftLeft || keys.ShiftRight);
}

document.getElementById('title-card').addEventListener('click', startGame);
function startGame() {
  if (uiState !== 'title') return;
  document.getElementById('title-card').classList.add('hide');
  hud.commentary('Marv', 'Good evening from Gridiron Prime Stadium — a beautiful night for football!');
  setTimeout(() => game.startPresnap(), 900);
  uiState = 'wait';
}

hud.onPlaySelected(selectPlay);
function selectPlay(play) {
  if (uiState !== 'playcall') return;
  hud.showPlaycall(false);
  if (play === 'punt') { uiState = 'dead'; game.punt(); return; }
  if (play === 'fg') { uiState = 'dead'; bcam.setMode('endzone'); game.fieldGoal(); setTimeout(() => bcam.setMode('broadcast'), 2600); return; }
  uiState = 'live';
  game.callPlay(play);
}

// ---------------- resize ----------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------- main loop ----------------
window.__debug = () => ({ uiState, state: game.state, clock: game.clock, snapTime: game.snapTime, down: game.down, losX: game.losX, fdX: game.fdX, carrier: game.carrier?.role, ballMode: game.ballState.mode, scores: game.scores });
window.__field = field;

// Fixed-timestep simulation so game speed is independent of render framerate.
const clock = new THREE.Clock();
const STEP = 1 / 60;
let acc = 0, simT = 0, bugAccum = 0;
function loop() {
  requestAnimationFrame(loop);
  acc += Math.min(clock.getDelta(), 0.6);
  let steps = 0, stepped = 0;
  pollInput();
  while (acc >= STEP && steps < 40) {
    game.update(STEP, simT);
    simT += STEP; stepped += STEP; steps++;
    acc -= STEP;
  }
  const dt = Math.max(stepped, 1e-4);
  const t = simT;
  stadium.update(t, game.excitement, dt);
  updateBlobs();

  // broadcast exposure dip while the play-call overlay is up
  const targetExposure = uiState === 'playcall' ? 1.0 : 1.3;
  renderer.toneMappingExposure += (targetExposure - renderer.toneMappingExposure) * Math.min(1, dt * 5);

  // camera focus: ball during play, LOS otherwise
  const focus = game.state === 'live' || game.ballState.mode === 'air'
    ? game.ball.position.clone()
    : new THREE.Vector3(game.losX, 1, 0);
  bcam.update(dt, focus, t);

  // HUD + jumbotron (throttled)
  bugAccum += dt;
  if (bugAccum > 0.25) {
    bugAccum = 0;
    const info = hud.updateBug(game);
    stadium.jumbotron.draw({
      awayScore: game.scores.away, homeScore: game.scores.home,
      qtrLabel: info.q, clockLabel: info.clockLabel,
    });
  }

  renderer.render(scene, camera);
}
loop();
