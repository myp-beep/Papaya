import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { sfx } from '../lib/sound'
import { haptic } from '../lib/haptics'
import type { Vec2 } from '../types'

interface BossEnemyProps {
  playerPos: Vec2
  onDefeated: () => void
  onPhaseChange: (phase: number) => void
  invincible: boolean
}

export interface BossHandle {
  hit: () => void
  getPos: () => Vec2
}

const BOSS_HP = 12
const PHASE_THRESHOLD = 0.4

const BossEnemy = forwardRef<BossHandle, BossEnemyProps>(({ playerPos, onDefeated, onPhaseChange }, ref) => {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const orbRef = useRef<THREE.Mesh>(null)
  const [hp, setHp] = useState(BOSS_HP)
  const [phase, setPhase] = useState(1)
  const [dead, setDead] = useState(false)
  const [flash, setFlash] = useState(false)
  const shootTimer = useRef(0)
  const [shadowBolts, setShadowBolts] = useState<{ x: number; z: number; id: number }[]>([])
  const boltIdRef = useRef(0)

  useImperativeHandle(ref, () => ({
    hit: () => {
      if (dead) return
      setHp((h) => {
        const next = h - 1
        if (next <= Math.floor(BOSS_HP * PHASE_THRESHOLD) && phase === 1) {
          setPhase(2)
          onPhaseChange(2)
        }
        if (next <= 0) {
          sfx.kill()
          setDead(true)
          onDefeated()
          return 0
        }
        sfx.hit()
        haptic('heavy')
        setFlash(true)
        setTimeout(() => setFlash(false), 200)
        return next
      })
    },
    getPos: () => groupRef.current ? { x: groupRef.current.position.x, z: groupRef.current.position.z } : { x: 0, z: 0 },
  }))

  useFrame((s, delta) => {
    if (dead) return
    const g = groupRef.current
    if (!g) return

    // float animation
    g.position.y = Math.sin(s.clock.elapsedTime * 1.5) * 0.3

    if (orbRef.current) {
      orbRef.current.rotation.y += delta * 2
      orbRef.current.rotation.x += delta * 0.5
    }

    if (bodyRef.current) {
      const pulse = 1 + Math.sin(s.clock.elapsedTime * 2.5) * (phase === 2 ? 0.1 : 0.05)
      bodyRef.current.scale.setScalar(pulse)
    }

    // Phase 2: shadow bolt attacks
    if (phase === 2) {
      shootTimer.current += delta
      if (shootTimer.current > 1.8) {
        shootTimer.current = 0
        const id = ++boltIdRef.current
        const offsetX = (Math.random() - 0.5) * 6
        const offsetZ = (Math.random() - 0.5) * 6
        setShadowBolts((prev) => [...prev, { x: playerPos.x + offsetX, z: playerPos.z + offsetZ, id }].slice(-6))
        setTimeout(() => {
          setShadowBolts((prev) => prev.filter((b) => b.id !== id))
        }, 1800)
      }
    }

    // Rotate to face player
    const dx = playerPos.x - g.position.x
    const dz = playerPos.z - g.position.z
    g.rotation.y = Math.atan2(dx, dz)
  })

  if (dead) return null

  const hpPct = (hp / BOSS_HP) * 100
  const color = flash ? '#ffffff' : phase === 2 ? '#7c3aed' : '#4c1d95'

  return (
    <>
      <group ref={groupRef} position={[0, 0, 7]}>
        {/* Shadow aura */}
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.6, 32]} />
          <meshBasicMaterial color="#6d28d9" transparent opacity={0.2 + Math.sin(Date.now() / 300) * 0.1} side={THREE.DoubleSide} />
        </mesh>

        {/* Main body */}
        <group position={[0, 1.2, 0]}>
          <mesh ref={bodyRef} castShadow>
            <dodecahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={phase === 2 ? 0.6 : 0.3} transparent opacity={0.85} />
          </mesh>
          {/* Orbiting shadow orbs */}
          <mesh ref={orbRef} position={[0.8, 0.3, 0]}>
            <icosahedronGeometry args={[0.25, 0]} />
            <meshBasicMaterial color="#a78bfa" />
          </mesh>
          <mesh position={[-0.8, -0.2, 0.4]}>
            <icosahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial color="#7c3aed" />
          </mesh>
          {/* Eyes */}
          <mesh position={[0.3, 0.5, 0.85]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color={phase === 2 ? '#ef4444' : '#ff8844'} />
          </mesh>
          <mesh position={[-0.3, 0.5, 0.85]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color={phase === 2 ? '#ef4444' : '#ff8844'} />
          </mesh>
        </group>

        {/* Name tag */}
        <Html position={[0, 2.8, 0]} center distanceFactor={10} pointerEvents="none">
          <div className="flex flex-col items-center gap-1">
            <div className="whitespace-nowrap rounded-full bg-black/70 px-3 py-0.5 text-xs font-bold text-purple-300 backdrop-blur">
              🌑 Gölge Het · Faz {phase}
            </div>
            <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-black/50">
              <div className="h-full rounded-full transition-all" style={{ width: `${hpPct}%`, background: hpPct > 50 ? '#a78bfa' : '#ef4444' }} />
            </div>
          </div>
        </Html>
      </group>

      {/* Shadow bolt indicators */}
      {shadowBolts.map((b) => (
        <group key={b.id} position={[b.x, 0.05, b.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.7, 16]} />
            <meshBasicMaterial color="#7c3aed" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </>
  )
})

export default BossEnemy
