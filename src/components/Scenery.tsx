import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { tex } from '../lib/textures'

/** Dikey gradient gökyüzü kubbesi (dış yüz). */
export function SkyDome() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          top: { value: new THREE.Color('#3b1f5e') },
          mid: { value: new THREE.Color('#1a1030') },
          bottom: { value: new THREE.Color('#0a0810') },
        },
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
          void main(){
            float h = normalize(vP).y;
            vec3 col = h > 0.0 ? mix(mid, top, h) : mix(mid, bottom, -h);
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  )
  return (
    <mesh material={mat}>
      <sphereGeometry args={[60, 32, 16]} />
    </mesh>
  )
}

function Tree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  const top = useRef<THREE.Group>(null)
  const bark = useLoader(THREE.TextureLoader, tex('bark_diff.jpg'))
  useMemo(() => {
    bark.colorSpace = THREE.SRGBColorSpace
    bark.wrapS = bark.wrapT = THREE.RepeatWrapping
    bark.repeat.set(1, 2)
  }, [bark])
  useFrame((st) => {
    if (top.current) top.current.rotation.z = Math.sin(st.clock.elapsedTime * 0.8 + x) * 0.04
  })
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.32, 1.8, 12]} />
        <meshStandardMaterial map={bark} roughness={0.95} />
      </mesh>
      <group ref={top} position={[0, 1.9, 0]}>
        <mesh castShadow>
          <icosahedronGeometry args={[1.05, 0]} />
          <meshStandardMaterial color="#3da33a" emissive="#1c5a1c" emissiveIntensity={0.25} flatShading />
        </mesh>
        <mesh position={[0.4, 0.6, 0.2]} castShadow>
          <icosahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color="#4cb84c" flatShading />
        </mesh>
        {/* asılı papayalar */}
        <mesh position={[0.6, -0.2, 0.5]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshStandardMaterial color="#f9a23c" emissive="#f95816" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[-0.5, 0.1, 0.4]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshStandardMaterial color="#f9a23c" emissive="#f95816" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  )
}

function Rock({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  const rock = useLoader(THREE.TextureLoader, tex('rock_diff.jpg'))
  useMemo(() => {
    rock.colorSpace = THREE.SRGBColorSpace
  }, [rock])
  return (
    <mesh position={[x, 0.3 * s, z]} scale={s} rotation={[0.3, x, 0.2]} castShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial map={rock} roughness={1} flatShading />
    </mesh>
  )
}

function Bush({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.25, z]}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#2f8f3f" flatShading />
      </mesh>
      <mesh position={[0.35, 0.05, 0.1]} castShadow>
        <icosahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#37a64a" flatShading />
      </mesh>
    </group>
  )
}

/** Uçuşan ateşböcekleri (parçacıklar). */
export function Fireflies({ count = 60, area = 22 }: { count?: number; area?: number }) {
  const ref = useRef<THREE.Points>(null)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * area
      pos[i * 3 + 1] = 1 + Math.random() * 5
      pos[i * 3 + 2] = (Math.random() - 0.5) * area
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [count, area])
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 0.03
      ref.current.position.y = Math.sin(s.clock.elapsedTime * 0.6) * 0.4
    }
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#fcd34d" size={0.18} sizeAttenuation transparent opacity={0.85} />
    </points>
  )
}

function Bird({ phase, radius, height, speed }: { phase: number; radius: number; height: number; speed: number }) {
  const ref = useRef<THREE.Group>(null)
  const lw = useRef<THREE.Group>(null)
  const rw = useRef<THREE.Group>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime * speed + phase
    if (ref.current) {
      ref.current.position.set(Math.cos(t) * radius, height + Math.sin(t * 2) * 0.5, Math.sin(t) * radius)
      ref.current.rotation.y = -t
    }
    const flap = Math.sin(s.clock.elapsedTime * 9 + phase) * 0.7
    if (lw.current) lw.current.rotation.z = flap
    if (rw.current) rw.current.rotation.z = -flap
  })
  return (
    <group ref={ref}>
      <group ref={lw}>
        <mesh position={[-0.3, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.6, 0.16]} />
          <meshStandardMaterial color="#1c1c22" side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group ref={rw}>
        <mesh position={[0.3, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.6, 0.16]} />
          <meshStandardMaterial color="#1c1c22" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

/** Gökyüzünde dönen kuş sürüsü. */
export function Birds({ count = 7 }: { count?: number }) {
  const birds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        phase: (i / count) * Math.PI * 2 + Math.random(),
        radius: 7 + Math.random() * 7,
        height: 9 + Math.random() * 6,
        speed: 0.12 + Math.random() * 0.1,
      })),
    [count],
  )
  return (
    <group>
      {birds.map((b, i) => (
        <Bird key={i} {...b} />
      ))}
    </group>
  )
}

/** Binlerce instanced çimen yaprağı (tek draw call) + hafif rüzgâr. */
export function InstancedGrass({ count = 1400, radius = 13 }: { count?: number; radius?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const group = useRef<THREE.Group>(null)
  useEffect(() => {
    if (!ref.current) return
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(Math.random()) * radius
      const a = Math.random() * Math.PI * 2
      dummy.position.set(Math.cos(a) * r, 0.22, Math.sin(a) * r)
      dummy.rotation.y = Math.random() * Math.PI
      dummy.rotation.z = (Math.random() - 0.5) * 0.3
      const h = 0.6 + Math.random() * 0.9
      dummy.scale.set(1, h, 1)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [count, radius])
  // birlikte salınan hafif rüzgâr
  useFrame((s) => {
    if (group.current) group.current.rotation.z = Math.sin(s.clock.elapsedTime * 1.2) * 0.025
  })
  return (
    <group ref={group}>
      <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow>
        <coneGeometry args={[0.05, 0.5, 3]} />
        <meshStandardMaterial color="#5a8f3c" roughness={0.9} />
      </instancedMesh>
    </group>
  )
}

const TREES: [number, number, number][] = [
  [-9.5, -9, 1.1], [9.5, -9, 1], [-10, 3, 1.2], [10, 3, 0.95],
  [-6, 9.6, 1], [6, 9.6, 1.1], [-9.6, -4, 0.9], [9.6, 8, 1.05],
]
const ROCKS: [number, number, number][] = [
  [-3, -6, 1], [4.5, -3, 1.3], [-5, 4, 0.9], [3, 7, 1.1], [7, -1, 0.8],
]
const BUSHES: [number, number][] = [
  [-7.5, -7.5], [7.5, -4.5], [-4.5, 6.5], [5, 1.5], [-2, -9.5], [8.5, 2.5],
]

/** Dekoratif çevre: ağaçlar, kayalar, çalılar. */
export function Scenery() {
  return (
    <group>
      {TREES.map(([x, z, s], i) => (
        <Tree key={'t' + i} x={x} z={z} s={s} />
      ))}
      {ROCKS.map(([x, z, s], i) => (
        <Rock key={'r' + i} x={x} z={z} s={s} />
      ))}
      {BUSHES.map(([x, z], i) => (
        <Bush key={'b' + i} x={x} z={z} />
      ))}
    </group>
  )
}
