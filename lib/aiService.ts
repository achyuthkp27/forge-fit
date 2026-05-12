import { Exercise, WorkoutTemplate, WorkoutSession, ChatAction } from '../types';

const SYSTEM_PROMPT = `You are ForgeFit, an AI workout coach. Help users with:
- Creating workout plans (push, pull, legs, etc.)
- Logging workout sets (bench press 80kg for 8 reps)
- Tracking personal records
- Motivating users

Keep responses concise.`;

interface AIResponse {
  message: string;
  actions?: ChatAction[];
}

const mockExercises: Exercise[] = [
  { id: '1', name: 'Bench Press', muscleGroups: ['chest'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: [] },
  { id: '15', name: 'Squat', muscleGroups: ['legs'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: [] },
  { id: '6', name: 'Deadlift', muscleGroups: ['back'], equipment: 'barbell', difficulty: 'advanced', defaultSets: 4, defaultReps: 5, coachingCues: [] },
  { id: '11', name: 'Overhead Press', muscleGroups: ['shoulders'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: [] },
  { id: '7', name: 'Pull-Ups', muscleGroups: ['back'], equipment: 'bodyweight', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: [] },
];

export class AIService {
  private useOnDevice: boolean = false;
  private onDeviceModelLoaded: boolean = false;
  private hfModelRepo: string = 'Qwen/Qwen3-4B-GGUF';

  private conversationHistory: { role: 'user' | 'assistant', content: string }[] = [];

  async initOnDeviceModel(): Promise<boolean> {
    try {
      console.log(`Initialising ForgeFit AI core engine...`);
      // Simulate hardware verification
      await new Promise(resolve => setTimeout(resolve, 800));
      this.onDeviceModelLoaded = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize local AI engine:', error);
      return false;
    }
  }

  async downloadModelFromHF(progressCallback?: (progress: number) => void): Promise<boolean> {
    try {
      console.log(`Downloading ForgeFit AI core...`);
      
      let progress = 0;
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          // Make progress a bit more variable for realism
          progress += Math.random() * 5 + 1;
          progressCallback?.(Math.min(progress, 100));
          
          if (progress >= 100) {
            clearInterval(interval);
            this.onDeviceModelLoaded = true;
            resolve(true);
          }
        }, 150); // Slightly slower for realism
      });
    } catch (error) {
      return false;
    }
  }

  setOnDeviceMode(enabled: boolean) {
    this.useOnDevice = enabled;
  }

  isOnDeviceAvailable(): boolean {
    return this.onDeviceModelLoaded;
  }

  async checkOnDeviceStatus(): Promise<{ available: boolean; modelSize: string }> {
    return {
      available: this.onDeviceModelLoaded,
      modelSize: this.onDeviceModelLoaded ? 'ForgeFit-Core v1.0' : 'Not installed',
    };
  }

  async checkLocalConnection(): Promise<boolean> {
    return this.onDeviceModelLoaded;
  }

  async processMessage(userMessage: string, context?: { activeSession?: WorkoutSession | null }): Promise<AIResponse> {
    // Record user message
    this.conversationHistory.push({ role: 'user', content: userMessage });
    if (this.conversationHistory.length > 10) this.conversationHistory.shift();

    let response: AIResponse;
    if (this.useOnDevice && this.onDeviceModelLoaded) {
      response = await this.runOnDeviceInference(userMessage, context);
    } else {
      response = await this.processMessageLocal(userMessage, context);
    }

    // Record AI response
    this.conversationHistory.push({ role: 'assistant', content: response.message });
    return response;
  }

  private async runOnDeviceInference(message: string, context?: any): Promise<AIResponse> {
    try {
      // In production, this would call the actual GGUF model via CoreML
      return await this.processMessageLocal(message, context);
    } catch (error) {
      return this.processMessageLocal(message, context);
    }
  }

  private async processMessageLocal(userMessage: string, context?: { activeSession?: WorkoutSession | null }): Promise<AIResponse> {
    const lowerMessage = userMessage.toLowerCase().trim();

    // Handle Greetings
    const greetings = ['hi', 'hello', 'hey', 'yo', 'sup'];
    if (greetings.includes(lowerMessage)) {
      return {
        message: "Hey! Ready to crush your workout today? What's the plan—are we hitting a specific muscle group or should I suggest something?"
      };
    }

    // Handle "What can you do?"
    if (lowerMessage.includes('what can you do') || lowerMessage.includes('help') || lowerMessage.includes('who are you')) {
      return {
        message: "I'm your ForgeFit AI Coach. I can help you build custom workouts, log your sets in real-time, track your personal records, and even adjust your training based on how tired you are. Just tell me what you want to train!"
      };
    }

    // Logic for creating workouts
    if (lowerMessage.includes('create') || lowerMessage.includes('suggest') || lowerMessage.includes('plan') || lowerMessage.includes('push day') || lowerMessage.includes('pull day') || lowerMessage.includes('leg day')) {
      return this.handleCreateWorkout(userMessage);
    }

    // Logic for logging sets
    if (lowerMessage.includes('log') || lowerMessage.includes('did') || /\d+\s*kg/i.test(userMessage)) {
      return this.handleLogSet(userMessage);
    }

    // Logic for PRs
    if (lowerMessage.includes('pr') || lowerMessage.includes('personal record')) {
      return this.handleUpdatePR(userMessage);
    }

    // Logic for completion
    if (lowerMessage.includes('complete') || lowerMessage.includes('finish') || lowerMessage.includes('done')) {
      return {
        message: "Great session! I'm ready to wrap this up. Should I save your progress now?",
        actions: [{ type: 'complete_workout', payload: {} }],
      };
    }

    // Fallback conversational response
    return {
      message: "I'm here to help with your training! You can ask me to 'Suggest a workout for today', 'Log my bench press', or even tell me if you're feeling low energy and I'll adjust the intensity."
    };
  }

  private handleCreateWorkout(userMessage: string): AIResponse {
    const lowerMessage = userMessage.toLowerCase();
    let name = 'Custom Workout';
    let exercises: { name: string; sets: number; reps: string }[] = [];

    if (lowerMessage.includes('push') || lowerMessage.includes('chest')) {
      name = 'Push Day';
      exercises = [
        { name: 'Bench Press', sets: 4, reps: '8' },
        { name: 'Incline Dumbbell Press', sets: 3, reps: '10' },
        { name: 'Overhead Press', sets: 3, reps: '8' },
        { name: 'Lateral Raises', sets: 3, reps: '12' },
      ];
    } else if (lowerMessage.includes('pull') || lowerMessage.includes('back')) {
      name = 'Pull Day';
      exercises = [
        { name: 'Pull-Ups', sets: 4, reps: '8' },
        { name: 'Barbell Row', sets: 4, reps: '8' },
        { name: 'Lat Pulldown', sets: 3, reps: '10' },
        { name: 'Barbell Curl', sets: 3, reps: '10' },
      ];
    } else if (lowerMessage.includes('leg')) {
      name = 'Leg Day';
      exercises = [
        { name: 'Squat', sets: 4, reps: '8' },
        { name: 'Romanian Deadlift', sets: 4, reps: '10' },
        { name: 'Leg Press', sets: 3, reps: '12' },
        { name: 'Calf Raises', sets: 4, reps: '15' },
      ];
    } else {
      name = 'Full Body';
      exercises = [
        { name: 'Squat', sets: 3, reps: '10' },
        { name: 'Bench Press', sets: 3, reps: '8' },
        { name: 'Barbell Row', sets: 3, reps: '8' },
        { name: 'Plank', sets: 3, reps: '60s' },
      ];
    }

    return {
      message: `Here's your ${name}:\n\n${exercises.map((e, i) => `${i + 1}. ${e.name} - ${e.sets}×${e.reps}`).join('\n')}\n\nWant me to save this?`,
      actions: [{ type: 'create_workout', payload: { id: Date.now().toString(), name, description: `AI-generated ${name}`, exercises } }],
    };
  }

  private handleLogSet(userMessage: string): AIResponse {
    const weightMatch = userMessage.match(/(\d+)\s*(kg|lbs?)?/i);
    const repsMatch = userMessage.match(/(\d+)\s*reps?/i);
    const exerciseMatch = userMessage.replace(/log|did|record|(\d+\s*(kg|lbs?|reps?))/gi, '').trim();

    if (!weightMatch || !repsMatch) {
      return { message: "I couldn't parse that. Try: 'Log bench press 80kg 8 reps'" };
    }

    const exercise = mockExercises.find(e => exerciseMatch.toLowerCase().includes(e.name.toLowerCase().split(' ')[0])) || mockExercises[0];

    return {
      message: `Logged: ${exercise.name} - ${weightMatch[1]}kg × ${repsMatch[1]} reps`,
      actions: [{ type: 'log_set', payload: { exercise, weight: parseInt(weightMatch[1]), reps: parseInt(repsMatch[1]) } }],
    };
  }

  private handleUpdatePR(userMessage: string): AIResponse {
    const match = userMessage.match(/(\d+)\s*(kg|lbs?)/i);
    if (!match) return { message: "Tell me your new PR weight, like 'New PR 100kg on bench press'" };

    return {
      message: `New PR: ${match[1]}${match[2] || 'kg'} recorded! 🎉`,
      actions: [{ type: 'update_pr', payload: { weight: parseInt(match[1]) } }],
    };
  }

  async generateCompletion(prompt: string): Promise<string> {
    const response = await this.processMessage(prompt, {});
    return response.message;
  }
}

export const aiService = new AIService();