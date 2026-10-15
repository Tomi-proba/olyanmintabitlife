import { useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEditorStore } from '../state/editorStore';
import { buildFrameModel, disposeFrameModel } from '../three/buildFrameModel';

function FrameMeshes() {
  const outline = useEditorStore((s) => s.outline);
  const frame = useEditorStore((s) => s.frame);
  const temple = useEditorStore((s) => s.temple);

  const model = useMemo(() => {
    if (!outline) return null;
    return buildFrameModel(outline, frame, temple);
  }, [outline, frame, temple]);

  useEffect(() => {
    return () => {
      if (model) disposeFrameModel(model);
    };
  }, [model]);

  if (!model) return null;

  const rimMaterial = <meshStandardMaterial color="#2b2b30" roughness={0.4} metalness={0.1} />;
  const lensMaterial = <meshPhysicalMaterial color="#bcd9f2" roughness={0.05} clearcoat={0.6} transparent opacity={0.45} side={2} />;
  const templeMaterial = <meshStandardMaterial color="#2b2b30" roughness={0.45} metalness={0.1} />;

  return (
    <group>
      <mesh geometry={model.rimRight}>{rimMaterial}</mesh>
      <mesh geometry={model.rimLeft}>{rimMaterial}</mesh>
      <mesh geometry={model.lensRight}>{lensMaterial}</mesh>
      <mesh geometry={model.lensLeft}>{lensMaterial}</mesh>
      <mesh geometry={model.templeRight}>{templeMaterial}</mesh>
      <mesh geometry={model.templeLeft}>{templeMaterial}</mesh>
    </group>
  );
}

export function Preview3D() {
  const outline = useEditorStore((s) => s.outline);

  return (
    <div className="preview-3d">
      {!outline && (
        <div className="preview-3d-placeholder">
          <p>Draw a lens shape and switch to editing to see the live 3D model here.</p>
        </div>
      )}
      <Canvas camera={{ position: [0, 0, 180], fov: 35, near: 1, far: 2000 }}>
        {/* Plain local lighting only — no remote HDR environment map, so this works fully offline. */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[80, 120, 150]} intensity={1.1} />
        <directionalLight position={[-80, -40, 100]} intensity={0.35} />
        <pointLight position={[0, 0, 220]} intensity={0.4} />
        <FrameMeshes />
        <OrbitControls enablePan={false} minDistance={60} maxDistance={400} />
      </Canvas>
    </div>
  );
}
