import type { AvatarConfig } from "@/lib/schemas/avatar";
import type { ContentCard } from "@/lib/schemas/content";

export type Professor = {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  avatar_config: AvatarConfig;
  sample_phrases?: string[];
};

export type QuizQuestionPublic = {
  id: string;
  prompt: string;
  options: string[];
};

export type Chapter = {
  id: string;
  legacy_key: string | null;
  title: string;
  order_index: number;
  cards: ContentCard[];
  quiz: QuizQuestionPublic[];
};

export type Lesson = {
  id: string;
  legacy_key: string | null;
  title: string;
  order_index: number;
  professor: Professor | null;
  chapters: Chapter[];
  checkpoint: QuizQuestionPublic[];
};

export type CourseDetail = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: string;
  professor: Professor | null;
  progress_percent: number;
  lessons: Lesson[];
};

export type CourseListItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  order_index: number;
  progress_percent: number;
};

export type CourseProgress = {
  chapters: Record<string, { best: number; xp_earned: number }>;
  lessons: Record<string, { best: number; attempts: number; passed: boolean }>;
};

export type MeResponse = {
  profile: {
    display_name: string;
    role: string;
    avatar_url: string | null;
    email?: string;
  };
  stats: {
    total_xp: number;
    streak: number;
    last_active: string | null;
    level: number;
    level_into: number;
    level_span: number;
  };
  chapters_completed: number;
  checkpoints_passed: number;
  courses: Array<{
    slug: string;
    title: string;
    color: string;
    icon: string;
    percent: number;
  }>;
};
