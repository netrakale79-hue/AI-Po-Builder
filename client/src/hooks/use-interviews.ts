import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateInterviewRequest, SubmitAnswerRequest } from "@shared/schema";
import { z } from "zod";

// --- Hooks ---

export function useCreateInterview() {
  return useMutation({
    mutationFn: async (data: CreateInterviewRequest) => {
      const validated = api.interviews.create.input.parse(data);
      const res = await fetch(api.interviews.create.path, {
        method: api.interviews.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.interviews.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to create interview');
      }
      return api.interviews.create.responses[201].parse(await res.json());
    },
  });
}

export function useInterview(id: number) {
  return useQuery({
    queryKey: [api.interviews.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.interviews.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch interview');
      return api.interviews.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !isNaN(id),
  });
}

export function useNextQuestion(interviewId: number) {
  return useMutation({
    mutationFn: async () => {
      const url = buildUrl(api.interviews.nextQuestion.path, { id: interviewId });
      const res = await fetch(url, { 
        method: api.interviews.nextQuestion.method,
        credentials: "include" 
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error('Interview not found');
        throw new Error('Failed to fetch next question');
      }
      return api.interviews.nextQuestion.responses[200].parse(await res.json());
    },
  });
}

export function useSubmitAnswer(interviewId: number, questionId: number) {
  return useMutation({
    mutationFn: async (data: SubmitAnswerRequest) => {
      const url = buildUrl(api.interviews.submitAnswer.path, { id: interviewId, questionId });
      // Input validation
      const validated = api.interviews.submitAnswer.input.parse(data);
      
      const res = await fetch(url, {
        method: api.interviews.submitAnswer.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.interviews.submitAnswer.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to submit answer');
      }
      return api.interviews.submitAnswer.responses[201].parse(await res.json());
    },
  });
}

export function useParseResume() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(api.interviews.parseResume.path, {
        method: api.interviews.parseResume.method,
        body: formData, // No Content-Type header; fetch adds boundary
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
           const error = api.interviews.parseResume.responses[400].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error('Failed to parse resume');
      }
      return api.interviews.parseResume.responses[200].parse(await res.json());
    }
  });
}
