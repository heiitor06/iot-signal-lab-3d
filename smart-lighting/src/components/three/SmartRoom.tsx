import { BEAM, DESK, ROOM, WINDOW } from './layout'
import { MATERIALS } from './materials'

const { halfWidth: W, backZ, frontZ, height: H } = ROOM
const depth = frontZ - backZ
const midZ = (frontZ + backZ) / 2

interface PanelProps {
  /** Centro do painel. */
  position: [number, number, number]
  rotationY: number
  width: number
  height: number
  accent?: boolean
  /** Só a parede da janela projeta sombra (recorta o sol); nas outras evita o serrilhado de autossombra. */
  castShadow?: boolean
}

function WallPanel({ position, rotationY, width, height, accent, castShadow }: PanelProps) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]} material={accent ? MATERIALS.wallAccent : MATERIALS.wall} receiveShadow castShadow={castShadow}>
      <planeGeometry args={[width, height]} />
    </mesh>
  )
}

/** Parede esquerda em quatro peças em volta da abertura da janela. */
function WindowWall() {
  const below = WINDOW.yMin
  const above = H - WINDOW.yMax
  const openH = WINDOW.yMax - WINDOW.yMin
  const backPiece = WINDOW.zMin - backZ
  const frontPiece = frontZ - WINDOW.zMax
  const r = Math.PI / 2
  return (
    <group>
      <WallPanel position={[-W, below / 2, midZ]} rotationY={r} width={depth} height={below} castShadow />
      <WallPanel position={[-W, H - above / 2, midZ]} rotationY={r} width={depth} height={above} castShadow />
      <WallPanel position={[-W, WINDOW.yMin + openH / 2, backZ + backPiece / 2]} rotationY={r} width={backPiece} height={openH} castShadow />
      <WallPanel position={[-W, WINDOW.yMin + openH / 2, WINDOW.zMax + frontPiece / 2]} rotationY={r} width={frontPiece} height={openH} castShadow />
    </group>
  )
}

function Desk() {
  const legH = DESK.height - 0.04
  const lx = DESK.width / 2 - 0.06
  const lz = DESK.depth / 2 - 0.06
  return (
    <group position={[DESK.x, 0, DESK.z]}>
      <mesh position={[0, DESK.height - 0.02, 0]} material={MATERIALS.wood} castShadow receiveShadow>
        <boxGeometry args={[DESK.width, 0.04, DESK.depth]} />
      </mesh>
      {[
        [-lx, -lz],
        [lx, -lz],
        [-lx, lz],
        [lx, lz],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, legH / 2, z]} material={MATERIALS.metal} castShadow>
          <boxGeometry args={[0.045, legH, 0.045]} />
        </mesh>
      ))}
    </group>
  )
}

/** Cadeira de escritório virada para a mesa. */
function Chair() {
  const x = DESK.x - 0.1
  const z = DESK.z + 0.78
  return (
    <group position={[x, 0, z]} rotation={[0, 0.12, 0]}>
      <mesh position={[0, 0.47, 0]} material={MATERIALS.fabric} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.07, 0.48]} />
      </mesh>
      <mesh position={[0, 0.82, 0.22]} rotation={[-0.08, 0, 0]} material={MATERIALS.fabric} castShadow>
        <boxGeometry args={[0.48, 0.55, 0.06]} />
      </mesh>
      <mesh position={[0, 0.23, 0]} material={MATERIALS.metal} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.42, 12]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.17, 0.03, Math.sin(a) * 0.17]} rotation={[0, -a, 0]} material={MATERIALS.metal}>
            <boxGeometry args={[0.34, 0.035, 0.04]} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Sala: piso, paredes (frente aberta), viga do teto, mesa e cadeira. Geometria procedural. */
export function SmartRoom() {
  return (
    <group>
      <mesh position={[0, 0, midZ]} rotation={[-Math.PI / 2, 0, 0]} material={MATERIALS.floor} receiveShadow>
        <planeGeometry args={[2 * W, depth]} />
      </mesh>
      <WallPanel position={[0, H / 2, backZ]} rotationY={0} width={2 * W} height={H} />
      <WallPanel position={[W, H / 2, midZ]} rotationY={-Math.PI / 2} width={depth} height={H} accent />
      <WindowWall />
      {/* Teto só de sombra: a câmera vê a sala por cima, mas o sol não entra por cima da parede. */}
      <mesh position={[0, H + 0.01, midZ]} rotation={[Math.PI / 2, 0, 0]} material={MATERIALS.shadowOnly} castShadow>
        <planeGeometry args={[2 * W + 1, depth + 1]} />
      </mesh>

      {/* Rodapé: marca onde parede encontra o piso. */}
      <mesh position={[0, 0.04, backZ + 0.01]} material={MATERIALS.metal}>
        <boxGeometry args={[2 * W, 0.08, 0.02]} />
      </mesh>

      {/* Viga do teto que segura a luminária e leva o cabo de comando. */}
      <mesh position={[0, BEAM.y, BEAM.z]} material={MATERIALS.metal} castShadow>
        <boxGeometry args={[2 * W, 0.12, 0.14]} />
      </mesh>

      <Desk />
      <Chair />
    </group>
  )
}
