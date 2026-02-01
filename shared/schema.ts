import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  resumeText: text("resume_text").notNull(),
  jobDescription: text("job_description").notNull(),
  status: text("status").notNull().default("in_progress"), // in_progress, completed, terminated
  currentDifficulty: text("current_difficulty").notNull().default("Easy"), // Easy, Medium, Hard
  totalScore: integer("total_score").notNull().default(0),
  questionCount: integer("question_count").notNull().default(0),
  consecutiveLowScores: integer("consecutive_low_scores").notNull().default(0),
  timeExceededCount: integer("time_exceeded_count").notNull().default(0),
  resumeMatchScore: integer("resume_match_score").default(0),
  readinessScore: integer("readiness_score").default(0),
  readinessCategory: text("readiness_category"), // Strong, Average, Needs Improvement
  feedback: jsonb("feedback"), // Structured feedback object
  initialAnalysis: jsonb("initial_analysis"), // Store initial AI analysis of resume/JD
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").notNull(),
  content: text("content").notNull(),
  difficulty: text("difficulty").notNull(),
  timeLimit: integer("time_limit").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  content: text("content").notNull(),
  score: integer("score").notNull(),
  feedback: jsonb("feedback"), // { accuracy, clarity, depth, relevance, timeEfficiency, strengths, weaknesses }
  timeTaken: integer("time_taken").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===

export const insertInterviewSchema = createInsertSchema(interviews).pick({
  resumeText: true,
  jobDescription: true,
});

export const insertAnswerSchema = createInsertSchema(answers).pick({
  content: true,
  timeTaken: true,
});

// === TYPES ===

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type DrizzleInsertInterview = typeof interviews.$inferInsert; // For storage layer
export type Question = typeof questions.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;

// API Request/Response Types
export type CreateInterviewRequest = InsertInterview;

export type SubmitAnswerRequest = {
  answer: string;
  timeTaken: number; // in seconds
};

export type NextQuestionResponse = {
  question: Question | null;
  interviewStatus: string; // in_progress, completed, terminated
  message?: string;
};

export type ParsedResumeResponse = {
  text: string;
};
