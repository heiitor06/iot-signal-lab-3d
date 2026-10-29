import { LineBasicMaterial, MeshBasicMaterial, MeshStandardMaterial } from 'three'

/** Materiais compartilhados por toda a cena: criados uma vez, nunca por quadro. */
export const MATERIALS = {
  body: new MeshStandardMaterial({ color: '#2b313b', metalness: 0.5, roughness: 0.45 }),
  bodyDark: new MeshStandardMaterial({ color: '#1a1e25', metalness: 0.55, roughness: 0.5 }),
  panel: new MeshStandardMaterial({ color: '#3a414d', metalness: 0.35, roughness: 0.55 }),
  steel: new MeshStandardMaterial({ color: '#8d96a3', metalness: 0.85, roughness: 0.3 }),
  glass: new MeshStandardMaterial({
    color: '#a9bccf',
    metalness: 0.1,
    roughness: 0.08,
    transparent: true,
    opacity: 0.07,
    depthWrite: false,
  }),
  laneBack: new MeshBasicMaterial({ color: '#161a20', transparent: true, opacity: 0.55, depthWrite: false }),
  gridLine: new LineBasicMaterial({ color: '#2b313b' }),
}
