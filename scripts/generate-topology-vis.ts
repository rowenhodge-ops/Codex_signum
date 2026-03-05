#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * M-9.7b 3D Topology Visualisation Generator
 *
 * Queries the live Neo4j graph via getVisualisationTopology() and generates
 * a self-contained HTML file with embedded Three.js that renders the
 * morpheme topology in 3D.
 *
 * The HTML file is scaffolding — temporary until M-13 UI replaces it.
 * It does NOT connect to Neo4j from the browser. Data is embedded as inline JSON.
 *
 * Usage: npx tsx scripts/generate-topology-vis.ts
 * Output: docs/vis/topology-3d.html
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import {
  closeDriver,
  getVisualisationTopology,
} from "../src/graph/index.js";
import type { VisualisationTopology } from "../src/graph/index.js";

function generateHTML(topology: VisualisationTopology): string {
  const dataJSON = JSON.stringify(topology, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Codex Signum — Morpheme Topology</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0a0f; color: #e0e0e0; font-family: 'Consolas', 'Monaco', monospace; overflow: hidden; }
  #container { width: 100vw; height: 100vh; }
  #info {
    position: absolute; top: 12px; left: 12px; z-index: 100;
    background: rgba(10, 10, 15, 0.85); border: 1px solid #333;
    padding: 12px 16px; border-radius: 6px; max-width: 320px;
    font-size: 12px; line-height: 1.5;
  }
  #info h1 { font-size: 14px; color: #88ccff; margin-bottom: 6px; }
  #info .stat { color: #aaa; }
  #info .stat b { color: #e0e0e0; }
  #tooltip {
    position: absolute; display: none; z-index: 200;
    background: rgba(10, 10, 15, 0.92); border: 1px solid #555;
    padding: 8px 12px; border-radius: 4px; font-size: 11px;
    max-width: 300px; pointer-events: none;
  }
  #tooltip .tt-label { color: #88ccff; font-weight: bold; }
  #tooltip .tt-type { color: #aaa; font-style: italic; }
  #tooltip .tt-desc { color: #ccc; margin-top: 4px; }
  #legend {
    position: absolute; bottom: 12px; left: 12px; z-index: 100;
    background: rgba(10, 10, 15, 0.85); border: 1px solid #333;
    padding: 10px 14px; border-radius: 6px; font-size: 11px;
  }
  #legend .item { display: flex; align-items: center; margin: 3px 0; }
  #legend .swatch { width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
  #filters {
    position: absolute; top: 12px; right: 12px; z-index: 100;
    background: rgba(10, 10, 15, 0.85); border: 1px solid #333;
    padding: 10px 14px; border-radius: 6px; font-size: 11px;
  }
  #filters label { display: block; margin: 3px 0; cursor: pointer; }
  #filters input { margin-right: 6px; }
</style>
</head>
<body>
<div id="container"></div>

<div id="info">
  <h1>Codex Signum — Morpheme Topology</h1>
  <div class="stat">Nodes: <b id="node-count">0</b></div>
  <div class="stat">Relationships: <b id="rel-count">0</b></div>
  <div class="stat" style="margin-top: 6px; color: #666;">Click node for details. Scroll to zoom. Drag to rotate.</div>
</div>

<div id="tooltip">
  <div class="tt-label"></div>
  <div class="tt-type"></div>
  <div class="tt-desc"></div>
</div>

<div id="legend">
  <div class="item"><div class="swatch" style="background: #ffffff;"></div> Seed (origin)</div>
  <div class="item"><div class="swatch" style="background: #66bbff;"></div> Bloom (scope)</div>
  <div class="item"><div class="swatch" style="background: #ff8844;"></div> Resonator (transform)</div>
  <div class="item"><div class="swatch" style="background: #88cc88;"></div> Grid (structure)</div>
  <div class="item"><div class="swatch" style="background: #cc66ff;"></div> Helix (learning)</div>
</div>

