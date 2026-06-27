// ============ Question Types ============

export interface QuestionOption {
  label: string;
  value: number;
  scoring: Record<string, number>;
}

export interface Question {
  id: string;
  title: string;
  subtitle?: string;
  options: QuestionOption[];
}

// ============ Submission Types ============

export interface AnswerSubmission {
  questionId: string;
  optionIndex: number;
}

export interface SubmitBody {
  answers: AnswerSubmission[];
}

// ============ Score Types ============

export interface PsqiScores {
  quality_score: number;
  latency_score: number;
  duration_score: number;
  efficiency_score: number;
  disturbance_score: number;
  medication_score: number;
  daytime_score: number;
  rumination_score: number;
  bed_awake_score: number;
  night_waking_score: number;
  early_waking_score: number;
  return_sleep_score: number;
  daytime_energy_score: number;
  focus_mood_score: number;
  sleep_delay_score: number;
  private_time_score: number;
  routine_stability_score: number;
  recovery_score: number;
  psqi_lite_total: number;
  sleep_wellness_score: number;
}

export interface PersonaScores {
  P01: number;
  P02: number;
  P03: number;
  P04: number;
  P05: number;
  P06: number;
}

// ============ Result Types ============

export interface AssessmentResult {
  primary_persona: string;
  primary_persona_name: string;
  share_nickname: string;
  secondary_persona?: string;
  tags: string[];
  level: string;
  image: string;
  show_doctor_reminder: boolean;
  show_medication_notice: boolean;
  share_card_enabled: boolean;
}

export interface AssessmentResponse {
  assessment_id: string;
  scores: PsqiScores;
  persona_scores: PersonaScores;
  result: AssessmentResult;
}

// ============ Personality Config Types ============

export interface PersonalityConfig {
  id: string;
  name: string;
  share_nickname: string;
  image: string;
  description: string;
  core_traits: string[];
}

// ============ API Response Wrapper ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
