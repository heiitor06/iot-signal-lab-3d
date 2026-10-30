import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, Object3D, type HemisphereLight, type SpotLight } from 'three'
import { liveValues } from './sceneState'
import { skyColor } from './sky'

/**
 * Sol fora da janela. O eixo do cone passa pelo centro da janela e o cone
 * é estreito: a luz entra só pela abertura (a frente da sala é aberta).
 */
const SUN_POSITION: [number, number, number] = [-7.2, 5, -0.4]
const SUN_TARGET: [number, number, number] = [-0.84, 0, -0.7]

/** Intensidade da luz (unidades físicas do three.js) por lux de luz natural. */
const SUN_PER_LUX = 0.22
const SKY_FILL_PER_LUX = 0.0016
/** Luz ambiente mínima: mesmo com tudo apagado a sala continua legível no projetor. */
const AMBIENT_FLOOR = 0.42

/**
 * Luz natural: um spot com sombra (as paredes recortam o feixe no formato da
 * janela) e o preenchimento difuso do céu. Tudo proporcional a L_ext(t).
 */
export function SunLight() {
  const spot = useRef<SpotLight>(null)
  const hemi = useRef<HemisphereLight>(null)
  const target = useMemo(() => {
    const o = new Object3D()
    o.position.set(...SUN_TARGET)
    return o
  }, [])
  const sky = useMemo(() => new Color(), [])
  const night = useMemo(() => new Color('#8ea2c4'), [])

  useEffect(() => {
    if (spot.current) spot.current.target = target
  }, [target])

  useFrame(() => {
    const { externalLux } = liveValues()
    if (spot.current) spot.current.intensity = externalLux * SUN_PER_LUX
    if (hemi.current) {
      skyColor(Math.max(externalLux, 250), sky)
      hemi.current.color.copy(night).lerp(sky, Math.min(1, externalLux / 300))
      hemi.current.intensity = AMBIENT_FLOOR + externalLux * SKY_FILL_PER_LUX
    }
  })

  return (
    <group>
      <primitive object={target} />
      <spotLight
        ref={spot}
        position={SUN_POSITION}
        color="#fff4e0"
        angle={0.3}
        penumbra={0.3}
        decay={1.2}
        distance={0}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <hemisphereLight ref={hemi} args={['#8ea2c4', '#2a2622', AMBIENT_FLOOR]} />
    </group>
  )
}
