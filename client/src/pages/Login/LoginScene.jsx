import React, { useRef, useMemo, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Torus, Box, Sphere, Stars } from '@react-three/drei';

class CanvasErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('[3D Canvas Error Handled]', err);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/* ─── Floating Ring ──────────────────────────────────────────── */
const LuxuryRing = ({ position, scale = 1 }) => {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.rotation.x = Math.sin(t * 0.3) * 0.4;
    ref.current.rotation.y = t * 0.2;
    ref.current.position.y = position[1] + Math.sin(t * 0.5) * 0.15;
  });
  return (
    <Torus ref={ref} args={[0.45, 0.12, 16, 64]} position={position} scale={scale}>
      <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.05} />
    </Torus>
  );
};

/* ─── Floating Pearl / Sphere ────────────────────────────────── */
const LuxuryPearl = ({ position, color = '#F5F5DC', scale = 1 }) => {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.rotation.y = t * 0.4;
    ref.current.position.y = position[1] + Math.sin(t * 0.6 + 1) * 0.12;
  });
  return (
    <Sphere ref={ref} args={[0.3, 32, 32]} position={position} scale={scale}>
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.1} />
    </Sphere>
  );
};

/* ─── Luxury Gift Box ────────────────────────────────────────── */
const LuxuryBox = ({ position, scale = 1 }) => {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.rotation.x = Math.sin(t * 0.25) * 0.3;
    ref.current.rotation.y = t * 0.15;
    ref.current.position.y = position[1] + Math.sin(t * 0.4 + 2) * 0.1;
  });
  return (
    <Box ref={ref} args={[0.55, 0.55, 0.55]} position={position} scale={scale}>
      <meshStandardMaterial color="#C8A951" metalness={0.7} roughness={0.2} />
    </Box>
  );
};

/* ─── Bangle Ring ────────────────────────────────────────────── */
const LuxuryBangle = ({ position, scale = 1 }) => {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.rotation.z = t * 0.3;
    ref.current.position.y = position[1] + Math.sin(t * 0.45 + 3) * 0.13;
  });
  return (
    <Torus ref={ref} args={[0.35, 0.08, 12, 48]} position={position} scale={scale}>
      <meshStandardMaterial color="#E8C97A" metalness={0.9} roughness={0.08} />
    </Torus>
  );
};

/* ─── Gold Dust Particles ────────────────────────────────────── */
const GoldParticles = () => {
  const count = 200;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, []);

  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#D4AF37" size={0.025} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
};

/* ─── Camera Mouse Parallax ──────────────────────────────────── */
const CameraController = ({ mouse }) => {
  useFrame((state) => {
    const m = mouse?.current || { x: 0, y: 0 };
    state.camera.position.x += (m.x * 0.8 - state.camera.position.x) * 0.04;
    state.camera.position.y += (m.y * 0.5 - state.camera.position.y) * 0.04;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
};

/* ─── Main Login Scene ───────────────────────────────────────── */
const LoginScene = ({ mouse }) => {
  return (
    <CanvasErrorBoundary>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-3, 3, 2]} intensity={1.2} color="#D4AF37" />
        <pointLight position={[3, -2, 1]} intensity={0.6} color="#C8A951" />
        <spotLight position={[0, 8, 4]} angle={0.4} penumbra={0.8} intensity={1.5} color="#FFF8DC" />

        <Stars radius={80} depth={40} count={600} factor={3} fade speed={0.3} />
        <GoldParticles />
        <CameraController mouse={mouse} />

        <LuxuryRing position={[-2.2, 1.2, -1]} scale={1.1} />
        <LuxuryRing position={[1.8, -1.5, -2]} scale={0.75} />
        <LuxuryPearl position={[2.5, 1.5, 0]} color="#FFFAF0" scale={1} />
        <LuxuryPearl position={[-1.5, -1.8, -1]} color="#F0E6D3" scale={0.7} />
        <LuxuryBox position={[-2.8, -0.5, -1.5]} scale={0.9} />
        <LuxuryBox position={[2.2, 0.8, -2.5]} scale={0.65} />
        <LuxuryBangle position={[0.5, 2.2, -1]} scale={1} />
        <LuxuryBangle position={[-3.2, 1.8, -2]} scale={0.8} />
        <LuxuryPearl position={[3.5, -0.5, -3]} color="#D4AF37" scale={0.5} />
      </Canvas>
    </CanvasErrorBoundary>
  );
};

export default LoginScene;
