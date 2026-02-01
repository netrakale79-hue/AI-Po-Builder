import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { Trophy, ArrowLeft, Target, Award, BrainCircuit, AlertTriangle } from "lucide-react";
import { useInterview } from "@/hooks/use-interviews";
import { Button } from "@/components/ui/button-modern";
import { Card, CardTitle, CardDescription } from "@/components/ui/card-modern";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function InterviewResults() {
  const [, params] = useRoute("/results/:id");
  const interviewId = parseInt(params?.id || "0");
  const { data: interview, isLoading } = useInterview(interviewId);

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading results...</div>;
  if (!interview) return <div className="flex h-screen items-center justify-center">Results not found.</div>;

  // Mock data for charts if feedback is complex, but let's assume simple structure for now
  const feedback = interview.feedback as any || {};
  
  // Example chart data
  const scoreData = [
    { name: 'Score', value: interview.totalScore || 75 },
    { name: 'Remaining', value: 100 - (interview.totalScore || 75) },
  ];
  
  const COLORS = ['hsl(221, 83%, 53%)', 'hsl(210, 40%, 90%)'];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-10">
      <div className="container mx-auto max-w-5xl px-4">
        <Link href="/" className="mb-8 inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Link>

        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 shadow-inner"
          >
            <Trophy size={40} />
          </motion.div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900">
            Interview Complete
          </h1>
          <p className="text-lg text-slate-600">Here's how you performed</p>
        </div>

        {/* Top Stats Row */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card gradient className="border-t-4 border-t-primary">
            <div className="flex flex-col items-center p-4">
              <span className="mb-2 rounded-full bg-primary/10 p-2 text-primary">
                <Target size={24} />
              </span>
              <div className="text-3xl font-bold text-slate-900">{interview.totalScore}/100</div>
              <div className="text-sm font-medium text-muted-foreground">Overall Score</div>
            </div>
          </Card>
          
          <Card gradient className="border-t-4 border-t-accent">
            <div className="flex flex-col items-center p-4">
              <span className="mb-2 rounded-full bg-accent/10 p-2 text-accent">
                <Award size={24} />
              </span>
              <div className="text-3xl font-bold text-slate-900">{interview.readinessCategory || "Evaluating..."}</div>
              <div className="text-sm font-medium text-muted-foreground">Readiness Level</div>
            </div>
          </Card>

          <Card gradient className="border-t-4 border-t-emerald-500">
            <div className="flex flex-col items-center p-4">
              <span className="mb-2 rounded-full bg-emerald-100 p-2 text-emerald-600">
                <BrainCircuit size={24} />
              </span>
              <div className="text-3xl font-bold text-slate-900">{interview.resumeMatchScore}%</div>
              <div className="text-sm font-medium text-muted-foreground">Resume Match</div>
            </div>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Detailed Feedback Column */}
          <div className="md:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardTitle className="mb-6">AI Feedback Analysis</CardTitle>
                
                <div className="space-y-6">
                  {feedback.strengths && feedback.strengths.length > 0 && (
                    <div className="rounded-xl bg-emerald-50/50 p-6 border border-emerald-100">
                      <h4 className="mb-3 flex items-center text-lg font-bold text-emerald-700">
                        <CheckCircle className="mr-2 h-5 w-5" /> Key Strengths
                      </h4>
                      <ul className="space-y-2">
                        {feedback.strengths.map((s: string, i: number) => (
                          <li key={i} className="flex items-start text-emerald-800">
                            <span className="mr-2 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feedback.improvements && feedback.improvements.length > 0 && (
                    <div className="rounded-xl bg-amber-50/50 p-6 border border-amber-100">
                      <h4 className="mb-3 flex items-center text-lg font-bold text-amber-700">
                        <AlertTriangle className="mr-2 h-5 w-5" /> Areas for Improvement
                      </h4>
                      <ul className="space-y-2">
                        {feedback.improvements.map((s: string, i: number) => (
                          <li key={i} className="flex items-start text-amber-900">
                            <span className="mr-2 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {feedback.summary && (
                    <div className="mt-4">
                      <h4 className="mb-2 font-bold text-slate-900">Executive Summary</h4>
                      <p className="leading-relaxed text-slate-600">{feedback.summary}</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Visualizations Column */}
          <div className="space-y-8">
            <Card className="flex flex-col items-center justify-center p-6">
              <CardTitle className="mb-4 text-center">Performance Chart</CardTitle>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scoreData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {scoreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center text-sm text-slate-500">
                Visual representation of your total score
              </div>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardTitle className="text-white mb-2">Next Steps</CardTitle>
              <p className="text-primary-foreground/90 text-sm mb-6">
                Practice makes perfect. Start another session to improve your weak areas.
              </p>
              <Link href="/">
                <Button variant="secondary" className="w-full font-bold">
                  Start New Session
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
