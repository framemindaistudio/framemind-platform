"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * The home page hero in real-time 3D: FrameMind's gold shutter (the logo's aperture) around a glowing "mind", with
 * the four things the studio builds — a website, an industry app, an AI assistant and a brand kit — floating out of
 * it. Scrolling through the hero opens the shutter wider and brings the screens forward.
 *
 * Plain three.js, loaded only on the home page. It renders on demand: it stops when the hero is off screen or the
 * tab is hidden, caps the pixel ratio on phones, and keeps still for visitors who prefer reduced motion.
 */

const GOLD = new THREE.Color("#C8922E");
const VIOLET = new THREE.Color("#7B5CFF");

type Panel = { mesh: THREE.Mesh; home: THREE.Vector3; tilt: number; phase: number; w: number; h: number };

/* ─────────── the four screens, drawn on canvases ─────────── */

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function screen(w: number, h: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void) {
  const c = document.createElement("canvas");
  const S = 2;
  c.width = w * S;
  c.height = h * S;
  const g = c.getContext("2d")!;
  g.scale(S, S);
  // frame
  roundRect(g, 0, 0, w, h, 22);
  g.fillStyle = "#0E1222";
  g.fill();
  g.save();
  roundRect(g, 0, 0, w, h, 22);
  g.clip();
  draw(g, w, h);
  g.restore();
  roundRect(g, 1, 1, w - 2, h - 2, 21);
  g.strokeStyle = "rgba(231,184,102,0.55)";
  g.lineWidth = 2;
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const label = (g: CanvasRenderingContext2D, text: string, x: number, y: number) => {
  g.font = "700 15px Inter, system-ui, sans-serif";
  g.fillStyle = "#E7B866";
  g.fillText(text.toUpperCase(), x, y);
};

function websiteTex() {
  return screen(480, 320, (g, W, H) => {
    const grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, "#1B2142");
    grd.addColorStop(1, "#0B0E1A");
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#151A33";
    g.fillRect(0, 0, W, 34);
    ["#FF5F57", "#FEBC2E", "#28C840"].forEach((c, i) => {
      g.fillStyle = c;
      g.beginPath();
      g.arc(20 + i * 16, 17, 5, 0, Math.PI * 2);
      g.fill();
    });
    label(g, "Website", 28, 74);
    g.fillStyle = "#F5F4F0";
    g.font = "800 30px Montserrat, Inter, sans-serif";
    g.fillText("Your brand,", 28, 118);
    g.fillStyle = "#C8F135";
    g.fillText("online.", 28, 152);
    g.fillStyle = "rgba(255,255,255,0.35)";
    [182, 196].forEach((y, i) => g.fillRect(28, y, i ? 150 : 200, 6));
    g.fillStyle = "#C8F135";
    roundRect(g, 28, 222, 110, 34, 17);
    g.fill();
    g.fillStyle = "#0D0D0D";
    g.font = "700 13px Inter, sans-serif";
    g.fillText("Get started", 44, 244);
    const card = g.createLinearGradient(W - 200, 70, W - 20, 270);
    card.addColorStop(0, "#C8922E");
    card.addColorStop(1, "#7B5CFF");
    g.fillStyle = card;
    roundRect(g, W - 196, 70, 172, 200, 16);
    g.fill();
  });
}

function appTex() {
  return screen(230, 420, (g, W, H) => {
    g.fillStyle = "#F6F4EF";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#0E1222";
    g.fillRect(0, 0, W, 96);
    label(g, "Industry app", 18, 40);
    g.fillStyle = "#fff";
    g.font = "800 22px Montserrat, Inter, sans-serif";
    g.fillText("Today", 18, 74);
    const rows: [string, string][] = [
      ["#C8F135", "New orders"],
      ["#E7B866", "Bookings"],
      ["#7B5CFF", "Payments"],
      ["#28C840", "Customers"],
    ];
    rows.forEach(([c, t], i) => {
      const y = 116 + i * 66;
      g.fillStyle = "#fff";
      roundRect(g, 14, y, W - 28, 54, 12);
      g.fill();
      g.fillStyle = c;
      roundRect(g, 26, y + 13, 28, 28, 8);
      g.fill();
      g.fillStyle = "#0E1222";
      g.font = "700 14px Inter, sans-serif";
      g.fillText(t, 66, y + 26);
      g.fillStyle = "rgba(14,18,34,0.35)";
      g.fillRect(66, y + 34, 70, 5);
    });
    g.fillStyle = "#0E1222";
    roundRect(g, 14, H - 50, W - 28, 36, 18);
    g.fill();
  });
}

