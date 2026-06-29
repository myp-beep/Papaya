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
export function Avatar3D({ stateRef, scale = 0.22 }: { stateRef: React.MutableRefObject<AnimState>; scale?: number }) {
  const { scene, animations } = useGLTF(MODEL)
  const cloned = useMemo(() => cloneSkeleton(scene), [scene])
  const ref = useRef<THREE.Group>(null)
  const { actions } = useAnimations(animations, ref)
  const current = useRef<string>('')

  useEffect(() => {
    // gölge dökme
    cloned.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
  }, [cloned])

  useFrame(() => {
    const want = stateRef.current
    if (want !== current.current && actions[want]) {
      actions[current.current]?.fadeOut(0.22)
      actions[want]!.reset().fadeIn(0.22).play()
      current.current = want
    }
  })

  return <primitive ref={ref} object={cloned} scale={scale} />
}

useGLTF.preload(MODEL)
