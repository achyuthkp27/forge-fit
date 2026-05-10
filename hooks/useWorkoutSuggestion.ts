import { useState, useCallback } from 'react';
import { getMuscleLoadHistory, getRecentSessionNames, getTodaySessionCount } from '../lib/sessionQueries';
import { computeRecoveryScores, rankMusclesForToday } from '../ai/recoveryEngine';
import { findBestWorkout } from '../ai/workoutMatcher';
import { buildSuggestionPrompt, generateFallbackExplanation } from '../ai/suggestionPrompt';
import type { WorkoutMatch } from '../ai/workoutMatcher';
import type { RecoveryScore } from '../ai/recoveryEngine';

const CACHE_KEY = 'suggestion_cache';
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;

export interface SuggestionResult {
  workout: WorkoutMatch;
  explanation: string;
  recoveryScores: RecoveryScore[];
  alreadyTrainedToday: boolean;
}

let cacheData: { data: SuggestionResult; timestamp: number } | null = null;

export function useWorkoutSuggestion() {
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSuggestion = useCallback(async (
    preferredType: 'gym' | 'home' | 'any' = 'any',
    forceRefresh = false
  ): Promise<SuggestionResult | null> => {
    setLoading(true);
    setError(null);

    try {
      if (!forceRefresh && cacheData && (Date.now() - cacheData.timestamp < CACHE_TTL_MS)) {
        setResult(cacheData.data);
        return cacheData.data;
      }

      const alreadyTrainedToday = await getTodaySessionCount() > 0;

      const loads = await getMuscleLoadHistory(14);
      const scores = computeRecoveryScores(loads);
      const ranked = rankMusclesForToday(scores);

      const workout = await findBestWorkout(ranked, preferredType);
      if (!workout) {
        setError('No workouts found. Create one first!');
        return null;
      }

      const recentSessions = await getRecentSessionNames(3);
      const streakDays = 0;

      const prompt = buildSuggestionPrompt({
        topMatch: workout,
        recoveryScores: ranked,
        recentSessions,
        streakDays,
      });

      let explanation = workout.matchReason;
      explanation = generateFallbackExplanation({
        topMatch: workout,
        recoveryScores: ranked,
        recentSessions,
        streakDays,
      });

      const suggestion: SuggestionResult = {
        workout,
        explanation,
        recoveryScores: ranked,
        alreadyTrainedToday,
      };

      cacheData = { data: suggestion, timestamp: Date.now() };
      setResult(suggestion);
      return suggestion;

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(() => {
    cacheData = null;
  }, []);

  return { getSuggestion, result, loading, error, clearCache };
}