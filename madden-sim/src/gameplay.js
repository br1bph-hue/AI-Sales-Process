// Gameplay: formations, playbook routes, offensive/defensive AI, ball physics,
// tackling, downs and drive management. Offense (user, home team) drives +x.
import * as THREE from 'three';
import { buildPlayer, animatePlayer, buildBall } from './players.js';

export const GRAVITY = 10.7; // yd/s^2

export const PLAYBOOK = [
  {
    id: 'hb-dive', name: 'HB Dive', type: 'run', key: '1',
    diagram: [[0, 0, 4, 0.5]],
    desc: 'Power run between the tackles',
  },
  {
    id: 'hb-stretch', name: 'HB Stretch', type: 'run', key: '2',
    diagram: [[0, 0, 2, 6], [2, 6, 6, 8]],
    desc: 'Outside zone to the edge',
  },
  {
    id: 'slants', name: 'Quick Slants', type: 'pass', key: '3',
    routes: { WR1: [[3, 0], [10, 7]], WR2: [[3, 0], [10, -7]], WR3: [[2, 0], [9, 6]], TE: [[4, 0], [7, 3]] },
    diagram: [[0, 0, 3, 0], [3, 0, 8, 4]],
    desc: 'Three-step timing throws inside',
  },
  {
    id: 'four-verts', name: 'Four Verticals', type: 'pass', key: '4',
    routes: { WR1: [[22, 1]], WR2: [[22, -1]], WR3: [[20, 4]], TE: [[16, -2]] },
    diagram: [[0, 0, 9, 0.4]],
    desc: 'Stretch the defense deep',
  },
  {
    id: 'curls', name: 'Curl Flats', type: 'pass', key: '5',
    routes: { WR1: [[9, 0], [7.4, 1.2]], WR2: [[9, 0], [7.4, -1.2]], WR3: [[4, 8]], TE: [[4, -6]] },
    diagram: [[0, 0, 6, 0], [6, 0, 5, 1.4]],
    desc: 'Hook up at the sticks',
  },
  {
    id: 'pa-post', name: 'PA Deep Post', type: 'pass', key: '6', playAction: true,
    routes: { WR1: [[10, 0], [22, -8]], WR2: [[12, -3]], WR3: [[6, 9]], TE: [[5, 2]] },
    diagram: [[0, 0, 5, 0], [5, 0, 10, -4]],
    desc: 'Fake the run, hit the post',
  },
];

