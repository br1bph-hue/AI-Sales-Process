// HUD: broadcast score bug, banners, play-call cards with route diagrams.
import { PLAYBOOK } from './gameplay.js';

const $ = (id) => document.getElementById(id);

export class HUD {
  constructor() {
    this.bannerTimeout = null;
    this.buildPlaycards();
  }

  buildPlaycards() {
    const wrap = $('playcards');
    wrap.innerHTML = '';
    for (const play of PLAYBOOK) {
      const card = document.createElement('div');
      card.className = 'playcard';
      card.dataset.play = play.id;
      const cv = document.createElement('canvas');
      cv.width = 336; cv.height = 280;
      this.drawDiagram(cv, play);
      card.appendChild(cv);
      const nm = document.createElement('div'); nm.className = 'pc-name'; nm.textContent = play.name;
      const ty = document.createElement('div'); ty.className = 'pc-type';
      ty.textContent = `${play.formation ?? 'Gun Doubles'} · ${play.type === 'run' ? 'Run' : 'Pass'}`;
      const key = document.createElement('div'); key.className = 'pc-key'; key.textContent = `Press ${play.key}`;
      card.append(nm, ty, key);
      wrap.appendChild(card);
    }
    const spec = $('special-btns');
    spec.innerHTML = '';
    for (const [id, label] of [['punt', 'Punt (P)'], ['fg', 'Field Goal (K)']]) {
      const b = document.createElement('button');
      b.className = 'spec-btn'; b.dataset.special = id; b.textContent = label;
      spec.appendChild(b);
    }
  }

  drawDiagram(cv, play) {
    const g = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    // mini field (chalkboard green)
    g.fillStyle = '#0d2415'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2;
    for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(0, (H / 5) * i); g.lineTo(W, (H / 5) * i); g.stroke(); }
    // LOS
    g.strokeStyle = 'rgba(90,140,255,.9)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, H * 0.72); g.lineTo(W, H * 0.72); g.stroke();
    // O-line dots
    g.fillStyle = '#dfe6f2';
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(W / 2 + i * 26, H * 0.78, 7, 0, 7); g.fill(); }
    // QB + RB
    g.beginPath(); g.arc(W / 2, H * 0.88, 7, 0, 7); g.fill();
    g.beginPath(); g.arc(W / 2 - 24, H * 0.94, 7, 0, 7); g.fill();
    // route arrows
    const yScale = H * 0.6 / 22, xScale = W / 55;
    const routes = play.type === 'pass'
      ? Object.entries(play.routes).map(([role, r]) => ({ role, r }))
      : [{ role: 'RB', r: play.id === 'hb-stretch' ? [[3, 8], [12, 12]] : [[10, 0.5]] }];
    const startZ = { WR1: 20, WR2: -20, WR3: 13, TE: -3.4, RB: 1.6 };
    g.strokeStyle = '#f0c95c'; g.lineWidth = 3.5; g.lineCap = 'round';
    for (const { role, r } of routes) {
      let px = W / 2 + (startZ[role] ?? 0) * -xScale * 0.9;
      let py = H * 0.72;
      g.beginPath(); g.moveTo(px, py);
      let cx = px, cy = py;
      for (const [dx, dz] of r) {
        cx = px + dz * -xScale * 0.9;
        cy = py - dx * yScale;
        g.lineTo(cx, cy);
      }
      g.stroke();
      // arrowhead
      g.fillStyle = '#f0c95c';
      g.beginPath(); g.arc(cx, cy, 4.5, 0, 7); g.fill();
    }
  }

  showPlaycall(show) { $('playcall').classList.toggle('show', !!show); }

  onPlaySelected(cb) {
    $('playcards').addEventListener('click', (e) => {
      const card = e.target.closest('.playcard');
      if (card) cb(PLAYBOOK.find((p) => p.id === card.dataset.play));
    });
    $('special-btns').addEventListener('click', (e) => {
      const b = e.target.closest('.spec-btn');
      if (b) cb(b.dataset.special);
    });
  }

  updateBug(game) {
    $('away-score').textContent = game.scores.away;
    $('home-score').textContent = game.scores.home;
    const q = ['1st', '2nd', '3rd', '4th'][game.quarter - 1] ?? 'OT';
    $('bug-qtr').textContent = q;
    const m = Math.floor(game.clock / 60), s = Math.floor(game.clock % 60);
    $('bug-time').textContent = `${m}:${String(s).padStart(2, '0')}`;
    const toGo = Math.max(1, Math.ceil(game.fdX - game.losX));
    const dd = ['1st', '2nd', '3rd', '4th'][game.down - 1] ?? '4th';
    const goal = game.fdX >= 50 ? 'Goal' : toGo;
    $('bug-dd').textContent = `${dd} & ${goal}`;
    const pc = Math.ceil(game.playClock);
    $('play-clock-val').textContent = pc;
    $('bug-play-clock').classList.toggle('urgent', pc <= 5);
    $('bug-home').classList.add('has-ball');
    $('bug-away').classList.remove('has-ball');
    return { q, clockLabel: `${m}:${String(s).padStart(2, '0')}` };
  }

  banner(text, opts = {}) {
    const b = $('banner');
    b.textContent = text;
    b.classList.toggle('big', !!opts.big);
    b.classList.add('show');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => b.classList.remove('show'), opts.hold ?? 2200);
  }

  commentary(who, line) {
    const c = $('commentary');
    c.innerHTML = `<span class="who">${who}</span>${line}`;
    c.classList.add('on');
    clearTimeout(this._cT);
    this._cT = setTimeout(() => { c.classList.remove('on'); }, 5200);
  }

  hint(html) { $('hint').innerHTML = html; }
}
