import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useChat } from '../data/chatStore'
import { useProfile } from '../data/profileStore'
import { haptic } from '../lib/haptics'

const BOUND = 9 // arena yarı genişliği
const SPEED = 6
const PICKUP_R = 1.3
const PAPAYA_COUNT = 6

interface Remote {
  id: string
  name: string
  color: string
  x: number
  z: number
  last: number
}
interface Papaya {
  id: number
  x: number
  z: number
}

const randPos = () => (Math.random() * 2 - 1) * (BOUND - 1)
const makePapayas = (): Papaya[] => Array.from({ length: PAPAYA_COUNT }, (_, id) => ({ id, x: randPos(), z: randPos() }))

// --- Zemin + ızgara ---
function Arena() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[BOUND * 2, BOUND * 2]} />
        <meshStandardMaterial color="#15121f" />
      </mesh>
      <gridHelper args={[BOUND * 2, BOUND * 2, '#3a3357', '#241f33']} position={[0, 0.01, 0]} />
      {/* duvarlar */}
      {[
        [0, -BOUND], [0, BOUND], [-BOUND, 0], [BOUND, 0],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.5, z]}>
          <boxGeometry args={i < 2 ? [BOUND * 2, 1, 0.3] : [0.3, 1, BOUND * 2]} />
          <meshStandardMaterial color="#2a2540" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function PapayaPickup({ p }: { p: Papaya }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) {
      ref.current.position.y = 0.6 + Math.sin(s.clock.elapsedTime * 3 + p.id) * 0.15
      ref.current.rotation.y += 0.03
    }
  })
  return (
    <mesh ref={ref} position={[p.x, 0.6, p.z]}>
      <icosahedronGeometry args={[0.45, 0]} />
      <meshStandardMaterial color="#86e06b" emissive="#3da33a" emissiveIntensity={0.4} />
    </mesh>
  )
}

function RemotePlayer({ r }: { r: Remote }) {
  const ref = useRef<THREE.Group>(null)
  // hedefe yumuşak geçiş
  useFrame(() => {
    if (ref.current) {
      ref.current.position.x += (r.x - ref.current.position.x) * 0.2
      ref.current.position.z += (r.z - ref.current.position.z) * 0.2
    }
  })
  return (
    <group ref={ref} position={[r.x, 0.5, r.z]}>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshStandardMaterial color={r.color} emissive={r.color} emissiveIntensity={0.25} />
      </mesh>
    </group>
  )
}

interface LocalProps {
  color: string
  name: string
  myId: string
  dirRef: React.MutableRefObject<{ x: number; z: number }>
  papayasRef: React.MutableRefObject<Papaya[]>
  onCollect: (id: number) => void
  sendPos: (x: number, z: number) => void
}