const OFF_ROLES = ['QB', 'RB', 'WR1', 'WR2', 'WR3', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'];
const DEF_ROLES = ['DE1', 'DT1', 'DT2', 'DE2', 'MLB', 'OLB1', 'OLB2', 'CB1', 'CB2', 'NCB', 'FS'];

const NUMS = { QB: 7, RB: 28, WR1: 81, WR2: 18, WR3: 13, TE: 87, LT: 76, LG: 66, C: 55, RG: 63, RT: 71,
  DE1: 94, DT1: 90, DT2: 99, DE2: 92, MLB: 54, OLB1: 45, OLB2: 58, CB1: 24, CB2: 21, NCB: 29, FS: 32 };

export class Game {
  constructor(scene, events) {
    this.scene = scene;
    this.events = events; // callback(type, payload)
    this.players = { off: {}, def: {} };
    for (const r of OFF_ROLES) {
      const p = buildPlayer('home', NUMS[r]);
      p.role = r; this.players.off[r] = p; scene.add(p.root);
    }
    for (const r of DEF_ROLES) {
      const p = buildPlayer('away', NUMS[r]);
      p.role = r; this.players.def[r] = p; scene.add(p.root);
    }
    this.ball = buildBall();
    scene.add(this.ball);
    this.ballState = { mode: 'held', holder: null, vel: new THREE.Vector3(), spin: 0 };

    // drive state
    this.state = 'idle';        // idle | presnap | live | dead
    this.ballOn = -25;          // own 25
    this.losX = this.ballOn;
    this.fdX = this.ballOn + 10;
    this.down = 1;
    this.scores = { home: 0, away: 0 };
    this.quarter = 1;
    this.clock = 300;
    this.playClock = 25;
    this.play = null;
    this.carrier = null;
    this.userControl = false;
    this.input = { x: 0, z: 0, sprint: false };
    this.deadTimer = 0;
    this.excitement = 0;
    this.snapTime = 0;
    this.thrown = false;
    this.throwTarget = null;
  }

  all() { return [...Object.values(this.players.off), ...Object.values(this.players.def)]; }

  // ---------------- formation ----------------
  lineUp() {
    const los = this.losX;
    const O = this.players.off, D = this.players.def;
    const set = (p, x, z, mode = 'idle', heading = Math.PI / 2) => {
      p.pos.set(x, 0, z); p.vel.set(0, 0, 0); p.speed = 0;
      p.mode = mode; p.heading = heading; p.downTimer = 0;
      p.root.rotation.x = 0; p.root.position.y = 0;
      p.path = null; p.pathIdx = 0; p.assignment = null; p.engaged = null;
    };
    // Offense faces +x (heading PI/2 given models face +z when rotY=0 — we treat heading as world yaw where 0 faces +z; PI/2 faces +x)
    const OH = Math.PI / 2, DH = -Math.PI / 2;
    set(O.C, los - 0.7, 0, 'stance', OH);
    set(O.LG, los - 0.7, 1.1, 'stance', OH);
    set(O.RG, los - 0.7, -1.1, 'stance', OH);
    set(O.LT, los - 0.7, 2.2, 'stance', OH);
    set(O.RT, los - 0.7, -2.2, 'stance', OH);
    set(O.TE, los - 0.7, -3.4, 'stance', OH);
    set(O.QB, los - 5, 0, 'idle', OH);
    set(O.RB, los - 6.2, 1.6, 'idle', OH);
    set(O.WR1, los - 1, 20, 'idle', OH);
    set(O.WR2, los - 1, -20, 'idle', OH);
    set(O.WR3, los - 1.6, 13, 'idle', OH);

    set(D.DE1, los + 0.9, 2.8, 'stance', DH);
    set(D.DT1, los + 0.9, 0.9, 'stance', DH);
    set(D.DT2, los + 0.9, -0.9, 'stance', DH);
    set(D.DE2, los + 0.9, -2.9, 'stance', DH);
    set(D.MLB, los + 4.5, 0, 'idle', DH);
    set(D.OLB1, los + 4, 4.5, 'idle', DH);
    set(D.OLB2, los + 4, -4.5, 'idle', DH);
    set(D.CB1, los + 6.5, 19.5, 'idle', DH);
    set(D.CB2, los + 6.5, -19.5, 'idle', DH);
    set(D.NCB, los + 5.5, 12.5, 'idle', DH);
    set(D.FS, los + 13, 0, 'idle', DH);

    // ball at C
    this.ballState.mode = 'held';
    this.ballState.holder = O.C;
    this.carrier = null;
    this.userControl = false;
    this.thrown = false;
    this.throwTarget = null;
    this.playClock = 25;
  }

  startPresnap() {
    this.state = 'presnap';
    this.lineUp();
    this.events('presnap', { down: this.down, toGo: Math.max(1, Math.ceil(this.fdX - this.losX)), ballOn: this.losX });
  }

  callPlay(play) {
    this.play = play;
    this.snap();
  }

  snap() {
    const O = this.players.off;
    this.state = 'live';
    this.snapTime = 0;
    this.excitement = 0.4;
    // ball to QB
    this.ballState.holder = O.QB;
    this.carrier = O.QB;
    O.QB.mode = 'carry';
    // assign routes
    if (this.play.type === 'pass') {
      for (const [role, route] of Object.entries(this.play.routes)) {
        const p = O[role];
        p.path = route.map(([dx, dz]) => new THREE.Vector3(p.pos.x + dx, 0, p.pos.z + dz));
        p.pathIdx = 0;
      }
    } else {
      const rb = O.RB;
      const edge = this.play.id === 'hb-stretch';
      const pts = edge
        ? [[2, 3], [5, 8], [14, 10]]
        : [[3.5, -0.5], [10, 0], [20, 1]];
      rb.path = pts.map(([dx, dz]) => new THREE.Vector3(this.losX + dx, 0, rb.pos.z * 0 + dz));
      rb.pathIdx = 0;
      // receivers run token routes downfield to block
      for (const r of ['WR1', 'WR2', 'WR3', 'TE']) {
        const p = O[r];
        p.path = [new THREE.Vector3(p.pos.x + 6, 0, p.pos.z)];
        p.pathIdx = 0;
      }
    }
    // defense assignments (man coverage + rush)
    const D = this.players.def;
    D.CB1.assignment = O.WR1; D.CB2.assignment = O.WR2; D.NCB.assignment = O.WR3;
    D.OLB2.assignment = O.TE; D.MLB.assignment = O.RB; D.OLB1.assignment = null; // OLB1 spies QB
    for (const r of ['DE1', 'DT1', 'DT2', 'DE2']) { D[r].mode = 'idle'; D[r].rush = true; }
    // OL pass sets
    for (const r of ['LT', 'LG', 'C', 'RG', 'RT']) { O[r].mode = 'idle'; O[r].blocker = true; }
    this.events('snap', { play: this.play });
  }

  // ---------------- throwing ----------------
  throwTo(role) {
    if (this.state !== 'live' || this.play.type !== 'pass' || this.thrown) return;
    if (this.snapTime < 0.6) return;
    const O = this.players.off;
    const rec = O[role];
    if (!rec || !rec.path) return;
    const qb = O.QB;
    this.thrown = true;
    this.throwTarget = rec;
    qb.mode = 'throw';
    setTimeout(() => { if (qb.mode === 'throw') qb.mode = 'idle'; }, 450);
    // lead the receiver
    const dir = rec.pathIdx < rec.path.length ? rec.path[rec.pathIdx].clone().sub(rec.pos).normalize() : new THREE.Vector3(1, 0, 0);
    const dist = qb.pos.distanceTo(rec.pos);
    const flight = THREE.MathUtils.clamp(dist / 18 + 0.45, 0.55, 2.1);
    const lead = rec.pos.clone().addScaledVector(dir, rec.maxSpeed ? rec.maxSpeed * flight * 0.85 : 5.6 * flight * 0.85);
    lead.z = THREE.MathUtils.clamp(lead.z, -26, 26);
    const start = qb.pos.clone().setY(1.9);
    const v = lead.clone().sub(start).multiplyScalar(1 / flight);
    v.y = (GRAVITY * flight) / 2 - (start.y - 0.9) / flight;
    this.ballState.mode = 'air';
    this.ballState.holder = null;
    this.ballState.vel.copy(v);
    this.ball.position.copy(start);
    this.carrier = null;
    this.events('throw', { target: role });
  }

  // ---------------- per-frame ----------------
  update(dt, t) {
    if (this.state === 'live') this.updateLive(dt);
    if (this.state === 'dead') {
      this.deadTimer += dt;
      this.excitement = Math.max(0, this.excitement - dt * 0.3);
    }
    if (this.state === 'presnap') {
      this.playClock = Math.max(0, this.playClock - dt);
    }
    // clock runs during live play
    if (this.state === 'live') {
      this.clock = Math.max(0, this.clock - dt);
    }
    // ball follow / physics
    this.updateBall(dt, t);
    for (const p of this.all()) animatePlayer(p, dt, t);
  }

  updateLive(dt) {
    this.snapTime += dt;
    const O = this.players.off, D = this.players.def;
    const qb = O.QB;

    // --- offense skill players run routes ---
    for (const r of ['WR1', 'WR2', 'WR3', 'TE', 'RB']) {
      const p = O[r];
      if (p === this.carrier && this.userControl) continue;
      if (p.mode === 'down') continue;
      if (p.path && p.pathIdx < p.path.length) {
        this.seek(p, p.path[p.pathIdx], dt, 6.1);
        if (p.pos.distanceTo(p.path[p.pathIdx]) < 0.8) p.pathIdx++;
      } else if (p !== this.carrier) {
        // route done: drift downfield
        this.seek(p, p.pos.clone().add(new THREE.Vector3(4, 0, 0)), dt, 3.5);
      }
      if (this.carrier === p && !this.userControl) {
        // AI carrier: keep following path; once exhausted, sprint upfield
        if (!p.path || p.pathIdx >= p.path.length) {
          this.seek(p, p.pos.clone().add(new THREE.Vector3(8, 0, (13 - Math.abs(p.pos.z)) * Math.sign(-p.pos.z || 1) * 0.15)), dt, 6.4);
        }
        p.mode = 'carry';
      }
    }

    // --- QB behavior ---
    if (this.play.type === 'pass' && !this.thrown) {
      const dropDepth = this.play.playAction ? 7.5 : 6.5;
      const dropPt = new THREE.Vector3(this.losX - dropDepth, 0, qb.pos.z * 0.5);
      if (this.snapTime < 1.1) {
        this.seek(qb, dropPt, dt, 4.2, true);
        qb.mode = 'carry';
      } else {
        qb.speed = 0;
        // auto-throw if user hasn't by 3.2s: pick most open receiver
        if (this.snapTime > 3.2) {
          let best = null, bestSep = -1;
          for (const r of Object.keys(this.play.routes)) {
            const rec = O[r];
            let sep = 99;
            for (const d of Object.values(D)) sep = Math.min(sep, d.pos.distanceTo(rec.pos));
            if (sep > bestSep) { bestSep = sep; best = r; }
          }
          this.throwTo(best);
        }
      }
      // sack check
      for (const r of ['DE1', 'DT1', 'DT2', 'DE2', 'OLB1']) {
        if (D[r].pos.distanceTo(qb.pos) < 1.0 && this.snapTime > 1.2) {
          return this.endPlay('sack', qb.pos.x);
        }
      }
    }
    if (this.play.type === 'run' && this.carrier === qb && this.snapTime > 0.55) {
      // handoff at mesh point
      const rb = O.RB;
      if (rb.pos.distanceTo(qb.pos) < 3.4) {
        this.carrier = rb;
        this.ballState.holder = rb;
        rb.mode = 'carry';
        qb.mode = 'idle';
        this.userControl = true;
        this.events('handoff', {});
      }
    }

    // --- user-controlled carrier ---
    if (this.carrier && this.userControl && this.carrier.mode !== 'down') {
      const c = this.carrier;
      const maxS = this.input.sprint ? 7.6 : 6.4;
      const iv = new THREE.Vector3(this.input.x, 0, this.input.z);
      if (iv.lengthSq() > 0.01) {
        iv.normalize().multiplyScalar(maxS);
        c.vel.lerp(iv, Math.min(1, dt * 6));
      } else {
        c.vel.lerp(new THREE.Vector3(Math.min(6.0, maxS), 0, 0), Math.min(1, dt * 2.5)); // drift upfield
      }
      c.pos.addScaledVector(c.vel, dt);
      c.speed = c.vel.length();
      if (c.speed > 0.3) c.heading = Math.atan2(c.vel.x, c.vel.z);
      c.mode = 'carry';
    }

    // --- OL blocking: engage nearest rusher ---
    const rushers = ['DE1', 'DT1', 'DT2', 'DE2'].map((r) => D[r]);
    for (const r of ['LT', 'LG', 'C', 'RG', 'RT']) {
      const ol = O[r];
      let near = null, nd = 3.5;
      for (const ru of rushers) {
        const d = ru.pos.distanceTo(ol.pos);
        if (d < nd && !ru.blockedBy) { nd = d; near = ru; }
      }
      if (near) {
        near.blockedBy = ol;
        // mirror between rusher and QB
        const mid = near.pos.clone().lerp(qb.pos, 0.25);
        this.seek(ol, mid, dt, 3.4);
      } else {
        this.seek(ol, new THREE.Vector3(this.losX - 1.2, 0, ol.pos.z), dt, 2);
      }
    }

    // --- defense ---
    const pursueTarget = this.thrown ? null : this.carrier;
    for (const p of Object.values(D)) {
      if (p.mode === 'down') continue;
      if (this.carrier && this.carrier !== qb) {
        // ball is out: everyone pursues carrier
        this.pursue(p, this.carrier, dt);
      } else if (p.rush) {
        const slow = p.blockedBy ? 0.32 : 1;
        this.seek(p, qb.pos, dt, 5.6 * slow);
        p.blockedBy = null;
      } else if (p.assignment && this.play.type === 'pass' && !this.thrown) {
        // man coverage: trail with cushion
        const a = p.assignment;
        const trail = a.pos.clone().addScaledVector(new THREE.Vector3(Math.sin(a.heading), 0, Math.cos(a.heading)), 0.9);
        this.seek(p, trail, dt, 6.0);
      } else if (this.thrown && this.throwTarget) {
        // break on the ball
        this.seek(p, this.ball.position.clone().setY(0), dt, 6.2);
      } else if (this.carrier) {
        this.pursue(p, this.carrier, dt);
      }
    }

    // --- tackling ---
    if (this.carrier && this.carrier !== qb || (this.carrier === qb && this.snapTime > 1 && this.play.type === 'run')) {
      const c = this.carrier;
      for (const d of Object.values(D)) {
        if (d.mode === 'down') continue;
        if (d.pos.distanceTo(c.pos) < 0.95) {
          const breakChance = this.input.sprint ? 0.28 : 0.14;
          if (Math.random() < breakChance * dt * 60 * 0.02) {
            d.mode = 'down'; // broken tackle
            this.events('broken', {});
            continue;
          }
          c.mode = 'down'; d.mode = 'down';
          return this.endPlay(c.pos.x >= 50 ? 'td' : 'tackle', c.pos.x, d);
        }
      }
      // TD / OOB
      if (c.pos.x >= 50) return this.endPlay('td', 50);
      if (Math.abs(c.pos.z) > 26.2) return this.endPlay('oob', c.pos.x);
    }
  }

  seek(p, target, dt, maxSpeed, keepMode) {
    const to = target.clone().sub(p.pos); to.y = 0;
    const d = to.length();
    if (d < 0.05) { p.speed = 0; return; }
    to.normalize();
    const sp = Math.min(maxSpeed, d * 4);
    p.vel.lerp(to.multiplyScalar(sp), Math.min(1, dt * 5));
    p.pos.addScaledVector(p.vel, dt);
    p.speed = p.vel.length();
    if (p.speed > 0.3) p.heading = Math.atan2(p.vel.x, p.vel.z);
    if (!keepMode && p.mode !== 'carry' && p.mode !== 'down') p.mode = 'run';
  }

  pursue(p, target, dt) {
    // aim at intercept point
    const lead = target.pos.clone().addScaledVector(target.vel, 0.25);
    this.seek(p, lead, dt, 6.55);
  }

  // ---------------- ball ----------------
  updateBall(dt, t) {
    const b = this.ball, s = this.ballState;
    if (s.mode === 'held' && s.holder) {
      const h = s.holder;
      const fwd = new THREE.Vector3(Math.sin(h.heading), 0, Math.cos(h.heading));
      if (h.mode === 'carry') {
        b.position.copy(h.pos).add(new THREE.Vector3(0, 1.25, 0)).addScaledVector(fwd, 0.28);
        b.rotation.set(0, h.heading, 0.4);
      } else {
        b.position.copy(h.pos).add(new THREE.Vector3(0, 0.25, 0)).addScaledVector(fwd, 0.35);
        b.rotation.set(0, h.heading + Math.PI / 2, 0);
      }
    } else if (s.mode === 'air') {
      s.vel.y -= GRAVITY * dt;
      b.position.addScaledVector(s.vel, dt);
      // spiral
      b.rotation.y = Math.atan2(s.vel.x, s.vel.z);
      b.rotation.z = -Math.atan2(s.vel.y, Math.hypot(s.vel.x, s.vel.z)) * 0.7;
      b.rotateOnAxis(new THREE.Vector3(1, 0, 0), dt * 22);
      // catch / INT / incomplete resolution
      if (this.state === 'live' && this.throwTarget) {
        const rec = this.throwTarget;
        const groundPos = b.position.clone().setY(0);
        if (b.position.y < 1.9) {
          const dRec = groundPos.distanceTo(rec.pos);
          // nearest defender to catch point
          let dDef = 99, defender = null;
          for (const d of Object.values(this.players.def)) {
            const dd = groundPos.distanceTo(d.pos);
            if (dd < dDef) { dDef = dd; defender = d; }
          }
          if (dRec < 1.35) {
            if (dDef < 0.9 && Math.random() < 0.32) {
              return this.endPlay('int', b.position.x, defender);
            }
            if (dDef < 1.1 && Math.random() < 0.35) {
              return this.endPlay('incomplete', this.losX);
            }
            // catch!
            s.mode = 'held'; s.holder = rec;
            this.carrier = rec; rec.mode = 'carry';
            this.userControl = true;
            this.events('catch', { x: b.position.x });
          } else if (b.position.y < 0.25) {
            return this.endPlay('incomplete', this.losX);
          }
        }
      } else if (b.position.y < 0.2) {
        // FG / loose ball hits ground
        s.mode = 'ground';
        s.vel.multiplyScalar(0.3); s.vel.y = Math.abs(s.vel.y) * 0.35;
      }
    } else if (s.mode === 'ground') {
      s.vel.y -= GRAVITY * dt;
      s.vel.x *= 0.985; s.vel.z *= 0.985;
      b.position.addScaledVector(s.vel, dt);
      if (b.position.y < 0.16) { b.position.y = 0.16; s.vel.y = Math.abs(s.vel.y) * 0.4; if (s.vel.y < 0.4) s.vel.y = 0; }
    }
  }

  // ---------------- play resolution ----------------
  endPlay(result, deadX, defender) {
    if (this.state !== 'live') return;
    this.state = 'dead';
    this.deadTimer = 0;
    const gain = Math.round(deadX - this.losX);
    const payload = { result, gain, deadX, defender: defender?.num };
    this.excitement = result === 'td' ? 1 : result === 'int' ? 0.8 : 0.3;

    if (result === 'td') {
      this.scores.home += 7; // TD + auto XP
      payload.score = true;
      for (const r of ['WR1', 'WR2', 'WR3', 'RB', 'TE']) this.players.off[r].mode = 'celebrate';
      this.events('td', payload);
      this.nextDrive(-25, 3.4);
      return;
    }
    if (result === 'int') {
      this.events('int', payload);
      this.opponentPossession(3.2);
      return;
    }
    this.events(result === 'incomplete' ? 'incomplete' : result === 'sack' ? 'sack' : 'tackle', payload);

    // advance downs
    const newLos = result === 'incomplete' ? this.losX : THREE.MathUtils.clamp(deadX, -49, 49);
    setTimeout(() => {
      if (newLos >= this.fdX) {
        this.down = 1;
        this.losX = newLos;
        this.fdX = Math.min(50, newLos + 10);
        this.events('firstdown', { losX: newLos });
      } else {
        this.down += 1;
        this.losX = newLos;
        if (this.down > 4) {
          this.events('turnover', {});
          this.opponentPossession(1.2);
          return;
        }
      }
      this.maybeQuarter();
      this.startPresnap();
    }, 2400);
  }

  // 4th-down specials
  punt() {
    this.events('punt', {});
    this.opponentPossession(1.5, Math.min(45, this.losX + 42));
  }
  fieldGoal() {
    const dist = Math.round(50 - this.losX + 17);
    const good = Math.random() < THREE.MathUtils.clamp(1.25 - dist / 55, 0.15, 0.97);
    // animate kick
    const s = this.ballState;
    s.mode = 'air'; s.holder = null;
    this.ball.position.set(this.losX - 7, 0.2, 0);
    const flight = 2.1;
    const target = new THREE.Vector3(60, 0, good ? (Math.random() - 0.5) * 4 : 8);
    s.vel.copy(target.sub(this.ball.position).multiplyScalar(1 / flight));
    s.vel.y = (GRAVITY * flight) / 2 + 2.2;
    this.state = 'dead'; this.deadTimer = 0;
    this.throwTarget = null;
    setTimeout(() => {
      if (good) { this.scores.home += 3; this.events('fg_good', { dist }); }
      else this.events('fg_miss', { dist });
      this.opponentPossession(2.2);
    }, 2200);
  }

  opponentPossession(delay, puntSpot) {
    // simulate the opponent drive off-screen, then give the ball back
    setTimeout(() => {
      const roll = Math.random();
      let msg, pts = 0;
      if (roll < 0.32) { pts = 7; msg = 'REDHAWKS DRIVE: TOUCHDOWN'; }
      else if (roll < 0.55) { pts = 3; msg = 'REDHAWKS DRIVE: FIELD GOAL'; }
      else msg = 'REDHAWKS DRIVE: DEFENSE HOLDS — PUNT';
      this.scores.away += pts;
      this.clock = Math.max(0, this.clock - 55);
      this.events('opp_drive', { msg, pts });
      this.down = 1;
      this.losX = -25; this.fdX = -15;
      this.maybeQuarter();
      setTimeout(() => this.startPresnap(), 2600);
    }, delay * 1000);
  }

  nextDrive(losX, delay) {
    setTimeout(() => {
      this.opponentPossessionAfterScore(losX);
    }, delay * 1000);
  }
  opponentPossessionAfterScore(losX) {
    // after we score, opponent answers (sim), then we're back
    this.opponentPossession(0.1);
  }

  maybeQuarter() {
    if (this.clock <= 0) {
      if (this.quarter >= 4) { this.events('final', { scores: this.scores }); this.state = 'final'; return; }
      this.quarter += 1;
      this.clock = 300;
      this.events('quarter', { q: this.quarter });
    }
  }
}
