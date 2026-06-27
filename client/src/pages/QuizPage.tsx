import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getQuestions, submitAnswers } from '../api';
import type { Question, AnswerSubmission } from '../../../shared/types';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import Button from '../components/Button';

const TOTAL_QUESTIONS = 16;

export default function QuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(AnswerSubmission | null)[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch questions on mount
  useEffect(() => {
    getQuestions()
      .then((data) => {
        setQuestions(data);
        setAnswers(new Array(data.length).fill(null));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || '加载题目失败');
        setLoading(false);
      });
  }, []);

  const handleSelect = useCallback((index: number) => {
    setSelectedOption(index);
  }, []);

  // Go to next question or submit
  const handleNext = useCallback(() => {
    if (selectedOption === null) return;

    const currentQuestion = questions[currentIndex];
    const newAnswer: AnswerSubmission = {
      questionId: currentQuestion.id,
      optionIndex: selectedOption,
    };

    const updatedAnswers = [...answers];
    updatedAnswers[currentIndex] = newAnswer;
    setAnswers(updatedAnswers);
    setSelectedOption(null);

    if (currentIndex < TOTAL_QUESTIONS - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // All questions answered - submit
      setSubmitting(true);
      const validAnswers = updatedAnswers.filter(
        (a): a is AnswerSubmission => a !== null
      );
      submitAnswers({ answers: validAnswers })
        .then((response) => {
          navigate(`/loading`, {
            state: { assessmentId: response.assessment_id },
          });
        })
        .catch((err) => {
          setError(err.message || '提交答案失败');
          setSubmitting(false);
        });
    }
  }, [selectedOption, questions, currentIndex, answers, navigate]);

  // Go back to previous question
  const handlePrev = useCallback(() => {
    if (currentIndex === 0) return;
    const prevIndex = currentIndex - 1;
    const prevAnswer = answers[prevIndex];
    setCurrentIndex(prevIndex);
    setSelectedOption(prevAnswer ? prevAnswer.optionIndex : null);
  }, [currentIndex, answers]);

  // Loading state
  if (loading) {
    return (
      <div className="page-container items-center justify-center">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 mx-auto">
            <img src="/assets/zzz.png" alt="loading" className="w-full h-full object-contain animate-pulse-soft" />
          </div>
          <p className="text-sm text-gray-mid/70">正在加载题目...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page-container items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-red-500">{error}</p>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === TOTAL_QUESTIONS - 1;

  return (
    <div className="page-container">
      {/* Fixed top bar */}
      <motion.div
        className="flex items-center justify-between pb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <button
          onClick={isFirst ? () => navigate('/guide') : handlePrev}
          className="text-sm text-gray-mid/60 hover:text-dark transition-colors"
        >
          ← {isFirst ? '返回' : '上一题'}
        </button>
        <span className="text-xs text-gray-mid/50">
          {currentIndex + 1} / {TOTAL_QUESTIONS}
        </span>
      </motion.div>

      {/* Progress */}
      <ProgressBar current={currentIndex} total={TOTAL_QUESTIONS} />

      {/* Scrollable question area */}
      {currentQuestion && (
        <div className="page-scroll flex flex-col justify-center">
          <QuestionCard
            question={currentQuestion}
            selectedIndex={selectedOption}
            onSelect={handleSelect}
            questionNumber={currentIndex + 1}
            totalQuestions={TOTAL_QUESTIONS}
          />
        </div>
      )}

      {/* Fixed bottom navigation */}
      <div className="pt-4 flex gap-3">
        {!isFirst && (
          <Button
            variant="secondary"
            onClick={handlePrev}
            fullWidth={false}
            className="flex-1"
          >
            ← 上一题
          </Button>
        )}
        <div className={isFirst ? 'w-full' : 'flex-1'}>
          {!isLast ? (
            <Button
              onClick={handleNext}
              disabled={selectedOption === null}
            >
              {selectedOption !== null ? '下一题' : '请选择一个选项'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={selectedOption === null || submitting}
            >
              {submitting ? '提交中...' : '查看我的睡眠人格'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
