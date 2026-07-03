import { useEffect, useRef } from 'react'
import { REGIONS } from './Scenery'

const MAP_SIZE = 100
const BOUND = 14
const SCALE = MAP_SIZE / (BOUND * 2)

interface MinimapProps {
  playerX: number
  playerZ: number
  remotes: { id: string; x: number; z: number; color: string; name: string }[]
  pickupPositions: { x: number; z: number }[]
  enemyPositions: { x: number; z: number }[]
  discoveredRegions: string[]
  pingPosition?: { x: number; z: number } | null
}

function toMap(v: number): number {
  return MAP_SIZE / 2 + v * SCALE
}

export default function Minimap({
  playerX, playerZ, remotes, pickupPositions, enemyPositions, discoveredRegions, pingPosition,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE)

    // Arka plan
    ctx.fillStyle = 'rgba(7, 6, 13, 0.7)'
    ctx.beginPath()
    ctx.arc(MAP_SIZE / 2, MAP_SIZE / 2, MAP_SIZE / 2 - 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Bölgeler
    REGIONS.forEach((r) => {
      const cx = toMap(r.center.x)
      const cy = toMap(r.center.z)
      const rad = r.radius * SCALE
      const active = discoveredRegions.includes(r.id)
      ctx.beginPath()
      ctx.arc(cx, cy, rad, 0, Math.PI * 2)
      ctx.fillStyle = active ? r.color + '40' : r.color + '15'
      ctx.fill()
      ctx.strokeStyle = active ? r.color + '80' : r.color + '30'
      ctx.lineWidth = active ? 1.5 : 0.5
      ctx.stroke()
      if (active) {
        ctx.fillStyle = r.color
        ctx.font = '6px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(r.emoji, cx, cy + 2)
      }
    })

    // Toplanabilir papayalar
    pickupPositions.forEach((p) => {
      const x = toMap(p.x)
      const z = toMap(p.z)
      ctx.fillStyle = '#86e06b'
      ctx.shadowColor = '#86e06b'
      ctx.shadowBlur = 4
      ctx.beginPath()
      ctx.arc(x, z, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Düşmanlar
    enemyPositions.forEach((p) => {
      const x = toMap(p.x)
      const z = toMap(p.z)
      ctx.fillStyle = '#ef4444'
      ctx.shadowColor = '#ef4444'
      ctx.shadowBlur = 3
      ctx.beginPath()
      ctx.arc(x, z, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Ping
    if (pingPosition) {
      const x = toMap(pingPosition.x)
      const z = toMap(pingPosition.z)
      ctx.strokeStyle = '#facc15'
      ctx.lineWidth = 2
      ctx.shadowColor = '#facc15'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(x, z, 5 + Math.sin(Date.now() / 200) * 1.5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Uzaktaki oyuncular
    remotes.forEach((r) => {
      const x = toMap(r.x)
      const z = toMap(r.z)
      ctx.fillStyle = r.color
      ctx.shadowColor = r.color
      ctx.shadowBlur = 4
      ctx.beginPath()
      ctx.arc(x, z, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 5px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(r.name.slice(0, 2), x, z - 5)
    })

    // Oyuncu (en üstte)
    const px = toMap(playerX)
    const pz = toMap(playerZ)
    ctx.fillStyle = '#fff'
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 6
    ctx.beginPath()
    // Ok şekli
    ctx.moveTo(px, pz - 5)
    ctx.lineTo(px - 3.5, pz + 3)
    ctx.lineTo(px, pz)
    ctx.lineTo(px + 3.5, pz + 3)
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0

    // Pusula (kuzey göstergesi)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.font = '7px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('N', MAP_SIZE / 2, 8)
  })

  return (
    <canvas
      ref={canvasRef}
      width={MAP_SIZE}
      height={MAP_SIZE}
      className="pointer-events-none"
      style={{ width: MAP_SIZE, height: MAP_SIZE, borderRadius: '50%' }}
    />
  )
}
