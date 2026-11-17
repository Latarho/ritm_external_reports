import { COMPETENCIES, LEARNING_GRID, ROLES, SCALE_SECTIONS } from "./definitions"
import type { ParticipantResults } from "./types"

/**
 * Демонстрационные результаты: детерминированно рассчитываются из id участника,
 * чтобы отчёт выглядел одинаково при каждом открытии. Заменить на данные Zetic.
 */

function hash(text: string): number {
  let h = 0x811c9dc5
  for (const ch of text) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function rng(seed: string) {
  let a = hash(seed)
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Приблизительно нормальное распределение (сумма трёх равномерных). */
function around(random: () => number, center: number, spread: number) {
  return center + (random() + random() + random() - 1.5) * spread
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Типичный уровень компетенции по рынку — чтобы профиль группы был правдоподобным. */
const COMPETENCY_CENTER: Record<string, number> = {
  "Принятие решений": 40,
  "Достижение результатов": 55,
  "Убеждение и влияние": 48,
  "Сотрудничество": 52,
  "Лидерство": 72,
  "Управление собой": 56,
  "Стрессоустойчивость": 50,
  "Ресурсность": 53,
  "Стратегия": 42,
  "Навыки управления": 63,
  "Развитие бизнеса": 56,
  "Проф. реализация": 84,
}

const LEARNING_STYLES = LEARNING_GRID.flat().map((s) => s.key)

export function demoResults(participantId: string): ParticipantResults {
  const random = rng(participantId)
  const personal = around(random, 0, 14)

  const competencies = Object.fromEntries(
    COMPETENCIES.map((c) => [
      c,
      Math.round(clamp(around(random, COMPETENCY_CENTER[c] + personal, 34), 4, 98)),
    ]),
  ) as ParticipantResults["competencies"]

  const scales: Record<string, number> = {}
  for (const section of SCALE_SECTIONS) {
    for (const group of section.groups) {
      for (const scale of group.scales) {
        const center = 2.5 + (hash(scale.key) % 50) / 10 // своё «среднее» у каждой шкалы
        scales[scale.key] = Math.round(clamp(around(random, center, 5), 0, 10))
      }
    }
  }

  // Большинство руководителей — «практики», как в типичных отчётах.
  const styleRoll = random()
  const learningStyle =
    styleRoll < 0.7 ? "practitioner" : LEARNING_STYLES[Math.floor(random() * LEARNING_STYLES.length)]

  return {
    competencies,
    role: ROLES[Math.floor(random() * ROLES.length)].key,
    potential: Math.round(clamp(around(random, 55, 70), 3, 97)),
    managerSkills: Math.round(clamp(around(random, 60, 70), 3, 97)),
    scales,
    learningStyle,
  }
}
