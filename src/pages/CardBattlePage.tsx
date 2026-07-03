import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CardDef, CardGameState, BoardCreature, PlayerState, GamePhase, HeroId, BotLevel } from '../types'
import { getCard, loadDeck, STARTER_DECK, allCards, TOKEN_CARDS } from '../data/cardStore'
import { pickBotPlay, pickBotAttack } from '../data/cardAi'
import { getHero, getHeroPowerTargetMode } from '../data/cardHeroes'
import { loadCollection, saveCollection, recordWin, recordLoss, addHeroXp } from '../data/cardProgression'
import { sfx } from '../lib/sound'
import CardHand from '../components/cards/CardHand'
import CardBoard from '../components/cards/CardBoard'
import HeroSelect from '../components/cards/HeroSelect'
import { CardAnimationOverlay, ManaCrystal, CardDrawPile } from '../components/cards/CardAnimation'

function uid() { return Math.random().toString(36).slice(2, 8) }

function shuffle(arr: string[]): string[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const MAX_BOARD = 5

function makePlayer(deck: string[], isOpponent: boolean, heroId: HeroId): PlayerState {
  const shuffled = shuffle(deck)
  const hero = getHero(heroId)
  const handSize = isOpponent ? 4 : 3
  return {
    hp: hero.hp,
    maxHp: hero.hp,
    mana: 1,
    maxMana: 1,
    deck: shuffled.slice(handSize),
    hand: shuffled.slice(0, handSize),
    board: [],
    weaponAtk: 0,
    weaponDurability: 0,
    hero: heroId,
    heroPowerUsed: false,
    armor: 0,
  }
}

function createBoardCreature(card: CardDef, hasCharge: boolean): BoardCreature {
  return {
    id: uid(),
    cardId: card.id,
    attack: card.attack || 0,
    hp: card.hp || 1,
    maxHp: card.hp || 1,
    canAttack: hasCharge || card.effect?.charge || false,
    frozen: false,
    taunt: card.effect?.taunt || false,
    charge: card.effect?.charge || false,
    silence: false,
    poison: card.effect?.poison || false,
    shield: card.effect?.shield || 0,
    frenzy: card.effect?.frenzy || false,
    deathrattle: card.effect?.deathrattle,
  }
}

function applyEffectToBoard(effect: CardDef['effect'], target: BoardCreature): BoardCreature {
  if (!effect) return target
  let c = { ...target }
  if (effect.buffAttack) c.attack += effect.buffAttack
  if (effect.buffHp) { c.hp += effect.buffHp; c.maxHp += effect.buffHp }
  if (effect.heal) c.hp = Math.min(c.maxHp, c.hp + effect.heal)
  if (effect.freeze) c.frozen = true
  if (effect.silence) { c.silence = true; c.taunt = false; c.charge = false; c.poison = false; c.frenzy = false; c.deathrattle = undefined }
  if (effect.taunt) c.taunt = true
  if (effect.shield) c.shield = (c.shield || 0) + effect.shield
  return c
}

interface BattleProps {
  initialHero?: HeroId
  botLevel?: BotLevel
}

export default function CardBattlePage({ initialHero, botLevel: forcedLevel }: BattleProps) {
  const navigate = useNavigate()
  const [heroSelected, setHeroSelected] = useState<HeroId | null>(initialHero || null)
  const [botLevel, setBotLevel] = useState<BotLevel>(forcedLevel || 'normal')
  const [game, setGame] = useState<CardGameState | null>(null)
  const [selectedHand, setSelectedHand] = useState<number | null>(null)
  const [targetMode, setTargetMode] = useState<'none' | 'own_creature' | 'enemy_creature' | 'hero' | 'all_enemies'>('none')
  const [pendingCard, setPendingCard] = useState<CardDef | null>(null)
  const [animMsg, setAnimMsg] = useState<string | null>(null)
  const [discoverCards, setDiscoverCards] = useState<CardDef[] | null>(null)
  const [lastCombo, setLastCombo] = useState(false)
  const botTurnRef = useRef(false)
  const gameRef = useRef<CardGameState | null>(null)
  const isPlayerTurn = game ? game.turnOwner === 0 && !game.winner && game.phase !== 'end' : false

  const addLog = useCallback((msg: string) => {
    setGame((g) => g ? ({ ...g, log: [...g.log.slice(-19), msg] }) : g)
  }, [])

  const showMsg = useCallback((msg: string) => {
    setAnimMsg(msg)
    setTimeout(() => setAnimMsg(null), 1500)
  }, [])

  const drawCards = useCallback((count: number, who: 'player' | 'opponent') => {
    setGame((g) => {
      if (!g) return g
      const p = who === 'player' ? { ...g.player } : { ...g.opponent }
      if (p.deck.length === 0) return g
      const drawn = p.deck.slice(0, count)
      p.deck = p.deck.slice(count)
      p.hand = [...p.hand, ...drawn]
      if (who === 'player') sfx.cardDraw()
      return who === 'player' ? { ...g, player: p } : { ...g, opponent: p }
    })
  }, [])

  const dealDamage = useCallback((target: PlayerState, amount: number, ignoreArmor = false): PlayerState => {
    const t = { ...target }
    let dmg = amount
    if (!ignoreArmor && t.armor > 0) {
      const absorbed = Math.min(t.armor, dmg)
      t.armor -= absorbed
      dmg -= absorbed
    }
    t.hp -= dmg
    return t
  }, [])

  function startGame(heroId: HeroId) {
    const deck = loadDeck()
    const g: CardGameState = {
      player: makePlayer(deck, false, heroId),
      opponent: makePlayer(STARTER_DECK, true, 'shadow'),
      turn: 1,
      phase: 'draw',
      turnOwner: 0,
      winner: null,
      turnActions: 0,
      log: ['Oyun başladı! 🎴'],
      botDifficulty: botLevel,
    }
    setGame(g)
    gameRef.current = g
    setHeroSelected(heroId)
    sfx.turnStart()
  }

  const startTurn = useCallback(() => {
    setGame((g) => {
      if (!g) return g
      const isPlayer = g.turnOwner === 0
      const p = isPlayer ? { ...g.player } : { ...g.opponent }
      p.maxMana = Math.min(10, p.maxMana + 1)
      p.mana = p.maxMana
      p.board = p.board.map((c) => ({ ...c, canAttack: true, frozen: c.frozen ? false : c.frozen }))
      p.heroPowerUsed = false

      if (p.deck.length > 0) {
        const drawn = p.deck.slice(0, 1)
        p.deck = p.deck.slice(1)
        p.hand = [...p.hand, ...drawn]
      }

      const newG = isPlayer
        ? { ...g, player: p, phase: 'main' as GamePhase }
        : { ...g, opponent: p, phase: 'main' as GamePhase }

      addLog(`Tur ${Math.floor(newG.turn / 2) + 1} başladı`)
      sfx.turnStart()

      if (!isPlayer) {
        setTimeout(() => runBotTurn(newG), 600)
        botTurnRef.current = true
      }

      return newG
    })
  }, [addLog])

  useEffect(() => {
    if (game && game.phase === 'draw' && !botTurnRef.current) {
      const t = setTimeout(() => startTurn(), 400)
      return () => clearTimeout(t)
    }
  }, [game?.phase, game?.turn, startTurn])

  useEffect(() => {
    if (game?.winner) {
      const c = loadCollection()
      if (game.winner === 0) {
        const nc = addHeroXp(recordWin(c), game.player.hero, 50)
        saveCollection(nc)
        sfx.win()
      } else {
        const nc = addHeroXp(recordLoss(c), game.player.hero, 15)
        saveCollection(nc)
        sfx.fail()
      }
    }
  }, [game?.winner, game?.player.hero])

  function runBotTurn(g: CardGameState) {
    let state = JSON.parse(JSON.stringify(g)) as CardGameState
    const p = state.opponent
    const opp = state.player

    let played = true
    let actions = 0
    while (played && actions < 30) {
      actions++
      const handCards = p.hand.map((id) => getCard(id)).filter((c): c is CardDef => !!c)
      const move = pickBotPlay(handCards, p, opp, state.botDifficulty)
      if (!move) { played = false; break }

      const card = move.card
      const hIdx = p.hand.indexOf(card.id)
      if (hIdx !== -1) p.hand.splice(hIdx, 1)
      p.mana -= card.cost

      applyCardEffects(card, p, opp, state, 'opponent', move.targetId)

      if (state.winner) break
    }

    if (!state.winner) {
      const attackers = p.board.filter((c) => c.canAttack && !c.frozen && c.attack > 0)
      let attacked = true
      let atkActions = 0
      while (attacked && atkActions < 20) {
        atkActions++
        const atk = pickBotAttack(attackers, opp.board, opp.hp, state.botDifficulty)
        if (!atk) { attacked = false; break }
        resolveAttack(atk.attacker, atk.target, p, opp, state)
        attackers.splice(attackers.findIndex(c => c.id === atk.attacker.id), 1)
        if (state.winner) break
      }
    }

    state.opponent = p
    state.player = opp

    if (state.winner) {
      setGame(state)
      return
    }

    state.turnOwner = 0
    state.turn++
    state.phase = 'draw'
    state.turnActions = 0
    setGame(state)
    gameRef.current = state
    botTurnRef.current = false
    setTimeout(() => startTurn(), 500)
  }

  function applyCardEffects(card: CardDef, caster: PlayerState, target: PlayerState, state: CardGameState, who: 'player' | 'opponent', targetId?: string) {
    const log = (msg: string) => state.log.push(msg)
    const isCombo = who === 'player' ? lastCombo : state.turnActions > 0

    if (card.type === 'creature') {
      if (caster.board.length >= MAX_BOARD) return
      const hasCharge = card.effect?.charge || false
      const cr = createBoardCreature(card, hasCharge || isCombo)
      caster.board = [...caster.board, cr]
      log(`${who === 'player' ? 'Sen' : 'Bot'}: ${card.emoji} ${card.name} oynadı`)

      if (card.effect?.draw) setTimeout(() => drawCards(card.effect!.draw!, who), 200)
      if (card.effect?.heal) caster.hp = Math.min(caster.maxHp, caster.hp + card.effect.heal)
      if (card.effect?.dealToAll) {
        target.board = target.board.map(c => ({ ...c, hp: c.hp - (card.effect?.dealToAll || 0) })).filter(c => c.hp > 0)
      }
      if (card.effect?.destroyRandom && target.board.length > 0) {
        const idx = Math.floor(Math.random() * target.board.length)
        target.board.splice(idx, 1)
        log('Bir yaratık yok edildi!')
      }
      if (card.effect?.stealLife) caster.hp = Math.min(caster.maxHp, caster.hp + 2)
      if (card.effect?.freeze) {
        target.board = target.board.map(c => ({ ...c, frozen: true }))
      }
      if (card.effect?.poison && target.board.length > 0) {
        const idx = Math.floor(Math.random() * target.board.length)
        target.board.splice(idx, 1)
        log('Zehir bir yaratığı yok etti!')
      }
      if (card.effect?.returnToHand && target.board.length > 0) {
        const idx = Math.floor(Math.random() * target.board.length)
        const bounced = target.board[idx]
        target.board.splice(idx, 1)
        target.hand.push(bounced.cardId)
        log('Yaratık ele döndü!')
      }
      if (card.effect?.reduceCost) {
        caster.hand = caster.hand.map(() => '') // placeholder, we apply in hand
      }
      if (card.effect?.addToHand) {
        caster.hand.push(card.effect.addToHand)
      }
      if (card.effect?.combo && isCombo) {
        const comboEff = card.effect.combo.effect
        if (comboEff.damage) {
          if (targetId) {
            const idx = target.board.findIndex(c => c.id === targetId)
            if (idx !== -1) target.board[idx].hp -= comboEff.damage
          } else {
            target.hp -= comboEff.damage
          }
        }
        if (comboEff.destroyRandom && target.board.length > 0) {
          const idx = Math.floor(Math.random() * target.board.length)
          target.board.splice(idx, 1)
        }
      }
      if (card.effect?.copyTarget && target.board.length > 0) {
        const copy = { ...target.board[target.board.length - 1], id: uid() }
        caster.board = [...caster.board, copy]
      }
      if (card.effect?.transform && targetId) {
        const idx = target.board.findIndex(c => c.id === targetId)
        if (idx !== -1) {
          const token = TOKEN_CARDS.find(t => t.id === card.effect!.transform)
          if (token) {
            target.board[idx] = createBoardCreature(token, false)
          }
        }
      }
      sfx.cardPlay()
    } else if (card.type === 'weapon') {
      caster.weaponAtk = card.effect?.buffAttack || 0
      caster.weaponDurability = 3
      log(`${who === 'player' ? 'Sen' : 'Bot'}: ${card.emoji} ${card.name} kuşandı`)
      if (card.effect?.draw) setTimeout(() => drawCards(card.effect!.draw!, who), 200)
      if (card.effect?.stealLife) caster.hp = Math.min(caster.maxHp, caster.hp + 2)
      sfx.cardPlay()
    } else if (card.type === 'spell') {
      if (card.effect?.win) { state.winner = who === 'player' ? 0 : 1; log('Büyük Papaya oynandı!'); return }
      if (card.effect?.damage) {
        if (targetId) {
          const idx = target.board.findIndex(c => c.id === targetId)
          if (idx !== -1) {
            target.board[idx] = { ...target.board[idx], hp: target.board[idx].hp - card.effect.damage }
            if (target.board[idx].hp <= 0) {
              target.board.splice(idx, 1)
            }
          }
        } else {
          target.hp -= card.effect.damage
        }
      }
      if (card.effect?.heal) caster.hp = Math.min(caster.maxHp, caster.hp + card.effect.heal)
      if (card.effect?.draw) setTimeout(() => drawCards(card.effect!.draw!, who), 200)
      if (card.effect?.dealToAll) {
        target.board = target.board.map(c => ({ ...c, hp: c.hp - (card.effect?.dealToAll || 0) })).filter(c => c.hp > 0)
      }
      if (card.effect?.destroyRandom && target.board.length > 0) {
        const idx = Math.floor(Math.random() * target.board.length)
        target.board.splice(idx, 1)
      }
      if (card.effect?.silence && targetId) {
        const idx = target.board.findIndex(c => c.id === targetId)
        if (idx !== -1) target.board[idx] = applyEffectToBoard({ silence: true }, target.board[idx])
      }
      if (card.effect?.stealLife) caster.hp = Math.min(caster.maxHp, caster.hp + 3)
      if (card.effect?.freeze) {
        target.board = target.board.map(c => ({ ...c, frozen: true }))
      }
      if (card.effect?.returnToHand && target.board.length > 0 && targetId) {
        const idx = target.board.findIndex(c => c.id === targetId)
        if (idx !== -1) {
          target.hand.push(target.board[idx].cardId)
          target.board.splice(idx, 1)
        }
      }
      if (card.effect?.copyTarget && target.board.length > 0) {
        const copy = { ...target.board[target.board.length - 1], id: uid() }
        caster.board = [...caster.board, copy]
      }
      if (card.effect?.transform && targetId) {
        const idx = target.board.findIndex(c => c.id === targetId)
        if (idx !== -1) {
          const token = TOKEN_CARDS.find(t => t.id === card.effect!.transform)
          if (token) {
            target.board[idx] = createBoardCreature(token, false)
          }
        }
      }
      if (card.effect?.discover) {
        const pool = [...allCards].sort(() => Math.random() - 0.5).slice(0, 3)
        setDiscoverCards(pool)
        return
      }
      if (card.effect?.buffAttack && targetId) {
        const idx = caster.board.findIndex(c => c.id === targetId)
        if (idx !== -1) caster.board[idx].attack += card.effect.buffAttack
      }
      if (card.effect?.buffHp && targetId) {
        const idx = caster.board.findIndex(c => c.id === targetId)
        if (idx !== -1) { caster.board[idx].hp += card.effect.buffHp; caster.board[idx].maxHp += card.effect.buffHp }
      }
      log(`${who === 'player' ? 'Sen' : 'Bot'}: ${card.emoji} ${card.name}`)
      sfx.spellCast()
    }

    if (target.hp <= 0) state.winner = who === 'player' ? 0 : 1
  }

  function resolveAttack(attacker: BoardCreature, target: 'hero' | string, caster: PlayerState, targetPlayer: PlayerState, state: CardGameState) {
    if (target === 'hero') {
      const dmg = attacker.attack
      const newTarget = dealDamage(targetPlayer, dmg)
      targetPlayer.hp = newTarget.hp
      targetPlayer.armor = newTarget.armor
      state.log.push(`${getCard(attacker.cardId)?.emoji} heroya ${dmg} hasar!`)
      if (attacker.frenzy) {
        attacker.attack += 1
        attacker.hp += 1
      }
      if (attacker.poison) {
        targetPlayer.hp -= 999
      }
      if (attacker.deathrattle) {
        const eff = attacker.deathrattle.effect
        if (eff.heal) caster.hp = Math.min(caster.maxHp, caster.hp + eff.heal)
        if (eff.damage) targetPlayer.hp -= eff.damage
        if (eff.freeze) targetPlayer.board = targetPlayer.board.map(c => ({ ...c, frozen: true }))
        if (eff.buffHp) caster.board = caster.board.map(c => ({ ...c, hp: c.hp + (eff.buffHp || 0), maxHp: c.maxHp + (eff.buffHp || 0) }))
      }
      sfx.creatureAttack()
      if (targetPlayer.hp <= 0) state.winner = state.turnOwner === 0 ? 1 : 0
    } else {
      const idx = targetPlayer.board.findIndex(c => c.id === target)
      if (idx === -1) return
      const defender = targetPlayer.board[idx]
      let defHp = defender.hp
      let atkHp = attacker.hp

      if (attacker.shield > 0) {
        attacker.shield -= 1
      } else {
        atkHp -= defender.attack
      }

      if (attacker.poison) {
        defHp = 0
      } else {
        if (defender.shield > 0) {
          defender.shield -= 1
        } else {
          defHp -= attacker.attack
        }
      }

      if (attacker.frenzy && defHp <= 0) {
        attacker.attack += 1
        attacker.maxHp += 1
        attacker.hp += 1
      }

      if (attacker.deathrattle) {
        const eff = attacker.deathrattle.effect
        if (eff.heal) caster.hp = Math.min(caster.maxHp, caster.hp + eff.heal)
        if (eff.damage) targetPlayer.hp -= eff.damage
        if (eff.freeze) targetPlayer.board = targetPlayer.board.map(c => ({ ...c, frozen: true }))
        if (eff.buffHp) caster.board = caster.board.map(c => ({ ...c, hp: c.hp + (eff.buffHp || 0), maxHp: c.maxHp + (eff.buffHp || 0) }))
      }

      state.log.push(`${getCard(attacker.cardId)?.emoji} ⚔️ ${getCard(defender.cardId)?.emoji}`)

      attacker.hp = atkHp
      targetPlayer.board[idx] = { ...defender, hp: defHp }

      if (targetPlayer.board[idx].hp <= 0) {
        const dead = targetPlayer.board[idx]
        if (dead.deathrattle) {
          const eff = dead.deathrattle.effect
          if (eff.heal) targetPlayer.hp = Math.min(targetPlayer.maxHp, targetPlayer.hp + eff.heal)
          if (eff.damage) caster.hp -= eff.damage
          if (eff.freeze) caster.board = caster.board.map(c => ({ ...c, frozen: true }))
          if (eff.buffHp) targetPlayer.board = targetPlayer.board.map(c => ({ ...c, hp: c.hp + (eff.buffHp || 0), maxHp: c.maxHp + (eff.buffHp || 0) }))
        }
        targetPlayer.board.splice(idx, 1)
        sfx.creatureDeath()
      }
      if (attacker.hp <= 0) {
        const dead = { ...attacker }
        caster.board = caster.board.filter(c => c.id !== attacker.id)
        if (dead.deathrattle) {
          const eff = dead.deathrattle.effect
          if (eff.heal) caster.hp = Math.min(caster.maxHp, caster.hp + eff.heal)
          if (eff.damage) targetPlayer.hp -= eff.damage
          if (eff.freeze) targetPlayer.board = targetPlayer.board.map(c => ({ ...c, frozen: true }))
          if (eff.buffHp) caster.board = caster.board.map(c => ({ ...c, hp: c.hp + (eff.buffHp || 0), maxHp: c.maxHp + (eff.buffHp || 0) }))
        }
        sfx.creatureDeath()
      }
      sfx.creatureAttack()
      if (targetPlayer.hp <= 0) state.winner = state.turnOwner === 0 ? 1 : 0
    }
    attacker.canAttack = false
  }

  const playCard = useCallback((card: CardDef, handIndex: number) => {
    if (!game || !isPlayerTurn || game.phase !== 'main' || card.cost > game.player.mana) return

    if (card.type === 'creature') {
      if (game.player.board.length >= MAX_BOARD) { showMsg('Board dolu!'); return }
      setGame((g) => {
        if (!g) return g
        const p = { ...g.player }
        p.hand = p.hand.filter((_, i) => i !== handIndex)
        p.mana -= card.cost
        const cr = createBoardCreature(card, card.effect?.charge || false)
        p.board = [...p.board, cr]
        const opp = { ...g.opponent }
        const newG = { ...g, player: p, opponent: opp, turnActions: g.turnActions + 1 }
        setLastCombo(true)
        setTimeout(() => setLastCombo(false), 100)

        const effectState = { ...newG, winner: null }
        applyCardEffects(card, p, opp, effectState as CardGameState, 'player')

        if (effectState.winner) return { ...newG, winner: effectState.winner }
        if (opp.hp <= 0) return { ...newG, winner: 0 }

        return { ...newG, player: p, opponent: opp }
      })
      setSelectedHand(null)
    } else if (card.type === 'weapon') {
      setGame((g) => {
        if (!g) return g
        const p = { ...g.player }
        p.hand = p.hand.filter((_, i) => i !== handIndex)
        p.mana -= card.cost
        p.weaponAtk = card.effect?.buffAttack || 0
        p.weaponDurability = 3
        addLog(`Sen: ${card.emoji} ${card.name} kuşandın`)
        sfx.cardPlay()
        return { ...g, player: p, turnActions: g.turnActions + 1 }
      })
      setSelectedHand(null)
    } else if (card.type === 'spell') {
      if (card.effect?.silence || card.effect?.buffAttack || card.effect?.buffHp || card.effect?.transform || card.effect?.returnToHand) {
        if (card.effect?.silence && game.opponent.board.length === 0) { showMsg('Hedef yok!'); return }
        if ((card.effect?.buffAttack || card.effect?.buffHp) && game.player.board.length === 0) { showMsg('Yaratığın yok!'); return }
        if ((card.effect?.transform || card.effect?.returnToHand) && game.opponent.board.length === 0) { showMsg('Hedef yok!'); return }
        setTargetMode(
          card.effect?.silence ? 'enemy_creature' :
          card.effect?.transform ? 'enemy_creature' :
          card.effect?.returnToHand ? 'enemy_creature' :
          'own_creature'
        )
        setPendingCard(card)
        return
      }
      applySpell(card, handIndex)
    }
  }, [game, isPlayerTurn, addLog, showMsg])

  const applySpell = useCallback((card: CardDef, handIndex: number, targetId?: string) => {
    setGame((g) => {
      if (!g) return g
      const p = { ...g.player }
      p.hand = p.hand.filter((_, i) => i !== handIndex)
      p.mana -= card.cost
      const opp = { ...g.opponent }
      const state = { ...g, player: p, opponent: opp, winner: null } as CardGameState
      setLastCombo(true)
      setTimeout(() => setLastCombo(false), 100)

      if (card.effect?.damage) {
        if (targetId && opp.board.length > 0) {
          const idx = opp.board.findIndex(c => c.id === targetId)
          if (idx !== -1) {
            opp.board[idx] = { ...opp.board[idx], hp: opp.board[idx].hp - (card.effect?.damage || 0) }
            if (opp.board[idx].hp <= 0) opp.board.splice(idx, 1)
          }
        } else {
          opp.hp -= card.effect.damage
        }
      }
      if (card.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + card.effect.heal)
      if (card.effect?.draw) setTimeout(() => drawCards(card.effect!.draw!, 'player'), 200)
      if (card.effect?.dealToAll) {
        opp.board = opp.board.map(c => ({ ...c, hp: c.hp - (card.effect?.dealToAll || 0) })).filter(c => c.hp > 0)
      }
      if (card.effect?.destroyRandom && opp.board.length > 0) {
        const idx = Math.floor(Math.random() * opp.board.length)
        opp.board.splice(idx, 1)
      }
      if (card.effect?.silence && targetId) {
        const idx = opp.board.findIndex(c => c.id === targetId)
        if (idx !== -1) opp.board[idx] = applyEffectToBoard({ silence: true }, opp.board[idx])
      }
      if (card.effect?.buffAttack && targetId) {
        const idx = p.board.findIndex(c => c.id === targetId)
        if (idx !== -1) p.board[idx].attack += card.effect.buffAttack
      }
      if (card.effect?.buffHp && targetId) {
        const idx = p.board.findIndex(c => c.id === targetId)
        if (idx !== -1) { p.board[idx].hp += (card.effect?.buffHp || 0); p.board[idx].maxHp += (card.effect?.buffHp || 0) }
      }
      if (card.effect?.win) return { ...g, player: p, opponent: opp, winner: 0 }
      if (card.effect?.stealLife) p.hp = Math.min(p.maxHp, p.hp + 3)
      if (card.effect?.freeze) {
        opp.board = opp.board.map(c => ({ ...c, frozen: true }))
      }
      if (card.effect?.returnToHand && targetId) {
        const idx = opp.board.findIndex(c => c.id === targetId)
        if (idx !== -1) {
          opp.hand.push(opp.board[idx].cardId)
          opp.board.splice(idx, 1)
        }
      }
      if (card.effect?.copyTarget && opp.board.length > 0) {
        const copy = { ...opp.board[opp.board.length - 1], id: uid() }
        p.board = [...p.board, copy]
      }
      if (card.effect?.transform && targetId) {
        const idx = opp.board.findIndex(c => c.id === targetId)
        if (idx !== -1) {
          const token = TOKEN_CARDS.find(t => t.id === card.effect!.transform)
          if (token) opp.board[idx] = createBoardCreature(token, false)
        }
      }
      if (card.effect?.discover) {
        const pool = [...allCards].sort(() => Math.random() - 0.5).slice(0, 3)
        setDiscoverCards(pool)
      }

      if (opp.hp <= 0) return { ...state, player: p, opponent: opp, winner: 0 }

      sfx.spellCast()
      addLog(`Sen: ${card.emoji} ${card.name}`)
      return { ...state, player: p, opponent: opp, turnActions: state.turnActions + 1 }
    })
    setSelectedHand(null)
    setTargetMode('none')
    setPendingCard(null)
  }, [addLog, drawCards])

  const handleTarget = useCallback((cr: BoardCreature) => {
    if (!pendingCard || !game) return
    const handIdx = game.player.hand.indexOf(pendingCard.id)
    if (handIdx !== -1) applySpell(pendingCard, handIdx, cr.id)
  }, [pendingCard, game, applySpell])

  const handleAttack = useCallback((cr: BoardCreature) => {
    if (!game || !isPlayerTurn || game.phase !== 'main' || !cr.canAttack) return
    if (cr.frozen) { showMsg('Donmuş!'); return }
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
    attackHero(cr)
  }, [game, isPlayerTurn, showMsg])

  const attackHero = useCallback((cr: BoardCreature) => {
    setGame((g) => {
      if (!g) return g
      const p = { ...g.player }
      const opp = { ...g.opponent }
      const dmg = cr.attack + p.weaponAtk
      const newOpp = dealDamage(opp, dmg)
      opp.hp = newOpp.hp
      opp.armor = newOpp.armor
      p.board = p.board.map(c => c.id === cr.id ? { ...c, canAttack: false } : c)

      if (cr.frenzy) {
        p.board = p.board.map(c => c.id === cr.id ? { ...c, attack: c.attack + 1, hp: c.hp + 1, maxHp: c.maxHp + 1 } : c)
      }
      if (cr.deathrattle) {
        const eff = cr.deathrattle.effect
        if (eff?.heal) p.hp = Math.min(p.maxHp, p.hp + (eff.heal || 0))
        if (eff?.damage) opp.hp -= (eff.damage || 0)
      }

      addLog(`Sen: ${getCard(cr.cardId)?.emoji} rakibe ${dmg} hasar!`)
      sfx.creatureAttack()
      if (opp.hp <= 0) return { ...g, player: p, opponent: opp, winner: 0 }
      return { ...g, player: p, opponent: opp }
    })
    setTargetMode('none')
  }, [addLog, dealDamage])

  const useHeroPower = useCallback(() => {
    if (!game || !isPlayerTurn || game.phase !== 'main') return
    const hero = getHero(game.player.hero)
    if (game.player.mana < hero.powerCost) { showMsg('Mana yetersiz!'); return }
    if (game.player.heroPowerUsed) { showMsg('Kahraman gücü zaten kullanıldı!'); return }

    const targetMode = getHeroPowerTargetMode(hero.id)
    if (targetMode === 'own_creature' && game.player.board.length === 0) { showMsg('Yaratığın yok!'); return }
    if (targetMode === 'enemy_creature' && game.opponent.board.length === 0) { showMsg('Hedef yok!'); return }

    if (targetMode !== 'none' && targetMode !== 'hero') {
      setTargetMode(targetMode)
      setPendingCard(null)
      return
    }

    applyHeroPower()
  }, [game, isPlayerTurn, showMsg])

  const applyHeroPower = useCallback((targetId?: string) => {
    setGame((g) => {
      if (!g) return g
      const hero = getHero(g.player.hero)
      const p = { ...g.player }
      p.mana -= hero.powerCost
      p.heroPowerUsed = true
      const opp = { ...g.opponent }

      const effect = hero.powerEffect
      if (effect.buffAttack && targetId) {
        const idx = p.board.findIndex(c => c.id === targetId)
        if (idx !== -1) p.board[idx].attack += effect.buffAttack
      }
      if (effect.damage) {
        if (targetId) {
          const idx = opp.board.findIndex(c => c.id === targetId)
          if (idx !== -1) opp.board[idx].hp -= effect.damage
        } else {
          opp.hp -= effect.damage
        }
      }
      if (effect.heal) p.hp = Math.min(p.maxHp, p.hp + effect.heal)
      if (effect.draw) setTimeout(() => drawCards(effect.draw!, 'player'), 200)

      addLog(`⚡ Kahraman gücü: ${hero.powerName}`)
      sfx.heroPower()
      if (opp.hp <= 0) return { ...g, player: p, opponent: opp, winner: 0 }
      return { ...g, player: p, opponent: opp }
    })
    setTargetMode('none')
  }, [addLog, drawCards])

  const endTurn = useCallback(() => {
    if (!game || !isPlayerTurn || game.phase !== 'main') return
    setGame((g) => {
      if (!g) return g
      return { ...g, turnOwner: 1, phase: 'main' as GamePhase, turn: g.turn + 1 }
    })
    addLog('Turunu bitirdin ⏭️')
    setTimeout(() => {
      setGame((g) => {
        if (!g) return g
        const g2 = JSON.parse(JSON.stringify(g)) as CardGameState
        setTimeout(() => runBotTurn(g2), 400)
        botTurnRef.current = true
        return g
      })
    }, 300)
  }, [game, isPlayerTurn, addLog])

  const handleDiscover = useCallback((card: CardDef) => {
    setGame((g) => {
      if (!g) return g
      const p = { ...g.player }
      p.hand = [...p.hand, card.id]
      return { ...g, player: p }
    })
    setDiscoverCards(null)
    addLog(`Keşif: ${card.emoji} ${card.name} seçildi`)
    sfx.cardPlay()
  }, [addLog])

  const restartGame = useCallback(() => {
    setGame(null)
    setHeroSelected(null)
    botTurnRef.current = false
    setSelectedHand(null)
    setTargetMode('none')
    setPendingCard(null)
    setDiscoverCards(null)
  }, [])

  if (!heroSelected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <HeroSelect selected={null} onSelect={(id) => startGame(id)} />
          <div className="flex gap-2 mt-2">
            {(['easy', 'normal', 'hard'] as BotLevel[]).map(level => (
              <button
                key={level}
                onClick={() => setBotLevel(level)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                  botLevel === level
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {level === 'easy' ? '🟢 Köylü' : level === 'normal' ? '🟡 Savaşçı' : '🔴 Kumandan'}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!game) return null

  const hero = getHero(game.player.hero)
  const playerHand = game.player.hand.map((id) => getCard(id)).filter((c): c is CardDef => !!c)
  const canEndTurn = isPlayerTurn && game.phase === 'main'

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900">
      <CardAnimationOverlay />

      {animMsg && (
        <div className="absolute left-1/2 top-1/3 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg animate-pop-in pointer-events-none">
          {animMsg}
        </div>
      )}

      {discoverCards && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl p-6 border border-white/20">
            <h3 className="text-white font-bold text-lg mb-4 text-center">🔍 Keşif — Bir kart seç</h3>
            <div className="flex gap-3">
              {discoverCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleDiscover(card)}
                  className="bg-gradient-to-br from-purple-600 to-indigo-800 p-4 rounded-xl border border-white/20 hover:scale-105 transition text-center min-w-[100px]"
                >
                  <div className="text-3xl">{card.emoji}</div>
                  <div className="text-white text-xs font-bold mt-1">{card.name}</div>
                  <div className="text-blue-300 text-xs">{card.cost} mana</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {game.winner !== null && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-pop-in">
          <div className="mx-6 flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-br from-yellow-500/20 to-purple-500/20 p-8 text-center">
            <div className="text-6xl">{game.winner === 0 ? '🎉' : '😔'}</div>
            <h2 className="mt-3 text-2xl font-extrabold text-white">
              {game.winner === 0 ? 'Zafer!' : 'Mağlubiyet'}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {game.winner === 0 ? 'Rakibi yendin! 🪙+15' : 'Tekrar dene! 🪙+5'}
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => navigate('/games')} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition">Oyunlar</button>
              <button onClick={restartGame} className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg font-bold transition hover:brightness-110">Rövanş</button>
            </div>
          </div>
        </div>
      )}

      <header className="flex items-center gap-2 px-3 pt-2 pb-1">
        <button onClick={() => navigate('/games')} className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-white/60 hover:bg-white/10">‹</button>
        <span className="text-lg">{hero.emoji}</span>
        <h1 className="flex items-center gap-1 text-lg font-extrabold text-white">🎴 Kart Savaşı</h1>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">Tur {Math.floor(game.turn / 2) + 1}</span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-3 py-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="text-sm font-semibold text-white/80">
              Bot {game.botDifficulty === 'easy' ? '🟢' : game.botDifficulty === 'normal' ? '🟡' : '🔴'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {game.opponent.armor > 0 && <span className="text-blue-300 text-xs">🛡️{game.opponent.armor}</span>}
            <div className="flex items-center gap-1 text-xs">
              <ManaCrystal current={game.opponent.mana} max={game.opponent.maxMana} />
            </div>
            <span className="text-sm font-bold text-white">{game.opponent.hp}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: game.opponent.maxHp > 30 ? 20 : game.opponent.maxHp }, (_, i) => (
                <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < game.opponent.hp ? 'bg-red-400' : 'bg-white/15'}`} />
              ))}
            </div>
            <CardDrawPile count={game.opponent.deck.length} label="Deste" />
          </div>
        </div>

        <CardBoard creatures={game.opponent.board} isOpponent title="Rakip" />

        <div className="border-t border-white/5 mx-3 my-1" />

        <div className="flex-1 flex flex-col">
          <CardBoard
            creatures={game.player.board}
            onAttack={handleAttack}
            onTarget={targetMode !== 'none' ? handleTarget : undefined}
            selectable={targetMode !== 'none'}
            title="Senin Yaratıkların"
          />

          {targetMode !== 'none' && (
            <div className="text-center text-xs text-yellow-400 animate-pulse py-1">
              {targetMode === 'enemy_creature' ? 'Düşman yaratığını seç' : 'Kendi yaratığını seç'}
            </div>
          )}

          <div className="flex items-center justify-between px-3 py-1">
            <div className="flex items-center gap-2">
              <ManaCrystal current={game.player.mana} max={game.player.maxMana} />
              <span className="text-[10px] text-white/40">{game.player.mana}/{game.player.maxMana}</span>
              {game.player.armor > 0 && <span className="text-blue-300 text-xs">🛡️{game.player.armor}</span>}
              {game.player.weaponAtk > 0 && <span className="text-xs text-orange-300">🗡️+{game.player.weaponAtk}</span>}
              {!game.player.heroPowerUsed && isPlayerTurn && game.player.mana >= hero.powerCost && (
                <button
                  onClick={useHeroPower}
                  className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-0.5 rounded font-bold transition"
                  title={`${hero.powerName}: ${hero.powerDesc}`}
                >
                  {hero.emoji} {hero.powerCost}🔮
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: game.player.maxHp > 30 ? 20 : game.player.maxHp }, (_, i) => (
                  <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < game.player.hp ? 'bg-green-400' : 'bg-white/15'}`} />
                ))}
              </div>
              <span className="text-sm font-bold text-white">{game.player.hp}</span>
              <CardDrawPile count={game.player.deck.length} label="Deste" />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-gray-800/50 pt-2">
          <CardHand
            cards={playerHand}
            mana={game.player.mana}
            onPlayCard={playCard}
            selectedIndex={selectedHand}
            onSelect={setSelectedHand}
            disabled={!isPlayerTurn || game.winner !== null}
          />

          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <div className="text-[10px] text-white/30">
              🎴 {game.player.hand.length} kart
            </div>
            {canEndTurn && (
              <button
                onClick={endTurn}
                className="rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 px-5 py-1.5 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition"
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
