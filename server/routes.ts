import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import OpenAI from "openai";

const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI client using Replit AI integration env vars
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function analyzeResumeAndJD(resumeText: string, jobDescription: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "system",
          content: "You are an expert technical recruiter. Analyze the resume and job description. Output JSON."
        },
        {
          role: "user",
          content: `
            Resume: ${resumeText.substring(0, 5000)}
            Job Description: ${jobDescription.substring(0, 5000)}

            Analyze for:
            1. Match score (0-100)
            2. Experience level (Fresher/Junior/Mid/Senior)
            3. Key missing skills
            
            Return JSON: { "matchScore": number, "experienceLevel": string, "missingSkills": string[] }
          `
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return { matchScore: 50, experienceLevel: "Junior", missingSkills: [] };
  }
}

async function generateQuestion(interview: any, previousQuestions: string[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "system",
          content: `You are a strict technical interviewer. Generate ONE ${interview.currentDifficulty} interview question based on the job description and resume.
            Rules:
            - Easy: Definitions, basic concepts (60s limit implied)
            - Medium: Application, reasoning, trade-offs (90s limit implied)
            - Hard: Edge cases, system design, real-world scenarios (120s limit implied)
            - Do not repeat topics: ${previousQuestions.join(", ")}
            - Output JSON: { "content": "question text", "timeLimit": number }
          `
        },
        {
          role: "user",
          content: `Job Description: ${interview.jobDescription.substring(0, 2000)}`
        }
      ],
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Question generation failed:", error);
    return { content: "Explain the concept of polymorphism.", timeLimit: 60 };
  }
}

async function evaluateAnswer(question: string, answer: string, timeTaken: number, difficulty: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "system",
          content: `Evaluate the technical interview answer. 
            Question: ${question}
            Difficulty: ${difficulty}
            Time Taken: ${timeTaken} seconds

            Scoring Criteria:
            - Accuracy (0-30)
            - Clarity (0-20)
            - Depth (0-20)
            - Relevance (0-20)
            - Time Efficiency (0-10)

            Return JSON: { 
              "score": number (0-100), 
              "feedback": {
                "strengths": string[],
                "weaknesses": string[],
                "improvement": string
              }
            }
          `
        },
        {
          role: "user",
          content: answer
        }
      ],
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Evaluation failed:", error);
    return { score: 50, feedback: { strengths: [], weaknesses: ["AI Evaluation Failed"], improvement: "" } };
  }
}

