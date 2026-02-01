import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { UploadCloud, Briefcase, FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import { useCreateInterview, useParseResume } from "@/hooks/use-interviews";
import { Button } from "@/components/ui/button-modern";
import { Card, CardTitle, CardDescription } from "@/components/ui/card-modern";
import { Textarea, Label } from "@/components/ui/input-modern";
import { useToast } from "@/hooks/use-toast";

export default function StartInterview() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState("");
  
  const createInterview = useCreateInterview();
  const parseResume = useParseResume();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    
    try {
      const result = await parseResume.mutateAsync(file);
      setResumeText(result.text);
      toast({
        title: "Resume parsed successfully",
        description: "We've extracted the text from your resume.",
      });
    } catch (error) {
      toast({
        title: "Parsing failed",
        description: "Could not read the file. Please try copy-pasting the text instead.",
        variant: "destructive",
      });
      setFileName("");
    }
  };

  const handleSubmit = async () => {
    if (!resumeText.trim()) {
      toast({ title: "Resume required", description: "Please upload a resume or paste text.", variant: "destructive" });
      return;
    }
    if (!jobDescription.trim()) {
      toast({ title: "Job description required", description: "Please enter the job description.", variant: "destructive" });
      return;
    }

    try {
      const interview = await createInterview.mutateAsync({
        resumeText,
        jobDescription,
      });
      setLocation(`/interview/${interview.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start interview",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-10">
      <div className="container mx-auto max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            AI Mock <span className="text-primary">Interviewer</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Upload your resume and a job description to generate a personalized, adaptive interview session powered by AI.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Resume Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Card className="h-full border-t-4 border-t-primary">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText size={20} />
                </div>
                <div>
                  <CardTitle>Your Resume</CardTitle>
                  <CardDescription>Upload PDF/DOCX or paste text</CardDescription>
                </div>
              </div>

              <div className="space-y-4">
                <div className="group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-primary hover:bg-primary/5">
                  <input
                    type="file"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    disabled={parseResume.isPending}
                  />
                  {parseResume.isPending ? (
                    <div className="flex flex-col items-center gap-2 text-primary">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span className="text-sm font-medium">Parsing...</span>
                    </div>
                  ) : fileName ? (
                    <div className="flex flex-col items-center gap-2 text-green-600">
                      <CheckCircle2 size={24} />
                      <span className="text-sm font-medium">{fileName}</span>
                      <span className="text-xs text-slate-400">Click to change</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-primary">
                      <UploadCloud size={24} />
                      <span className="text-sm font-medium">Click to upload or drag file</span>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or paste text</span>
                  </div>
                </div>

                <Textarea
                  placeholder="Paste your resume content here..."
                  className="min-h-[200px] font-mono text-sm"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>
            </Card>
          </motion.div>

          {/* Job Description Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="h-full border-t-4 border-t-accent">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Briefcase size={20} />
                </div>
                <div>
                  <CardTitle>Job Description</CardTitle>
                  <CardDescription>Paste the job posting details</CardDescription>
                </div>
              </div>

              <div className="space-y-4">
                <Textarea
                  placeholder="Paste the full job description here (requirements, responsibilities, etc)..."
                  className="min-h-[340px] font-mono text-sm"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 flex justify-center"
        >
          <Button
            size="lg"
            onClick={handleSubmit}
            isLoading={createInterview.isPending}
            className="w-full text-lg md:w-auto md:min-w-[300px]"
          >
            Start Interview <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
