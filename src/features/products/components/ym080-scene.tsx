"use client";

import { Suspense, useEffect, useMemo, useRef, type ElementRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, Html, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Path, Shape, Vector3 } from "three";

export type ModelView = { preset: "perspective" | "front" | "top"; revision: number };
type SceneProps = { autoRotate: boolean; active: boolean; view: ModelView; modelUrl?: string };
const circle = Math.PI * 2;
const extrusion = { depth: 0.1, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.008, bevelThickness: 0.008, curveSegments: 48 };

function OutputFlange() {
  const shape = useMemo(() => {
    const plate = new Shape();
    plate.absarc(0, 0, 0.71, 0, circle, false);
    const center = new Path();
    center.absarc(0, 0, 0.27, 0, circle, true);
    plate.holes.push(center);
    // 중앙 홀과 체결 홀을 실제로 뚫어 상단에서도 입체적인 형상이 보이게 합니다.
    for (let index = 0; index < 12; index++) {
      const angle = index / 12 * circle;
      const hole = new Path();
      hole.absarc(Math.cos(angle) * 0.56, Math.sin(angle) * 0.56, 0.052, 0, circle, true);
      plate.holes.push(hole);
    }
    return plate;
  }, []);

  return <mesh position={[0, 1.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    <extrudeGeometry args={[shape, extrusion]} />
    <meshStandardMaterial color="#c4c9d1" metalness={0.95} roughness={0.25} />
  </mesh>;
}

function Ym080Model() {
  // 원본 규격 D80 × 100.1mm를 기준으로 직경 2, 높이 약 2.50의 비율을 사용합니다.
  // 외관 확인용 모델이며 실제 CAD 형상이나 내부 기구를 재현하지 않습니다.
  return <group>
    <mesh position={[0, -0.07, 0]}>
      <cylinderGeometry args={[0.988, 0.988, 2.13, 96]} />
      <meshStandardMaterial color="#454a53" metalness={0.58} roughness={0.36} />
    </mesh>
    {[-0.86, -0.2, 0.46, 0.95].map((height) => <mesh key={height} position={[0, height, 0]}>
      <cylinderGeometry args={[0.994, 0.994, 0.012, 96]} />
      <meshStandardMaterial color="#101319" metalness={0.5} roughness={0.5} />
    </mesh>)}
    <mesh position={[0, -1.16, 0]}>
      <cylinderGeometry args={[0.989, 0.95, 0.18, 96]} />
      <meshStandardMaterial color="#171b21" metalness={0.35} roughness={0.48} />
    </mesh>
    <mesh position={[0, 1.02, 0]}>
      <cylinderGeometry args={[1.005, 1.005, 0.16, 96]} />
      <meshStandardMaterial color="#aab0bb" metalness={0.95} roughness={0.26} />
    </mesh>
    <mesh position={[0, 1.12, 0]}>
      <cylinderGeometry args={[0.96, 0.99, 0.09, 96]} />
      <meshStandardMaterial color="#c1c5ce" metalness={0.95} roughness={0.22} />
    </mesh>
    <mesh position={[0, 1.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.77, 0.048, 12, 96]} />
      <meshStandardMaterial color="#15191e" metalness={0.65} roughness={0.28} />
    </mesh>
    <OutputFlange />
    <mesh position={[0, 1.237, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.27, 0.34, 64]} />
      <meshStandardMaterial color="#101319" metalness={0.6} roughness={0.32} />
    </mesh>
    <mesh position={[0, 1.16, 0]}>
      <cylinderGeometry args={[0.265, 0.265, 0.12, 48]} />
      <meshBasicMaterial color="#07090c" />
    </mesh>
    {Array.from({ length: 16 }, (_, index) => {
      const angle = index / 16 * circle;
      return <group key={index} position={[Math.cos(angle) * 0.91, 1.2, Math.sin(angle) * 0.91]}>
        <mesh><cylinderGeometry args={[0.053, 0.053, 0.055, 16]} /><meshStandardMaterial color="#434950" metalness={0.9} roughness={0.25} /></mesh>
        <mesh position={[0, 0.029, 0]}><cylinderGeometry args={[0.026, 0.026, 0.006, 6]} /><meshStandardMaterial color="#0e1115" roughness={0.6} /></mesh>
      </group>;
    })}
    <mesh position={[0, -1.09, 0.97]}>
      <boxGeometry args={[0.62, 0.2, 0.09]} />
      <meshStandardMaterial color="#151920" roughness={0.55} />
    </mesh>
  </group>;
}

function CadModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const { object, floor } = useMemo(() => {
    const object = scene.clone(true);
    const bounds = new Box3().setFromObject(object);
    const center = bounds.getCenter(new Vector3());
    object.position.sub(center);
    return { object, floor: -bounds.getSize(new Vector3()).y / 2 - 0.015 };
  }, [scene]);
  return <><primitive object={object} dispose={null} /><ContactShadows position={[0, floor, 0]} opacity={0.5} scale={8} blur={2.5} far={3} resolution={256} frames={1} /><Grid position={[0, floor - 0.01, 0]} args={[12, 12]} cellSize={0.5} sectionSize={2.5} cellColor="#46536a" sectionColor="#596b86" fadeDistance={9} fadeStrength={2} infiniteGrid /></>;
}

function CameraControls({ autoRotate, active, view }: SceneProps) {
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const position = view.preset === "top" ? [0, 6.6, 0.01] : view.preset === "front" ? [0, 0.5, 6.8] : [4.3, 3.1, 5.2];
    camera.position.set(position[0], position[1], position[2]);
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
    invalidate();
  }, [camera, invalidate, view]);

  return <OrbitControls ref={controls} makeDefault enablePan={false} autoRotate={autoRotate && active} autoRotateSpeed={0.65} minDistance={3.8} maxDistance={10} minPolarAngle={0.04} maxPolarAngle={Math.PI * 0.85} />;
}

