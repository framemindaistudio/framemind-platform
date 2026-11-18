"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * The home page hero in real-time 3D: a slowly morphing liquid-chrome orb with an iridescent gold-to-violet sheen,
 * lit by a small studio of coloured soft boxes, with a few chrome beads orbiting it. It follows the pointer a little
 * and flows faster and swells as the visitor scrolls through the hero.
 *
 * Plain three.js, loaded only on the home page. It stops when the hero is off screen or the tab is hidden, uses
 * fewer polygons and a lower pixel ratio on phones, and keeps still for visitors who prefer reduced motion.
 */

// 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT)
const NOISE = /* glsl */ `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+2.0*C.xxx; vec3 x3=x0-1.0+3.0*C.xxx;
  i=mod(i,289.0);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=1.0/7.0; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
uniform float uTime; uniform float uAmp; uniform float uFreq;
float disp(vec3 p){
  vec3 q=normalize(p);
  return uAmp*(snoise(q*uFreq+vec3(uTime*0.22,uTime*0.17,-uTime*0.12))
             +0.22*snoise(q*uFreq*2.2+vec3(-uTime*0.15,uTime*0.1,uTime*0.2)));
}
`;

/** A small photo studio, rendered once into an environment map: dark room, coloured soft boxes. */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const env = new THREE.Scene();
  // a dark studio lit by long, thin strip lights: chrome reflects them as crisp bright bands
  // the room is a horizon: deep violet-navy sky above, warm gold ground below, like chrome photographed outdoors
  const roomGeo = new THREE.SphereGeometry(20, 48, 32);
  const sky = new THREE.Color("#2B2470");
  const haze = new THREE.Color("#4B3A7A");
  const ground = new THREE.Color("#7A5018");
  const deep = new THREE.Color("#2E1E0C");
  const cols: number[] = [];
  const pos = roomGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 20;
    const c = y >= 0 ? haze.clone().lerp(sky, Math.min(1, y * 1.6)) : ground.clone().lerp(deep, Math.min(1, -y * 1.4));
    if (Math.abs(y) < 0.04) c.lerp(new THREE.Color("#E7B866"), 0.6); // a bright horizon line
    cols.push(c.r, c.g, c.b);
  }
  roomGeo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  env.add(new THREE.Mesh(roomGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const strip = (color: string, intensity: number, w: number, h: number, pos: [number, number, number], rz = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    m.rotateZ(rz);
    env.add(m);
  };
  strip("#FFFFFF", 4.0, 16, 1.2, [0, 9, 4]); // overhead bar
  strip("#FFF1D6", 3.2, 1.0, 14, [-8, 0, 6]); // tall warm strip, left front
  strip("#FFE2A8", 2.4, 0.6, 12, [-11, 1, -2]); // second warm strip, left back
  strip("#9C84FF", 3.0, 1.1, 14, [9, 0, 4]); // violet strip, right
  strip("#FFFFFF", 1.6, 10, 0.5, [0, -6, 8], 0.2); // thin floor bounce
  strip("#C8F135", 0.8, 0.5, 8, [5, -2, -10]); // a hint of FrameMind lime behind
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, 0.012).texture;
  pm.dispose();
  env.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    (m.material as THREE.Material | undefined)?.dispose?.();
  });
  return tex;
}

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
      // no WebGL here: keep the soft glow that is already showing
      queueMicrotask(() => setFailed(true));
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.setAttribute("aria-hidden", "true");
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envTex = studioEnvironment(renderer);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    const rig = new THREE.Group();
    const world = new THREE.Group();
    rig.add(world);
    scene.add(rig);

    // the orb: liquid chrome with an iridescent film
    const uniforms = { uTime: { value: 0 }, uAmp: { value: 0.07 }, uFreq: { value: 0.9 } };
    const orbGeo = new THREE.IcosahedronGeometry(1.2, small ? 48 : 96);
    const orbMat = new THREE.MeshPhysicalMaterial({
      color: "#F1E2C4",
      metalness: 1,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      iridescence: 0.35,
      iridescenceIOR: 1.5,
      iridescenceThicknessRange: [260, 640],
      envMapIntensity: 1.15,
    });
    orbMat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = NOISE + shader.vertexShader;
      // move each vertex along the noise, and rebuild its normal from two nearby displaced points
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        /* glsl */ `
        vec3 n0 = normalize(normal);
        vec3 tg = normalize(cross(n0, abs(n0.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
        vec3 bt = normalize(cross(n0, tg));
        float r0 = length(position);
        float e = 0.012;
        vec3 pA = normalize(position + tg * e) * r0;
        vec3 pB = normalize(position + bt * e) * r0;
        vec3 q0 = position + n0 * disp(position);
        vec3 qA = pA + normalize(pA) * disp(pA);
        vec3 qB = pB + normalize(pB) * disp(pB);
        vec3 objectNormal = normalize(cross(qA - q0, qB - q0));
        vec3 displacedPos = q0;
        `,
      );
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "vec3 transformed = displacedPos;");
    };
    const orb = new THREE.Mesh(orbGeo, orbMat);
    world.add(orb);

    // chrome beads in orbit
    const beadMat = new THREE.MeshPhysicalMaterial({ color: "#F1E2C4", metalness: 1, roughness: 0.06, envMapIntensity: 1.2 });
    const beadGeo = new THREE.SphereGeometry(1, 48, 32);
    const beads = [
      { r: 0.13, radius: 1.95, speed: 0.32, tilt: 0.5, phase: 0 },
      { r: 0.075, radius: 2.25, speed: -0.22, tilt: -0.35, phase: 2.1 },
      { r: 0.1, radius: 1.75, speed: 0.26, tilt: 1.1, phase: 4.0 },
      { r: 0.05, radius: 2.45, speed: 0.4, tilt: -0.9, phase: 1.2 },
    ].map((b) => {
      const m = new THREE.Mesh(beadGeo, beadMat);
      m.scale.setScalar(b.r);
      world.add(m);
      return { ...b, m };
    });

    // a thin orbit line, very faint
    const orbitGeo = new THREE.TorusGeometry(1.95, 0.0035, 6, 200);
    const orbitMat = new THREE.MeshBasicMaterial({ color: "#E7B866", transparent: true, opacity: 0.22 });
    const orbit = new THREE.Mesh(orbitGeo, orbitMat);
    orbit.rotation.set(Math.PI / 2 - 0.5, 0, 0);
    world.add(orbit);

    const disposables: { dispose: () => void }[] = [envTex, orbGeo, orbMat, beadMat, beadGeo, orbitGeo, orbitMat];

    // layout: orb on the right on large screens, centred in its own box on phones and tablets
    let layout = { scale: 1, x: 0, y: 0, z: 8 };
    function resize() {
      const w = el!.clientWidth || 1;
      const h = el!.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const a = w / h;
      const z = 8.5;
      const half = Math.tan(THREE.MathUtils.degToRad(16)) * z; // half the visible height at the orb
      if (window.innerWidth >= 1024) layout = { scale: 1, x: Math.min(half * a * 0.48, 2.9), y: 0, z };
      else layout = { scale: Math.min(1, (half * a) / 2.7, half / 2.6), x: 0, y: 0, z };
      camera.position.set(0, 0, layout.z);
      rig.position.set(layout.x, layout.y, 0);
      rig.scale.setScalar(layout.scale);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const pointer = new THREE.Vector2();
    const onPointer = (e: PointerEvent) => pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    window.addEventListener("pointermove", onPointer, { passive: true });

    const progress = () => {
      const t = track.current;
      if (!t) return 0;
      const r = t.getBoundingClientRect();
      // pinned hero: its extra height is the scroll range; stacked hero: scrolling it out of view
      const span = r.height > window.innerHeight * 1.2 ? r.height - window.innerHeight : Math.max(1, r.height * 0.6);
      return THREE.MathUtils.clamp(-r.top / span, 0, 1);
    };

    const start = performance.now();
    let raf = 0;
    let onScreen = true;
    let p = progress();
    let first = true;
    const ease = (x: number) => x * x * (3 - 2 * x);

    function frame() {
      raf = 0;
      const t = reduced ? 4 : (performance.now() - start) / 1000;
      p += (progress() - p) * (reduced ? 1 : 0.08);
      const e = ease(p);

      // the liquid flows faster and swells as you scroll
      uniforms.uTime.value = t * 0.7 * (1 + e * 1.4);
      uniforms.uAmp.value = 0.07 + e * 0.08;
      orb.rotation.set(t * 0.05 + e * 0.6, t * 0.09 + e * 1.2, 0);
      orb.scale.setScalar(1 + e * 0.18);

      beads.forEach((b) => {
        const a = b.phase + t * b.speed + e * 1.5;
        const rad = b.radius * (1 + e * 0.15);
        b.m.position.set(Math.cos(a) * rad, Math.sin(a) * rad * Math.sin(b.tilt) * 0.6, Math.sin(a) * rad * Math.cos(b.tilt));
      });
      orbit.rotation.z = t * 0.05;

      world.rotation.y += (pointer.x * 0.35 - world.rotation.y) * 0.04;
      world.rotation.x += (pointer.y * 0.2 - world.rotation.x) * 0.04;
      world.position.x += (pointer.x * 0.12 - world.position.x) * 0.04;
      world.position.y += (-pointer.y * 0.1 - world.position.y) * 0.04;
      rig.position.z = e * 1.1;

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
      {/* until the 3D scene draws (or without WebGL): a soft gold-violet glow where the orb will be */}
      <div aria-hidden className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${ready && !failed ? "opacity-0" : "opacity-100"}`}>
        <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#F2DDB4,#C8922E_35%,#3B2A7A_70%,transparent_72%)] opacity-80 blur-[2px] lg:left-[72%] lg:h-[400px] lg:w-[400px]" />
      </div>
      <div ref={host} className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
