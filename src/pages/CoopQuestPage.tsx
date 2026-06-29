import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Html, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useChat } from '../data/chatStore'
import { useProfile } from '../data/profileStore'
import { haptic } from '../lib/haptics'
import Confetti from '../components/Confetti'
import { Scenery, Fireflies, InstancedGrass } from '../components/Scenery'
import Effects from '../components/Effects'
import { Avatar3D, type AnimState } from '../components/Character'
import { tex } from '../lib/textures'

const BOUND = 11
const SPEED = 6.5
const NEED = 5

interface Vec { x: number; z: number }
interface NpcDef { id: string; name: string; emoji: string; color: string; x: number; z: number }

const NPCS: NpcDef[] = [
  { id: 'elder', name: 'Bilge Pofu', emoji: '🧙', color: '#8b5cf6', x: 0, z: -8 },
  { id: 'guardian', name: 'Bekçi Karpuz', emoji: '🛡️', color: '#22b8cf', x: 8, z: 6 },
]
const SHADOW: NpcDef = { id: 'shadow', name: 'Gölge Het', emoji: '🌑', color: '#6d28d9', x: 0, z: 7 }
const PAPAYAS: Vec[] = [
  { x: -7, z: -5 }, { x: 7, z: -6 }, { x: -8, z: 5 }, { x: 4, z: 2 }, { x: -2, z: 8 },
]
const ORB: Vec = { x: -8, z: -1 }
const PORTAL: Vec = { x: 0, z: 9 }

// --- Bölümler (hikâye perdeleri) ---
interface Chapter { n: number; title: string; text: string }
const CHAPTERS: Record<number, Chapter> = {
  1: { n: 1, title: 'Solan Krallık', text: 'Papaya Krallığı’nın kalbindeki Büyük Papaya’nın ışığı sönmeye başladı. Karanlık çökerken, son umut bir yolcuya kaldı...' },
  2: { n: 2, title: 'Işık Taşı', text: 'Beş sihirli papayanın ışığı toplandı. Şimdi kadim Işık Taşı uyanacak ve gölgeler diyarına açılan kapı belirecek.' },
  3: { n: 3, title: 'Gölgeler Diyarı', text: 'Portalın ötesinde, krallığı karanlığa boğan gücün gerçek yüzü bekliyor. Ama her gölgenin ardında bir hikâye vardır.' },
  4: { n: 4, title: 'Şafak', text: 'Gerçek anlaşıldı, kırgınlık iyileşti. Papaya Krallığı yeniden ışıkla doğuyor.' },
}
export function chapterOf(stage: number): number {
  if (stage <= 1) return 1
  if (stage <= 3) return 2
  if (stage <= 5) return 3
  return 4
}

// --- Hikâye diyalogları ---
function dialogueFor(npcId: string, stage: number, collected: number): { lines: string[]; action?: number } {
  if (npcId === 'elder') {
    if (stage === 0)
      return {
        lines: [
          'Sonunda geldin yolcu... Seni rüyalarımda gördüm. 🌙',
          'Ben Bilge Pofu, bu krallığın son hafızasıyım.',
          'Bir zamanlar göğümüzde Büyük Papaya parlardı; ışığı herkesi ısıtırdı.',
          'Ama bir gece o ışık söndü. Karanlık, koruyucu beş sihirli papayayı söküp diyara savurdu.',
          'O ışıklar olmadan krallık yavaşça soluyor... ve ben de onunla.',
          'Beş papayayı topla. Sonra Doğu’nun Bekçisi Karpuz’a git — gerisini o anlatacak.',
          'Yalnız değilsin: bir dostunla birlikte daha güçlüsünüz. Haydi, umut sende.',
        ],
        action: 1,
      }
    if (stage === 1) return { lines: ['Papayaların ışığı seni çağırıyor... onları topla, yolcu.'] }
    return { lines: ['Sen geldin geleli kalbimde unuttuğum bir his var: umut.'] }
  }

  if (npcId === 'guardian') {
    if (stage < 1) return { lines: ['Önce Bilge Pofu ile konuş; bu yol oradan başlar.'] }
    if (stage === 1 && collected < NEED)
      return { lines: [`Dur bakalım yolcu. Henüz ${collected}/${NEED} papaya topladın.`, 'Hepsinin ışığı olmadan Taş uyanmaz. Geri kalanları bul.'] }
    if (stage === 1)
      return {
        lines: [
          'Demek beş ışığı da topladın... Cesursun, bunu kabul ediyorum.',
          'Sana bir sır vereyim: Karanlık dışarıdan gelmedi. İçimizden biriydi.',
          'Yıllar önce iki kardeş koruyordu bu krallığı: Pofu ve... Het.',
          'Şu kadim Işık Taşı’na beş papayayı götür. Dokun ona — kapı açılacak.',
          'Ötesinde seni bekleyenle yüzleşmeye hazır ol. Yüreğini de yanına al.',
        ],
        action: 2,
      }
    return { lines: ['Işık seninle yolcu. Korkma; gölgenin ardına bak.'] }
  }

  if (npcId === 'shadow') {
    if (stage === 4)
      return {
        lines: [
          '...Demek geldin. Beş ışığı da taşıyorsun. 🌑',
          'Ben Het. Bir zamanlar bu krallığı kardeşim Pofu ile korurdum.',
          'Büyük Papaya sönmeye başladığında herkes paniğe kapıldı. Ben de...',
          'Onu kimse söndürmesin diye sakladım. Beş ışığı ben sakladım — korumak için!',
          'Ama korumak sandığım şey, krallığı karanlığa boğdu. Kendi korkum gölgem oldu.',
          'Şimdi geri mi almaya geldin? Yoksa beni de mi yargılayacaksın?',
        ],
        action: 5,
      }
    if (stage === 5)
      return {
        lines: [
          'Taşıdığın ışık... çok sıcak. Onu yargı için değil, paylaşmak için getirdin.',
          'Kardeşim Pofu hâlâ beni bekliyor, öyle mi? Onca yıldan sonra...',
          'Belki de korkuyu bırakmanın vakti geldi. Ellerini uzat, yolcu.',
          'Bu ışığı birlikte göğe geri verelim — krallık yeniden doğsun. 🌅',
        ],
        action: 6,
      }
    return { lines: ['...'] }
  }
  return { lines: ['...'] }
}

