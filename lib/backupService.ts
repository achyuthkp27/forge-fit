// Backup service - stub implementation
// TODO: Implement with proper encryption or remove if not needed

export interface BackupData {
  version: string;
  exportDate: string;
  settings: any;
  workouts: any[];
  sessions: any[];
  personalRecords: any[];
  exercises: any[];
  bodyMeasurements: any;
  sleepHistory: any[];
}

class BackupService {
  /**
   * Create a backup of all app data
   */
  async createBackup(): Promise<string> {
    // Stub - returns empty JSON
    return JSON.stringify({ version: '1.0.0', exportDate: new Date().toISOString() });
  }

  /**
   * Share backup via system share sheet
   */
  async shareBackup(): Promise<void> {
    // Stub - no-op
  }

  /**
   * Receive backup from file
   */
  async receiveBackup(): Promise<string | null> {
    return null;
  }
}

export const backupService = new BackupService();