function aiTex() {
  return screen(400, 290, (g, W) => {
    g.fillStyle = "#101530";
    g.fillRect(0, 0, W, 290);
    label(g, "AI assistant", 24, 38);
    const bubble = (x: number, y: number, w: number, me: boolean, lines: number) => {
      g.fillStyle = me ? "#C8F135" : "#232A4D";
      roundRect(g, x, y, w, 22 + lines * 14, 14);
      g.fill();
      g.fillStyle = me ? "rgba(13,13,13,0.55)" : "rgba(255,255,255,0.55)";
      for (let i = 0; i < lines; i++) g.fillRect(x + 14, y + 14 + i * 14, w - 28 - (i === lines - 1 ? 40 : 0), 6);
    };
    bubble(W - 214, 58, 190, true, 1);
    bubble(24, 110, 260, false, 3);
    bubble(W - 174, 192, 150, true, 1);
    g.fillStyle = "#7B5CFF";
    g.beginPath();
    g.arc(46, 252, 7, 0, Math.PI * 2);
    g.arc(68, 252, 7, 0, Math.PI * 2);
    g.arc(90, 252, 7, 0, Math.PI * 2);
    g.fill();
  });
}

function brandTex() {
  return screen(360, 260, (g, W) => {
    g.fillStyle = "#F6F4EF";
    g.fillRect(0, 0, W, 260);
    g.fillStyle = "#0E1222";
    g.font = "700 15px Inter, sans-serif";
    g.fillText("BRAND KIT", 24, 38);
    ["#0E1222", "#C8922E", "#7B5CFF", "#C8F135", "#E2DED5"].forEach((c, i) => {
      g.fillStyle = c;
      roundRect(g, 24 + i * 62, 58, 52, 80, 10);
      g.fill();
    });
    g.fillStyle = "#0E1222";
    g.font = "900 42px Montserrat, Inter, sans-serif";
    g.fillText("Aa", 24, 202);
    g.fillStyle = "rgba(14,18,34,0.4)";
    g.fillRect(100, 172, 200, 7);
    g.fillRect(100, 190, 150, 7);
    g.fillStyle = "#C8922E";
    g.beginPath();
    g.arc(W - 46, 222, 18, 0, Math.PI * 2);
    g.fill();
  });
}

/* ─────────── the shutter ─────────── */

/**
 * One iris leaf, drawn with its pivot (the rim corner at angle 0) at the origin: a radial edge from the hole out to
 * the rim, the rim arc, then a spiral back to the hole. Turning the leaf about its pivot opens or closes the iris.
 */
function bladeGeometry(hole: number, R: number, span: number) {
  const s = new THREE.Shape();
  const pt = (r: number, a: number) => new THREE.Vector2(r * Math.cos(a) - R, r * Math.sin(a));
  const p0 = pt(hole, 0);
  s.moveTo(p0.x, p0.y);
  const p1 = pt(R, 0);
  s.lineTo(p1.x, p1.y);
  const steps = 48;
  for (let k = 1; k <= steps; k++) {
    const q = pt(R, (k / steps) * span);
    s.lineTo(q.x, q.y);
  }
  for (let k = steps; k >= 0; k--) {
    const f = k / steps; // 1 at the far end, 0 back at the start
    const q = pt(hole + (R * 0.985 - hole) * Math.pow(f, 1.35), f * span);
    s.lineTo(q.x, q.y);
  }
  return new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 2, curveSegments: 12 });
}

function brainNetwork(radius: number, count: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    // even spread on a sphere (Fibonacci)
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * 2.399963;
    pts.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(radius));
  }
  const seg: number[] = [];
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) if (pts[i].distanceTo(pts[j]) < radius * 0.62) seg.push(...pts[i].toArray(), ...pts[j].toArray());
  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
  const nodes = new THREE.BufferGeometry().setFromPoints(pts);
  return { lines, nodes };
}

/* ─────────── component ─────────── */