<div id="filters">
  <label><input type="checkbox" data-label="Seed" checked> Seeds</label>
  <label><input type="checkbox" data-label="Bloom" checked> Blooms</label>
  <label><input type="checkbox" data-label="Resonator" checked> Resonators</label>
  <label><input type="checkbox" data-label="Grid" checked> Grids</label>
  <label><input type="checkbox" data-label="Helix" checked> Helixes</label>
</div>

<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"
  }
}
</script>

<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── Embedded topology data ──
const TOPOLOGY = ${dataJSON};

document.getElementById('node-count').textContent = TOPOLOGY.nodes.length;
document.getElementById('rel-count').textContent = TOPOLOGY.relationships.length;

// ── Morpheme visual encoding ──
const MORPHEME_CONFIG = {
  Seed:      { color: 0xffffff, size: 0.3, segments: 16, emissive: 0x222222 },
  Bloom:     { color: 0x66bbff, size: 0.6, segments: 32, emissive: 0x112244 },
  Resonator: { color: 0xff8844, size: 0.4, segments: 8,  emissive: 0x331100 },
  Grid:      { color: 0x88cc88, size: 0.5, segments: 4,  emissive: 0x113311 },
  Helix:     { color: 0xcc66ff, size: 0.45, segments: 12, emissive: 0x220033 },
};

const REL_COLORS = {
  CONTAINS: 0x334455,
  FLOWS_TO: 0x44aaff,
  SCOPED_TO: 0x555555,
  OBSERVES: 0xcc66ff,
  INSTANTIATES: 0x336633,
  DEPENDS_ON: 0xaa6633,
  VIOLATES: 0xff3333,
};

// ── Scene setup ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0f);
scene.fog = new THREE.FogExp2(0x0a0a0f, 0.008);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 30, 60);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 200;

// Lighting
const ambient = new THREE.AmbientLight(0x444466, 0.6);
scene.add(ambient);
const directional = new THREE.DirectionalLight(0xffffff, 0.8);
directional.position.set(20, 40, 30);
scene.add(directional);
const point = new THREE.PointLight(0x4488ff, 0.4, 100);
point.position.set(-10, 20, -10);
scene.add(point);

// ── Force-directed layout ──
const nodeMap = new Map();
const meshMap = new Map();
const positions = new Map();

// Group nodes by label for layout
const groups = {};
TOPOLOGY.nodes.forEach(n => {
  if (!groups[n.label]) groups[n.label] = [];
  groups[n.label].push(n);
});

// Initial positions: group by label with some structure
let idx = 0;
const labelOffsets = {
  Bloom: { x: 0, y: 0, z: 0, spread: 15 },
  Resonator: { x: 0, y: -5, z: 0, spread: 20 },
  Seed: { x: 0, y: 10, z: 0, spread: 25 },
  Grid: { x: -20, y: -10, z: 0, spread: 5 },
  Helix: { x: 20, y: -10, z: 0, spread: 5 },
};

TOPOLOGY.nodes.forEach(n => {
  const offset = labelOffsets[n.label] || { x: 0, y: 0, z: 0, spread: 15 };
  const angle = (idx / TOPOLOGY.nodes.length) * Math.PI * 2;
  const r = offset.spread * (0.3 + Math.random() * 0.7);
  positions.set(n.id, {
    x: offset.x + r * Math.cos(angle) + (Math.random() - 0.5) * 5,
    y: offset.y + (Math.random() - 0.5) * 8,
    z: offset.z + r * Math.sin(angle) + (Math.random() - 0.5) * 5,
    vx: 0, vy: 0, vz: 0,
  });
  nodeMap.set(n.id, n);
  idx++;
});

// Build adjacency for force simulation
const edges = TOPOLOGY.relationships.map(r => ({
  source: r.from, target: r.to, type: r.type
}));

