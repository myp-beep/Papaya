import { useRef } from 'react'
import Avatar from './Avatar'
import { useCall } from '../data/callStore'
import { haptic } from '../lib/haptics'

export default function CallView() {
  const { status, peer, isVideo, localStream, remoteStream, isAudioMuted, isVideoMuted, endCall, toggleMuteAudio, toggleMuteVideo } = useCall()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  if (!peer || (status !== 'calling' && status !== 'connecting' && status !== 'connected' && status !== 'ended')) return null

  if (localStream && localVideoRef.current && !localVideoRef.current.srcObject) {
    localVideoRef.current.srcObject = localStream
  }
  if (remoteStream && remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
    remoteVideoRef.current.srcObject = remoteStream
  }

  const statusLabel = status === 'calling' ? 'Aranıyor…' : status === 'connecting' ? 'Bağlanıyor…' : status === 'connected' ? 'Bağlandı' : 'Görüşme sonlandı'

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-black">
      {isVideo && status === 'connected' && remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <Avatar emoji={peer.avatar} color={peer.color} size={120} online />
        </div>
      )}

      {isVideo && localStream && (status === 'connected' || status === 'connecting') && (
        <div className="absolute right-4 top-4 h-36 w-28 overflow-hidden rounded-2xl border-2 border-white/20 shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="absolute left-0 right-0 top-6 flex flex-col items-center gap-1">
        <div className="text-lg font-bold text-white drop-shadow-lg">{peer.name}</div>
        <div className={`text-sm drop-shadow-lg ${status === 'connected' ? 'text-emerald-400' : 'text-white/60'}`}>
          {statusLabel}
        </div>
      </div>

      {status === 'connected' && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8">
          <button
            onClick={() => { haptic('light'); toggleMuteAudio() }}
            className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl transition active:scale-90 ${isAudioMuted ? 'bg-red-500 text-white' : 'bg-white/15 text-white backdrop-blur'}`}
            aria-label={isAudioMuted ? 'Sesi aç' : 'Sessize al'}
          >
            {isAudioMuted ? '🔇' : '🎤'}
          </button>
          {isVideo && (
            <button
              onClick={() => { haptic('light'); toggleMuteVideo() }}
              className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl transition active:scale-90 ${isVideoMuted ? 'bg-red-500 text-white' : 'bg-white/15 text-white backdrop-blur'}`}
              aria-label={isVideoMuted ? 'Kamerayı aç' : 'Kamerayı kapat'}
            >
              {isVideoMuted ? '📷' : '🎥'}
            </button>
          )}
          <button
            onClick={() => { haptic('medium'); endCall() }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-2xl text-white shadow-lg transition active:scale-90"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
      )}

      {status === 'calling' && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <button
            onClick={() => { haptic('medium'); endCall() }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-2xl text-white shadow-lg transition active:scale-90"
            aria-label="İptal"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
