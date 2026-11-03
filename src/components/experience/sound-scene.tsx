"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import {
  Color,
  DoubleSide,
  type Group,
  ShaderMaterial,
  type Points,
} from "three";

const vertex = `
  uniform float uTime; uniform float uEnergy; uniform float uPhase;
  varying vec2 vUv; varying float vDepth;
  void main(){
    vUv=uv;
    float a=uv.x*6.2831853;
    float w=(uv.y-.5)*.28;
    float wave=sin(a*3.+uPhase+uTime*.28);
    float radius=1.65+.20*wave+uEnergy*.15*sin(a*7.-uTime*.35+uPhase);
    vec3 p=vec3(cos(a)*(radius+w),sin(a)*(radius+w)*.72,.42*sin(a*2.+uPhase+uTime*.18));
    p.z+=w*sin(a*3.+uPhase)*3.;
    p.y+=.18*sin(a*2.+uPhase);
    vDepth=p.z;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
  }`;
const fragment = `
  uniform vec3 uColor; varying vec2 vUv; varying float vDepth;
  void main(){
    float edge=smoothstep(0.,.08,vUv.y)*(1.-smoothstep(.92,1.,vUv.y));
    float thread=.86+.14*sin(vUv.y*170.);
    float light=.58+.42*sin(vUv.y*3.14159);
    float highlight=pow(sin(vUv.y*3.14159),14.)*.4;
    vec3 c=uColor*(.72+light*.4)+vec3(.18,.12,.06)*highlight;
    c*=thread;
    gl_FragColor=vec4(c,edge*.97);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

function Ribbons({
  active,
  intensity,
}: {
  active: boolean;
  intensity: number;
}) {
  const group = useRef<Group>(null);
  const dust = useRef<Points>(null);
  const time = useRef(0);
  const energy = useRef(intensity);
  const invalidate = useThree((state) => state.invalidate);
  const pointer = useThree((state) => state.pointer);
  const materials = useMemo(
    () =>
      ["#d5a75b", "#b66e9a", "#b9bda1"].map(
        (color, i) =>
          new ShaderMaterial({
            uniforms: {
              uTime: { value: 0 },
              uEnergy: { value: 0.45 },
              uPhase: { value: i * 2.094 },
              uColor: { value: new Color(color) },
            },
            vertexShader: vertex,
            fragmentShader: fragment,
            side: DoubleSide,
            transparent: true,
            depthWrite: false,
          }),
      ),
    [],
  );
  const particles = useMemo(() => {
    const array = new Float32Array(96 * 3);
    for (let i = 0; i < 96; i++) {
      const t = i * 2.399963;
      const r = 1.9 + (i % 13) * 0.065;
      array[i * 3] = Math.cos(t) * r;
      array[i * 3 + 1] = Math.sin(t) * r * 0.76;
      array[i * 3 + 2] = Math.sin(i * 1.7) * 0.8;
    }
    return array;
  }, []);
  useEffect(() => {
    invalidate();
  }, [active, intensity, invalidate]);
  useEffect(
    () => () => materials.forEach((material) => material.dispose()),
    [materials],
  );
  useFrame((_, delta) => {
    if (active) time.current += Math.min(delta, 0.04);
    energy.current = active
      ? energy.current + (intensity - energy.current) * 0.05
      : intensity;
    materials.forEach((material) => {
      material.uniforms.uTime.value = time.current;
      material.uniforms.uEnergy.value = energy.current;
    });
    if (group.current) {
      group.current.rotation.x +=
        (0.34 + pointer.y * 0.13 - group.current.rotation.x) * 0.025;
      group.current.rotation.y +=
        (pointer.x * 0.22 - group.current.rotation.y) * 0.025;
      group.current.rotation.z = 0.18 + Math.sin(time.current * 0.1) * 0.12;
    }
    if (dust.current) dust.current.rotation.z = time.current * 0.025;
    if (active) invalidate();
  });
  return (
    <group ref={group} rotation={[0.34, 0, 0.18]}>
      {materials.map((material, i) => (
        <mesh key={i} material={material}>
          <planeGeometry args={[1, 1, 192, 8]} />
        </mesh>
      ))}
      <points ref={dust}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#e4c38a"
          size={0.018}
          sizeAttenuation
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export default function SoundScene({
  active,
  intensity,
  onReady,
  onFailure,
}: {
  active: boolean;
  intensity: number;
  onReady: () => void;
  onFailure: () => void;
}) {
  return (
    <Canvas
      className="sculpture-canvas"
      camera={{ position: [0, 0, 5.3], fov: 48 }}
      dpr={[1, 1.35]}
      frameloop="demand"
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      fallback={null}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onFailure, {
          once: true,
        });
        onReady();
      }}
    >
      <AdaptiveDpr />
      <Ribbons active={active} intensity={intensity} />
    </Canvas>
  );
}