function objectiveText(stage: number, collected: number): string {
  switch (stage) {
    case 0: return '🧙 Bilge Pofu ile konuş'
    case 1: return collected >= NEED ? '🛡️ Bekçi Karpuz’a dön' : `🍈 Sihirli papayaları topla: ${collected}/${NEED}`
    case 2: return '✨ Işık Taşı’na dokun'
    case 3: return '🌀 Portala gir'
    case 4: return '🌑 Gölge Het ile yüzleş'
    case 5: return '💜 Gölge Het’e umudu göster'
    default: return '🌅 Şafak — krallık kurtarıldı!'
  }
}

const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.z - b.z)

// --- Gerçek dokulu çimen zemin ---
function Ground() {
  const [diff, nor, rough] = useLoader(THREE.TextureLoader, [tex('grass_diff.jpg'), tex('grass_nor.jpg'), tex('grass_rough.jpg')])
  useMemo(() => {
    diff.colorSpace = THREE.SRGBColorSpace
    ;[diff, nor, rough].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(8, 8)
      t.anisotropy = 8
    })
  }, [diff, nor, rough])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[BOUND + 5, 64]} />
      <meshStandardMaterial map={diff} normalMap={nor} roughnessMap={rough} roughness={1} envMapIntensity={0.6} />
    </mesh>
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
  const animRef = useRef<AnimState>('Idle')
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const nx = g.position.x + (r.x - g.position.x) * 0.2
    const nz = g.position.z + (r.z - g.position.z) * 0.2
    const dx = nx - g.position.x
    const dz = nz - g.position.z
    g.position.x = nx
    g.position.z = nz
    if (Math.hypot(dx, dz) > 0.004) {
      g.rotation.y = Math.atan2(dx, dz)
      animRef.current = 'Walking'
    } else {
      animRef.current = 'Idle'
    }
  })
  return (
    <group ref={ref} position={[r.x, 0, r.z]}>
      <Suspense fallback={<mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color={r.color} /></mesh>}>
        <Avatar3D stateRef={animRef} />
      </Suspense>
    </group>
  )
}

interface LocalProps {
  color: string
  dirRef: React.MutableRefObject<Vec>
  stageRef: React.MutableRefObject<number>
  collectedRef: React.MutableRefObject<Set<number>>
  npcsRef: React.MutableRefObject<NpcDef[]>
  onCollect: (i: number) => void
  onOrb: () => void
  onPortal: () => void
  onNpc: (id: string | null) => void
  sendPos: (x: number, z: number) => void
}

