import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import { useChat } from '../data/chatStore'
import type { Peer } from '../types'

interface Invite {
  gameId: string
  game: 'tic' | 'battleship'
  from: string
  hostProfile: { name: string; avatar: string; color: string }
}

/** Uygulama genelinde gelen oyun davetlerini dinler ve kabul/ret kartı gösterir. */
export default function GameInviteListener() {
  const { onEvent, sendEvent } = useChat()
  const navigate = useNavigate()
  const [invite, setInvite] = useState<Invite | null>(null)

  useEffect(
    () =>
      onEvent('game:invite', (p) =>
        setInvite({
          gameId: String(p.gameId),
          game: (p.game as Invite['game']) ?? 'tic',
          from: String(p.from),
          hostProfile: p.hostProfile as Invite['hostProfile'],
        }),
      ),
    [onEvent],
  )

  if (!invite) return null

  const peer: Peer = { id: invite.from, ...invite.hostProfile, online: true }
  const gameLabel = invite.game === 'battleship' ? 'Amiral Battı' : 'XOX'
  const gameEmoji = invite.game === 'battleship' ? '⚓' : '⭕'
  const gameRoute = invite.game === 'battleship' ? `/play/battleship/${invite.gameId}` : `/play/tic/${invite.gameId}`

  const accept = () => {
    sendEvent('game:accept', { to: invite.from, gameId: invite.gameId })
    navigate(gameRoute, { state: { gameId: invite.gameId, peer, role: 'guest' } })
    setInvite(null)
  }

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm animate-slide-up">
      <div className="w-full rounded-3xl border border-ink-600 bg-ink-800 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <Avatar emoji={peer.avatar} color={peer.color} size={48} online />
          <div className="flex-1">
            <div className="font-bold text-white">{peer.name}</div>
            <div className="text-sm text-white/60">
              seni {gameEmoji} {gameLabel}'a davet ediyor
            </div>
          </div>
          <span className="text-3xl">{gameEmoji}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setInvite(null)}
            className="flex-1 rounded-xl bg-ink-700 py-2.5 font-semibold text-white/80 transition hover:bg-ink-600"
          >
            Reddet
          </button>
          <button
            onClick={accept}
            className="flex-1 rounded-xl bg-papaya-500 py-2.5 font-bold text-white shadow-glow transition hover:bg-papaya-400"
          >
            Kabul et
          </button>
        </div>
      </div>
    </div>
  )
}
