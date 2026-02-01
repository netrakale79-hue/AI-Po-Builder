import { z } from 'zod';
import { insertInterviewSchema, insertAnswerSchema, interviews, questions, answers } from './schema';

// Shared error schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// API Contract
export const api = {
  interviews: {
    create: {
      method: 'POST' as const,
      path: '/api/interviews',
      input: insertInterviewSchema,
      responses: {
        201: z.custom<typeof interviews.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/interviews/:id',
      responses: {
        200: z.custom<typeof interviews.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    nextQuestion: {
      method: 'POST' as const,
      path: '/api/interviews/:id/next',
      responses: {
        200: z.object({
          question: z.custom<typeof questions.$inferSelect>().nullable(),
          interviewStatus: z.string(),
          message: z.string().optional(),
        }),
        404: errorSchemas.notFound,
      },
    },
    submitAnswer: {
      method: 'POST' as const,
      path: '/api/interviews/:id/questions/:questionId/answer',
      input: z.object({
        content: z.string(),
        timeTaken: z.number(),
      }),
      responses: {
        201: z.custom<typeof answers.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    finish: {
      method: 'POST' as const,
      path: '/api/interviews/:id/finish',
      responses: {
        200: z.custom<typeof interviews.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    parseResume: {
      method: 'POST' as const,
      path: '/api/parse-resume',
      // Multipart form data is handled specially, so input schema here is for documentation/response
      responses: {
        200: z.object({ text: z.string() }),
        400: errorSchemas.validation,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
