/*
 * Three.js viewer rendered into a <canvas>. Listens to plan changes via
 * the usePlan hook and rebuilds the scene whenever items change.
 *
 * Why rebuild instead of reconcile: the plan is small (<100 items) and a
 * full rebuild is well under 5 ms. A diffing layer would be premature.
 *
 * Each cabinet is built as:
 *   - body (BoxGeometry, MeshStandardMaterial with procedural color)
 *   - door panel (slightly recessed, on the +Z face = "front")
 *   - 1-2 handles (CylinderGeometry)
 *   - hinges (SphereGeometry markers on the hinge edge)
 * Sinks/hobs/appliances render with characteristic surface markings.
 */
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { usePlan } from '../hooks/usePlan.jsx';
import { WALL_MOUNT_CM } from '../utils/geometry.js';

// Fallback flat colors used when texture files are missing.
const FALLBACK_COLORS = {
  oak:    '#c8a978',
  walnut: '#5e3c20',
  white:  '#f2f0eb',
  black:  '#1a1a1a',
};

// Preload all textures once and build reusable MeshStandardMaterials.
// Textures must be placed in frontend/public/textures/.
// CC0 wood textures can be downloaded from https://ambientcg.com
// - oak:    Wood049 (diffuse + normal)
// - walnut: Wood062 (diffuse + normal)
// - white/black: no diffuse, only roughness map
function buildMaterialCache() {
  const loader = new THREE.TextureLoader();

  const tryLoad = (path, onLoad) => {
    const t = loader.load(path, onLoad, undefined, () => { /* 404 is fine — falls back */ });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    return t;
  };

  const cache = {};

  // Oak — warm wood grain
  const oakDiff = tryLoad('/textures/oak_diffuse.jpg');
  const oakNorm = tryLoad('/textures/oak_normal.jpg');
  cache.oak = new THREE.MeshStandardMaterial({
    map: oakDiff, normalMap: oakNorm,
    color: FALLBACK_COLORS.oak,
    roughness: 0.6, metalness: 0.02,
  });

  // Walnut — dark wood grain
  const walDiff = tryLoad('/textures/walnut_diffuse.jpg');
  const walNorm = tryLoad('/textures/walnut_normal.jpg');
  cache.walnut = new THREE.MeshStandardMaterial({
    map: walDiff, normalMap: walNorm,
    color: FALLBACK_COLORS.walnut,
    roughness: 0.5, metalness: 0.02,
  });

  // White painted — subtle roughness variation
  const whiteRough = tryLoad('/textures/white_roughness.jpg');
  cache.white = new THREE.MeshStandardMaterial({
    roughnessMap: whiteRough,
    color: FALLBACK_COLORS.white,
    roughness: 0.35, metalness: 0.05,
  });

  // Black matte — subtle roughness variation
  const blackRough = tryLoad('/textures/black_roughness.jpg');
  cache.black = new THREE.MeshStandardMaterial({
    roughnessMap: blackRough,
    color: FALLBACK_COLORS.black,
    roughness: 0.45, metalness: 0.08,
  });

  return cache;
}

