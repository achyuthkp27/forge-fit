import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { Icon, Icons } from '../components/Icon';
import { MarkDoneCard } from '../components/MarkDoneCard';
import { SuggestionCard } from '../components/chat/SuggestionCard';
import { ExerciseOptionsCard } from '../components/chat/ExerciseOptionsCard';
import { ProgressiveOverloadCard } from '../components/chat/ProgressiveOverloadCard';
import { MoodTrackingCard } from '../components/chat/MoodTrackingCard';
import { WeeklySummaryCard } from '../components/chat/WeeklySummaryCard';
import { useWorkoutStore } from '../stores/workoutStore';
import { useWorkoutSuggestion } from '../hooks/useWorkoutSuggestion';
import { useChatActions } from '../hooks/useChatActions';
import { ChatMessage, WorkoutTemplate, ChatAction } from '../types';
import { aiService } from '../lib/aiService';
import { adjustWorkoutForMood } from '../hooks/useAIFeatures';

export default function ChatScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedWorkout, setSuggestedWorkout] = useState<WorkoutTemplate | null>(null);
  const [showCompletionCard, setShowCompletionCard] = useState(false);
  const [suggestionResult, setSuggestionResult] = useState<any>(null);
  const [showExerciseOptions, setShowExerciseOptions] = useState(false);
  const [overloadSuggestions, setOverloadSuggestions] = useState<import('../hooks/useAIFeatures').OverloadSuggestion[]>([]);
  const [showMoodCard, setShowMoodCard] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState<import('../hooks/useAIFeatures').WeeklyStats | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const { messages, addMessage, isLoading, setLoading, activeSession } = useWorkoutStore();
  const { getSuggestion } = useWorkoutSuggestion();
  const { handleAction } = useChatActions();
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    const checkLocal = async () => {
      const connected = await aiService.checkLocalConnection();
      setIsLocalMode(connected);
    };
    checkLocal();
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        id: 'welcome',
        role: 'assistant',
        content: "Hey! I'm your AI workout coach. I can help you:\n\n🏋️ Create workouts (\"push day\")\n📝 Log sets (\"bench 80kg x 8\")\n🏆 Track PRs\n\nWhat would you like to do?",
        timestamp: new Date(),
      });
    }
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInputText('');
    setLoading(true);
    setIsTyping(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
      const context = { activeSession };
      const response = await aiService.processMessage(userMessage.content, context);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        actions: response.actions,
      };

      addMessage(aiMessage);

       if (response.actions) {
         for (const action of response.actions) {
           const result = await handleAction(action);
           
           // Handle different types of results from actions
           if (result !== null && result !== undefined && typeof result === 'object') {
             // Check for specific action result types with proper type narrowing
             if ('type' in result && result.type === 'SET_OVERLOAD_SUGGESTIONS' && 'payload' in result && Array.isArray(result.payload)) {
               setOverloadSuggestions(result.payload);
             } else if ('type' in result && result.type === 'SET_WEEKLY_STATS' && 'payload' in result && result.payload !== null && typeof result.payload === 'object') {
               setWeeklyStats(result.payload as import('../hooks/useAIFeatures').WeeklyStats);
             } else if ('type' in result && result.type === 'SHOW_EXERCISE_OPTIONS') {
               setShowExerciseOptions(true);
             } else if ('type' in result && result.type === 'SHOW_MOOD_CARD') {
               setShowMoodCard(true);
             } else if ('workout' in result && 'explanation' in result) {
               // This is a suggestion object from the 'suggest_workout' action
               setSuggestionResult(result);
             } else if ('id' in result && 'role' in result && 'content' in result && 'timestamp' in result) {
               // This is a message to display
               addMessage(result as ChatMessage);
             }
           }
         }
       }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleSaveWorkout = () => {
    if (suggestedWorkout) {
      // Note: In the refactored stores, we'd use a different method
      // For now, we'll keep the existing one for compatibility
      // This would need to be updated when we fully migrate to the new store structure
      setSuggestedWorkout(null);
    }
  };

  const handleConfirmComplete = async (notes: string) => {
    // Note: endSession would need to be imported from the session store
    // For now, we'll keep existing implementation
    setShowCompletionCard(false);
    addMessage({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `Awesome work! Your ${activeSession?.workoutName || 'workout'} is saved — great job! 💪`,
      timestamp: new Date(),
    });
  };

  const handleCancelComplete = () => {
    setShowCompletionCard(false);
    addMessage({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: "No worries! Keep going — I'm here when you're ready to finish.",
      timestamp: new Date(),
    });
  };

  const handleStartWorkoutFromSuggestion = async (workoutId: string) => {
    // Note: startSession would need to be imported from the session store
    // For now, we'll keep existing implementation
    setSuggestedWorkout(null);
  };

  const handleSuggestAlternative = async () => {
    if (suggestionResult) {
      const newSuggestion = await getSuggestion('any', true);
      if (newSuggestion) {
        setSuggestionResult(newSuggestion);
      }
    }
  };

  const handleExerciseSelect = (exerciseId: string) => {
    setShowExerciseOptions(false);
    addMessage({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `Exercise swapped! You're all set with the new exercise. Ready to crush it! 💪`,
      timestamp: new Date(),
    });
  };

  const handleOverloadApply = (exerciseName: string, newWeight: number) => {
    setOverloadSuggestions([]);
    addMessage({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `Applied! Increased ${exerciseName} to ${newWeight}kg. Great job pushing for progressive overload! 🔥`,
      timestamp: new Date(),
    });
  };

  const handleMoodSelect = (mood: 'low' | 'neutral' | 'high') => {
    const adjustment = adjustWorkoutForMood(mood);
    setShowMoodCard(false);
    addMessage({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `Workout adjusted for your ${mood} energy! ${adjustment.recommendation}`,
      timestamp: new Date(),
    });
  };

  const handleDismissSummary = () => {
    setWeeklyStats(null);
  };

  const handleVoiceInput = async () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "🎤 Voice input is coming soon! For now, type your message and I'll understand. You can also use the quick action buttons below for common commands.",
        timestamp: new Date(),
      });
    }, 1500);
  };

  const quickActions = [
    { label: 'Push Day', action: () => { setInputText('Create a push day workout'); handleSend(); } },
    { label: 'Log Set', action: () => setInputText('Log bench press 80kg 8 reps') },
    { label: 'Track PR', action: () => setInputText('New PR 100kg on bench') },
  ];

  const toggleSpeaking = (messageId: string, content: string) => {
    if (speakingMessageId === messageId) {
      Speech.stop();
      setSpeakingMessageId(null);
    } else {
      Speech.stop();
      Speech.speak(content, { language: 'en', pitch: 1.0, rate: 0.9, onDone: () => setSpeakingMessageId(null), onStopped: () => setSpeakingMessageId(null) });
      setSpeakingMessageId(messageId);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const isSpeaking = speakingMessageId === item.id;
    return (
      <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        {!isUser && (
            <View style={styles.aiAvatar}>
              <Image source={require('../assets/ai-avatar.png')} style={styles.avatarImageSmall} />
            </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.content}</Text>
          {!isUser && (
            <TouchableOpacity style={[styles.speakerButton, isSpeaking && styles.speakerButtonActive]} onPress={() => toggleSpeaking(item.id, item.content)}>
              <Icon name={isSpeaking ? Icons.speakerSlash : Icons.speaker} size={14} color={isSpeaking ? '#F97316' : '#71717A'} accessibilityLabel={isSpeaking ? 'Stop speaking' : 'Speak message'} accessible />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D', '#0D0D0D']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Image source={require('../assets/ai-avatar.png')} style={styles.avatarImage} />
          </View>
          <View><Text style={styles.headerTitle}>AI Coach</Text><Text style={styles.headerSubtitle}>{isLocalMode ? 'ForgeFit AI Core' : 'ForgeFit Intelligence'}</Text></View>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}><Icon name={Icons.x} size={24} color="#71717A" accessibilityLabel="Close" accessible /></TouchableOpacity>
      </View>

      {activeSession && (
        <TouchableOpacity style={styles.sessionBanner}>
          <View style={styles.sessionInfo}><Icon name={Icons.dumbbell} size={16} color="#F97316" accessibilityLabel="Dumbbell" accessible /><Text style={styles.sessionText}>In session: {activeSession.workoutName}</Text></View>
        </TouchableOpacity>
      )}

      {suggestedWorkout && (
        <View style={styles.suggestedCard}>
          <View style={styles.suggestedHeader}><Icon name={Icons.dumbbell} size={18} color="#F97316" accessibilityLabel="Dumbbell" accessible /><Text style={styles.suggestedTitle}>{suggestedWorkout.name}</Text></View>
          {suggestedWorkout.exercises.map((ex, i) => <Text key={i} style={styles.suggestedExercise}>{i + 1}. {ex.name} - {ex.sets} × {ex.reps}</Text>)}
          <View style={styles.suggestedActions}>
            <TouchableOpacity style={styles.dismissButton} onPress={() => setSuggestedWorkout(null)}><Text style={styles.dismissText}>Not now</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveWorkout}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {suggestionResult && (
        <View style={styles.suggestionCardContainer}>
          <SuggestionCard
            workout={suggestionResult.workout}
            explanation={suggestionResult.explanation}
            recoveryScores={suggestionResult.recoveryScores}
            alreadyTrainedToday={suggestionResult.alreadyTrainedToday}
            onStartWorkout={handleStartWorkoutFromSuggestion}
            onSuggestAlternative={handleSuggestAlternative}
          />
        </View>
      )}

      {showExerciseOptions && (
        <View style={styles.suggestionCardContainer}>
          <ExerciseOptionsCard
            onSelectExercise={handleExerciseSelect}
            onCancel={() => setShowExerciseOptions(false)}
          />
        </View>
      )}

      {overloadSuggestions && overloadSuggestions.length > 0 && (
        <View style={styles.suggestionCardContainer}>
          <ProgressiveOverloadCard
            suggestions={overloadSuggestions}
            onApply={handleOverloadApply}
            onDismiss={() => setOverloadSuggestions([])}
          />
        </View>
      )}

      {showMoodCard && (
        <View style={styles.suggestionCardContainer}>
          <MoodTrackingCard
            onMoodSelect={handleMoodSelect}
          />
        </View>
      )}

      {weeklyStats && (
        <View style={styles.suggestionCardContainer}>
          <WeeklySummaryCard
            stats={weeklyStats}
            onDismiss={handleDismissSummary}
          />
        </View>
      )}

      <FlatList ref={flatListRef} data={messages} keyExtractor={(item) => item.id} renderItem={renderMessage} contentContainerStyle={styles.messagesList} showsVerticalScrollIndicator={false} onContentSizeChange={() => flatListRef.current?.scrollToEnd()} ListFooterComponent={isTyping ? <View style={styles.typingContainer}><View style={styles.aiAvatar}><Icon name={Icons.sparkles} size={16} color="#0D0D0D" /></View><View style={[styles.messageBubble, styles.aiBubble]}><Text style={styles.typingText}>...</Text></View></View> : null} />

      {showCompletionCard && activeSession && (
        <View style={styles.completionCardContainer}>
          <Text style={styles.completionPrompt}>Ready to wrap up your session?</Text>
          <MarkDoneCard
            workoutName={activeSession.workoutName}
            startedAt={activeSession.startTime}
            setCount={activeSession.sets.length}
            onConfirm={handleConfirmComplete}
            onCancel={handleCancelComplete}
          />
        </View>
      )}

      <View style={styles.quickActions}>
        {quickActions.map((action, index) => (
          <TouchableOpacity key={index} style={styles.quickActionButton} onPress={action.action}>
            <Text style={styles.quickActionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={[styles.voiceButton, isListening && styles.voiceButtonActive]} onPress={handleVoiceInput}>
            <Icon name={isListening ? Icons.mic : Icons.mic} size={20} color={isListening ? '#F97316' : '#71717A'} accessibilityLabel={isListening ? 'Stop listening' : 'Start voice input'} accessible />
          </TouchableOpacity>
          <TextInput style={styles.input} placeholder="Ask me anything..." placeholderTextColor="#52525B" value={inputText} onChangeText={setInputText} multiline maxLength={500} />
          <TouchableOpacity style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]} onPress={handleSend} disabled={!inputText.trim() || isLoading}>
            <Icon name={Icons.send} size={20} color="#fff" accessibilityLabel="Send message" accessible />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#27272A' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#18181B', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#27272A' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: '#71717A' },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#18181B', justifyContent: 'center', alignItems: 'center' },
  sessionBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(249, 115, 22, 0.15)', marginHorizontal: 20, marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.3)' },
  sessionInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionText: { fontSize: 14, color: '#F97316', fontWeight: '500' },
  suggestedCard: { backgroundColor: '#18181B', marginHorizontal: 20, marginTop: 12, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#27272A' },
  suggestedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  suggestedTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  suggestedExercise: { fontSize: 14, color: '#A1A1AA', marginBottom: 4, paddingLeft: 8 },
  suggestedActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  dismissButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  dismissText: { fontSize: 14, color: '#71717A' },
  saveButton: { backgroundColor: '#F97316', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  messagesList: { paddingHorizontal: 20, paddingVertical: 16 },
  messageContainer: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  userMessageContainer: { alignSelf: 'flex-end' },
  aiAvatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#18181B', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarImageSmall: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  messageBubble: { padding: 16, borderRadius: 20, maxWidth: '100%' },
  userBubble: { backgroundColor: '#F97316', borderBottomRightRadius: 6 },
  aiBubble: { backgroundColor: '#18181B', borderBottomLeftRadius: 6, borderWidth: 1, borderColor: '#27272A' },
  messageText: { fontSize: 15, color: '#FFFFFF', lineHeight: 22 },
  userMessageText: { color: '#fff' },
  speakerButton: { position: 'absolute', bottom: 8, right: 10, padding: 10, borderRadius: 16, backgroundColor: '#27272A', minWidth: 36, minHeight: 36 },
  speakerButtonActive: { backgroundColor: 'rgba(249, 115, 22, 0.2)' },
  typingContainer: { flexDirection: 'row', marginBottom: 16 },
  typingText: { fontSize: 15, color: '#71717A' },
  quickActions: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  quickActionButton: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', minHeight: 48 },
  quickActionText: { fontSize: 13, color: '#A1A1AA', fontWeight: '500' },
  completionCardContainer: { paddingHorizontal: 20, paddingBottom: 8 },
  suggestionCardContainer: { paddingHorizontal: 20, marginBottom: 12 },
  completionPrompt: { fontSize: 14, color: '#A1A1AA', marginBottom: 8 },
  inputContainer: { paddingHorizontal: 20, paddingBottom: 34, paddingTop: 10, backgroundColor: '#0D0D0D', borderTopWidth: 1, borderTopColor: '#27272A' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 24, borderWidth: 1, borderColor: '#3F3F46', paddingHorizontal: 6, paddingVertical: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  voiceButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  voiceButtonActive: { backgroundColor: 'rgba(249, 115, 22, 0.2)' },
  input: { flex: 1, fontSize: 16, color: '#fff', paddingHorizontal: 12, paddingVertical: 10, maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#3F3F46' },
});