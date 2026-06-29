import { EffectComposer, Bloom, Vignette, SMAA, BrightnessContrast, HueSaturation } from '@react-three/postprocessing'

/** Sinematik post-processing yığını: kenar yumuşatma, bloom, renk derecesi, vignette. */
export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom intensity={0.55} luminanceThreshold={0.8} luminanceSmoothing={0.3} mipmapBlur />
      <BrightnessContrast brightness={0.02} contrast={0.12} />
      <HueSaturation saturation={0.12} />
      <Vignette offset={0.3} darkness={0.55} />
    </EffectComposer>
  )
}
