import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

const MODEL = `${import.meta.env.BASE_URL}models/RobotExpressive.glb`

export type AnimState = 'Idle' | 'Walking' | 'Running' | 'Wave' | 'Dance' | 'Jump'

/**
 * Animasyonlu 3D karakter. `stateRef` ile dışarıdan animasyon durumu sürülür
 * (her örnek bağımsız iskelet klonu + kendi mixer'ı).
 */
export function Avatar3D({
  stateRef,
  emoteRef,
  scale = 0.22,
  tint,
}: {
  stateRef: React.MutableRefObject<AnimState>
  /** Tek seferlik emote (Jump/Wave/Dance); bitince temizlenir. */
  emoteRef?: React.MutableRefObject<AnimState | null>
  scale?: number
  tint?: string
}) {
  const { scene, animations } = useGLTF(MODEL)
  const cloned = useMemo(() => cloneSkeleton(scene), [scene])
  const ref = useRef<THREE.Group>(null)
  const { actions } = useAnimations(animations, ref)
  const current = useRef<string>('')

  useEffect(() => {
    cloned.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
        if (tint) {
          // materyali klonla ve renklendir (diğer örnekleri etkilemeden)
          const recolor = (m: THREE.Material) => {
            const c = m.clone() as THREE.MeshStandardMaterial
            if (c.color) c.color.set(tint)
            if (c.emissive) {
              c.emissive.set(tint)
              c.emissiveIntensity = 0.15
            }
            return c
          }
          mesh.material = Array.isArray(mesh.material)
            ? mesh.material.map(recolor)
            : recolor(mesh.material)
        }
      }
    })
  }, [cloned, tint])

  useFrame(() => {
    // emote öncelikli; bittiğinde temizle
    if (emoteRef?.current) {
      const a = actions[emoteRef.current]
      if (current.current === emoteRef.current && a && !a.isRunning()) {
        emoteRef.current = null
      }
    }
    const want = emoteRef?.current ?? stateRef.current
    if (want !== current.current && actions[want]) {
      const a = actions[want]!
      actions[current.current]?.fadeOut(0.18)
      a.reset().fadeIn(0.18)
      if (emoteRef?.current === want) {
        a.setLoop(THREE.LoopOnce, 1)
        a.clampWhenFinished = true
      } else {
        a.setLoop(THREE.LoopRepeat, Infinity)
      }
      a.play()
      current.current = want
    }
  })

  return <primitive ref={ref} object={cloned} scale={scale} />
}

useGLTF.preload(MODEL)
