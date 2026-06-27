import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { AnswerSubmission, Question, PsqiScores, PersonaScores, AssessmentResult } from '../../shared/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const personalities = JSON.parse(
  readFileSync(join(__dirname, '../data/personalities.json'), 'utf-8')
);
const questions: Question[] = JSON.parse(
  readFileSync(join(__dirname, '../data/questions.json'), 'utf-8')
);

export function computeScores(answers: AnswerSubmission[]): PsqiScores {
  const questionMap = new Map<string, Question>(
    (questions as Question[]).map(q => [q.id, q])
  );

  const dims: Record<string, number> = {
    quality_score: 0,
    latency_score: 0,
    duration_score: 0,
    efficiency_score: 0,
    disturbance_score: 0,
    medication_score: 0,
    daytime_score: 0,
    rumination_score: 0,
    bed_awake_score: 0,
    night_waking_score: 0,
    early_waking_score: 0,
    return_sleep_score: 0,
    daytime_energy_score: 0,
    focus_mood_score: 0,
    sleep_delay_score: 0,
    private_time_score: 0,
    routine_stability_score: 0,
    recovery_score: 0,
  };

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;
    const option = question.options[answer.optionIndex];
    if (!option) continue;
    for (const [key, value] of Object.entries(option.scoring)) {
      if (key in dims) {
        dims[key] += value;
      }
    }
  }

  const psqi_lite_total =
    dims.quality_score + dims.latency_score + dims.duration_score +
    dims.efficiency_score + dims.disturbance_score +
    dims.medication_score + dims.daytime_score;

  const sleep_wellness_score = Math.round(100 - (psqi_lite_total / 21) * 100);

  return {
    ...dims as PsqiScores,
    psqi_lite_total,
    sleep_wellness_score,
  };
}

export function computePersonaScores(scores: PsqiScores): PersonaScores {
  const {
    quality_score, latency_score, duration_score, efficiency_score,
    disturbance_score, medication_score, daytime_score,
    rumination_score, bed_awake_score, night_waking_score,
    early_waking_score, return_sleep_score, daytime_energy_score,
    focus_mood_score, sleep_delay_score, private_time_score,
    routine_stability_score, recovery_score, psqi_lite_total,
  } = scores;

  const P01 =
    0.35 * latency_score + 0.30 * rumination_score +
    0.15 * bed_awake_score + 0.10 * quality_score +
    0.10 * daytime_score;

  const P02 =
    0.35 * night_waking_score + 0.25 * disturbance_score +
    0.20 * return_sleep_score + 0.10 * quality_score +
    0.10 * recovery_score;

  const P03 =
    0.45 * early_waking_score + 0.20 * return_sleep_score +
    0.15 * duration_score + 0.10 * quality_score +
    0.10 * daytime_score;

  const normalized_total_score = (psqi_lite_total / 21) * 3;
  const P04 =
    0.40 * daytime_score + 0.25 * daytime_energy_score +
    0.20 * focus_mood_score + 0.10 * quality_score +
    0.05 * normalized_total_score;

  const routine_reverse_score = 3 - routine_stability_score;
  const P05 =
    0.35 * sleep_delay_score + 0.30 * private_time_score +
    0.15 * routine_reverse_score + 0.10 * duration_score +
    0.10 * daytime_score;

  let P06 = 0;
  const max_dimension_score = Math.max(
    quality_score, latency_score, duration_score, efficiency_score,
    disturbance_score, daytime_score, rumination_score, bed_awake_score,
    night_waking_score, early_waking_score, return_sleep_score,
    daytime_energy_score, focus_mood_score, sleep_delay_score, private_time_score
  );

  if (
    psqi_lite_total <= 5 && max_dimension_score < 2 &&
    routine_stability_score >= 2 && medication_score < 2
  ) {
    P06 = 3.5;
  }

  return { P01, P02, P03, P04, P05, P06 };
}

