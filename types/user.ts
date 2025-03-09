export interface UserStats {
  quizzesCompleted: number;
  quizzesCorrect: number;
  totalQuizPoints: number;
  tasksCompleted: number;
  challengesCompleted: number;
  streakDays: number;
  totalTimeSpent: number; // in minutes
  lastActive: Date;
  badges: string[];
  achievements: {
    id: string;
    name: string;
    description: string;
    unlockedAt: Date;
  }[];
}

export interface UserProgress {
  level: number;
  xp: number;
  points: number;
  rank?: number;
  nextLevelXp: number;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  password?: string; // Only present in database, not in frontend
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  stats: UserStats;
  progress: UserProgress;
  settings: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    emailPreferences: {
      marketing: boolean;
      updates: boolean;
      activityDigest: boolean;
    };
  };
}