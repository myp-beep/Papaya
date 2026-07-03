import type { CardDef, PlayerState, BoardCreature } from '../types'

// Bot kararları için basit ama etkili AI

export function pickBotPlay(hand: CardDef[], player: PlayerState, opponent: PlayerState): { card: CardDef; targetId?: string } | null {
  const playable = hand.filter((c) => c.cost <= player.mana)
  if (playable.length === 0) return null

  // Önce büyük yaratıkları oyna
  const creatures = playable.filter((c) => c.type === 'creature').sort((a, b) => (b.cost - a.cost) || ((b.attack || 0) - (a.attack || 0)))

  if (creatures.length > 0 && player.board.length < 5) {
    const card = creatures[0]
    return { card }
  }

  // Silah kuşan
  const weapons = playable.filter((c) => c.type === 'weapon' && (player.weaponAtk === 0 || c.cost > player.weaponAtk))
  if (weapons.length > 0) {
    return { card: weapons[0] }
  }

  // Büyüler
  const spells = playable.filter((c) => c.type === 'spell')

  // İyileştirme: canı düşükse
  const heal = spells.find((c) => c.effect?.heal && player.hp <= player.maxHp - (c.effect?.heal || 0))
  if (heal) return { card: heal }

  // Doğrudan hasar: rakibin canı düşükse bitir
  const dmg = spells.find((c) => c.effect?.damage && c.effect.damage >= opponent.hp)
  if (dmg) return { card: dmg }

  // Yaratık yok etme
  if (opponent.board.length > 0) {
    const destroy = spells.find((c) => c.effect?.destroyRandom)
    if (destroy && opponent.board.length > 0) return { card: destroy }

    const aoe = spells.find((c) => c.effect?.dealToAll)
    if (aoe) return { card: aoe }

    const silence = spells.find((c) => c.effect?.silence)
    if (silence) return { card: silence, targetId: opponent.board[0].id }
  }

  // Güçlendirme: kendi yaratığına
  if (player.board.length > 0) {
    const buff = spells.find((c) => c.effect?.buffAttack)
    if (buff) return { card: buff, targetId: player.board[0].id }
  }

  // Kazanma büyüsü
  const win = spells.find((c) => c.effect?.win)
  if (win && player.mana >= (win.cost || 0)) return { card: win }

  return null
}

export function pickBotAttack(attackers: BoardCreature[], opponentBoard: BoardCreature[], opponentHp: number): { attacker: BoardCreature; target: 'hero' | string } | null {
  if (attackers.length === 0) return null

  // Taunt varsa önce onları yok et
  const taunts = opponentBoard.filter((c) => c.taunt)
  if (taunts.length > 0) {
    const weakest = [...taunts].sort((a, b) => a.hp - b.hp)[0]
    const attacker = [...attackers].sort((a, b) => b.attack - a.attack)[0]
    return { attacker, target: weakest.id }
  }

  // Toplam hasar rakibi öldürmeye yetiyorsa hero'ya git
  const totalAtk = attackers.reduce((s, a) => s + a.attack, 0)
  if (totalAtk >= opponentHp) {
    const attacker = [...attackers].sort((a, b) => b.attack - a.attack)[0]
    return { attacker, target: 'hero' }
  }

  // En zayıf düşman yaratığını vur
  if (opponentBoard.length > 0) {
    const weakest = [...opponentBoard].sort((a, b) => a.hp - b.hp)[0]
    const attacker = [...attackers].sort((a, b) => b.attack - a.attack)[0]
    if (attacker.attack >= weakest.hp || opponentBoard.length <= 2) {
      return { attacker, target: weakest.id }
    }
  }

  // Hero'ya git
  const attacker = attackers[0]
  return { attacker, target: 'hero' }
}
