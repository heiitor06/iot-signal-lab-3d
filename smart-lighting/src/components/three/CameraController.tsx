import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { PerspectiveCamera, Vector3, type Camera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useLabStore } from '../../store/simulationStore'
import type { CameraView } from '../../types/simulation'
import { CAMERA_VIEWS, overviewPosition } from './layout'
import { sceneState, viewInsets } from './sceneState'

/** Limites do pan: o alvo da câmera fica dentro da sala. */
const TARGET_MIN = new Vector3(-2.9, 0.2, -2.2)
const TARGET_MAX = new Vector3(2.9, 2.8, 2.2)

/** A vista geral se ajusta à proporção do canvas; as demais são fixas. */
function viewPosition(view: CameraView, camera: Camera): [number, number, number] {
  if (view === 'overview' && camera instanceof PerspectiveCamera) return overviewPosition(camera.aspect, camera.fov)
  return CAMERA_VIEWS[view].position
}

/**
 * Órbita, zoom e pan limitados + transições suaves para as vistas
 * pré-definidas. Se o usuário pega a câmera no meio da transição, ela para.
 */
export function CameraController() {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera)
  const request = useLabStore((s) => s.cameraRequest)
  const view = useLabStore((s) => s.cameraView)
  const goal = useMemo(() => ({ position: new Vector3(), target: new Vector3(), active: false }), [])
  const size = useThree((s) => s.size)
  const appliedInset = useRef(-1)

  // Na abertura, a vista geral já enquadra o laboratório inteiro.
  // Redimensionou: o recorte precisa ser refeito com o tamanho novo.
  useEffect(() => {
    appliedInset.current = -1
  }, [size])

  useEffect(() => {
    camera.position.set(...viewPosition('overview', camera))
    controls.current?.update()
  }, [camera])

  useEffect(() => {
    goal.position.set(...viewPosition(view, camera))
    goal.target.set(...CAMERA_VIEWS[view].target)
    goal.active = request > 0
  }, [request, view, goal, camera])

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const stop = () => {
      goal.active = false
    }
    const clamp = () => c.target.clamp(TARGET_MIN, TARGET_MAX)
    c.addEventListener('start', stop)
    c.addEventListener('change', clamp)
    return () => {
      c.removeEventListener('start', stop)
      c.removeEventListener('change', clamp)
    }
  }, [goal])

  useFrame((_, delta) => {
    // Centro óptico acima do cartão do roteiro: imagem "maior" para baixo, recortada na altura do canvas.
    const inset = Math.min(viewInsets.bottom, size.height * 0.5)
    if (inset !== appliedInset.current && camera instanceof PerspectiveCamera) {
      appliedInset.current = inset
      if (inset > 0) {
        // O recorte aproxima a imagem; o zoom < 1 devolve à faixa visível quase todo o enquadramento original.
        camera.zoom = (size.height - 0.6 * inset) / (size.height + inset)
        camera.setViewOffset(size.width, size.height + inset, 0, inset, size.width, size.height)
      } else {
        camera.zoom = 1
        camera.clearViewOffset()
      }
    }
    const c = controls.current
    if (!goal.active || !c) return
    const k = sceneState.reducedMotion ? 1 : 1 - Math.exp(-delta * 3.2)
    camera.position.lerp(goal.position, k)
    c.target.lerp(goal.target, k)
    c.update()
    if (camera.position.distanceTo(goal.position) < 0.01 && c.target.distanceTo(goal.target) < 0.01) goal.active = false
  })

  const overview = CAMERA_VIEWS.overview
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={overview.target}
      enableDamping
      dampingFactor={0.08}
      minDistance={0.5}
      maxDistance={18}
      maxPolarAngle={Math.PI * 0.48}
      screenSpacePanning
    />
  )
}
