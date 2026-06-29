import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useChat } from '../data/chatStore'
import { useProfile } from '../data/profileStore'
import { haptic } from '../lib/haptics'
import Confetti from '../components/Confetti'

const BOUND = 11
const SPEED = 6.5
const NEED = 5

interface Vec { x: number; z: number }
interface NpcDef { id: string; name: string; emoji: string; color: string; x: number; z: number }

const NPCS: NpcDef[] = [
  { id: 'elder', name: 'Bilge Pofu', emoji: '🧙', color: '#8b5cf6', x: 0, z: -8 },
  { id: 'guardian', name: 'Bekçi Karpuz', emoji: '🛡️', color: '#22b8cf', x: 8, z: 6 },
]
const PAPAYAS: Vec[] = [
  { x: -7, z: -5 }, { x: 7, z: -6 }, { x: -8, z: 5 }, { x: 4, z: 2 }, { x: -2, z: 8 },
]
const ORB: Vec = { x: -8, z: -1 }
const PORTAL: Vec = { x: 0, z: 9 }

// --- Hikâye diyalogları ---
function dialogueFor(npcId: string, stage: number, collected: number): { lines: string[]; action?: number } {
  if (npcId === 'elder') {
    if (stage === 0)
      return {
        lines: [
          'Hoş geldin yolcu... Papaya Krallığı büyük tehlikede. 🍈',
          'Karanlık, krallığın 5 sihirli papayasını çaldı ve diyara saçtı!',
          'Onları toplaman gerek. Bir arkadaşınla birlikte çok daha hızlı olursunuz.',
          'Haydi! Papayaları bul, sonra Bekçi Karpuz’a git.',
        ],
        action: 1,
      }
    return { lines: ['Cesaretin krallığa umut oldu yolcu. Görevine devam et!'] }
  }
  if (npcId === 'guardian') {
    if (stage < 1) return { lines: ['Önce Bilge Pofu ile konuşmalısın.'] }
    if (collected < NEED) return { lines: [`Henüz ${collected}/${NEED} papaya topladın. Hepsini getir, sonra konuşalım.`] }
    if (stage < 2)
      return {
        lines: [
          'Muhteşem! 5 sihirli papayayı da topladın. 🎉',
          'Şimdi krallığın kapısını açma vakti.',
          'Şu parlayan Işık Taşı’na dokunun — portal belirecek!',
        ],
        action: 2,
      }
    return { lines: ['Portal açıldı! Birlikte içinden geçin ve krallığı kurtarın!'] }
  }
  return { lines: ['...'] }
}

function objectiveText(stage: number, collected: number): string {
  switch (stage) {
    case 0: return '🧙 Bilge Pofu ile konuş'
    case 1: return `🍈 Sihirli papayaları topla: ${collected}/${NEED}`
    case 2: return '✨ Işık Taşı’na dokun'
    case 3: return '🌀 Portala ulaş'
    default: return '🏆 Krallık kurtarıldı!'
  }
}

const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.z - b.z)

// --- Sahne parçaları ---
function World() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[BOUND * 2, BOUND * 2]} />
        <meshStandardMaterial color="#161226" />
      </mesh>
      <gridHelper args={[BOUND * 2, BOUND * 2, '#3a3357', '#241f33']} position={[0, 0.01, 0]} />
      {[[0, -BOUND], [0, BOUND], [-BOUND, 0], [BOUND, 0]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.6, z]}>
          <boxGeometry args={i < 2 ? [BOUND * 2, 1.2, 0.4] : [0.4, 1.2, BOUND * 2]} />
          <meshStandardMaterial color="#2a2540" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function NpcMesh({ npc }: { npc: NpcDef }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (ref.current) ref.current.position.y = Math.sin(s.clock.elapsedTime * 1.5) * 0.08
  })
  return (
    <group position={[npc.x, 0, npc.z]}>
      <group ref={ref}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <capsuleGeometry args={[0.45, 0.7, 8, 16]} />
          <meshStandardMaterial color={npc.color} emissive={npc.color} emissiveIntensity={0.3} />
        </mesh>
        <Html position={[0, 2.1, 0]} center distanceFactor={12} pointerEvents="none">
          <div className="whitespace-nowrap rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
            {npc.emoji} {npc.name}
          </div>
        </Html>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.1, 1.3, 32]} />
        <meshBasicMaterial color={npc.color} transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

