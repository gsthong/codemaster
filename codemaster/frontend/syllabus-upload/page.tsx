'use client';

import { useState } from 'react';
import { RootLayout } from '@/components/layout/RootLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { MOCK_SYLLABUS } from '@/lib/mock-data';
import { SyllabusTopic } from '@/lib/types';
import { toast } from 'sonner';

export default function SyllabusUploadPage() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            toast.success('Syllabus uploaded successfully!', {
              description: '6 topics extracted and analyzed'
            });
            return 100;
          }
          return prev + Math.random() * 30;
        });
      }, 300);
    }
  };

  return (
    <RootLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Syllabus Upload</h1>
          <p className="text-foreground/60">Upload your course syllabus and we'll extract key topics to guide your practice</p>
        </div>

        {/* Upload Zone */}
        <Card className="p-12 bg-card border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Upload Syllabus</h3>
              <p className="text-sm text-foreground/60 mb-4">Drag and drop your PDF or Word document here</p>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <Button
              onClick={() => document.getElementById('file-input')?.click()}
              className="bg-primary hover:bg-primary/90"
            >
              Choose File
            </Button>
            <p className="text-xs text-foreground/40">PDF or Word • Max 10MB</p>
          </div>
        </Card>

        {/* Progress Bar */}
        {isUploading && (
          <Card className="p-4 bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Analyzing syllabus...</span>
              <span className="text-sm text-foreground/60">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </Card>
        )}

        {/* Topics Section */}
        {!isUploading && (
          <>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Extracted Topics</h2>
              <div className="grid grid-cols-2 gap-4">
                {MOCK_SYLLABUS.map((topic: SyllabusTopic) => (
                  <Card key={topic.id} className="p-4 bg-card border border-border hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-foreground">{topic.name}</h4>
                        <p className="text-xs text-foreground/60 mt-1">{topic.description}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground/60">Progress</span>
                        <span className="text-xs font-medium text-foreground">{topic.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-primary to-accent"
                          style={{ width: `${topic.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Subtopics */}
                    {topic.subtopics && (
                      <div className="mt-3 text-xs text-foreground/60">
                        <p className="font-medium text-foreground/70 mb-1">Subtopics:</p>
                        <div className="flex flex-wrap gap-1">
                          {topic.subtopics.map((sub: string) => (
                            <span key={sub} className="px-2 py-1 bg-secondary/30 rounded text-foreground/60">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Card */}
            <Card className="p-6 bg-accent/10 border border-accent/20">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-accent shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-2">Ready to Practice</h3>
                  <p className="text-sm text-foreground/70 mb-4">
                    Your personalized practice roadmap is ready. We've matched topics to real coding problems.
                  </p>
                  <Button className="bg-primary hover:bg-primary/90">
                    Start Practicing
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </RootLayout>
  );
}