// Force simulation (simple spring-electric)
function simulateForces(iterations) {
  const nodes = Array.from(positions.entries());
  const k = 8; // ideal spring length
  const repulsion = 200;
  const attraction = 0.01;
  const damping = 0.85;

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      const [id1, p1] = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const [id2, p2] = nodes[j];
        let dx = p1.x - p2.x, dy = p1.y - p2.y, dz = p1.z - p2.z;
        let dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
        let force = repulsion / (dist * dist);
        let fx = (dx / dist) * force, fy = (dy / dist) * force, fz = (dz / dist) * force;
        p1.vx += fx; p1.vy += fy; p1.vz += fz;
        p2.vx -= fx; p2.vy -= fy; p2.vz -= fz;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const p1 = positions.get(edge.source);
      const p2 = positions.get(edge.target);
      if (!p1 || !p2) continue;
      let dx = p2.x - p1.x, dy = p2.y - p1.y, dz = p2.z - p1.z;
      let dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
      let force = attraction * (dist - k);
      // CONTAINS edges pull harder
      if (edge.type === 'CONTAINS') force *= 3;
      let fx = (dx / dist) * force, fy = (dy / dist) * force, fz = (dz / dist) * force;
      p1.vx += fx; p1.vy += fy; p1.vz += fz;
      p2.vx -= fx; p2.vy -= fy; p2.vz -= fz;
    }

    // Apply velocities with damping
    for (const [, p] of nodes) {
      p.x += p.vx; p.y += p.vy; p.z += p.vz;
      p.vx *= damping; p.vy *= damping; p.vz *= damping;
    }
  }
}

simulateForces(150);

// ── Create 3D objects ──
function createNodeMesh(node) {
  const config = MORPHEME_CONFIG[node.label] || MORPHEME_CONFIG.Seed;
  let geometry;

  switch (node.label) {
    case 'Resonator':
      geometry = new THREE.OctahedronGeometry(config.size);
      break;
    case 'Grid':
      geometry = new THREE.BoxGeometry(config.size * 1.5, config.size * 0.3, config.size * 1.5);
      break;
    case 'Helix':
      geometry = new THREE.TorusGeometry(config.size * 0.6, config.size * 0.2, 8, 16);
      break;
    case 'Bloom':
      geometry = new THREE.SphereGeometry(config.size, config.segments, config.segments);
      break;
    default:
      geometry = new THREE.SphereGeometry(config.size, config.segments, config.segments);
  }

  const material = new THREE.MeshPhongMaterial({
    color: config.color,
    emissive: config.emissive,
    transparent: node.label === 'Bloom',
    opacity: node.label === 'Bloom' ? 0.6 : 1.0,
    shininess: 60,
  });

  const mesh = new THREE.Mesh(geometry, material);
  const pos = positions.get(node.id);
  mesh.position.set(pos.x, pos.y, pos.z);
  mesh.userData = node;
  return mesh;
}

// Create node meshes
const nodeGroup = new THREE.Group();
TOPOLOGY.nodes.forEach(n => {
  const mesh = createNodeMesh(n);
  meshMap.set(n.id, mesh);
  nodeGroup.add(mesh);
});
scene.add(nodeGroup);

// Create edges
const edgeGroup = new THREE.Group();
function createEdges() {
  // Clear existing
  while (edgeGroup.children.length > 0) {
    const child = edgeGroup.children[0];
    child.geometry?.dispose();
    child.material?.dispose();
    edgeGroup.remove(child);
  }

  TOPOLOGY.relationships.forEach(r => {
    const fromMesh = meshMap.get(r.from);
    const toMesh = meshMap.get(r.to);
    if (!fromMesh || !toMesh || !fromMesh.visible || !toMesh.visible) return;

    const points = [fromMesh.position.clone(), toMesh.position.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const color = REL_COLORS[r.type] || 0x444444;
    const material = new THREE.LineBasicMaterial({
      color, transparent: true,
      opacity: r.type === 'FLOWS_TO' ? 0.7 : 0.3,
    });
    const line = new THREE.Line(geometry, material);
    line.userData = { type: r.type, from: r.from, to: r.to };
    edgeGroup.add(line);
  });
}
createEdges();
scene.add(edgeGroup);

// Create node labels (sprite-based)
const labelGroup = new THREE.Group();
function createLabel(text, position, color) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 256; canvas.height = 64;
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 256, 64);
  ctx.font = 'bold 20px Consolas, monospace';
  ctx.fillStyle = color || '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(text.length > 20 ? text.slice(0, 18) + '..' : text, 128, 36);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.8 });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.position.y += 0.8;
  sprite.scale.set(4, 1, 1);
  return sprite;
}