export default function Viewer3D() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const itemGroupRef = useRef(null);
  const matCacheRef = useRef(null);
  const { state } = usePlan();
  const { plan } = state;

  // ---- one-time scene setup ----
  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1a1a1a');

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(5, 4, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);

    // Lights
    const key  = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(4, 6, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -8; key.shadow.camera.right = 8;
    key.shadow.camera.top  = 8;  key.shadow.camera.bottom = -8;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-4, 3, -2);
    scene.add(fill);

    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    // Group containers — clearing/refilling these is faster than wiping the whole scene.
    const roomGroup = new THREE.Group();
    const itemGroup = new THREE.Group();
    scene.add(roomGroup); scene.add(itemGroup);

    sceneRef.current  = { scene, camera, renderer, controls, roomGroup };
    itemGroupRef.current = itemGroup;
    matCacheRef.current = buildMaterialCache();

    // Resize observer
    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // Animation loop
    let id;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      id = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  // ---- rebuild room when room dims change ----
  useEffect(() => {
    if (!sceneRef.current) return;
    const { roomGroup } = sceneRef.current;
    while (roomGroup.children.length) roomGroup.remove(roomGroup.children[0]);

    const W = plan.room.width  / 100;
    const D = plan.room.depth  / 100;
    const H = plan.room.height / 100;

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(W, D),
      new THREE.MeshStandardMaterial({ color: '#d8cfb8', roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Back & left walls (so the camera's default angle has them visible)
    const wallMat = new THREE.MeshStandardMaterial({ color: '#efeadd', roughness: 0.95 });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    back.position.set(0, H / 2, -D / 2);
    roomGroup.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    left.rotation.y = Math.PI / 2;
    left.position.set(-W / 2, H / 2, 0);
    roomGroup.add(left);
  }, [plan.room.width, plan.room.depth, plan.room.height]);

  // ---- rebuild items when they change ----
  useEffect(() => {
    if (!itemGroupRef.current) return;
    const group = itemGroupRef.current;
    while (group.children.length) group.remove(group.children[0]);

    const W = plan.room.width, D = plan.room.depth;

    const matCache = matCacheRef.current;
    for (const it of plan.items) {
      group.add(buildCabinet(it, W, D, matCache));
    }
  }, [plan.items, plan.room.width, plan.room.depth]);

  return <div className="viewer3d" ref={mountRef} />;
}


// =================== cabinet builder ===========================

function buildCabinet(item, roomW, roomD, matCache) {
  // Centered in scene coords (room centered at origin).
  const w = item.w / 100, d = item.d / 100, h = item.h / 100;
  const cx = (item.x + item.w / 2 - roomW / 2) / 100;
  const cz = (item.y + item.d / 2 - roomD / 2) / 100;
  const cy = item.category === 'wall'
    ? (WALL_MOUNT_CM + item.h / 2) / 100
    : h / 2;

  const group = new THREE.Group();
  group.position.set(cx, cy, cz);
  group.rotation.y = -THREE.MathUtils.degToRad(item.rotation || 0);

  const baseMat = (matCache && matCache[item.material])
    ? matCache[item.material].clone()
    : new THREE.MeshStandardMaterial({
        color: FALLBACK_COLORS[item.material] || FALLBACK_COLORS.oak,
        roughness: 0.55, metalness: 0.05,
      });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), baseMat);
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  // Door panel — slightly forward on +Z face (the "front")
  const doorThickness = 0.018;
  const doorMat = baseMat.clone();
  doorMat.roughness = Math.max(0, baseMat.roughness - 0.15);
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.96, h * 0.94, doorThickness),
    doorMat,
  );
  door.position.z = d / 2 + doorThickness / 2;
  door.castShadow = true;
  group.add(door);

  // Door split for wide cabinets
  if (w > 0.6) {
    const split = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, h * 0.94, doorThickness * 1.05),
      new THREE.MeshStandardMaterial({ color: '#222' })
    );
    split.position.set(0, 0, d / 2 + doorThickness);
    group.add(split);
  }

  // Handles
  const handleMat = new THREE.MeshStandardMaterial({
    color: '#c0c0c0', roughness: 0.25, metalness: 0.85,
  });
  const handleGeom = new THREE.CylinderGeometry(0.008, 0.008, w > 0.6 ? w * 0.35 : w * 0.55, 12);
  handleGeom.rotateZ(Math.PI / 2);
  const handleY = item.category === 'base' ? h / 2 - 0.05 : -h / 2 + 0.05;
  if (w > 0.6) {
    const left  = new THREE.Mesh(handleGeom, handleMat);
    const right = new THREE.Mesh(handleGeom, handleMat);
    left.position.set(-w / 4,  handleY, d / 2 + doorThickness + 0.012);
    right.position.set( w / 4, handleY, d / 2 + doorThickness + 0.012);
    group.add(left); group.add(right);
  } else {
    const handle = new THREE.Mesh(handleGeom, handleMat);
    handle.position.set(0, handleY, d / 2 + doorThickness + 0.012);
    group.add(handle);
  }

  // Hinges (visible little caps on the front edge)
  const hingeMat = new THREE.MeshStandardMaterial({ color: '#888', roughness: 0.4, metalness: 0.7 });
  const hingeGeom = new THREE.SphereGeometry(0.012, 8, 8);
  for (const sign of [-1, 1]) {
    const yOff = h * 0.35 * sign;
    const hinge = new THREE.Mesh(hingeGeom, hingeMat);
    hinge.position.set(-w / 2 + 0.02, yOff, d / 2 + 0.005);
    group.add(hinge);
  }

  // Worktop on base/appliance cabinets
  if (item.category === 'base' || item.category === 'appliance') {
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.02, 0.04, d + 0.02),
      new THREE.MeshStandardMaterial({ color: '#2a2520', roughness: 0.35 })
    );
    top.position.y = h / 2 + 0.02;
    top.castShadow = true; top.receiveShadow = true;
    group.add(top);
  }

  // Appliance overlays
  if (item.kind === 'sink') {
    const basin = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.7, 0.08, d * 0.6),
      new THREE.MeshStandardMaterial({ color: '#888', roughness: 0.2, metalness: 0.9 })
    );
    basin.position.y = h / 2 + 0.03;
    group.add(basin);
  }
  if (item.kind === 'hob') {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.85, 0.005, d * 0.85),
      new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.15 })
    );
    plate.position.y = h / 2 + 0.045;
    group.add(plate);
    for (const [px, pz] of [[-0.2,-0.15],[0.2,-0.15],[-0.2,0.15],[0.2,0.15]]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.06, 0.005, 8, 24),
        new THREE.MeshStandardMaterial({ color: '#444', roughness: 0.4, metalness: 0.6 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(px * w, h / 2 + 0.05, pz * d);
      group.add(ring);
    }
  }
  if (item.kind === 'fridge') {
    door.material = new THREE.MeshStandardMaterial({
      color: '#e8e8e6', roughness: 0.3, metalness: 0.4,
    });
  }

  return group;
}

// Lighten/darken a hex color by `amt` in -1..1.
function shade(hex, amt) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  hsl.l = Math.max(0, Math.min(1, hsl.l + amt));
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return '#' + c.getHexString();
}
