import { ExpoWebSpeechRecognition, ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import * as TextToSpeech from 'expo-speech';

interface VoiceRecognitionResult {
  text: string;
  isFinal: boolean;
}

class VoiceService {
  private _isAvailable: boolean = false;
  private recognition: any = null;
  private onResultCallback: ((result: VoiceRecognitionResult) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this._isAvailable = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
    } catch (error) {
      console.warn('Speech recognition availability check failed:', error);
      this._isAvailable = false;
    }
  }

  async isAvailable(): Promise<boolean> {
    return this._isAvailable;
  }

  async startListening(
    onResult: (result: VoiceRecognitionResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this._isAvailable) {
      throw new Error('Speech recognition not available');
    }

    if (this.recognition) {
      this.recognition.abort();
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;

    try {
      this.recognition = new ExpoWebSpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        if (this.onResultCallback && event.results && event.results.length > 0) {
          const result = event.results[event.resultIndex];
          this.onResultCallback({
            text: result[0].transcript,
            isFinal: !!event.isFinal || result.isFinal
          });
        }
      };

      this.recognition.onerror = (event: any) => {
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error || 'Unknown error');
        }
      };

      this.recognition.start();
    } catch (error) {
      throw error;
    }
  }

  async stopListening(): Promise<void> {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }

  async speak(text: string): Promise<void> {
    if (!text) return;
    
    try {
      await TextToSpeech.speak(text, {
        language: 'en-US',
        pitch: 1,
        rate: 1,
      });
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  }

  async isSpeaking(): Promise<boolean> {
    try {
      return await TextToSpeech.isSpeakingAsync();
    } catch (error) {
      return false;
    }
  }

  async stopSpeaking(): Promise<void> {
    try {
      await TextToSpeech.stop();
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }
}

export const voiceService = new VoiceService();