// LifeMap Data Types
// Keep this file pure — no React imports, no side effects.

export type DefaultLifeArea =
  | 'technical'
  | 'communication'
  | 'career'
  | 'creativity'
  | 'health';

export type LifeArea = DefaultLifeArea | string;

export interface CustomLifeArea {
  id: string; // Stable identifier: 'technical', 'communication', etc., or custom slug
  name: string; // Display name: "Technical Mastery"
  description?: string;
  icon: string; // Icon identifier or emoji
  color: string; // Hex color code
  weight: number; // Planning weight percentage (0-100)
  isEnabled: boolean; // Visible in filters and menus
  orderIndex: number;
  isCustom?: boolean;
}

export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'rescheduled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description?: string;
  lifeArea: LifeArea;
  projectId?: string;
  roadmapMonth?: number;    // 1-8 or any assigned roadmap month
  dueDate: string; // ISO date string YYYY-MM-DD
  plannedStartTime?: string; // HH:mm
  duration?: number; // minutes
  priority: TaskPriority;
  recurring?: 'daily' | 'weekly' | 'weekdays' | 'none';
  status: TaskStatus;
  estimatedMinutes?: number;
  actualMinutes?: number;
  notes?: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  completedAt?: string; // ISO datetime
  rescheduledFrom?: string; // original dueDate
  rescheduledTo?: string; // new dueDate
  parentRecurringId?: string;
  userId?: string;
  parentId?: string | null; // ID of parent task or subtask (null/undefined for root task)
  orderIndex?: number;      // Sort order among siblings at the same hierarchy level
  isDeleted?: boolean;      // Soft delete flag for Recycle Bin
  deletedAt?: string;       // ISO datetime of deletion
}

export interface HierarchicalTask extends Task {
  children: HierarchicalTask[];
  depth: number;
  subtaskCount: number;
  completedSubtaskCount: number;
  progressPercent: number;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  tasksCompleted: number;
  tasksTotal: number;
  minutesSpent: number;
  reflectionNote?: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  savedAt: string; // ISO datetime
}

export interface LifeAreaWeights {
  technical: number;
  communication: number;
  career: number;
  creativity: number;
  health: number;
}

export interface RoadmapMilestone {
  id: string;
  month: number;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  subtasks: MilestoneSubtask[];
  notes?: string;
  startDate?: string;
  targetDate?: string;
  completedDate?: string;
  learningSessions: LearningSession[];
}

export interface MilestoneSubtask {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
}

export interface LearningSession {
  id: string;
  date: string;
  topic: string;
  minutes: number;
  notes?: string;
}

export interface CommunicationEntry {
  id: string;
  date: string;
  topic: string;
  practiceMinutes: number;
  confidenceNote?: string; // subjective description, not a number score
  notes?: string;
  type: 'speaking' | 'listening' | 'vocabulary' | 'writing' | 'presentation' | 'reflection';
}

export interface CareerItem {
  id: string;
  type: 'resume' | 'github' | 'linkedin' | 'dsa' | 'cs-fundamentals' | 'mock-interview' | 'internship' | 'other';
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
  link?: string;
  notes?: string;
  updatedAt: string;
}

export interface InternshipApplication {
  id: string;
  company: string;
  role: string;
  link?: string;
  appliedDate: string;
  status: 'researching' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';
  nextFollowUp?: string;
  notes?: string;
  updatedAt: string;
}

export type ProjectStatus = 'idea' | 'planned' | 'in-progress' | 'paused' | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  goals: string[];
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  notes?: string;
  technologies: string[];
  repoUrl?: string;
  nextAction?: string;
  startDate?: string;
  targetDate?: string;
  priority?: TaskPriority;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
  targetDate?: string;
}

export interface ContentItem {
  id: string;
  type:
    | 'tamil-book'
    | 'youtube'
    | 'video-editing'
    | 'instagram'
    | 'linkedin'
    | 'personal-photos'
    | 'writing'
    | 'media'
    | 'tech-writing'
    | 'design'
    | 'identity'
    | 'other';
  title: string;
  idea?: string;
  draft?: string;
  plannedDate?: string;
  publishedDate?: string;
  status: 'idea' | 'draft' | 'scheduled' | 'published';
  link?: string;
  isPrivate: boolean;
  notes?: string;
  createdAt: string;
}