async function generateFinalReport(interview: any, answers: any[]) {
   try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "system",
          content: `Generate a final interview report.
            Return JSON: {
              "readinessScore": number (0-100),
              "readinessCategory": "Strong" | "Average" | "Needs Improvement",
              "feedback": {
                 "summary": string,
                 "technicalGap": string,
                 "hiringRecommendation": string
              }
            }
          `
        },
        {
          role: "user",
          content: `
            Total Questions: ${interview.questionCount}
            Average Score: ${interview.totalScore / (interview.questionCount || 1)}
            Resume Match: ${interview.resumeMatchScore}
            Answers: ${JSON.stringify(answers.map(a => ({ score: a.score, feedback: a.feedback })))}
          `
        }
      ],
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    return { 
      readinessScore: 50, 
      readinessCategory: "Average", 
      feedback: { summary: "Generated default report due to error.", technicalGap: "Unknown", hiringRecommendation: "Review manually" } 
    };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Resume Parsing Endpoint
  app.post(api.interviews.parseResume.path, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    try {
      const data = await pdfParse(req.file.buffer);
      res.json({ text: data.text });
    } catch (error) {
      res.status(500).json({ message: "Failed to parse PDF" });
    }
  });

  // Create Interview
  app.post(api.interviews.create.path, async (req, res) => {
    try {
      const input = api.interviews.create.input.parse(req.body);
      
      // Analyze Resume & JD first
      const analysis = await analyzeResumeAndJD(input.resumeText, input.jobDescription);
      
      const interview = await storage.createInterview({
        ...input,
        resumeMatchScore: analysis.matchScore || 0,
        currentDifficulty: "Easy", // Start easy
        status: "in_progress",
        initialAnalysis: analysis
      });
      
      res.status(201).json(interview);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Get Interview
  app.get(api.interviews.get.path, async (req, res) => {
    const interview = await storage.getInterview(Number(req.params.id));
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    res.json(interview);
  });

  // Next Question
  app.post(api.interviews.nextQuestion.path, async (req, res) => {
    const interviewId = Number(req.params.id);
    const interview = await storage.getInterview(interviewId);
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    if (interview.status !== "in_progress") {
      return res.json({ question: null, interviewStatus: interview.status, message: "Interview is finished" });
    }

    // Check termination conditions? (Usually done after answer)
    // Get existing questions to avoid repeats
    const questions = await storage.getQuestions(interviewId);
    const lastQuestion = questions[questions.length - 1];
    
    // If last question hasn't been answered, return it (resume behavior)
    if (lastQuestion) {
      const answers = await storage.getAnswers(interviewId);
      const isAnswered = answers.find(a => a.questionId === lastQuestion.id);
      if (!isAnswered) {
        return res.json({ question: lastQuestion, interviewStatus: interview.status });
      }
    }

    // Generate new question
    const qData = await generateQuestion(interview, questions.map(q => q.content));
    
    const question = await storage.createQuestion({
      interviewId,
      content: qData.content,
      difficulty: interview.currentDifficulty,
      timeLimit: qData.timeLimit || 60,
      order: questions.length + 1
    });

    res.json({ question, interviewStatus: interview.status });
  });

  // Submit Answer
  app.post(api.interviews.submitAnswer.path, async (req, res) => {
    const interviewId = Number(req.params.id);
    const questionId = Number(req.params.questionId);
    const { content, timeTaken } = req.body;

    const interview = await storage.getInterview(interviewId);
    const question = await storage.getQuestion(questionId);

    if (!interview || !question) return res.status(404).json({ message: "Not found" });

    // Evaluate
    const evaluation = await evaluateAnswer(question.content, content, timeTaken, question.difficulty);
    
    const answer = await storage.createAnswer({
      questionId,
      content,
      score: evaluation.score,
      feedback: evaluation.feedback,
      timeTaken
    });

    // Update Interview State
    let newDifficulty = interview.currentDifficulty;
    let consecutiveLow = interview.consecutiveLowScores;
    let timeExceeded = interview.timeExceededCount;

    if (evaluation.score < 40) consecutiveLow++;
    else consecutiveLow = 0;

    if (timeTaken > question.timeLimit) {
      timeExceeded++;
    }

    // Difficulty Adjustment
    if (evaluation.score >= 75) {
      if (newDifficulty === "Easy") newDifficulty = "Medium";
      else if (newDifficulty === "Medium") newDifficulty = "Hard";
    } else if (evaluation.score < 50) {
      if (newDifficulty === "Hard") newDifficulty = "Medium";
      else if (newDifficulty === "Medium") newDifficulty = "Easy";
    }

    // Termination Logic
    let newStatus = "in_progress";
    const answers = await storage.getAnswers(interviewId);
    const avgScore = (interview.totalScore + evaluation.score) / (interview.questionCount + 1);
    
    if (consecutiveLow >= 3 || (answers.length >= 5 && avgScore < 45)) {
      newStatus = "terminated";
    }

    await storage.updateInterview(interviewId, {
      totalScore: interview.totalScore + evaluation.score,
      questionCount: interview.questionCount + 1,
      currentDifficulty: newDifficulty,
      consecutiveLowScores: consecutiveLow,
      timeExceededCount: timeExceeded,
      status: newStatus
    });

    res.status(201).json(answer);
  });

  // Finish Interview
  app.post(api.interviews.finish.path, async (req, res) => {
    const interviewId = Number(req.params.id);
    const interview = await storage.getInterview(interviewId);
    if (!interview) return res.status(404).json({ message: "Not found" });

    const answers = await storage.getAnswers(interviewId);
    const report = await generateFinalReport(interview, answers);

    const updated = await storage.updateInterview(interviewId, {
      status: "completed",
      readinessScore: report.readinessScore,
      readinessCategory: report.readinessCategory,
      feedback: report.feedback
    });

    res.json(updated);
  });

  return httpServer;
}
