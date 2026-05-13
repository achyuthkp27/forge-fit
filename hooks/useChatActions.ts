import { useCallback } from 'react';
import { useWorkoutStore } from '../stores/workoutStore';
import { useWorkoutSuggestion } from './useWorkoutSuggestion';
import { ChatAction, ChatMessage } from '../types';
import { checkProgressiveOverload, getWeeklySummary, adjustWorkoutForMood } from './useAIFeatures';

export const useChatActions = () => {
  const {
    activeSession,
    logSet,
    addPersonalRecord,
    setSuggestedWorkout,
    endSession,
    workouts,
    startSession,
  } = useWorkoutStore();
  
  const { getSuggestion } = useWorkoutSuggestion();

  const handleAction = useCallback(async (action: ChatAction) => {
    switch (action.type) {
      case 'create_workout': {
        setSuggestedWorkout(action.payload);
        break;
      }
      case 'log_set': {
        const { exercise, weight, reps } = action.payload;
        logSet(exercise.id, 1, reps, weight);
        break;
      }
      case 'update_pr': {
        const { weight } = action.payload;
        // Using a placeholder exercise ID - in a real implementation, this would come from the AI
        addPersonalRecord('1', weight, 0);
        break;
      }
      case 'complete_workout': {
        if (activeSession) {
          // This would typically show a completion card
          // For now, we'll just end the session
          await endSession('Completed via AI coach');
        } else {
          // Return a message that should be displayed
          return {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: "You don't have an active workout session. Start a workout first and I'll track it for you!",
            timestamp: new Date(),
          };
        }
        break;
      }
      case 'suggest_workout': {
        const preferredType = action.payload.preferredType || 'any';
        const suggestion = await getSuggestion(preferredType);
        if (suggestion) {
          return suggestion;
        } else {
          return {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: "You don't have any workouts saved yet. Want me to create one for you?",
            timestamp: new Date(),
          };
        }
      }
      case 'exercise_options': {
        // This would set state to show exercise options modal
        // Returning an object to be handled by the caller
        return { type: 'SHOW_EXERCISE_OPTIONS' };
      }
      case 'progressive_overload': {
        const suggestions = await checkProgressiveOverload();
        return { type: 'SET_OVERLOAD_SUGGESTIONS', payload: suggestions };
      }
      case 'mood_tracking': {
        return { type: 'SHOW_MOOD_CARD' };
      }
      case 'weekly_summary': {
        const stats = await getWeeklySummary();
        return { type: 'SET_WEEKLY_STATS', payload: stats };
      }
      default:
        console.warn('Unknown action type:', action.type);
        return null;
    }
  }, [
    activeSession,
    logSet,
    addPersonalRecord,
    endSession,
    workouts,
    startSession,
    setSuggestedWorkout,
    getSuggestion,
    checkProgressiveOverload,
    getWeeklySummary,
    adjustWorkoutForMood
  ]);

  return { handleAction };
};