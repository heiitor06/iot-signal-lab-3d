import { DoubleSide, FrontSide, MeshBasicMaterial, MeshStandardMaterial } from 'three'

/**
 * Materiais compartilhados por toda a cena: criados uma vez, nunca por quadro.
 * Paredes só com a face interna: vistas de fora ficam transparentes (casa de bonecas),
 * mas continuam bloqueando o sol (shadowSide duplo).
 */
export const MATERIALS = {
  wall: new MeshStandardMaterial({ color: '#c9ccd1', roughness: 0.92, side: FrontSide, shadowSide: DoubleSide }),
  wallAccent: new MeshStandardMaterial({ color: '#aeb4bd', roughness: 0.9, side: FrontSide, shadowSide: DoubleSide }),
  floor: new MeshStandardMaterial({ color: '#8a8478', roughness: 0.8 }),
  wood: new MeshStandardMaterial({ color: '#b48a5e', roughness: 0.62 }),
  metal: new MeshStandardMaterial({ color: '#3a3f47', metalness: 0.6, roughness: 0.4 }),
  metalLight: new MeshStandardMaterial({ color: '#9aa1ab', metalness: 0.75, roughness: 0.3 }),
  device: new MeshStandardMaterial({ color: '#23272e', metalness: 0.3, roughness: 0.5 }),
  fabric: new MeshStandardMaterial({ color: '#39424f', roughness: 0.95 }),
  frame: new MeshStandardMaterial({ color: '#e6e8eb', roughness: 0.5 }),
  cable: new MeshStandardMaterial({ color: '#1b1e23', roughness: 0.7 }),
  /** Invisível para a câmera, mas entra no mapa de sombras. */
  shadowOnly: new MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: DoubleSide }),
}