export interface HealthEntry {
  id: string;
  date: string;
  sleepHours?: number;
  energyNote?: string;
  moodNote?: string;
  movement?: string;
  relationships?: string;
  reflection?: string;
  gratitude?: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface WeeklyReview {
  id: string;
  weekStart: string; // Monday ISO date
  weekEnd: string;
  wins: string[];
  challenges: string[];
  continueItems: string[];
  reduceItems: string[];
  postponeItems: string[];
  nextWeekFocus: string[];
  completionRate: number;
  notes?: string;
  createdAt: string;
}

export interface ScheduleEntry {
  id: string;
  userId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  description?: string;
  linkedTaskId?: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface Note {
  id: string;
  userId?: string;
  title: string;
  content: string;
  category?: string;
  isPinned?: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export type UploadCategory = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface UserUpload {
  id: string;
  userId: string;
  fileName: string;
  filePath: string; // Storage path in bucket, e.g. user_id/file_id-name.png
  fileSize: number; // in bytes
  mimeType: string;
  category: UploadCategory;
  description?: string;
  signedUrl?: string; // transient signed preview/download URL
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export type ThemePreset = 'navy-purple' | 'dark-slate' | 'midnight-oled' | 'cyberpunk' | 'clean-light';

export interface AppearanceSettings {
  theme: 'dark' | 'light' | 'system';
  themePreset: ThemePreset;
  accentColor: string; // e.g. '#6366f1'
  backgroundImageUrl?: string;
  backgroundOverlayOpacity: number; // 0.1 to 0.95
}

export type AiProvider = 'openai' | 'gemini';

export interface AiSettings {
  provider: AiProvider;
  model: string;
  isConfigured?: boolean;
}

export interface CommunicationSession {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  durationMinutes: number;
  activityType: 'speaking' | 'presentation' | 'discussion' | 'interview' | 'vocabulary' | 'listening' | 'writing' | 'other';
  topic: string;
  description?: string;
  notes?: string;
  attendanceStatus: 'present' | 'attended' | 'missed' | 'excused';
  completionStatus: 'completed' | 'partial' | 'in-progress';
  createdAt: string;
  updatedAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category: 'tech' | 'career' | 'ai' | 'general';
  summary?: string;
  author?: string;
  score?: number;
}

export const DEFAULT_LIFE_AREAS: CustomLifeArea[] = [
  {
    id: 'technical',
    name: 'Technical Mastery',
    description: 'Core coding, DSA, system projects & architecture',
    icon: 'Code2',
    color: '#6366f1',
    weight: 50,
    isEnabled: true,
    orderIndex: 0,
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'English fluency, speaking, articulate thoughts & discussions',
    icon: 'MessageSquare',
    color: '#06b6d4',
    weight: 15,
    isEnabled: true,
    orderIndex: 1,
  },
  {
    id: 'career',
    name: 'Career Readiness',
    description: 'Resume, GitHub, internships, interview prep & LinkedIn',
    icon: 'Briefcase',
    color: '#f59e0b',
    weight: 15,
    isEnabled: true,
    orderIndex: 2,
  },
  {
    id: 'creativity',
    name: 'Creativity & Identity',
    description: 'Creative projects, ideas, writing, content & identity',
    icon: 'Palette',
    color: '#ec4899',
    weight: 10,
    isEnabled: true,
    orderIndex: 3,
  },
  {
    id: 'health',
    name: 'Health & Reflection',
    description: 'Sleep, exercise, connections, habits & calm mindset',
    icon: 'Heart',
    color: '#10b981',
    weight: 10,
    isEnabled: true,
    orderIndex: 4,
  },
];

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: 'dark',
  themePreset: 'navy-purple',
  accentColor: '#6366f1',
  backgroundImageUrl: '',
  backgroundOverlayOpacity: 0.85,
};

export const DEFAULT_AI_SETTINGS: AiSettings = {
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  isConfigured: false,
};

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  displayName: string;
  lifeAreaWeights: LifeAreaWeights;
  lifeAreas: CustomLifeArea[];
  appearance: AppearanceSettings;
  aiSettings: AiSettings;
  workingHoursStart: string;
  workingHoursEnd: string;
  timezone: string;
  dataVersion: number;
}

export interface AppData {
  settings: AppSettings;
  tasks: Task[];
  schedules?: ScheduleEntry[];
  notes?: Note[];
  uploads?: UserUpload[];
  dailyRecords: DailyRecord[];
  roadmapMilestones: RoadmapMilestone[];
  communicationEntries: CommunicationEntry[];
  communicationSessions?: CommunicationSession[];
  careerItems: CareerItem[];
  internshipApplications: InternshipApplication[];
  projects: Project[];
  contentItems: ContentItem[];
  healthEntries: HealthEntry[];
  weeklyReviews: WeeklyReview[];
}


