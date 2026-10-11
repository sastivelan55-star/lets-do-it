// LifeMap Data Types
// Keep this file pure — no React imports, no side effects.

export type LifeArea =
  | 'technical'
  | 'communication'
  | 'career'
  | 'creativity'
  | 'health';

export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'rescheduled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description?: string;
  lifeArea: LifeArea;
  projectId?: string;
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
  type: 'resume' | 'github' | 'linkedin' | 'dsa' | 'cs-fundamentals' | 'mock-interview' | 'internship';
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
  type: 'tamil-book' | 'youtube' | 'video-editing' | 'instagram' | 'linkedin' | 'personal-photos';
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

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  displayName: string;
  lifeAreaWeights: LifeAreaWeights;
  workingHoursStart: string;
  workingHoursEnd: string;
  timezone: string;
  dataVersion: number;
}

export interface AppData {
  settings: AppSettings;
  tasks: Task[];
  dailyRecords: DailyRecord[];
  roadmapMilestones: RoadmapMilestone[];
  communicationEntries: CommunicationEntry[];
  careerItems: CareerItem[];
  internshipApplications: InternshipApplication[];
  projects: Project[];
  contentItems: ContentItem[];
  healthEntries: HealthEntry[];
  weeklyReviews: WeeklyReview[];
}
