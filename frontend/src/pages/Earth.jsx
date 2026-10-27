import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF } from "@react-three/drei";

const CanvasLoader = () => {
  return (
    <mesh scale={2.7}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshBasicMaterial color="#6366f1" wireframe transparent opacity={0.3} />
    </mesh>
  );
};

const Earth = () => {
  const earth = useGLTF("/planet/scene.gltf");

  return (
    <primitive object={earth.scene} scale={2.9} position-y={0} rotation-y={0} />
  );
};

useGLTF.preload("/planet/scene.gltf");

const EarthCanvas = () => {
  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{
          fov: 42,
          near: 0.1,
          far: 200,
          position: [-3.4, 2.1, 5.0],
        }}
        className="w-full h-full"
      >
        <Suspense fallback={<CanvasLoader />}>
          <ambientLight intensity={1.3} />
          <directionalLight position={[5, 3, 5]} intensity={1.6} />
          <OrbitControls
            autoRotate
            autoRotateSpeed={1.4}
            enableZoom={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
          />
          <Earth />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default EarthCanvas;
