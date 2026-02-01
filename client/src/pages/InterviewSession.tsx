import { useEffect, useState, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { useInterview, useNextQuestion, useSubmitAnswer } from "@/hooks/use-interviews";
import { Button } from "@/components/ui/button-modern";
import { Card } from "@/components/ui/card-modern";
import { Textarea } from "@/components/ui/input-modern";
import { InterviewTimer } from "@/components/InterviewTimer";
import { useToast } from "@/hooks/use-toast";
import type { Question } from "@shared/schema";

export default function InterviewSession() {
  const [, params] = useRoute("/interview/:id");
  const interviewId = parseInt(params?.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // State
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answerContent, setAnswerContent] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isReady, setIsReady] = useState(false); // To show "Ready?" screen

  // Queries & Mutations
  const { data: interview, isLoading: isLoadingInterview } = useInterview(interviewId);
  const nextQuestionMutation = useNextQuestion(interviewId);
  const submitAnswerMutation = useSubmitAnswer(
    interviewId, 
    currentQuestion?.id || 0
  );

  // Load first question on mount
  useEffect(() => {
    if (interview && !currentQuestion && !isReady) {
      // Don't auto-fetch, wait for user to say "Ready"
      setIsReady(true);
    }
  }, [interview, currentQuestion]);

  const fetchNextQuestion = async () => {
    try {
      const result = await nextQuestionMutation.mutateAsync();
      
      if (result.interviewStatus !== "in_progress") {
        setLocation(`/results/${interviewId}`);
        return;
      }

      if (result.question) {
        setCurrentQuestion(result.question);
        setAnswerContent("");
        setTimeElapsed(0);
        setIsTimerActive(true);
      } else {
         // Fallback if no question returned but status is in_progress (rare)
         toast({ title: "Error", description: "Could not load question.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load question.", variant: "destructive" });
    }
  };

  const handleStart = () => {
    setIsReady(false);
    fetchNextQuestion();
  };

  const handleSubmitAnswer = async () => {
    if (!answerContent.trim()) {
      toast({ title: "Empty Answer", description: "Please provide an answer before submitting.", variant: "destructive" });
      return;
    }
    
    setIsTimerActive(false); // Stop timer

    try {
      await submitAnswerMutation.mutateAsync({
        content: answerContent,
        timeTaken: timeElapsed,
      });
      
      // Successfully submitted, fetch next
      fetchNextQuestion();
    } catch (error) {
      toast({ title: "Submission Failed", description: "Please try again.", variant: "destructive" });
      setIsTimerActive(true); // Resume timer on error
    }
  };

  const handleTimerTick = (seconds: number) => {
    setTimeElapsed(seconds);
  };

  const handleTimerComplete = () => {
    toast({ 
      title: "Time's up!", 
      description: "Please wrap up your answer and submit.",
      variant: "destructive" 
    });
    // We don't auto-submit, but we could enforce it. For now just warn.
  };

  if (isLoadingInterview) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-lg font-medium text-slate-600">Preparing your interview...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Interview not found.</p>
      </div>
    );
  }

  // Initial Ready Screen
  if (isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle size={32} />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold">Ready to Begin?</h2>
            <p className="mb-8 text-muted-foreground">
              You'll be presented with a series of questions.
              <br />
              There is a time limit for each question based on difficulty.
            </p>
            <Button size="lg" className="w-full" onClick={handleStart}>
              Start Interview
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Interview Interface
  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header Stats */}
        <header className="mb-8 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              {interview.currentDifficulty} Mode
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-sm font-medium text-slate-500">
              Question {interview.questionCount + 1}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock size={16} />
            <span>Session in progress</span>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Main Question Area */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="border-l-4 border-l-primary bg-white shadow-lg">
                    <h2 className="mb-6 font-display text-2xl font-bold leading-tight text-slate-900 md:text-3xl">
                      {currentQuestion.content}
                    </h2>
                    
                    <div className="relative">
                      <Label className="mb-3 ml-1 text-slate-500">Your Answer</Label>
                      <Textarea
                        value={answerContent}
                        onChange={(e) => setAnswerContent(e.target.value)}
                        placeholder="Type your answer here..."
                        className="min-h-[300px] text-base leading-relaxed p-6 shadow-inner bg-slate-50/50 focus:bg-white"
                        autoFocus
                      />
                      
                      {/* Optional: Voice Input Trigger (future feature placeholder) */}
                      <button className="absolute bottom-4 right-4 rounded-full bg-white p-2 text-slate-400 shadow-sm hover:text-primary hover:shadow-md transition-all border border-slate-100">
                        <Mic size={20} />
                      </button>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button 
                        size="lg" 
                        onClick={handleSubmitAnswer}
                        isLoading={submitAnswerMutation.isPending || nextQuestionMutation.isPending}
                        className="w-full md:w-auto min-w-[160px]"
                      >
                        Submit Answer <Send className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar / Timer */}
          <div className="hidden lg:block">
            <div className="sticky top-6 space-y-6">
              <Card className="flex flex-col items-center justify-center py-10">
                <div className="mb-4 text-sm font-medium text-slate-500">Time Remaining</div>
                <InterviewTimer 
                  key={currentQuestion?.id} // Reset timer on new question
                  durationSeconds={currentQuestion?.timeLimit || 60}
                  isActive={isTimerActive}
                  onComplete={handleTimerComplete}
                  onTick={handleTimerTick}
                />
                <div className="mt-6 flex items-start gap-3 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>Try to be concise. The AI evaluates both quality and efficiency.</p>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Mobile Timer (Floating) */}
          <div className="fixed bottom-4 right-4 lg:hidden">
             <div className="h-16 w-16 rounded-full bg-white shadow-xl ring-2 ring-primary/20">
                <InterviewTimer 
                  key={`mobile-${currentQuestion?.id}`}
                  durationSeconds={currentQuestion?.timeLimit || 60}
                  isActive={isTimerActive}
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