export default function Ym080Scene(props: SceneProps) {
  return <Canvas
    camera={{ position: [4.3, 3.1, 5.2], fov: 36 }}
    dpr={[1, 1.5]}
    frameloop={props.active && props.autoRotate ? "always" : "demand"}
    gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
    fallback={<p className="model-webgl-fallback">이 환경에서는 3D 뷰어를 사용할 수 없습니다. 위의 제품 사진을 확인해 주세요.</p>}
  >
    {props.modelUrl && <color attach="background" args={["#202938"]} />}
    <ambientLight intensity={props.modelUrl ? 0.35 : 0.75} />
    <directionalLight position={[4, 7, 5]} intensity={props.modelUrl ? 1.8 : 2.5} />
    <directionalLight position={[-3, 2, -4]} intensity={props.modelUrl ? 0.9 : 1.5} color="#dce7ff" />
    {/* 외부 HDR 파일 없이 로컬 조명만으로 금속 표면의 스튜디오 반사를 만듭니다. */}
    <Environment resolution={128} frames={1}>
      <Lightformer position={[-4, 2, 2]} rotation={[0, Math.PI / 3, 0]} scale={[3, 6, 1]} intensity={3} />
      <Lightformer position={[4, 3, 1]} rotation={[0, -Math.PI / 3, 0]} scale={[2, 6, 1]} intensity={2.5} />
      <Lightformer position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[5, 5, 1]} intensity={3} />
    </Environment>
    {props.modelUrl ? <Suspense fallback={<Html center><span className="cad-model-loading">3D 모델을 불러오고 있습니다.</span></Html>}><CadModel url={props.modelUrl} /></Suspense> : <><Ym080Model /><ContactShadows position={[0, -1.26, 0]} opacity={0.22} scale={8} blur={2.5} far={3} resolution={256} frames={1} /><Grid position={[0, -1.27, 0]} args={[12, 12]} cellSize={0.5} sectionSize={2.5} cellColor="#dce1e8" sectionColor="#c9d1dc" fadeDistance={10} fadeStrength={2} infiniteGrid /></>}
    <CameraControls {...props} />
  </Canvas>;
}
