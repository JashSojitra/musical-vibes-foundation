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
    float a=uv.x*11.;
    float w=(uv.y-.5);
    float envelope=exp(-pow((uv.x-.67)*2.8,2.));
    float wave=sin(a*1.2+uPhase*.38+uTime*.19);
    float fine=sin(a*3.8-uTime*.35+uPhase)*.10;
    vec3 p=vec3((uv.x-.5)*17., -1.7+uv.x*1.3+wave*envelope*1.55,
      sin(a*.65+uPhase+uTime*.12)*.7);
    p.y+=w*(.25+envelope*.8)+fine*uEnergy;
    p.z+=w*cos(a*.8+uPhase)*1.7;
    vDepth=p.z;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
  }`;
const fragment = `
  uniform vec3 uColor; varying vec2 vUv; varying float vDepth;
  void main(){
    float edge=smoothstep(0.,.08,vUv.y)*(1.-smoothstep(.92,1.,vUv.y));
    float thread=pow(.5+.5*cos(vUv.y*230.),8.);
    float light=.45+.55*sin(vUv.x*3.14159);
    float highlight=pow(.5+.5*sin(vUv.x*18.+vDepth*3.),8.);
    vec3 c=uColor*(light+highlight*.65);
    float fade=smoothstep(0.,.09,vUv.x)*(1.-smoothstep(.92,1.,vUv.x));
    gl_FragColor=vec4(c,edge*(.09+thread*.77)*fade);
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
      ["#e9c791", "#b18a50", "#f5dfb0"].map(
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
      const r = 2.5 + (i % 13) * 0.31;
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
        (0.12 + pointer.y * 0.04 - group.current.rotation.x) * 0.025;
      group.current.rotation.y +=
        (pointer.x * 0.04 - group.current.rotation.y) * 0.025;
      group.current.rotation.z = -0.06 + Math.sin(time.current * 0.1) * 0.018;
    }
    if (dust.current) dust.current.rotation.z = time.current * 0.025;
    if (active) invalidate();
  });
  return (
    <group ref={group} rotation={[0.12, 0, -0.06]}>
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
      camera={{ position: [0, 0, 8], fov: 48 }}
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