export default function HeroScene({ track }: { track: React.RefObject<HTMLElement | null> }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio < 2, alpha: true, powerPreference: "high-performance" });
    } catch {
      // no WebGL here: keep the logo mark that is already showing
      queueMicrotask(() => setFailed(true));
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.setAttribute("aria-hidden", "true");
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const rig = new THREE.Group(); // positioned per screen shape
    const world = new THREE.Group(); // pointer parallax
    rig.add(world);
    scene.add(rig);

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const key = new THREE.DirectionalLight(0xffe0b0, 2.2);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const rim = new THREE.PointLight(VIOLET, 18, 12);
    rim.position.set(0, 0.5, -2.5);
    world.add(rim);
    const ember = new THREE.PointLight(0xff7a2e, 8, 10);
    ember.position.set(0.5, -2.2, 1.5);
    world.add(ember);

    const disposables: { dispose: () => void }[] = [envTex, pmrem];

    // shutter blades
    const N = 9;
    const R = 1.3;
    // two golds so the overlapping leaves read as separate pieces
    const gold = new THREE.MeshPhysicalMaterial({ color: "#C08A3E", metalness: 1, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.9 });
    const goldDeep = new THREE.MeshPhysicalMaterial({ color: "#8E5E24", metalness: 1, roughness: 0.36, clearcoat: 0.5, envMapIntensity: 0.8 });
    const bladeGeo = bladeGeometry(0.34, R, ((Math.PI * 2) / N) * 2.05);
    disposables.push(gold, goldDeep, bladeGeo);
    const shutter = new THREE.Group();
    const blades: THREE.Group[] = [];
    for (let i = 0; i < N; i++) {
      const around = new THREE.Group();
      around.rotation.z = (i / N) * Math.PI * 2;
      const leaf = new THREE.Group(); // turns about the leaf's rim corner
      leaf.position.set(R, 0, i * 0.011);
      leaf.add(new THREE.Mesh(bladeGeo, i % 2 ? goldDeep : gold));
      around.add(leaf);
      shutter.add(around);
      blades.push(leaf);
    }
    // a rim the leaves sit in
    const rimGeo = new THREE.TorusGeometry(R + 0.04, 0.05, 16, 120);
    const rimMesh = new THREE.Mesh(rimGeo, goldDeep);
    rimMesh.position.z = 0.05;
    shutter.add(rimMesh);
    disposables.push(rimGeo);
    world.add(shutter);

    // rings
    const ringMat = new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: 0.3 });
    const ringGeo = new THREE.TorusGeometry(1.62, 0.012, 12, 160);
    const ring2Geo = new THREE.TorusGeometry(1.86, 0.006, 8, 160);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.55 });
    disposables.push(ringMat, ringGeo, ring2Geo, ring2Mat);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.set(0.5, -0.35, 0);
    world.add(ring, ring2);

    // the mind: a glowing core with a neural mesh
    const coreGeo = new THREE.IcosahedronGeometry(0.36, 5);
    const coreMat = new THREE.MeshPhysicalMaterial({ color: "#1C1450", emissive: VIOLET, emissiveIntensity: 0.9, roughness: 0.25, clearcoat: 1 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    const net = brainNetwork(0.5, small ? 70 : 110);
    const netLineMat = new THREE.LineBasicMaterial({ color: "#B9A8FF", transparent: true, opacity: 0.55 });
    const netNodeMat = new THREE.PointsMaterial({ color: "#E7B866", size: 0.035 });
    const mind = new THREE.Group();
    mind.add(core, new THREE.LineSegments(net.lines, netLineMat), new THREE.Points(net.nodes, netNodeMat));
    mind.position.z = -0.12;
    world.add(mind);
    disposables.push(coreGeo, coreMat, net.lines, net.nodes, netLineMat, netNodeMat);

    // the four screens
    const specs: { tex: THREE.Texture; w: number; home: [number, number, number]; tilt: number }[] = [
      { tex: websiteTex(), w: 1.5, home: [-1.62, 0.92, 0.55], tilt: 0.32 },
      { tex: appTex(), w: 0.62, home: [1.78, 0.62, 0.7], tilt: -0.34 },
      { tex: aiTex(), w: 1.22, home: [-1.72, -0.98, 0.42], tilt: 0.28 },
      { tex: brandTex(), w: 1.08, home: [1.62, -1.06, 0.6], tilt: -0.3 },
    ];
    const panels: Panel[] = specs.map((s, i) => {
      const img = s.tex.image as HTMLCanvasElement;
      const h = (s.w * img.height) / img.width;
      const geo = new THREE.PlaneGeometry(s.w, h);
      const mat = new THREE.MeshBasicMaterial({ map: s.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide });
      disposables.push(geo, mat, s.tex);
      const mesh = new THREE.Mesh(geo, mat);
      world.add(mesh);
      return { mesh, home: new THREE.Vector3(...s.home), tilt: s.tilt, phase: i * 1.7, w: s.w, h };
    });

    // gold dust
    const dustCount = small ? 140 : 320;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 9;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: "#E7B866", size: 0.018, transparent: true, opacity: 0.7, depthWrite: false });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);
    disposables.push(dustGeo, dustMat);

    // layout for the screen shape: scene on the right on wide screens, above the words on tall ones
    let layout = { scale: 1, x: 0, y: 0, z: 8 };
    function resize() {
      const w = el!.clientWidth || 1;
      const h = el!.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const a = w / h;
      if (window.innerWidth >= 1024) layout = { scale: 0.9, x: Math.min(2.6, 1.35 + a * 0.65), y: 0.05, z: 8.2 };
      else {
        // phones and tablets: the scene has its own box above the words; fit the shutter and all four screens in it
        const half = Math.tan(THREE.MathUtils.degToRad(17.5)) * 8.5;
        layout = { scale: Math.min(1, (half * a) / 2.7, half / 2.05) * 0.96, x: 0, y: 0, z: 8.5 };
      }
      camera.position.set(0, 0, layout.z);
      rig.position.set(layout.x, layout.y, 0);
      rig.scale.setScalar(layout.scale);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // input
    const pointer = new THREE.Vector2();
    const onPointer = (e: PointerEvent) => {
      pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const progress = () => {
      const t = track.current;
      if (!t) return 0;
      const r = t.getBoundingClientRect();
      // pinned hero: its extra height is the scroll range; stacked hero: scrolling it out of view opens the shutter
      const span = r.height > window.innerHeight * 1.2 ? r.height - window.innerHeight : Math.max(1, r.height * 0.6);
      return THREE.MathUtils.clamp(-r.top / span, 0, 1);
    };

    // render loop: runs only while the hero is on screen and the tab is visible
    const start = performance.now();
    let raf = 0;
    let onScreen = true;
    let p = progress();
    let first = true;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);

    function frame() {
      raf = 0;
      const t = reduced ? 0 : (performance.now() - start) / 1000;
      p += (progress() - p) * (reduced ? 1 : 0.09);
      const e = ease(p);

      // shutter: half-open at rest, wide open as you scroll
      const open = 0.22 + 0.78 * e;
      blades.forEach((leaf, i) => {
        leaf.rotation.z = -0.4 * open;
        leaf.position.z = i * 0.011 + Math.sin(t * 0.8 + i) * 0.006;
      });
      shutter.rotation.z = t * 0.1 + e * 0.8;
      ring.rotation.set(0.35 + Math.sin(t * 0.3) * 0.08, 0.25 + Math.sin(t * 0.2) * 0.1, t * 0.12);
      ring2.rotation.z = -t * 0.1;
      mind.rotation.y = t * 0.35;
      mind.scale.setScalar(1 + e * 0.35 + Math.sin(t * 1.6) * 0.02);
      coreMat.emissiveIntensity = 0.85 + Math.sin(t * 2) * 0.15 + e * 0.4;

      // screens: out around the shutter at rest, forward and wider as you scroll
      panels.forEach((pn) => {
        const spread = 0.86 + 0.32 * e;
        pn.mesh.position.set(pn.home.x * spread, pn.home.y * spread + Math.sin(t * 0.9 + pn.phase) * 0.05, pn.home.z + e * 0.9);
        pn.mesh.rotation.set(Math.sin(t * 0.6 + pn.phase) * 0.04, pn.tilt * (1 - e * 0.6), Math.sin(t * 0.5 + pn.phase) * 0.025);
      });

      // whole scene: pointer parallax and a slow drift; fades back as the page moves on
      world.rotation.y += (pointer.x * 0.28 - world.rotation.y) * 0.05;
      world.rotation.x += (pointer.y * 0.16 - world.rotation.x) * 0.05;
      rig.position.z = e * 1.4;
      dust.rotation.y = t * 0.02;
      dust.position.y = Math.sin(t * 0.2) * 0.1;

      renderer.render(scene, camera);
      if (first) {
        first = false;
        setReady(true);
      }
      if (!reduced && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
    }
    const kick = () => {
      if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([en]) => {
      onScreen = en.isIntersecting;
      kick();
    });
    io.observe(el);
    const onVis = () => kick();
    document.addEventListener("visibilitychange", onVis);
    // with reduced motion there is no loop: draw again only when the visitor scrolls
    const onScroll = () => reduced && kick();
    window.addEventListener("scroll", onScroll, { passive: true });
    kick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [track]);

  return (
    <div className="absolute inset-0">
      {/* until the 3D scene draws (or if WebGL is unavailable): the logo mark on a glow */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${ready && !failed ? "opacity-0" : "opacity-100"}`}
      >
        <div className="absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 lg:left-[72%] lg:top-1/2 lg:h-[440px] lg:w-[440px]">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(123,92,255,0.35),transparent_65%)]" />
          <img src="/brand/fm-mark-dark.png" alt="" className="absolute inset-[18%] h-[64%] w-[64%] object-contain opacity-90" />
        </div>
      </div>
      <div ref={host} className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
