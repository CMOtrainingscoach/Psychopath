/**
 * Typed curriculum shape for the MVP seed (JSON is the runtime source).
 * Generated via `npm run extract-mvp` from reference/PsychPath.jsx.
 */
import type { AvatarConfig } from "@/lib/schemas/avatar";
import type { ContentCard, ContentQuestion } from "@/lib/schemas/content";
import curriculum from "./mvp-curriculum.json";

export type MvpProfessor = {
  legacy_key: string;
  name: string;
  tagline: string;
  bio: string;
  avatar_config: AvatarConfig;
  voice_prompt: string;
  sample_phrases: string[];
};

export type MvpChapter = {
  legacy_key: string;
  title: string;
  order_index: number;
  cards: ContentCard[];
  quiz: ContentQuestion[];
};

export type MvpLesson = {
  legacy_key: string;
  title: string;
  order_index: number;
  professor_key: string;
  chapters: MvpChapter[];
  checkpoint: ContentQuestion[];
};

export type MvpCourse = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: string;
  order_index: number;
  default_professor_key: string;
  lessons: MvpLesson[];
};

export type MvpCurriculum = {
  generated_from: string;
  professors: MvpProfessor[];
  courses: MvpCourse[];
  counts: {
    professors: number;
    courses: number;
    lessons: number;
    chapters: number;
  };
};

export const mvpCurriculum = curriculum as MvpCurriculum;
