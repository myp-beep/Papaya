import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { sfx } from '../lib/sound'
import type { EnemyDef, Vec2 } from '../types'

interface EnemyProps {
  def: EnemyDef
  playerPos: Vec2
  onDefeated: (id: string) => void
  onDamagePlayer: (dmg: number) => void
  invincible: boolean
}

export interface EnemyHandle {
  hit: () => void
  getPos: () => Vec2
}

const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.z - b.z)

const Enemy = forwardRef<EnemyHandle, EnemyProps>(({ def, playerPos, onDefeated, onDamagePlayer, invincible }, ref) => {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const [hp, setHp] = useState(def.hp)
  const [state, setState] = useState<'patrol' | 'chase'>('patrol')
  const [dead, setDead] = useState(false)
  const patrolIndex = useRef(0)
  const lastDamageTime = useRef(0)
  const [flash, setFlash] = useState(false)

  useImperativeHandle(ref, () => ({
    hit: () => {
      if (dead) return
      setHp((h) => {
        const next = h - 1
        if (next <= 0) {
          sfx.kill()
          setDead(true)
          onDefeated(def.id)
          return 0
        }
        sfx.hit()
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

    const me: Vec2 = { x: g.position.x, z: g.position.z }
    const d = dist(me, playerPos)

    if (d < def.aggroRange) {
      setState('chase')
    } else if (state === 'chase' && d > def.aggroRange * 1.8) {
      setState('patrol')
    }

    if (state === 'chase') {
      const dx = playerPos.x - me.x
      const dz = playerPos.z - me.z
      const len = Math.hypot(dx, dz)
      if (len > 0.5) {
        g.position.x += (dx / len) * def.speed * delta
        g.position.z += (dz / len) * def.speed * delta
      }
      g.rotation.y = Math.atan2(dx, dz)

      if (d < 1.2 && !invincible && s.clock.elapsedTime - lastDamageTime.current > 1.2) {
        lastDamageTime.current = s.clock.elapsedTime
        onDamagePlayer(def.damage)
      }
    } else if (state === 'patrol' && def.patrolPath.length > 1) {
      const target = def.patrolPath[patrolIndex.current]
      const dx = target.x - me.x
      const dz = target.z - me.z
      const len = Math.hypot(dx, dz)
      if (len > 0.3) {
        g.position.x += (dx / len) * def.speed * 0.4 * delta
        g.position.z += (dz / len) * def.speed * 0.4 * delta
        g.rotation.y = Math.atan2(dx, dz)
      } else {
        patrolIndex.current = (patrolIndex.current + 1) % def.patrolPath.length
      }
    }

    if (bodyRef.current) {
      const pulse = 1 + Math.sin(s.clock.elapsedTime * 3) * 0.06
      bodyRef.current.scale.setScalar(pulse)
    }
  })

  if (dead) return null

  const color = flash ? '#ffffff' : def.color

  return (
    <group ref={groupRef} position={[def.patrolPath[0]?.x ?? 0, 0, def.patrolPath[0]?.z ?? 0]}>
      <group position={[0, 0.8, 0]}>
        <mesh ref={bodyRef} castShadow>
          <sphereGeometry args={[0.6, 12, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={flash ? 1 : 0.3} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 0.6, 0.5]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color="#ff4444" />
        </mesh>
        <mesh position={[0, 0.6, -0.5]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color="#ff4444" />
        </mesh>
      </group>
      <Html position={[0, 1.8, 0]} center distanceFactor={12} pointerEvents="none">
        <div className="whitespace-nowrap rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-red-300 backdrop-blur">
          {def.emoji} {def.name}
        </div>
      </Html>
      {hp < def.hp && (
        <Html position={[0, 1.4, 0]} center distanceFactor={12} pointerEvents="none">
          <div className="flex gap-0.5">
            {Array.from({ length: def.hp }, (_, i) => (
              <div key={i} className={`h-1 w-2 rounded-full ${i < hp ? 'bg-red-400' : 'bg-white/20'}`} />
            ))}
          </div>
        </Html>
      )}
    </group>
  )
})

export default Enemy