export function determinePersonality(personaScores: PersonaScores) {
  const personalityList = personalities as Array<{
    id: string; name: string; share_nickname: string; image: string;
  }>;

  if (personaScores.P06 > 0) {
    const p06 = personalityList.find(p => p.id === 'P06')!;
    return { primary: 'P06', primaryName: p06.name, shareNickname: p06.share_nickname, secondary: undefined };
  }

  const contenders: Array<{ id: string; score: number }> = [
    { id: 'P01', score: personaScores.P01 },
    { id: 'P02', score: personaScores.P02 },
    { id: 'P03', score: personaScores.P03 },
    { id: 'P04', score: personaScores.P04 },
    { id: 'P05', score: personaScores.P05 },
  ];
  contenders.sort((a, b) => b.score - a.score);
  const top1 = contenders[0];
  const top2 = contenders[1];
  const top1Persona = personalityList.find(p => p.id === top1.id)!;

  if (top1.score < 1.35) {
    const p06 = personalityList.find(p => p.id === 'P06')!;
    return { primary: 'P06', primaryName: p06.name, shareNickname: p06.share_nickname, secondary: undefined };
  }

  let secondary: string | undefined;
  if (top1.score - top2.score < 0.2) {
    secondary = top2.id;
  }

  return { primary: top1.id, primaryName: top1Persona.name, shareNickname: top1Persona.share_nickname, secondary };
}

export function generateTags(scores: PsqiScores, personaId: string) {
  const tags: string[] = [];

  if (scores.latency_score >= 2 || scores.rumination_score >= 2) tags.push('入睡难');
  if (scores.night_waking_score >= 2) tags.push('易醒');
  if (scores.early_waking_score >= 2) tags.push('早醒');
  if (scores.daytime_score >= 2) tags.push('日间困倦');
  if (scores.efficiency_score >= 2) tags.push('睡眠效率偏低');
  if (scores.duration_score >= 2) tags.push('睡眠时长偏短');
  if (scores.private_time_score >= 2 || scores.sleep_delay_score >= 2) tags.push('作息节律后移');
  if (scores.medication_score >= 2) tags.push('用药管理关注');
  if (personaId === 'P06' || (scores.psqi_lite_total <= 5 && scores.routine_stability_score >= 2 && scores.recovery_score <= 1)) {
    tags.push('睡眠整体稳定');
  }

  const uniqueTags = [...new Set(tags)];
  const shareTags = uniqueTags.filter(t => t !== '用药管理关注');
  return { tags: uniqueTags.slice(0, 3), shareTags: shareTags.slice(0, 3) };
}

export function determineLevel(psqi_lite_total: number): string {
  if (psqi_lite_total <= 5) return '睡眠健康';
  if (psqi_lite_total <= 10) return '轻度关注';
  if (psqi_lite_total <= 14) return '中度关注';
  return '重点关注';
}

export function determineReminders(scores: PsqiScores) {
  const show_doctor_reminder =
    scores.psqi_lite_total >= 11 || scores.daytime_score >= 3 ||
    scores.medication_score >= 2 || scores.early_waking_score >= 3 ||
    scores.night_waking_score >= 3;

  const show_medication_notice = scores.medication_score >= 2;
  return { show_doctor_reminder, show_medication_notice };
}

export function runAssessment(answers: AnswerSubmission[]) {
  const scores = computeScores(answers);
  const personaScores = computePersonaScores(scores);
  const personality = determinePersonality(personaScores);
  const { tags, shareTags } = generateTags(scores, personality.primary);
  const level = determineLevel(scores.psqi_lite_total);
  const reminders = determineReminders(scores);

  const personaConfig = (personalities as Array<{ id: string; image: string }>)
    .find(p => p.id === personality.primary);

  const result = {
    primary_persona: personality.primary,
    primary_persona_name: personality.primaryName,
    share_nickname: personality.shareNickname,
    secondary_persona: personality.secondary,
    tags: shareTags,
    level,
    image: personaConfig?.image || 'result_B.png',
    show_doctor_reminder: reminders.show_doctor_reminder,
    show_medication_notice: reminders.show_medication_notice,
    share_card_enabled: true,
  };

  return { scores, personaScores, result };
}
