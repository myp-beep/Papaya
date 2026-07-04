import Avatar from './Avatar'
import { useCall } from '../data/callStore'
import { haptic } from '../lib/haptics'

export default function IncomingCall() {
  const { status, peer, isVideo, acceptCall, rejectCall } = useCall()

  if (status !== 'ringing' || !peer) return null

  const handleAccept = () => {
    haptic('medium')
    acceptCall(isVideo)
  }

  const handleReject = () => {
    haptic('light')
    rejectCall()
  }

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/60 p-4 backdrop-blur-md animate-slide-up">
      <div className="w-full rounded-3xl border border-ink-600 bg-ink-800 p-6 shadow-card">
        <div className="flex flex-col items-center gap-3">
          <Avatar emoji={peer.avatar} color={peer.color} size={72} online />
          <div className="text-center">
            <div className="text-lg font-bold text-white">{peer.name}</div>
            <div className="text-sm text-papaya-400">
              {isVideo ? 'Görüntülü arama' : 'Sesli arama'}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-6">
          <button
            onClick={handleReject}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-3xl text-white shadow-lg transition hover:bg-red-400 active:scale-90"
            aria-label="Reddet"
          >
            ✕
          </button>
          <button
            onClick={handleAccept}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white shadow-lg transition hover:bg-emerald-400 active:scale-90"
            aria-label="Kabul et"
          >
            {isVideo ? '📹' : '📞'}
          </button>
        </div>
      </div>
    </div>
  )
}