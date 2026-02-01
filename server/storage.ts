import { db } from "./db";
import {
  interviews, questions, answers,
  type Interview, type InsertInterview,
  type Question,
  type Answer, type InsertAnswer,
  type DrizzleInsertInterview
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  createInterview(interview: DrizzleInsertInterview): Promise<Interview>;
  getInterview(id: number): Promise<Interview | undefined>;
  updateInterview(id: number, updates: Partial<Interview>): Promise<Interview>;
  createQuestion(question: Omit<Question, "id" | "createdAt">): Promise<Question>;
  getQuestions(interviewId: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createAnswer(answer: Omit<Answer, "id" | "createdAt">): Promise<Answer>;
  getAnswers(interviewId: number): Promise<Answer[]>; // Helper to get all answers for an interview
}

export class DatabaseStorage implements IStorage {
  async createInterview(interview: DrizzleInsertInterview): Promise<Interview> {
    const [newInterview] = await db.insert(interviews).values(interview).returning();
    return newInterview;
  }

  async getInterview(id: number): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview;
  }

  async updateInterview(id: number, updates: Partial<Interview>): Promise<Interview> {
    const [updated] = await db.update(interviews)
      .set(updates)
      .where(eq(interviews.id, id))
      .returning();
    return updated;
  }

  async createQuestion(question: Omit<Question, "id" | "createdAt">): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async getQuestions(interviewId: number): Promise<Question[]> {
    return await db.select().from(questions)
      .where(eq(questions.interviewId, interviewId))
      .orderBy(asc(questions.order));
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createAnswer(answer: Omit<Answer, "id" | "createdAt">): Promise<Answer> {
    const [newAnswer] = await db.insert(answers).values(answer).returning();
    return newAnswer;
  }

  async getAnswers(interviewId: number): Promise<Answer[]> {
    // Join answers with questions to filter by interviewId
    // For simplicity, we can fetch questions first then answers, or use a join.
    // Drizzle join:
    const result = await db.select({
      answer: answers
    })
    .from(answers)
    .innerJoin(questions, eq(answers.questionId, questions.id))
    .where(eq(questions.interviewId, interviewId))
    .orderBy(asc(questions.order));
    
    return result.map(r => r.answer);
  }
}

export const storage = new DatabaseStorage();
