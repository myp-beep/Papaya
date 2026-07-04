const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export function createPeerConnection(
  onIceCandidate: (candidate: RTCIceCandidate) => void,
  onTrack: (stream: MediaStream) => void,
  onConnectionStateChange: (state: RTCPeerConnectionState) => void,
): RTCPeerConnection {
  const pc = new RTCPeerConnection(ICE_SERVERS)
  pc.onicecandidate = (e) => {
    if (e.candidate) onIceCandidate(e.candidate)
  }
  pc.ontrack = (e) => onTrack(e.streams[0])
  pc.onconnectionstatechange = () => onConnectionStateChange(pc.connectionState)
  return pc
}

export async function getUserMedia(video: boolean, audio: boolean): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ video, audio })
}

export function addLocalTracks(pc: RTCPeerConnection, stream: MediaStream) {
  stream.getTracks().forEach((t) => pc.addTrack(t, stream))
}

export function removeLocalTracks(pc: RTCPeerConnection) {
  pc.getSenders().forEach((s) => pc.removeTrack(s))
}

export function cleanupStream(stream: MediaStream | null) {
  if (!stream) return
  stream.getTracks().forEach((t) => t.stop())
}
