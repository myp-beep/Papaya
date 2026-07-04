import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { CallPeer, CallStatus } from '../types'
import { useChat } from './chatStore'
import { useProfile } from './profileStore'
import { createPeerConnection, getUserMedia, addLocalTracks, cleanupStream } from '../lib/webrtc'

interface CallContextValue {
  status: CallStatus
  peer: CallPeer | null
  isVideo: boolean
  isIncoming: boolean
  isAudioMuted: boolean
  isVideoMuted: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  startCall: (peer: CallPeer, video: boolean) => void
  endCall: () => void
  acceptCall: (video: boolean) => void
  rejectCall: () => void
  toggleMuteAudio: () => void
  toggleMuteVideo: () => void
}

const CallContext = createContext<CallContextValue | null>(null)

export function CallProvider({ children }: { children: ReactNode }) {
  const { sendEvent, onEvent, realtime } = useChat()
  const { profile } = useProfile()

  const [status, setStatus] = useState<CallStatus>('idle')
  const [peer, setPeer] = useState<CallPeer | null>(null)
  const [isVideo, setIsVideo] = useState(false)
  const [isIncoming, setIsIncoming] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const statusRef = useRef<CallStatus>('idle')
  const peerRef = useRef<CallPeer | null>(null)

  const syncStatus = useCallback((s: CallStatus) => {
    setStatus(s)
    statusRef.current = s
  }, [])

  const reset = useCallback(() => {
    syncStatus('idle')
    setPeer(null)
    setIsVideo(false)
    setIsIncoming(false)
    setIsAudioMuted(false)
    setIsVideoMuted(false)
    setLocalStream(null)
    setRemoteStream(null)
    localStreamRef.current = null
    remoteStreamRef.current = null
    peerRef.current = null
  }, [syncStatus])

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    cleanupStream(localStreamRef.current)
    cleanupStream(remoteStreamRef.current)
    reset()
  }, [reset])

  const onIceCandidate = useCallback(
    (candidate: RTCIceCandidate) => {
      const p = peerRef.current
      if (!p) return
      sendEvent('call:ice', { to: p.id, candidate: candidate.toJSON() })
    },
    [sendEvent],
  )

  const onTrack = useCallback((stream: MediaStream) => {
    remoteStreamRef.current = stream
    setRemoteStream(stream)
  }, [])

  const onConnectionStateChange = useCallback(
    (state: RTCPeerConnectionState) => {
      if (state === 'connected') {
        syncStatus('connected')
      } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        cleanup()
      }
    },
    [syncStatus, cleanup],
  )

  const setupCall = useCallback(
    async (video: boolean) => {
      const stream = await getUserMedia(video, true)
      localStreamRef.current = stream
      setLocalStream(stream)
      const pc = createPeerConnection(onIceCandidate, onTrack, onConnectionStateChange)
      addLocalTracks(pc, stream)
      pcRef.current = pc
      return pc
    },
    [onIceCandidate, onTrack, onConnectionStateChange],
  )

  const startCall = useCallback(
    async (p: CallPeer, video: boolean) => {
      if (!realtime) return
      setPeer(p)
      peerRef.current = p
      setIsVideo(video)
      setIsIncoming(false)
      syncStatus('calling')

      try {
        const pc = await setupCall(video)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        sendEvent('call:request', {
          to: p.id,
          isVideo: video,
          callerName: profile.name,
          callerAvatar: profile.avatar,
          callerColor: profile.color,
        })
      } catch {
        cleanup()
      }
    },
    [realtime, setupCall, sendEvent, profile, syncStatus, cleanup],
  )

  const acceptCall = useCallback(
    async (video: boolean) => {
      const p = peerRef.current
      if (!p) return
      setIsVideo(video)
      syncStatus('connecting')

      try {
        await setupCall(video)
        sendEvent('call:accept', { to: p.id, isVideo: video })
      } catch {
        cleanup()
      }
    },
    [setupCall, sendEvent, syncStatus, cleanup],
  )

  const rejectCall = useCallback(() => {
    const p = peerRef.current
    if (p) sendEvent('call:reject', { to: p.id })
    cleanup()
  }, [sendEvent, cleanup])

  const endCall = useCallback(() => {
    const p = peerRef.current
    if (p) sendEvent('call:end', { to: p.id })
    cleanup()
  }, [sendEvent, cleanup])

  const toggleMuteAudio = useCallback(() => {
    setIsAudioMuted((p) => {
      const next = !p
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next))
      return next
    })
  }, [])

  const toggleMuteVideo = useCallback(() => {
    setIsVideoMuted((p) => {
      const next = !p
      localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !next))
      return next
    })
  }, [])

  useEffect(() => {
    if (!realtime) return

    const unsubs: (() => void)[] = []

    unsubs.push(
      onEvent('call:request', (p) => {
        if (statusRef.current !== 'idle') return
        const cp: CallPeer = {
          id: String(p.from),
          name: String(p.callerName),
          avatar: String(p.callerAvatar),
          color: String(p.callerColor),
        }
        setPeer(cp)
        peerRef.current = cp
        setIsVideo(Boolean(p.isVideo))
        setIsIncoming(true)
        syncStatus('ringing')
      }),
    )

    unsubs.push(
      onEvent('call:accept', async () => {
        if (statusRef.current !== 'calling') return
        syncStatus('connecting')
        const p = peerRef.current
        if (!p || !pcRef.current) return
        const offer = pcRef.current.localDescription
        if (offer) sendEvent('call:offer', { to: p.id, sdp: offer })
      }),
    )

    unsubs.push(
      onEvent('call:offer', async (p) => {
        if (statusRef.current !== 'connecting') return
        const sdp = p.sdp as RTCSessionDescriptionInit
        if (!sdp) return
        const pc = pcRef.current
        if (!pc) return
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          const pPeer = peerRef.current
          if (pPeer) sendEvent('call:answer', { to: pPeer.id, sdp: answer })
        } catch {
          cleanup()
        }
      }),
    )

    unsubs.push(
      onEvent('call:answer', async (p) => {
        if (statusRef.current !== 'connecting') return
        const sdp = p.sdp as RTCSessionDescriptionInit
        if (!sdp || !pcRef.current) return
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp))
        } catch {
          cleanup()
        }
      }),
    )

    unsubs.push(
      onEvent('call:ice', async (p) => {
        const s = statusRef.current
        if (s !== 'connecting' && s !== 'connected') return
        const candidate = p.candidate as RTCIceCandidateInit
        if (!candidate || !pcRef.current) return
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        } catch {
          /* ignore */
        }
      }),
    )

    unsubs.push(
      onEvent('call:reject', (_p) => {
        if (statusRef.current === 'calling') cleanup()
      }),
    )

    unsubs.push(
      onEvent('call:end', () => {
        syncStatus('ended')
        setTimeout(cleanup, 1500)
      }),
    )

    return () => unsubs.forEach((u) => u())
  }, [realtime, onEvent, sendEvent, cleanup, syncStatus])

  const value: CallContextValue = {
    status,
    peer,
    isVideo,
    isIncoming,
    isAudioMuted,
    isVideoMuted,
    localStream,
    remoteStream,
    startCall,
    endCall,
    acceptCall,
    rejectCall,
    toggleMuteAudio,
    toggleMuteVideo,
  }

  return createElement(CallContext.Provider, { value }, children)
}

export function useCall() {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error('useCall must be used within <CallProvider>')
  return ctx
}