function Pickup({ p }: { p: Vec }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) {
      ref.current.position.y = 0.7 + Math.sin(s.clock.elapsedTime * 3 + p.x) * 0.2
      ref.current.rotation.y += 0.04
    }
  })
  return (
    <mesh ref={ref} position={[p.x, 0.7, p.z]}>
      <icosahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#86e06b" emissive="#3da33a" emissiveIntensity={0.6} />
    </mesh>
  )
}

function Orb() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y += 0.02
      const sc = 1 + Math.sin(s.clock.elapsedTime * 2) * 0.1
      ref.current.scale.setScalar(sc)
    }
  })
  return (
    <mesh ref={ref} position={[ORB.x, 1, ORB.z]}>
      <octahedronGeometry args={[0.7, 0]} />
      <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={1} />
    </mesh>
  )
}

function Portal() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z += 0.03 + Math.sin(s.clock.elapsedTime) * 0.005
  })
  return (
    <group position={[PORTAL.x, 1.6, PORTAL.z]}>
      <mesh ref={ref}>
        <torusGeometry args={[1.3, 0.28, 16, 48]} />
        <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={1.1} />
      </mesh>
      <mesh>
        <circleGeometry args={[1.1, 32]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function RemotePlayer({ r }: { r: { x: number; z: number; color: string } }) {
  const ref = useRef<THREE.Group>(null)
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
        <meshStandardMaterial color={r.color} emissive={r.color} emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

interface LocalProps {
  color: string
  dirRef: React.MutableRefObject<Vec>
  stageRef: React.MutableRefObject<number>
  collectedRef: React.MutableRefObject<Set<number>>
  onCollect: (i: number) => void
  onOrb: () => void
  onPortal: () => void
  onNpc: (id: string | null) => void
  sendPos: (x: number, z: number) => void
}

function LocalPlayer({ color, dirRef, stageRef, collectedRef, onCollect, onOrb, onPortal, onNpc, sendPos }: LocalProps) {
  const ref = useRef<THREE.Mesh>(null)
  const pos = useRef(new THREE.Vector3(0, 0.5, -4))
  const { camera } = useThree()
  const lastSent = useRef(0)
  const nearNpc = useRef<string | null>(null)

  useFrame((_, delta) => {
    const d = dirRef.current
    const moving = d.x || d.z
    const len = Math.hypot(d.x, d.z) || 1
    if (moving) {
      pos.current.x = THREE.MathUtils.clamp(pos.current.x + (d.x / len) * SPEED * delta, -BOUND + 0.6, BOUND - 0.6)
      pos.current.z = THREE.MathUtils.clamp(pos.current.z + (d.z / len) * SPEED * delta, -BOUND + 0.6, BOUND - 0.6)
    }
    if (ref.current) ref.current.position.copy(pos.current)

    camera.position.lerp(new THREE.Vector3(pos.current.x, 8, pos.current.z + 10), 0.08)
    camera.lookAt(pos.current.x, 0.5, pos.current.z)

    const me: Vec = { x: pos.current.x, z: pos.current.z }
    const stage = stageRef.current

    // papaya topla (stage 1)
    if (stage === 1) {
      PAPAYAS.forEach((p, i) => {
        if (!collectedRef.current.has(i) && dist(me, p) < 1.4) onCollect(i)
      })
    }
    // ışık taşı (stage 2)
    if (stage === 2 && dist(me, ORB) < 1.9) onOrb()
    // portal (stage 3)
    if (stage === 3 && dist(me, PORTAL) < 2) onPortal()

    // en yakın NPC (etkileşim için)
    let near: string | null = null
    for (const n of NPCS) if (dist(me, n) < 2.4) near = n.id
    if (near !== nearNpc.current) {
      nearNpc.current = near
      onNpc(near)
    }

    const now = performance.now()
    if (now - lastSent.current > 80) {
      lastSent.current = now
      sendPos(pos.current.x, pos.current.z)
    }
  })

  return (
    <mesh ref={ref} position={[0, 0.5, -4]} castShadow>
      <sphereGeometry args={[0.5, 24, 24]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
    </mesh>
  )
}

export default function CoopQuestPage() {
  const navigate = useNavigate()
  const { sendEvent, onEvent, myId } = useChat()
  const { profile } = useProfile()

  const [stage, setStage] = useState(0)
  const [collectedIds, setCollectedIds] = useState<number[]>([])
  const [remotes, setRemotes] = useState<{ id: string; x: number; z: number; color: string }[]>([])
  const [dialogue, setDialogue] = useState<{ npcId: string; line: number; lines: string[]; action?: number } | null>(null)
  const [nearNpc, setNearNpc] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const stageRef = useRef(0)
  stageRef.current = stage
  const collectedRef = useRef<Set<number>>(new Set())
  const remotesRef = useRef<Map<string, { id: string; x: number; z: number; color: string; last: number }>>(new Map())
  const dirRef = useRef<Vec>({ x: 0, z: 0 })
  const me = useMemo(() => ({ color: profile.color, name: profile.name }), [profile])

  const collected = collectedIds.length
  const victory = stage >= 4

  const broadcastQuest = (s: number, ids: number[]) => sendEvent('quest', { stage: s, collected: ids })

  const advance = (n: number) => {
    if (n > stageRef.current) {
      stageRef.current = n
      setStage(n)
      broadcastQuest(n, [...collectedRef.current])
    }
  }

  // Klavye
  useEffect(() => {
    const keys = new Set<string>()
    const apply = () => {
      let x = 0, z = 0
      if (keys.has('arrowleft') || keys.has('a')) x -= 1
      if (keys.has('arrowright') || keys.has('d')) x += 1
      if (keys.has('arrowup') || keys.has('w')) z -= 1
      if (keys.has('arrowdown') || keys.has('s')) z += 1
      dirRef.current = { x, z }
    }
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k.startsWith('arrow')) e.preventDefault()
      if (k === 'e' || k === 'enter') { tryTalk(); return }
      keys.add(k); apply()
    }
    const up = (e: KeyboardEvent) => { keys.delete(e.key.toLowerCase()); apply() }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Realtime: konumlar + görev durumu
  useEffect(() => {
    const offPos = onEvent('arena:pos', (p) => {
      const id = String(p.from)
      if (id === myId) return
      remotesRef.current.set(id, { id, x: Number(p.x) || 0, z: Number(p.z) || 0, color: String(p.color ?? '#888'), last: Date.now() })
    })
    const offQuest = onEvent('quest', (p) => {
      const incomingStage = Number(p.stage) || 0
      const incoming = (p.collected as number[]) || []
      let changed = false
      incoming.forEach((i) => { if (!collectedRef.current.has(i)) { collectedRef.current.add(i); changed = true } })
      if (changed) setCollectedIds([...collectedRef.current])
      setStage((s) => (incomingStage > s ? incomingStage : s))
    })
    const iv = window.setInterval(() => {
      const now = Date.now()
      for (const [id, r] of remotesRef.current) if (now - r.last > 4000) remotesRef.current.delete(id)
      setRemotes([...remotesRef.current.values()].map(({ id, x, z, color }) => ({ id, x, z, color })))
    }, 200)
    return () => { offPos(); offQuest(); window.clearInterval(iv) }
  }, [onEvent, myId])

  const sendPos = (x: number, z: number) =>
    sendEvent('arena:pos', { x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100, name: me.name, color: me.color })

  const onCollect = (i: number) => {
    if (collectedRef.current.has(i)) return
    collectedRef.current.add(i)
    const ids = [...collectedRef.current]
    setCollectedIds(ids)
    haptic('light')
    setToast(`Sihirli papaya! ${ids.length}/${NEED} 🍈`)
    window.setTimeout(() => setToast(null), 1400)
    broadcastQuest(stageRef.current, ids)
  }
  const onOrb = () => { if (stageRef.current === 2) { haptic('success'); setToast('Portal açıldı! 🌀'); window.setTimeout(() => setToast(null), 1600); advance(3) } }
  const onPortal = () => { if (stageRef.current === 3) { haptic('success'); advance(4) } }

  // Diyalog
  const tryTalk = () => {
    const npcId = nearNpcRef.current
    if (!npcId) return
    const d = dialogueFor(npcId, stageRef.current, collectedRef.current.size)
    setDialogue({ npcId, line: 0, lines: d.lines, action: d.action })
    haptic('select')
  }
  const nearNpcRef = useRef<string | null>(null)
  const handleNpc = (id: string | null) => { nearNpcRef.current = id; setNearNpc(id) }

  const advanceDialogue = () => {
    if (!dialogue) return
    if (dialogue.line < dialogue.lines.length - 1) {
      setDialogue({ ...dialogue, line: dialogue.line + 1 })
    } else {
      if (dialogue.action != null) advance(dialogue.action)
      setDialogue(null)
    }
  }

  const restart = () => {
    collectedRef.current = new Set()
    setCollectedIds([])
    setStage(0)
    setDialogue(null)
    broadcastQuest(0, [])
  }

  // Joystick
  const padRef = useRef<HTMLDivElement>(null)
  const onPad = (e: React.PointerEvent) => {
    const pad = padRef.current
    if (!pad) return
    const r = pad.getBoundingClientRect()
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    const len = Math.hypot(dx, dy)
    if (len > 1) { dx /= len; dy /= len }
    dirRef.current = { x: dx, z: dy }
  }
  const endPad = () => { dirRef.current = { x: 0, z: 0 } }

  const npc = dialogue ? NPCS.find((n) => n.id === dialogue.npcId) : null

  return (
    <div className="relative flex h-full flex-col bg-ink-900">
      <Confetti show={victory} />

      {/* HUD */}
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center gap-2 px-3 pt-4">
        <button onClick={() => navigate('/games')} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-xl text-white/80 backdrop-blur" aria-label="Geri">‹</button>
        <div className="glass max-w-[70%] rounded-full px-4 py-1.5 text-sm font-semibold text-white">{objectiveText(stage, collected)}</div>
        <div className="glass ml-auto rounded-full px-3 py-1.5 text-xs text-white/70">{remotes.length > 0 ? `${remotes.length} eş · canlı` : 'Co-op'}</div>
      </header>

      {toast && (
        <div className="absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-full bg-papaya-500/90 px-4 py-2 text-sm font-bold text-white shadow-glow animate-pop-in">
          {toast}
        </div>
      )}

      <Canvas shadows camera={{ position: [0, 8, 10], fov: 55 }} className="flex-1">
        <color attach="background" args={['#0a0810']} />
        <fog attach="fog" args={['#0a0810', 14, 34]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 12, 6]} intensity={1.1} castShadow />
        <pointLight position={[0, 6, 0]} intensity={0.5} color="#f95816" />
        <World />
        {NPCS.map((n) => <NpcMesh key={n.id} npc={n} />)}
        {stage === 1 && PAPAYAS.map((p, i) => (!collectedIds.includes(i) ? <Pickup key={i} p={p} /> : null))}
        {stage === 2 && <Orb />}
        {stage >= 3 && <Portal />}
        <LocalPlayer
          color={me.color} dirRef={dirRef} stageRef={stageRef} collectedRef={collectedRef}
          onCollect={onCollect} onOrb={onOrb} onPortal={onPortal} onNpc={handleNpc} sendPos={sendPos}
        />
        {remotes.map((r) => <RemotePlayer key={r.id} r={r} />)}
      </Canvas>

      {/* Konuş butonu */}
      {nearNpc && !dialogue && !victory && (
        <button
          onClick={tryTalk}
          className="btn-primary absolute bottom-32 left-1/2 z-20 -translate-x-1/2 px-6 py-2.5 animate-pop-in"
        >
          💬 Konuş (E)
        </button>
      )}

      {/* Joystick */}
      <div
        ref={padRef}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); onPad(e) }}
        onPointerMove={(e) => e.buttons && onPad(e)}
        onPointerUp={endPad}
        onPointerCancel={endPad}
        className="absolute bottom-8 left-8 z-10 h-28 w-28 touch-none rounded-full border border-white/15 bg-white/[0.06] backdrop-blur"
      >
        <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-papaya-500/70" />
      </div>

      {/* Diyalog paneli */}
      {dialogue && npc && (
        <div className="absolute inset-x-0 bottom-0 z-30 p-4 animate-slide-up">
          <div className="glass rounded-3xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">{npc.emoji}</span>
              <span className="font-bold text-white">{npc.name}</span>
            </div>
            <p className="min-h-[3rem] text-[15px] leading-relaxed text-white/85">{dialogue.lines[dialogue.line]}</p>
            <div className="mt-3 flex justify-end">
              <button onClick={advanceDialogue} className="btn-primary px-6 py-2">
                {dialogue.line < dialogue.lines.length - 1 ? 'Devam ▸' : 'Tamam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zafer ekranı */}
      {victory && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink-900/80 backdrop-blur-sm animate-pop-in">
          <div className="mx-8 flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-br from-papaya-500/20 to-grape-500/20 p-8 text-center">
            <div className="text-6xl">🏆</div>
            <h2 className="mt-3 text-2xl font-extrabold text-white">Krallık kurtarıldı!</h2>
            <p className="mt-2 text-sm text-white/70">Sihirli papayaları toplayıp portalı açtınız. Papaya Krallığı yeniden aydınlandı. 🍈✨</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => navigate('/games')} className="btn-ghost px-5 py-2.5">Oyunlar</button>
              <button onClick={restart} className="btn-primary px-6 py-2.5">Tekrar oyna</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
