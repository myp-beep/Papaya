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

// --- Bölge işaretleri (yerde renkli halkalar) ---
interface RegionMarkerProps {
  x: number
  z: number
  color: string
  active?: boolean
}

export function RegionMarker({ x, z, color, active }: RegionMarkerProps) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) {
      ref.current.material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.25 + Math.sin(s.clock.elapsedTime * 0.5) * 0.1,
        side: THREE.DoubleSide,
      })
    }
  })
  return (
    <group position={[x, 0, z]}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.4, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {active && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 2.2, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.12} />
        </mesh>
      )}
    </group>
  )
}

// --- Gölet (balık tutma alanı) ---
export function Pond() {
  return (
    <group position={[-11, -0.05, -6]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.8, 32]} />
        <meshStandardMaterial
          color="#1a7a9a"
          transparent
          opacity={0.7}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.8, 32]} />
        <meshBasicMaterial color="#6bb8d4" transparent opacity={0.4} />
      </mesh>
      <mesh position={[1.2, 1.2, 0.8]}>
        <cylinderGeometry args={[0.06, 0.12, 1.2, 8]} />
        <meshStandardMaterial color="#5c3d1a" />
      </mesh>
      <mesh position={[1.2, 1.8, 0.8]}>
        <planeGeometry args={[0.3, 0.15]} />
        <meshBasicMaterial color="#c4903a" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// --- Uçan kelebek (mob) ---
interface ButterflyProps {
  x: number
  z: number
  color?: string
  radius?: number
}
export function Butterfly({ x, z, color = '#facc15', radius = 1.5 }: ButterflyProps) {
  const ref = useRef<THREE.Group>(null)
  const lw = useRef<THREE.Group>(null)
  const rw = useRef<THREE.Group>(null)
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame((s) => {
    const t = s.clock.elapsedTime * 0.4 + phase
    if (ref.current) {
      ref.current.position.x = x + Math.cos(t) * radius
      ref.current.position.z = z + Math.sin(t * 1.3) * radius
      ref.current.position.y = 0.6 + Math.sin(t * 2) * 0.5
      ref.current.rotation.y = t
    }
    const flap = Math.sin(s.clock.elapsedTime * 12 + phase) * 0.6
    if (lw.current) lw.current.rotation.x = flap
    if (rw.current) rw.current.rotation.x = -flap
  })

  return (
    <group ref={ref} position={[x, 1, z]}>
      <group ref={lw}>
        <mesh position={[-0.25, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.25, 0.12]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group ref={rw}>
        <mesh position={[0.25, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.25, 0.12]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

// --- Zıplayan tavşan (mob) ---
interface RabbitProps {
  x: number
  z: number
}
export function Rabbit({ x, z }: RabbitProps) {
  const ref = useRef<THREE.Group>(null)
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame((s) => {
    if (!ref.current) return
    const t = s.clock.elapsedTime + phase
    const hop = Math.abs(Math.sin(t * 3)) * 0.15
    ref.current.position.x = x + Math.cos(phase + t * 0.2) * 2
    ref.current.position.z = z + Math.sin(phase + t * 0.25) * 2
    ref.current.position.y = hop
    ref.current.rotation.y = t * 0.3 + phase
  })

  return (
    <group ref={ref} position={[x, 0, z]}>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#d4c5a0" />
      </mesh>
      <mesh position={[0, 0.05, 0.3]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#f0e6d3" />
      </mesh>
      <mesh position={[-0.15, 0.08, -0.15]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#e8dcc8" />
      </mesh>
      <mesh position={[0.15, 0.08, -0.15]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#e8dcc8" />
      </mesh>
    </group>
  )
}

// --- Tüm mob'lar (kelebek + tavşan) ---
const BUTTERFLIES = [
  { x: -4, z: -3, color: '#facc15' },
  { x: 6, z: 2, color: '#f472b6' },
  { x: -2, z: 7, color: '#60a5fa' },
  { x: 3, z: -7, color: '#fbbf24' },
]
const RABBITS = [
  { x: -6, z: -2 },
  { x: 5, z: -5 },
  { x: -3, z: 5 },
]

export function Mobs() {
  return (
    <group>
      {BUTTERFLIES.map((b, i) => (
        <Butterfly key={'bf' + i} x={b.x} z={b.z} color={b.color} />
      ))}
      {RABBITS.map((r, i) => (
        <Rabbit key={'rb' + i} x={r.x} z={r.z} />
      ))}
    </group>
  )
}

// --- Bölge verisi (CoopQuestPage'de kullanılır) ---
export const REGIONS = [
  { id: 'meadow', name: 'Çiçekli Çayır', emoji: '🌼', color: '#facc15', center: { x: 0, z: 0 }, radius: 9 },
  { id: 'dark-forest', name: 'Karanlık Orman', emoji: '🌲', color: '#166534', center: { x: 12, z: 8 }, radius: 6 },
  { id: 'crystal-lake', name: 'Kristal Göl', emoji: '💎', color: '#0ea5e9', center: { x: -11, z: -6 }, radius: 5 },
  { id: 'ancient-ruins', name: 'Antik Harabeler', emoji: '🏛️', color: '#8b5cf6', center: { x: -8, z: 10 }, radius: 5 },
]
