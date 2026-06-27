import express from 'express';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { runAssessment } from '../services/scoring.ts';
import type { Question, PersonalityConfig, SubmitBody, ApiResponse } from '../../shared/types.ts';

const { Router } = express;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const questions: Question[] = JSON.parse(
  readFileSync(join(__dirname, '../data/questions.json'), 'utf-8')
);
const personalities: PersonalityConfig[] = JSON.parse(
  readFileSync(join(__dirname, '../data/personalities.json'), 'utf-8')
);

const router = Router();

const assessmentStore = new Map<string, ReturnType<typeof runAssessment>>();

router.get('/questions', (_req: Request, res: Response) => {
  const response: ApiResponse<typeof questions> = { success: true, data: questions };
  res.json(response);
});

router.get('/personalities', (_req: Request, res: Response) => {
  const response: ApiResponse<typeof personalities> = { success: true, data: personalities };
  res.json(response);
});

router.post('/submit', (req: Request, res: Response) => {
  try {
    const { answers } = req.body as SubmitBody;
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({ success: false, error: '请提供有效的答案数据' });
      return;
    }
    if (answers.length !== 16) {
      res.status(400).json({ success: false, error: `需要 16 道题的答案，但收到了 ${answers.length} 道` });
      return;
    }

    const assessment = runAssessment(answers);
    const assessmentId = uuidv4();
    assessmentStore.set(assessmentId, assessment);

    res.json({
      success: true,
      data: {
        assessment_id: assessmentId,
        scores: assessment.scores,
        persona_scores: assessment.personaScores,
        result: assessment.result,
      },
    });
  } catch (error) {
    console.error('Assessment error:', error);
    res.status(500).json({ success: false, error: '测评计算过程中出现错误' });
  }
});

router.get('/result/:assessmentId', (req: Request, res: Response) => {
  const { assessmentId } = req.params;
  const assessment = assessmentStore.get(assessmentId);
  if (!assessment) {
    res.status(404).json({ success: false, error: '未找到该测评结果' });
    return;
  }
  res.json({
    success: true,
    data: {
      assessment_id: assessmentId,
      scores: assessment.scores,
      persona_scores: assessment.personaScores,
      result: assessment.result,
    },
  });
});

export default router;
