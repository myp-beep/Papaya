import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CardDef, CardGameState, BoardCreature, PlayerState, GamePhase } from '../types'
import { getCard, loadDeck, STARTER_DECK } from '../data/cardStore'
import { pickBotPlay, pickBotAttack } from '../data/cardAi'
import { sfx } from '../lib/sound'
import { recordGame } from '../data/statsStore'
import CardHand from '../components/cards/CardHand'
import CardBoard from '../components/cards/CardBoard'

function uid() { return Math.random().toString(36).slice(2, 8) }

function shuffle(arr: string[]): string[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makePlayer(deck: string[], isOpponent: boolean): PlayerState {
  const shuffled = shuffle(deck)
  return {
    hp: 20,
    maxHp: 20,
    mana: 1,
    maxMana: 1,
    deck: shuffled.slice(isOpponent ? 3 : 3),
    hand: shuffled.slice(0, 3),
    board: [],
    weaponAtk: 0,
    weaponDurability: 0,
  }
}

function initialState(): CardGameState {
  const deck = loadDeck()
  return {
    player: makePlayer(deck, false),
    opponent: makePlayer(STARTER_DECK, true),
    turn: 1,
    phase: 'draw',
    turnOwner: 0,
    winner: null,
    turnActions: 0,
    log: ['Oyun başladı! 🎴'],
  }
}

const MAX_BOARD = 5

export default function CardBattlePage() {
  const navigate = useNavigate()
  const [game, setGame] = useState<CardGameState>(initialState)
  const [selectedHand, setSelectedHand] = useState<number | null>(null)
  const [targetMode, setTargetMode] = useState<'none' | 'own_creature' | 'enemy_creature'>('none')
  const [pendingCard, setPendingCard] = useState<CardDef | null>(null)
  const [animMsg, setAnimMsg] = useState<string | null>(null)
  const botTurnRef = useRef(false)

  const isPlayerTurn = game.turnOwner === 0 && !game.winner && game.phase !== 'end'

  const addLog = useCallback((msg: string) => {
    setGame((g) => ({ ...g, log: [...g.log.slice(-19), msg] }))
  }, [])

  const showMsg = useCallback((msg: string) => {
    setAnimMsg(msg)
    setTimeout(() => setAnimMsg(null), 1500)
  }, [])

  // Kart çekme
  const drawCards = useCallback((count: number, who: 'player' | 'opponent') => {
    setGame((g) => {
      const p = who === 'player' ? { ...g.player } : { ...g.opponent }
      if (p.deck.length === 0) { addLog(`${who === 'player' ? 'Sen' : 'Bot'} destede kart kalmadı!`); return g }
      const drawn = p.deck.slice(0, count)
      p.deck = p.deck.slice(count)
      p.hand = [...p.hand, ...drawn]
      return who === 'player' ? { ...g, player: p } : { ...g, opponent: p }
    })
  }, [addLog])

  // Tur başlangıcı
  const startTurn = useCallback(() => {
    setGame((g) => {
      const isPlayer = g.turnOwner === 0
      const p = isPlayer ? { ...g.player } : { ...g.opponent }

      // Mana artır (max 10)
      p.maxMana = Math.min(10, p.maxMana + (g.turnOwner === 0 ? 1 : 0))
      p.mana = p.maxMana

      // Board: canAttack sıfırla, frozen çöz
      p.board = p.board.map((c) => ({ ...c, canAttack: true, frozen: false }))

      // Kart çek
      if (p.deck.length > 0) {
        const drawn = p.deck.slice(0, 1)
        p.deck = p.deck.slice(1)
        p.hand = [...p.hand, ...drawn]
      }

      const newG = isPlayer
        ? { ...g, player: p, phase: 'main' as GamePhase }
        : { ...g, opponent: p, phase: 'main' as GamePhase }

      // Bot turu başlat
      if (!isPlayer) {
        setTimeout(() => runBotTurn({ ...newG }), 600)
        botTurnRef.current = true
      }

      return newG
    })
    addLog(`Tur ${Math.floor(game.turn / 2) + 1} başladı`)
  }, [addLog, game.turn])

  // Bot turu
  const runBotTurn = useCallback((g: CardGameState) => {
    let state = { ...g }
    const p = { ...state.opponent }
    const opp = { ...state.player }

    // Kart oyna
    let played = true
    while (played) {
      const handCards = p.hand.map((id) => getCard(id)).filter((c): c is CardDef => !!c)
      const move = pickBotPlay(handCards, p, opp)
      if (!move) { played = false; break }

      const card = move.card
      const hIdx = p.hand.indexOf(card.id)
      if (hIdx !== -1) p.hand.splice(hIdx, 1)
      p.mana -= card.cost

      if (card.type === 'creature') {
        if (p.board.length < MAX_BOARD) {
          const cr: BoardCreature = {
            id: uid(),
            cardId: card.id,
            attack: card.attack || 0,
            hp: card.hp || 1,
            maxHp: card.hp || 1,
            canAttack: card.effect?.charge || false,
            frozen: false,
            taunt: card.effect?.taunt || false,
            charge: card.effect?.charge || false,
            silence: false,
          }
          p.board = [...p.board, cr]
          addLog(`Bot: ${card.emoji} ${card.name} oynadı`)
          if (card.effect?.draw) drawCards(card.effect.draw, 'opponent')
          if (card.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + card.effect.heal)
          if (card.effect?.destroyRandom && opp.board.length > 0) {
            const idx = Math.floor(Math.random() * opp.board.length)
            opp.board.splice(idx, 1)
            addLog('Bot: bir yaratığını yok etti!')
          }
          if (card.effect?.dealToAll) {
            opp.board = opp.board.map((c) => ({ ...c, hp: c.hp - (card.effect?.dealToAll || 0) })).filter((c) => c.hp > 0)
          }
        }
      } else if (card.type === 'weapon') {
        p.weaponAtk = card.effect?.buffAttack || 0
        p.weaponDurability = 3
        addLog(`Bot: ${card.emoji} ${card.name} kuşandı`)
      } else if (card.type === 'spell') {
        if (card.effect?.win) { state.winner = 1; addLog('Bot Büyük Papaya\'yı oynadı!'); break }
        if (card.effect?.damage) opp.hp -= card.effect.damage
        if (card.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + card.effect.heal)
        if (card.effect?.draw) drawCards(card.effect.draw, 'opponent')
        if (card.effect?.dealToAll) {
          opp.board = opp.board.map((c) => ({ ...c, hp: c.hp - card.effect!.dealToAll! })).filter((c) => c.hp > 0)
        }
        if (card.effect?.destroyRandom && opp.board.length > 0) {
          const idx = Math.floor(Math.random() * opp.board.length)
          opp.board.splice(idx, 1)
        }
        if (card.effect?.silence && opp.board.length > 0) {
          opp.board[0] = { ...opp.board[0], silence: true, taunt: false, charge: false }
        }
        addLog(`Bot: ${card.emoji} ${card.name}`)
      }

      if (opp.hp <= 0) { state.winner = 1; break }
    }

    // Hücum
    if (!state.winner) {
      const attackers = p.board.filter((c) => c.canAttack && !c.frozen && c.attack > 0)
      let attacked = true
      while (attacked) {
        const atk = pickBotAttack(attackers, opp.board, opp.hp)
        if (!atk) { attacked = false; break }
        const { attacker, target } = atk
        const aIdx = attackers.findIndex((c) => c.id === attacker.id)
        if (aIdx === -1) { attacked = false; break }
        attackers.splice(aIdx, 1)

        if (target === 'hero') {
          const dmg = attacker.attack + p.weaponAtk
          opp.hp -= dmg
          addLog(`Bot: ${getCard(attacker.cardId)?.emoji} sana ${dmg} hasar verdi`)
          if (opp.hp <= 0) { state.winner = 1; break }
        } else {
          const tIdx = opp.board.findIndex((c) => c.id === target)
          if (tIdx === -1) continue
          const dmg = attacker.attack
          opp.board[tIdx] = { ...opp.board[tIdx], hp: opp.board[tIdx].hp - dmg }
          if (opp.board[tIdx].hp <= 0) {
            opp.board.splice(tIdx, 1)
            addLog(`Bot: ${getCard(attacker.cardId)?.emoji} yaratığını yok etti`)
          }
        }
      }
    }

    state.opponent = p
    state.player = opp

    if (state.winner) {
      setGame(state)
      return
    }

    // Turu bitir
    state.turnOwner = 0
    state.turn++
    state.phase = 'draw'
    state.turnActions = 0
    setGame(state)
    botTurnRef.current = false
    setTimeout(() => startTurn(), 500)
  }, [addLog, drawCards, startTurn])

  useEffect(() => {
    if (game.phase === 'draw' && !botTurnRef.current) {
      const t = setTimeout(() => startTurn(), 400)
      return () => clearTimeout(t)
    }
  }, [game.phase, startTurn])

  // Zafer kontrolü
  useEffect(() => {
    if (game.winner) {
      recordGame({ won: game.winner === 0, xp: game.winner === 0 ? 50 : 15 })
      if (game.winner === 0) sfx.win()
      else sfx.fail()
    }
  }, [game.winner])

  // Oyuncu hamlesi: kart oyna
  const playCard = useCallback((card: CardDef, handIndex: number) => {
    if (!isPlayerTurn || game.phase !== 'main' || card.cost > game.player.mana) return

    if (card.type === 'creature') {
      if (game.player.board.length >= MAX_BOARD) { showMsg('Board dolu!'); return }
      setGame((g) => {
        const p = { ...g.player }
        p.hand = p.hand.filter((_, i) => i !== handIndex)
        p.mana -= card.cost
        const cr: BoardCreature = {
          id: uid(),
          cardId: card.id,
          attack: card.attack || 0,
          hp: card.hp || 1,
          maxHp: card.hp || 1,
          canAttack: card.effect?.charge || false,
          frozen: false,
          taunt: card.effect?.taunt || false,
          charge: card.effect?.charge || false,
          silence: false,
        }
        p.board = [...p.board, cr]
        sfx.flip()
        addLog(`Sen: ${card.emoji} ${card.name} oynadın`)
        if (card.effect?.draw) setTimeout(() => drawCards(card.effect!.draw!, 'player'), 200)
        if (card.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + card.effect.heal)
        if (card.effect?.dealToAll) {
          const opp = { ...g.opponent }
          opp.board = opp.board.map((c) => ({ ...c, hp: c.hp - (card.effect?.dealToAll || 0) })).filter((c) => c.hp > 0)
          if (opp.hp <= 0) return { ...g, player: p, opponent: opp, winner: 0 }
          return { ...g, player: p, opponent: opp }
        }
        return { ...g, player: p }
      })
      setSelectedHand(null)
    } else if (card.type === 'weapon') {
      setGame((g) => {
        const p = { ...g.player }
        p.hand = p.hand.filter((_, i) => i !== handIndex)
        p.mana -= card.cost
        p.weaponAtk = card.effect?.buffAttack || 0
        p.weaponDurability = 3
        sfx.flip()
        addLog(`Sen: ${card.emoji} ${card.name} kuşandın`)
        return { ...g, player: p }
      })
      setSelectedHand(null)
    } else if (card.type === 'spell') {
      // Büyüler: hedef gerektirenler
      if (card.effect?.silence || card.effect?.buffAttack || card.effect?.buffHp) {
        if (card.effect?.silence) {
          if (game.opponent.board.length === 0) { showMsg('Hedef yok!'); return }
          setTargetMode('enemy_creature')
          setPendingCard(card)
          return
        }
        if (card.effect?.buffAttack || card.effect?.buffHp) {
          if (game.player.board.length === 0) { showMsg('Yaratığın yok!'); return }
          setTargetMode('own_creature')
          setPendingCard(card)
          return
        }
      }
      applySpell(card, handIndex)
    }
  }, [isPlayerTurn, game.phase, game.player.mana, game.player.board.length, game.opponent.board.length, addLog, drawCards, showMsg])

  const applySpell = useCallback((card: CardDef, handIndex: number, targetId?: string) => {
    setGame((g) => {
      const p = { ...g.player }
      p.hand = p.hand.filter((_, i) => i !== handIndex)
      p.mana -= card.cost
      const opp = { ...g.opponent }

      if (card.effect?.damage) {
        if (targetId) {
          const idx = opp.board.findIndex((c) => c.id === targetId)
          if (idx !== -1) {
            opp.board[idx] = { ...opp.board[idx], hp: opp.board[idx].hp - card.effect!.damage! }
            if (opp.board[idx].hp <= 0) opp.board.splice(idx, 1)
          }
        } else {
          opp.hp -= card.effect.damage
        }
      }
      if (card.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + card.effect.heal)
      if (card.effect?.draw) setTimeout(() => drawCards(card.effect!.draw!, 'player'), 200)
      if (card.effect?.dealToAll) {
        opp.board = opp.board.map((c) => ({ ...c, hp: c.hp - (card.effect?.dealToAll || 0) })).filter((c) => c.hp > 0)
      }
      if (card.effect?.destroyRandom && opp.board.length > 0) {
        const idx = Math.floor(Math.random() * opp.board.length)
        opp.board.splice(idx, 1)
      }
      if (card.effect?.silence && targetId) {
        const idx = opp.board.findIndex((c) => c.id === targetId)
        if (idx !== -1) opp.board[idx] = { ...opp.board[idx], silence: true, taunt: false, charge: false }
      }
      if (card.effect?.buffAttack && targetId) {
        const idx = p.board.findIndex((c) => c.id === targetId)
        if (idx !== -1) p.board[idx] = { ...p.board[idx], attack: p.board[idx].attack + (card.effect?.buffAttack || 0) }
      }
      if (card.effect?.buffHp && targetId) {
        const idx = p.board.findIndex((c) => c.id === targetId)
        if (idx !== -1) p.board[idx] = { ...p.board[idx], hp: p.board[idx].hp + (card.effect?.buffHp || 0), maxHp: p.board[idx].maxHp + (card.effect?.buffHp || 0) }
      }
      if (card.effect?.win) return { ...g, player: p, opponent: opp, winner: 0 }
      if (card.effect?.stealLife) p.hp = Math.min(p.maxHp, p.hp + 3)

      if (opp.hp <= 0) return { ...g, player: p, opponent: opp, winner: 0 }

      sfx.match()
      addLog(`Sen: ${card.emoji} ${card.name}`)
      return { ...g, player: p, opponent: opp }
    })
    setSelectedHand(null)
    setTargetMode('none')
    setPendingCard(null)
  }, [addLog, drawCards])

  // Hedef seçme
  const handleTarget = useCallback((cr: BoardCreature) => {
    if (!pendingCard) return
    const handIdx = game.player.hand.indexOf(pendingCard.id)
    if (handIdx !== -1) applySpell(pendingCard, handIdx, cr.id)
  }, [pendingCard, game.player.hand, applySpell])

  // Yaratıkla hücum
  const handleAttack = useCallback((cr: BoardCreature) => {
    if (!isPlayerTurn || game.phase !== 'main' || !cr.canAttack) return
    if (game.opponent.board.some((c) => c.taunt)) {
      setTargetMode('enemy_creature')
      setPendingCard(null)
      showMsg('Önce taunt\'ı yok et!')
      return
    }
    if (game.opponent.board.length > 0) {
      setTargetMode('enemy_creature')
      setPendingCard(null)
      showMsg('Hedef seç')
      return
    }
    // Hero'ya saldır
    attackHero(cr)
  }, [isPlayerTurn, game.phase, game.opponent.board, showMsg])

  const attackHero = useCallback((cr: BoardCreature) => {
    setGame((g) => {
      const p = { ...g.player }
      const opp = { ...g.opponent }
      const dmg = cr.attack + p.weaponAtk
      opp.hp -= dmg
      p.board = p.board.map((c) => c.id === cr.id ? { ...c, canAttack: false } : c)
      sfx.tap()
      addLog(`Sen: ${getCard(cr.cardId)?.emoji} rakibe ${dmg} hasar!`)
      if (opp.hp <= 0) return { ...g, player: p, opponent: opp, winner: 0 }
      return { ...g, player: p, opponent: opp }
    })
    setTargetMode('none')
  }, [addLog])

  // Tur bitir
  const endTurn = useCallback(() => {
    if (!isPlayerTurn || game.phase !== 'main') return
    setGame((g) => ({ ...g, turnOwner: 1, phase: 'main' as GamePhase, turn: g.turn + 1 }))
    addLog('Turunu bitirdin ⏭️')
    setTimeout(() => {
      setGame((g) => {
        const g2 = { ...g }
        setTimeout(() => runBotTurn(g2), 400)
        botTurnRef.current = true
        return g
      })
    }, 300)
  }, [isPlayerTurn, game.phase, addLog, runBotTurn])

  const restartGame = useCallback(() => {
    setGame(initialState())
    botTurnRef.current = false
    setSelectedHand(null)
    setTargetMode('none')
    setPendingCard(null)
  }, [])

  const playerHand = useMemo(
    () => game.player.hand.map((id) => getCard(id)).filter((c): c is CardDef => !!c),
    [game.player.hand],
  )

  const canEndTurn = isPlayerTurn && game.phase === 'main'

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-ink-900 via-ink-800 to-ink-900">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 pt-3 pb-1">
        <button onClick={() => navigate('/games')} className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-white/60 transition hover:bg-ink-700">‹</button>
        <h1 className="flex items-center gap-1 text-lg font-extrabold text-white">
          🎴 Kart Savaşı
        </h1>
        <span className="rounded-full bg-ink-700 px-2 py-0.5 text-[10px] text-white/50">
          Tur {Math.floor(game.turn / 2) + 1}
        </span>
      </header>

      {/* Animasyon mesajı */}
      {animMsg && (
        <div className="absolute left-1/2 top-1/3 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-papaya-500 to-papaya-600 px-6 py-3 text-sm font-bold text-white shadow-glow animate-pop-in pointer-events-none">
          {animMsg}
        </div>
      )}

      {/* Zafer/Ekran */}
      {game.winner !== null && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink-900/85 backdrop-blur-sm animate-pop-in">
          <div className="mx-6 flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-br from-papaya-500/20 to-grape-500/20 p-8 text-center">
            <div className="text-6xl">{game.winner === 0 ? '🎉' : '😔'}</div>
            <h2 className="mt-3 text-2xl font-extrabold text-white">
              {game.winner === 0 ? 'Zafer!' : 'Mağlubiyet'}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {game.winner === 0 ? 'Rakibi yendin! Krallık seninle gurur duyuyor.' : 'Bot bu sefer daha güçlüydü. Tekrar dene!'}
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => navigate('/games')} className="btn-ghost px-4 py-2">Oyunlar</button>
              <button onClick={restartGame} className="btn-primary px-5 py-2">Rövanş</button>
            </div>
          </div>
        </div>
      )}

      {/* Oyun alanı */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Rakip bilgisi */}
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="text-sm font-semibold text-white/80">Bot</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-papaya-400">💎{game.opponent.mana}</span>
            </div>
            <span className="text-sm font-bold text-white">{game.opponent.hp}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: game.opponent.maxHp }, (_, i) => (
                <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < game.opponent.hp ? 'bg-red-400' : 'bg-white/15'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Rakip board */}
        <CardBoard creatures={game.opponent.board} isOpponent title="Rakip" />

        {/* Orta çizgi */}
        <div className="border-t border-white/5 mx-3 my-1" />

        {/* Oyuncu board */}
        <div className="flex-1 flex flex-col">
          <CardBoard
            creatures={game.player.board}
            onAttack={handleAttack}
            onTarget={targetMode === 'enemy_creature' ? handleTarget : targetMode === 'own_creature' ? handleTarget : undefined}
            selectable={targetMode !== 'none'}
            title="Senin Yaratıkların"
          />

          {/* Hedef seçme uyarısı */}
          {targetMode !== 'none' && (
            <div className="text-center text-[10px] text-papaya-400 animate-pulse py-1">
              {targetMode === 'enemy_creature' ? 'Düşman yaratığını seç' : 'Kendi yaratığını seç'}
            </div>
          )}

          {/* Oyuncu bilgisi */}
          <div className="flex items-center justify-between px-3 py-1">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-papaya-500/30 text-[10px] font-bold text-papaya-400">
                {game.player.mana}/{game.player.maxMana}
              </span>
              {game.player.weaponAtk > 0 && (
                <span className="text-[10px] text-orange-300">🗡️+{game.player.weaponAtk}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: game.player.maxHp }, (_, i) => (
                  <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < game.player.hp ? 'bg-green-400' : 'bg-white/15'}`} />
                ))}
              </div>
              <span className="text-sm font-bold text-white">{game.player.hp}</span>
            </div>
          </div>
        </div>

        {/* Kart eli */}
        <div className="border-t border-white/10 bg-ink-800/50 pt-2">
          <CardHand
            cards={playerHand}
            mana={game.player.mana}
            onPlayCard={playCard}
            selectedIndex={selectedHand}
            onSelect={setSelectedHand}
            disabled={!isPlayerTurn || game.winner !== null}
          />

          {/* Alt kontroller */}
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <div className="text-[10px] text-white/30">
              Deste: {game.player.deck.length} kart
            </div>
            {canEndTurn && (
              <button
                onClick={endTurn}
                className="rounded-full bg-gradient-to-r from-papaya-500 to-papaya-600 px-5 py-1.5 text-xs font-bold text-white shadow-glow transition hover:brightness-110 active:scale-95"
              >
                ⏭️ Turu Bitir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
