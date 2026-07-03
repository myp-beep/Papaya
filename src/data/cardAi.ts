import type { CardDef, PlayerState, BoardCreature, BotLevel } from '../types'

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickBotPlay(hand: CardDef[], player: PlayerState, opponent: PlayerState, level: BotLevel = 'normal'): { card: CardDef; targetId?: string } | null {
  const playable = hand.filter((c) => c.cost <= player.mana)
  if (playable.length === 0) return null

  switch (level) {
    case 'easy': return easyPlay(playable, player, opponent)
    case 'normal': return normalPlay(playable, player, opponent)
    case 'hard': return hardPlay(playable, player, opponent)
  }
}

function easyPlay(playable: CardDef[], _player: PlayerState, _opponent: PlayerState): { card: CardDef; targetId?: string } | null {
  return { card: randItem(playable) }
}

function normalPlay(playable: CardDef[], player: PlayerState, opponent: PlayerState): { card: CardDef; targetId?: string } | null {
  const creatures = playable.filter(c => c.type === 'creature').sort((a, b) => (b.cost - a.cost) || ((b.attack || 0) - (a.attack || 0)))
  if (creatures.length > 0 && player.board.length < 5) return { card: creatures[0] }

  const weapons = playable.filter(c => c.type === 'weapon' && (player.weaponAtk === 0 || c.cost >= player.weaponAtk))
  if (weapons.length > 0) return { card: weapons[0] }

  const spells = playable.filter(c => c.type === 'spell')

  const heal = spells.find(c => c.effect?.heal && player.hp <= player.maxHp - (c.effect?.heal || 0))
  if (heal) return { card: heal }

  const dmg = spells.find(c => c.effect?.damage && c.effect.damage >= opponent.hp)
  if (dmg) return { card: dmg }

  if (opponent.board.length > 0) {
    const destroy = spells.find(c => c.effect?.destroyRandom)
    if (destroy) return { card: destroy }

    const aoe = spells.find(c => c.effect?.dealToAll)
    if (aoe) return { card: aoe }
  }

  if (player.board.length > 0) {
    const buff = spells.find(c => c.effect?.buffAttack)
    if (buff) return { card: buff, targetId: player.board[0].id }
  }

  const win = spells.find(c => c.effect?.win)
  if (win) return { card: win }

  if (playable.length > 0) return { card: playable[0] }
  return null
}

function hardPlay(playable: CardDef[], player: PlayerState, opponent: PlayerState): { card: CardDef; targetId?: string } | null {
  const sorted = [...playable].sort((a, b) => {
    const aScore = cardScore(a, player, opponent)
    const bScore = cardScore(b, player, opponent)
    return bScore - aScore
  })

  if (sorted.length === 0) return null
  const best = sorted[0]

  if (best.type === 'spell' && best.effect?.damage) {
    if (opponent.board.length > 0) {
      const weakest = [...opponent.board].sort((a, _b) => a.hp - _b.hp)[0]
      return { card: best, targetId: weakest.id }
    }
    return { card: best }
  }

  if (best.type === 'spell' && (best.effect?.buffAttack || best.effect?.buffHp) && player.board.length > 0) {
    const strongest = [...player.board].sort((a, b) => (b.attack + b.hp) - (a.attack + a.hp))[0]
    return { card: best, targetId: strongest.id }
  }

  if (best.type === 'spell' && best.effect?.silence && opponent.board.length > 0) {
    const dangerous = [...opponent.board].sort((a, b) => (b.attack - a.attack))[0]
    return { card: best, targetId: dangerous.id }
  }

  if (best.type === 'spell' && best.effect?.transform && opponent.board.length > 0) {
    const strongest = [...opponent.board].sort((a, b) => (b.attack + b.hp) - (a.attack + a.hp))[0]
    return { card: best, targetId: strongest.id }
  }

  return { card: best }
}