TOPOLOGY.nodes.forEach(n => {
  const mesh = meshMap.get(n.id);
  if (!mesh) return;
  const config = MORPHEME_CONFIG[n.label] || MORPHEME_CONFIG.Seed;
  const colorHex = '#' + config.color.toString(16).padStart(6, '0');
  const label = createLabel(n.name, mesh.position, colorHex);
  label.userData = { nodeId: n.id };
  labelGroup.add(label);
});
scene.add(labelGroup);

// ── FLOWS_TO animated particles ──
const particleGroup = new THREE.Group();
const flowParticles = [];

TOPOLOGY.relationships.filter(r => r.type === 'FLOWS_TO').forEach(r => {
  const fromMesh = meshMap.get(r.from);
  const toMesh = meshMap.get(r.to);
  if (!fromMesh || !toMesh) return;

  const geo = new THREE.SphereGeometry(0.1, 6, 6);
  const mat = new THREE.MeshBasicMaterial({ color: 0x44aaff });
  const particle = new THREE.Mesh(geo, mat);
  particle.userData = { from: fromMesh.position, to: toMesh.position, t: Math.random() };
  particleGroup.add(particle);
  flowParticles.push(particle);
});
scene.add(particleGroup);

// ── Raycaster for interaction ──
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');

renderer.domElement.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(nodeGroup.children);

  if (intersects.length > 0) {
    const node = intersects[0].object.userData;
    tooltip.style.display = 'block';
    tooltip.style.left = (e.clientX + 15) + 'px';
    tooltip.style.top = (e.clientY + 15) + 'px';
    tooltip.querySelector('.tt-label').textContent = node.name;
    tooltip.querySelector('.tt-type').textContent = node.label + (node.type ? ' (' + node.type + ')' : '');
    tooltip.querySelector('.tt-desc').textContent = node.properties?.description || node.id;
    renderer.domElement.style.cursor = 'pointer';
  } else {
    tooltip.style.display = 'none';
    renderer.domElement.style.cursor = 'default';
  }
});

// ── Filters ──
document.querySelectorAll('#filters input').forEach(cb => {
  cb.addEventListener('change', () => {
    const label = cb.dataset.label;
    const visible = cb.checked;
    TOPOLOGY.nodes.forEach(n => {
      if (n.label === label) {
        const mesh = meshMap.get(n.id);
        if (mesh) mesh.visible = visible;
      }
    });
    // Toggle labels
    labelGroup.children.forEach(sprite => {
      if (sprite.userData.nodeId) {
        const node = nodeMap.get(sprite.userData.nodeId);
        if (node && node.label === label) sprite.visible = visible;
      }
    });
    createEdges();
  });
});

// ── Animation loop ──
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Animate FLOWS_TO particles
  const time = Date.now() * 0.001;
  flowParticles.forEach(p => {
    p.userData.t = (p.userData.t + 0.003) % 1;
    const t = p.userData.t;
    p.position.lerpVectors(p.userData.from, p.userData.to, t);
  });

  // Subtle Resonator pulse
  meshMap.forEach((mesh, id) => {
    const node = nodeMap.get(id);
    if (node && node.label === 'Resonator') {
      const scale = 1 + 0.05 * Math.sin(time * 2 + mesh.position.x);
      mesh.scale.set(scale, scale, scale);
    }
    if (node && node.label === 'Helix') {
      mesh.rotation.z = time * 0.5;
    }
  });

  renderer.render(scene, camera);
}
animate();

