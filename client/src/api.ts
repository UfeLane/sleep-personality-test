import type {
  Question,
  PersonalityConfig,
  SubmitBody,
  AssessmentResponse,
  ApiResponse,
} from '../../shared/types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '网络请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getQuestions(): Promise<Question[]> {
  const res = await fetchJson<ApiResponse<Question[]>>(`${API_BASE}/questions`);
  if (!res.success || !res.data) throw new Error('获取题目失败');
  return res.data;
}

export async function getPersonalities(): Promise<PersonalityConfig[]> {
  const res = await fetchJson<ApiResponse<PersonalityConfig[]>>(
    `${API_BASE}/personalities`
  );
  if (!res.success || !res.data) throw new Error('获取人格配置失败');
  return res.data;
}

export async function submitAnswers(
  body: SubmitBody
): Promise<AssessmentResponse> {
  const res = await fetchJson<ApiResponse<AssessmentResponse>>(
    `${API_BASE}/submit`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
  if (!res.success || !res.data) throw new Error('提交答案失败');
  return res.data;
}

export async function getResult(
  assessmentId: string
): Promise<AssessmentResponse> {
  const res = await fetchJson<ApiResponse<AssessmentResponse>>(
    `${API_BASE}/result/${assessmentId}`
  );
  if (!res.success || !res.data) throw new Error('获取测评结果失败');
  return res.data;
}

/** 匿名数据收集（不阻塞） */
export async function collectResult(data: {
  primary_persona: string;
  secondary_persona?: string;
  psqi_total: number;
  level: string;
  tags: string[];
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/collect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    // 静默失败，不影响用户体验
  }
}
