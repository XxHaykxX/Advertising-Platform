"use client";

import { Suspense, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

const POSTER_COUNT = 15;
const PLANES = 30; // posters placed along the corridor
const GAP = 4; // z-distance between posters
const DEPTH = PLANES * GAP;

function posterUrl(n: number) {
  return `/posters/poster-${String(n).padStart(2, "0")}.jpg`;
}
const URLS = Array.from({ length: POSTER_COUNT }, (_, i) => posterUrl(i + 1));

/* Spiral corridor of poster planes the camera flies through. */
function PosterTunnel() {
  const textures = useLoader(THREE.TextureLoader, URLS);
  useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
    });
  }, [textures]);

  const items = useMemo(() => {
    return Array.from({ length: PLANES }, (_, i) => {
      const angle = i * 0.85;
      const radius = 2.7;
      return {
        key: i,
        tex: textures[i % POSTER_COUNT],
        position: [
          Math.cos(angle) * radius,
          Math.sin(angle * 0.7) * 1.7,
          -i * GAP - 4,
        ] as [number, number, number],
        rotation: [
          Math.sin(angle * 0.7) * 0.12,
          -Math.cos(angle) * 0.18,
          Math.sin(angle) * 0.05,
        ] as [number, number, number],
      };
    });
  }, [textures]);

  return (
    <group>
      {items.map((it) => (
        <group key={it.key} position={it.position} rotation={it.rotation}>
          {/* dark frame */}
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[2.7, 3.95]} />
            <meshBasicMaterial color="#0a0a0a" />
          </mesh>
          {/* poster */}
          <mesh>
            <planeGeometry args={[2.5, 3.75]} />
            <meshBasicMaterial map={it.tex} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* Atmospheric red glows drifting in the corridor. */
function RedGlows() {
  const refs = useRef<THREE.Mesh[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (m) m.position.x = Math.sin(t * 0.3 + i) * 3;
    });
  });
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el as THREE.Mesh;
          }}
          position={[0, i % 2 ? 2 : -2, -i * 16 - 6]}
        >
          <circleGeometry args={[3.4, 24]} />
          <meshBasicMaterial color="#e50914" transparent opacity={0.08} />
        </mesh>
      ))}
    </>
  );
}

function CameraRig({ progress }: { progress: RefObject<number> }) {
  useFrame((state) => {
    const off = progress.current ?? 0; // 0..1 from page scroll (Lenis)
    const targetZ = 4 - off * (DEPTH + 4);
    const cam = state.camera;
    cam.position.z += (targetZ - cam.position.z) * 0.08;
    cam.position.x += (state.pointer.x * 1.1 - cam.position.x) * 0.04;
    cam.position.y += (state.pointer.y * 0.7 - cam.position.y) * 0.04;
    cam.lookAt(0, 0, cam.position.z - 6);
  });
  return null;
}

export function ExperienceCanvas({ progress }: { progress: RefObject<number> }) {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 4], fov: 72, near: 0.1, far: 100 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0b0b0b"]} />
      <fog attach="fog" args={["#0b0b0b", 7, 30]} />
      <ambientLight intensity={1.2} />
      <CameraRig progress={progress} />
      <Suspense fallback={null}>
        <PosterTunnel />
      </Suspense>
      <RedGlows />
    </Canvas>
  );
}
