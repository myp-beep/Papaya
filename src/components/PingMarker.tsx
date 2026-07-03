import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PingMarkerProps {
  x: number
  z: number
}

export default function PingMarker({ x, z }: PingMarkerProps) {
  const ref = useRef<THREE.Mesh>(null)
  const start = useRef(Date.now())

  useFrame(() => {
    if (!ref.current) return
    const elapsed = (Date.now() - start.current) / 1000
    if (elapsed > 2.5) {
      ref.current.visible = false
      return
    }
    ref.current.visible = true
    ref.current.position.y = 0.3 + elapsed * 2.5
    const scale = 1 + elapsed * 2
    ref.current.scale.setScalar(scale)
    const opacity = Math.max(0, 1 - elapsed / 3)
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = opacity
  })

  return (
    <mesh ref={ref} position={[x, 0.3, z]}>
      <ringGeometry args={[0.15, 0.4, 24]} />
      <meshBasicMaterial color="#facc15" transparent opacity={1} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}