function cardScore(card: CardDef, player: PlayerState, opponent: PlayerState): number {
  let score = card.cost * 2

  if (card.type === 'creature') {
    score += (card.attack || 0) * 3 + (card.hp || 0) * 2
    if (card.effect?.taunt) score += 3
    if (card.effect?.charge) score += 4
    if (card.effect?.poison) score += 5
    if (card.effect?.shield) score += card.effect.shield * 3
    if (card.effect?.frenzy) score += 3
    if (card.effect?.deathrattle) score += 3
    if (card.effect?.stealLife) score += 4
    if (card.effect?.draw) score += card.effect.draw * 4
    if (card.effect?.freeze) score += 2
    if (card.effect?.returnToHand && opponent.board.length > 0) score += 4
    if (card.effect?.reduceCost) score += 5
    if (player.board.length >= 5) score -= 10
  }

  if (card.type === 'spell') {
    if (card.effect?.damage) {
      const needed = opponent.board.reduce((s, c) => s + c.hp, 0)
      score += Math.min(card.effect.damage * 2, needed * 2)
    }
    if (card.effect?.heal && player.hp < player.maxHp) score += card.effect.heal * 2
    if (card.effect?.draw) score += card.effect.draw * 4
    if (card.effect?.destroyRandom && opponent.board.length > 0) score += 6
    if (card.effect?.dealToAll && opponent.board.length > 0) score += opponent.board.length * 2
    if (card.effect?.win) score += 100
    if (card.effect?.silence && opponent.board.some(c => c.taunt || c.frenzy)) score += 4
    if (card.effect?.transform && opponent.board.length > 0) score += 5
    if (card.effect?.copyTarget && opponent.board.length > 0) score += 4
    if (card.effect?.discover) score += 3
  }

  if (card.type === 'weapon') {
    score += (card.effect?.buffAttack || 0) * 3
    if (card.effect?.stealLife) score += 3
    if (card.effect?.draw) score += (card.effect.draw || 0) * 4
    if (player.weaponAtk > 0 && (card.effect?.buffAttack || 0) <= player.weaponAtk) score -= 5
  }

  return score
}

export function pickBotAttack(attackers: BoardCreature[], opponentBoard: BoardCreature[], opponentHp: number, level: BotLevel = 'normal'): { attacker: BoardCreature; target: 'hero' | string } | null {
  if (attackers.length === 0) return null

  if (level === 'easy') {
    const a = randItem(attackers)
    if (opponentBoard.length > 0 && Math.random() > 0.5) {
      return { attacker: a, target: randItem(opponentBoard).id }
    }
    return { attacker: a, target: 'hero' }
  }

  const taunts = opponentBoard.filter(c => c.taunt)
  if (taunts.length > 0) {
    const weakest = [...taunts].sort((a, b) => a.hp - b.hp)[0]
    const best = [...attackers].sort((a, b) => b.attack - a.attack)[0]
    return { attacker: best, target: weakest.id }
  }

  const totalAtk = attackers.reduce((s, a) => s + a.attack, 0)
  if (level === 'hard' && totalAtk >= opponentHp) {
    return { attacker: attackers[0], target: 'hero' }
  }

  const poisoned = attackers.filter(a => a.poison)
  if (poisoned.length > 0 && opponentBoard.length > 0) {
    const biggest = [...opponentBoard].sort((a, b) => b.hp - a.hp)[0]
    return { attacker: poisoned[0], target: biggest.id }
  }

  if (opponentBoard.length > 0) {
    const weakest = [...opponentBoard].sort((a, b) => a.hp - b.hp)[0]
    const best = [...attackers].sort((a, b) => {
      const aCanKill = a.attack >= weakest.hp ? 10 : 0
      const bCanKill = b.attack >= weakest.hp ? 10 : 0
      return (bCanKill - aCanKill) || (b.attack - a.attack)
    })[0]
    if (best.attack >= weakest.hp || opponentBoard.length <= 2 || level === 'hard') {
      return { attacker: best, target: weakest.id }
    }
  }

  const attacker = level === 'hard'
    ? [...attackers].sort((a, b) => b.attack - a.attack)[0]
    : attackers[0]
  return { attacker, target: 'hero' }
}
