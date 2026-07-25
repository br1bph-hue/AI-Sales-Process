// Broadcast camera system: sideline tracking cam, end-zone cam for kicks,
// low celebration cam, with smoothing and dynamic zoom.
import * as THREE from 'three';

export class BroadcastCamera {
  constructor(camera) {
    this.camera = camera;
    this.mode = 'broadcast';        // broadcast | endzone | celebration | blimp
    this.focus = new THREE.Vector3();
    this.smoothFocus = new THREE.Vector3(0, 1, 0);
    this.smoothPos = new THREE.Vector3(0, 26, -62);
    this.shake = 0;
  }

  setMode(mode) { this.mode = mode; }
  addShake(amt) { this.shake = Math.min(1, this.shake + amt); }

  update(dt, focusPoint, t) {
    this.focus.copy(focusPoint);
    let targetPos, targetLook = this.focus.clone(), lerpRate = 3.2;

    if (this.mode === 'broadcast') {
      // high sideline cam perched above the near lower bowl, trucking with the ball
      const x = THREE.MathUtils.clamp(this.focus.x * 0.9, -48, 48);
      targetPos = new THREE.Vector3(x, 22, -47);
      // bias the look-at toward field center so the far bowl stays in frame
      targetLook = new THREE.Vector3(this.focus.x, 1.0, this.focus.z * 0.4 + 3);
      const dist = targetPos.distanceTo(targetLook);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, THREE.MathUtils.clamp(20 + dist * 0.14, 24, 36), dt * 2);
    } else if (this.mode === 'endzone') {
      targetPos = new THREE.Vector3(this.focus.x - 22, 7, 0);
      targetLook = new THREE.Vector3(60, 4, 0);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 42, dt * 2);
    } else if (this.mode === 'celebration') {
      const ang = t * 0.35;
      targetPos = new THREE.Vector3(this.focus.x + Math.cos(ang) * 9, 2.4, this.focus.z + Math.sin(ang) * 9);
      targetLook.y = 1.4;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 34, dt * 2);
      lerpRate = 4.5;
    } else { // blimp — title screen
      const ang = t * 0.06;
      targetPos = new THREE.Vector3(Math.cos(ang) * 95, 55, Math.sin(ang) * 95);
      targetLook = new THREE.Vector3(0, 0, 0);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 36, dt * 2);
      lerpRate = 1.5;
    }

    this.smoothPos.lerp(targetPos, Math.min(1, dt * lerpRate));
    this.smoothFocus.lerp(targetLook, Math.min(1, dt * 4.5));

    // impact shake
    if (this.shake > 0.001) {
      this.smoothPos.x += (Math.random() - 0.5) * this.shake * 0.5;
      this.smoothPos.y += (Math.random() - 0.5) * this.shake * 0.4;
      this.shake *= Math.pow(0.02, dt);
    }

    this.camera.position.copy(this.smoothPos);
    this.camera.lookAt(this.smoothFocus);
    this.camera.updateProjectionMatrix();
  }
}