// ── Resize ──
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
</script>
</body>
</html>`;
}

// ── Fallback: generate with mock data if Neo4j is unavailable ──
function generateMockTopology(): VisualisationTopology {
  console.log("  (Using mock topology data — Neo4j unavailable)");

  // This mock data mirrors what the bootstrap would create
  const nodes = [
    { id: "pattern:architect", label: "Bloom", type: "pattern", name: "Architect Pattern", properties: { description: "7-stage planning pipeline" } },
    { id: "pattern:dev-agent", label: "Bloom", type: "pattern", name: "DevAgent Pattern", properties: { description: "4-stage coding pipeline" } },
    { id: "pattern:thompson-router", label: "Bloom", type: "pattern", name: "Thompson Router", properties: { description: "Thompson sampling model selection" } },
    { id: "pipeline:signal", label: "Bloom", type: "pipeline", name: "Signal Pipeline", properties: { description: "7-stage signal conditioning" } },
    // Architect resonators
    { id: "resonator:architect:survey", label: "Resonator", type: "", name: "SURVEY", properties: { description: "Document discovery, claim extraction" } },
    { id: "resonator:architect:decompose", label: "Resonator", type: "", name: "DECOMPOSE", properties: { description: "LLM-driven task decomposition" } },
    { id: "resonator:architect:classify", label: "Resonator", type: "", name: "CLASSIFY", properties: { description: "Mechanical vs generative" } },
    { id: "resonator:architect:sequence", label: "Resonator", type: "", name: "SEQUENCE", properties: { description: "Topological sort + critical path" } },
    { id: "resonator:architect:gate", label: "Resonator", type: "", name: "GATE", properties: { description: "Human approval gate" } },
    { id: "resonator:architect:dispatch", label: "Resonator", type: "", name: "DISPATCH", properties: { description: "Task execution" } },
    { id: "resonator:architect:adapt", label: "Resonator", type: "", name: "ADAPT", properties: { description: "Failure classification + replanning" } },
    // DevAgent resonators
    { id: "resonator:dev-agent:scope", label: "Resonator", type: "", name: "SCOPE", properties: { description: "Task scoping" } },
    { id: "resonator:dev-agent:execute", label: "Resonator", type: "", name: "EXECUTE", properties: { description: "Code generation" } },
    { id: "resonator:dev-agent:review", label: "Resonator", type: "", name: "REVIEW", properties: { description: "Cross-model review" } },
    { id: "resonator:dev-agent:validate", label: "Resonator", type: "", name: "VALIDATE", properties: { description: "Quality assessment" } },
    // Signal resonators
    { id: "resonator:signal:debounce", label: "Resonator", type: "", name: "Debounce", properties: { description: "Stage 1: 100ms persistence" } },
    { id: "resonator:signal:hampel", label: "Resonator", type: "", name: "Hampel", properties: { description: "Stage 2: outlier filter" } },
    { id: "resonator:signal:ewma", label: "Resonator", type: "", name: "EWMA", properties: { description: "Stage 3: smoothing" } },
    { id: "resonator:signal:cusum", label: "Resonator", type: "", name: "CUSUM", properties: { description: "Stage 4: change detection" } },
    { id: "resonator:signal:macd", label: "Resonator", type: "", name: "MACD", properties: { description: "Stage 5: trend detection" } },
    { id: "resonator:signal:hysteresis", label: "Resonator", type: "", name: "Hysteresis", properties: { description: "Stage 6: band gating" } },
    { id: "resonator:signal:trend", label: "Resonator", type: "", name: "Trend", properties: { description: "Stage 7: Theil-Sen regression" } },
    // Helix + Grid
    { id: "helix:thompson-learning", label: "Helix", type: "learning", name: "Thompson Learning", properties: { description: "Bayesian posterior refinement" } },
    { id: "grid:compliance-corpus", label: "Grid", type: "compliance", name: "Compliance Corpus", properties: { description: "Placeholder for M-16.3" } },
  ];

  const relationships = [
    // Architect CONTAINS
    ...["survey", "decompose", "classify", "sequence", "gate", "dispatch", "adapt"].map(r => ({ from: "pattern:architect", to: `resonator:architect:${r}`, type: "CONTAINS" })),
    // DevAgent CONTAINS
    ...["scope", "execute", "review", "validate"].map(r => ({ from: "pattern:dev-agent", to: `resonator:dev-agent:${r}`, type: "CONTAINS" })),
    // Signal CONTAINS
    ...["debounce", "hampel", "ewma", "cusum", "macd", "hysteresis", "trend"].map(r => ({ from: "pipeline:signal", to: `resonator:signal:${r}`, type: "CONTAINS" })),
    // Architect FLOWS_TO
    { from: "resonator:architect:survey", to: "resonator:architect:decompose", type: "FLOWS_TO" },
    { from: "resonator:architect:decompose", to: "resonator:architect:classify", type: "FLOWS_TO" },
    { from: "resonator:architect:classify", to: "resonator:architect:sequence", type: "FLOWS_TO" },
    { from: "resonator:architect:sequence", to: "resonator:architect:gate", type: "FLOWS_TO" },
    { from: "resonator:architect:gate", to: "resonator:architect:dispatch", type: "FLOWS_TO" },
    { from: "resonator:architect:dispatch", to: "resonator:architect:adapt", type: "FLOWS_TO" },
    { from: "resonator:architect:adapt", to: "resonator:architect:survey", type: "FLOWS_TO" },
    // DevAgent FLOWS_TO
    { from: "resonator:dev-agent:scope", to: "resonator:dev-agent:execute", type: "FLOWS_TO" },
    { from: "resonator:dev-agent:execute", to: "resonator:dev-agent:review", type: "FLOWS_TO" },
    { from: "resonator:dev-agent:review", to: "resonator:dev-agent:validate", type: "FLOWS_TO" },
    // Signal FLOWS_TO
    { from: "resonator:signal:debounce", to: "resonator:signal:hampel", type: "FLOWS_TO" },
    { from: "resonator:signal:hampel", to: "resonator:signal:ewma", type: "FLOWS_TO" },
    { from: "resonator:signal:ewma", to: "resonator:signal:cusum", type: "FLOWS_TO" },
    { from: "resonator:signal:cusum", to: "resonator:signal:macd", type: "FLOWS_TO" },
    { from: "resonator:signal:macd", to: "resonator:signal:hysteresis", type: "FLOWS_TO" },
    { from: "resonator:signal:hysteresis", to: "resonator:signal:trend", type: "FLOWS_TO" },
    // OBSERVES
    { from: "helix:thompson-learning", to: "pattern:thompson-router", type: "OBSERVES" },
  ];

  return { nodes, relationships };
}

// ── Main ──
async function main(): Promise<void> {
  console.log("🔮 M-9.7b 3D Topology Visualisation Generator\n");

  let topology: VisualisationTopology;

  try {
    topology = await getVisualisationTopology();
    console.log(`  Queried ${topology.nodes.length} nodes, ${topology.relationships.length} relationships from Neo4j`);
  } catch (err) {
    console.warn("  Neo4j unavailable, using mock topology data");
    topology = generateMockTopology();
  }

  try {
    await closeDriver();
  } catch {
    // Ignore if driver wasn't connected
  }

  const html = generateHTML(topology);

  const outDir = path.join(process.cwd(), "docs", "vis");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "topology-3d.html");
  fs.writeFileSync(outPath, html, "utf-8");
  console.log(`\n  ✅ Written to: ${path.relative(process.cwd(), outPath)}`);
  console.log(`  Nodes: ${topology.nodes.length}`);
  console.log(`  Relationships: ${topology.relationships.length}`);
  console.log("\n  Open in a browser to view the 3D topology.");
}

const isMainModule =
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
