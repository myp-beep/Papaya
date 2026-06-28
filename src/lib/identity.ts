// Cihaz başına kalıcı istemci kimliği (gerçek backend kurulumu gerektirmez).
const CLIENT_ID_KEY = 'papaya.clientId.v1'

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxxyxxxyxxxyxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/** Bu tarayıcı/cihaz için kalıcı benzersiz kimlik. */
export function getClientId(): string {
  let id = localStorage.getItem(CLIENT_ID_KEY)
  if (!id) {
    id = uuid()
    localStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}