function LocalPlayer({ color, dirRef, stageRef, collectedRef, npcsRef, onCollect, onOrb, onPortal, onNpc, sendPos }: LocalProps) {
  const ref = useRef<THREE.Group>(null)
  const pos = useRef(new THREE.Vector3(0, 0, -4))
  const { camera } = useThree()
  const lastSent = useRef(0)
  const nearNpc = useRef<string | null>(null)
  const animRef = useRef<AnimState>('Idle')

  useFrame((_, delta) => {
    const d = dirRef.current
    const moving = !!(d.x || d.z)
    const len = Math.hypot(d.x, d.z) || 1
    if (moving) {
      pos.current.x = THREE.MathUtils.clamp(pos.current.x + (d.x / len) * SPEED * delta, -BOUND + 0.6, BOUND - 0.6)
      pos.current.z = THREE.MathUtils.clamp(pos.current.z + (d.z / len) * SPEED * delta, -BOUND + 0.6, BOUND - 0.6)
    }
    const g = ref.current
    if (g) {
      g.position.copy(pos.current)
      if (moving) {
        // yöne dön (en kısa yoldan)
        const target = Math.atan2(d.x, d.z)
        let diff = target - g.rotation.y
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        g.rotation.y += diff * Math.min(1, delta * 10)
      }
    }
    animRef.current = moving ? (len > 0.85 ? 'Running' : 'Walking') : 'Idle'

    camera.position.lerp(new THREE.Vector3(pos.current.x, 8, pos.current.z + 10), 0.08)
    camera.lookAt(pos.current.x, 1, pos.current.z)

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
    for (const n of npcsRef.current) if (dist(me, n) < 2.4) near = n.id
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
    <group ref={ref} position={[0, 0, -4]}>
      <Suspense fallback={<mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color={color} /></mesh>}>
        <Avatar3D stateRef={animRef} />
      </Suspense>
    </group>
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
  const [card, setCard] = useState<Chapter | null>(CHAPTERS[1])
  const shownChapters = useRef<Set<number>>(new Set([1]))

  const stageRef = useRef(0)
  stageRef.current = stage
  const collectedRef = useRef<Set<number>>(new Set())
  const remotesRef = useRef<Map<string, { id: string; x: number; z: number; color: string; last: number }>>(new Map())
  const dirRef = useRef<Vec>({ x: 0, z: 0 })
  const me = useMemo(() => ({ color: profile.color, name: profile.name }), [profile])

  // Aktif NPC listesi (Gölge Het yalnızca gölgeler diyarında)
  const activeNpcs = useMemo(() => (stage >= 4 ? [...NPCS, SHADOW] : NPCS), [stage])
  const npcsRef = useRef<NpcDef[]>(activeNpcs)
  npcsRef.current = activeNpcs

  const collected = collectedIds.length
  const victory = stage >= 6
  const shadowRealm = stage >= 4

  // Yeni bölüme geçince kart göster
  useEffect(() => {
    const ch = chapterOf(stage)
    if (!shownChapters.current.has(ch)) {
      shownChapters.current.add(ch)
      setCard(CHAPTERS[ch])
    }
  }, [stage])

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
    stageRef.current = 0
    setStage(0)
    setDialogue(null)
    shownChapters.current = new Set([1])
    setCard(CHAPTERS[1])
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

  const npc = dialogue ? [...NPCS, SHADOW].find((n) => n.id === dialogue.npcId) : null

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
        <ambientLight intensity={shadowRealm ? 0.2 : 0.35} />
        <directionalLight position={[8, 14, 6]} intensity={shadowRealm ? 0.8 : 1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} />
        <pointLight position={[0, 5, 0]} intensity={shadowRealm ? 1.1 : 0.5} color={shadowRealm ? '#7c3aed' : '#f95816'} distance={30} />
        {shadowRealm && <fog attach="fog" args={['#120a22', 14, 40]} />}
        {shadowRealm && <Fireflies />}
        <Suspense fallback={null}>
          <Environment files={tex('sky.hdr')} background backgroundBlurriness={shadowRealm ? 0.55 : 0.04} environmentIntensity={shadowRealm ? 0.5 : 1} />
          <Ground />
          <InstancedGrass />
          <Scenery />
        </Suspense>
        {activeNpcs.map((n) => <NpcMesh key={n.id} npc={n} />)}
        {stage === 1 && PAPAYAS.map((p, i) => (!collectedIds.includes(i) ? <Pickup key={i} p={p} /> : null))}
        {stage === 2 && <Orb />}
        {stage >= 3 && stage < 5 && <Portal />}
        <LocalPlayer
          color={me.color} dirRef={dirRef} stageRef={stageRef} collectedRef={collectedRef} npcsRef={npcsRef}
          onCollect={onCollect} onOrb={onOrb} onPortal={onPortal} onNpc={handleNpc} sendPos={sendPos}
        />
        {remotes.map((r) => <RemotePlayer key={r.id} r={r} />)}
        <Effects />
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

      {/* Bölüm kartı */}
      {card && !victory && (
        <button
          onClick={() => setCard(null)}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink-900/90 px-8 text-center backdrop-blur-md animate-pop-in"
        >
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-papaya-400">Bölüm {card.n}</span>
          <h2 className="text-gradient mt-2 text-4xl font-extrabold">{card.title}</h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">{card.text}</p>
          <span className="mt-8 text-xs text-white/40">dokun ▸</span>
        </button>
      )}

      {/* Zafer / final */}
      {victory && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink-900/85 backdrop-blur-sm animate-pop-in">
          <div className="mx-8 flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-br from-papaya-500/20 to-grape-500/20 p-8 text-center">
            <div className="text-6xl">🌅</div>
            <h2 className="mt-3 text-2xl font-extrabold text-white">Şafak Söktü</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Het’in kalbindeki kırgınlık iyileşti. İki kardeş, Pofu ve Het, Büyük Papaya’nın ışığını birlikte göğe geri verdi.
              Papaya Krallığı yeniden doğdu — ve bu sefer hiçbir gölge yalnız kalmayacak. 🍈✨
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => navigate('/games')} className="btn-ghost px-5 py-2.5">Oyunlar</button>
              <button onClick={restart} className="btn-primary px-6 py-2.5">Yeniden başla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
