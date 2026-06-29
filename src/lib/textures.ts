// Gömülü doku yolları (base'e göre çözülür: dev '/', canlı '/Papaya/').
export const tex = (file: string) => `${import.meta.env.BASE_URL}textures/${file}`