function LocalPlayer({ color, dirRef, papayasRef, onCollect, sendPos }: LocalProps) {
  const ref = useRef<THREE.Mesh>(null)
  const pos = useRef(new THREE.Vector3(0, 0.5, 0))
  const { camera } = useThree()
  const lastSent = useRef(0)

  useFrame((_, delta) => {
    const d = dirRef.current
    const len = Math.hypot(d.x, d.z) || 1
    pos.current.x = THREE.MathUtils.clamp(pos.current.x + (d.x / len) * SPEED * delta * (d.x || d.z ? 1 : 0), -BOUND + 0.5, BOUND - 0.5)
    pos.current.z = THREE.MathUtils.clamp(pos.current.z + (d.z / len) * SPEED * delta * (d.x || d.z ? 1 : 0), -BOUND + 0.5, BOUND - 0.5)
    if (ref.current) ref.current.position.copy(pos.current)

    // kamera takip
    const target = new THREE.Vector3(pos.current.x, 7, pos.current.z + 9)
    camera.position.lerp(target, 0.08)
    camera.lookAt(pos.current.x, 0.5, pos.current.z)

    // papaya toplama
    for (const p of papayasRef.current) {
      if (Math.hypot(p.x - pos.current.x, p.z - pos.current.z) < PICKUP_R) {
        onCollect(p.id)
        break
      }
    }

    // konum yayını (throttle ~80ms)
    const now = performance.now()
    if (now - lastSent.current > 80) {
      lastSent.current = now
      sendPos(pos.current.x, pos.current.z)
    }
  })

  return (
    <mesh ref={ref} position={[0, 0.5, 0]} castShadow>
      <sphereGeometry args={[0.5, 24, 24]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
    </mesh>
  )
}

export default function ArenaPage() {
  const navigate = useNavigate()
  const { sendEvent, onEvent, myId } = useChat()
  const { profile } = useProfile()

  const [score, setScore] = useState(0)
  const [papayas, setPapayas] = useState<Papaya[]>(makePapayas)
  const papayasRef = useRef<Papaya[]>(papayas)
  papayasRef.current = papayas
  const [remotes, setRemotes] = useState<Remote[]>([])
  const remotesRef = useRef<Map<string, Remote>>(new Map())
  const dirRef = useRef({ x: 0, z: 0 })

  const me = useMemo(() => ({ color: profile.color, name: profile.name }), [profile])

  // Klavye
  useEffect(() => {
    const keys = new Set<string>()
    const apply = () => {
      let x = 0
      let z = 0
      if (keys.has('arrowleft') || keys.has('a')) x -= 1
      if (keys.has('arrowright') || keys.has('d')) x += 1
      if (keys.has('arrowup') || keys.has('w')) z -= 1
      if (keys.has('arrowdown') || keys.has('s')) z += 1
      dirRef.current = { x, z }
    }
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(k)) e.preventDefault()
      keys.add(k)
      apply()
    }
    const up = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase())
      apply()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  // Realtime: diğer oyuncuların konumları
  useEffect(() => {
    const off = onEvent('arena:pos', (p) => {
      const id = String(p.from)
      if (id === myId) return
      remotesRef.current.set(id, {
        id,
        name: String(p.name ?? '?'),
        color: String(p.color ?? '#888'),
        x: Number(p.x) || 0,
        z: Number(p.z) || 0,
        last: Date.now(),
      })
    })
    const iv = window.setInterval(() => {
      const now = Date.now()
      let changed = false
      for (const [id, r] of remotesRef.current) {
        if (now - r.last > 4000) {
          remotesRef.current.delete(id)
          changed = true
        }
      }
      setRemotes((prev) => {
        const next = [...remotesRef.current.values()]
        if (changed || next.length !== prev.length || next.some((r, i) => prev[i]?.id !== r.id)) return next
        // konum güncellemeleri için her zaman yenile (yumuşak hareket RemotePlayer'da)
        return next
      })
    }, 200)
    return () => {
      off()
      window.clearInterval(iv)
    }
  }, [onEvent, myId])

  const sendPos = (x: number, z: number) =>
    sendEvent('arena:pos', { x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100, name: me.name, color: me.color })

  const onCollect = (id: number) => {
    setScore((s) => s + 1)
    haptic('light')
    setPapayas((prev) => prev.map((p) => (p.id === id ? { ...p, x: randPos(), z: randPos() } : p)))
  }

  // Joystick (mobil)
  const padRef = useRef<HTMLDivElement>(null)
  const onPad = (e: React.PointerEvent) => {
    const pad = padRef.current
    if (!pad) return
    const rect = pad.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let dx = (e.clientX - cx) / (rect.width / 2)
    let dy = (e.clientY - cy) / (rect.height / 2)
    const len = Math.hypot(dx, dy)
    if (len > 1) {
      dx /= len
      dy /= len
    }
    dirRef.current = { x: dx, z: dy }
  }
  const endPad = () => {
    dirRef.current = { x: 0, z: 0 }
  }

  return (
    <div className="relative flex h-full flex-col bg-ink-900">
      {/* HUD */}
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center gap-3 px-3 pt-4">
        <button
          onClick={() => navigate('/games')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-xl text-white/80 backdrop-blur transition hover:bg-black/60"
          aria-label="Geri"
        >
          ‹
        </button>
        <div className="glass rounded-full px-4 py-1.5 text-sm font-bold text-white">🍈 {score}</div>
        <div className="glass ml-auto rounded-full px-3 py-1.5 text-xs text-white/70">
          {remotes.length > 0 ? `${remotes.length} rakip · canlı` : 'Tek başına · arkadaşını çağır'}
        </div>
      </header>

      <Canvas shadows camera={{ position: [0, 7, 9], fov: 55 }} className="flex-1">
        <color attach="background" args={['#0a0810']} />
        <fog attach="fog" args={['#0a0810', 12, 28]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1.1} castShadow />
        <pointLight position={[0, 6, 0]} intensity={0.6} color="#f95816" />
        <Arena />
        <LocalPlayer color={me.color} name={me.name} myId={myId} dirRef={dirRef} papayasRef={papayasRef} onCollect={onCollect} sendPos={sendPos} />
        {remotes.map((r) => (
          <RemotePlayer key={r.id} r={r} />
        ))}
        {papayas.map((p) => (
          <PapayaPickup key={p.id} p={p} />
        ))}
      </Canvas>

      {/* Joystick */}
      <div
        ref={padRef}
        onPointerDown={(e) => {
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          onPad(e)
        }}
        onPointerMove={(e) => e.buttons && onPad(e)}
        onPointerUp={endPad}
        onPointerCancel={endPad}
        className="absolute bottom-8 left-8 z-10 h-28 w-28 touch-none rounded-full border border-white/15 bg-white/[0.06] backdrop-blur"
      >
        <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-papaya-500/70" />
      </div>

      <div className="absolute bottom-8 right-6 z-10 max-w-[40%] text-right text-xs text-white/40">
        Hareket: joystick veya WASD/ok tuşları. Papayaları topla 🍈
      </div>
    </div>
  )
}
