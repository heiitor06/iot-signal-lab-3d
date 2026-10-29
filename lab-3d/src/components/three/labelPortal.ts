/**
 * Contêiner DOM dos rótulos Html da cena. Existe antes do canvas: assim o drei
 * não troca de contêiner depois de montar (o que desmontava e perdia rótulos).
 */
export const labelPortal: { current: HTMLElement } = { current: document.body }
