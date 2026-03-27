'use client';

import { useState } from 'react';
import { RootLayout } from '@/components/layout/RootLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MOCK_SYLLABUS } from '@/lib/mock-data';
import { SyllabusTopic } from '@/lib/types';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';

export default function SyllabusUploadPage() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [topics, setTopics] = useState<SyllabusTopic[]>(MOCK_SYLLABUS);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const toastId = toast.loading('Đang tải lên syllabus...');

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(p => p < 90 ? p + 10 : p);
      }, 500);

      const result = await apiClient.uploadSyllabus(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTopics(result.topics || []);
      
      toast.success('Tải lên thành công!', {
        id: toastId,
        description: `Đã phân tích ${result.topics?.length || 0} chủ đề từ giáo trình của bạn.`
      });
    } catch (err: any) {
      toast.error('Tải lên thất bại', { id: toastId, description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <RootLayout>
      <div className="p-8 space-y-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tải lên Giáo trình</h1>
          <p className="text-foreground/60">Tải lên giáo trình khóa học của bạn để AI phân tích các chủ đề trọng tâm và gợi ý lộ trình luyện tập phù hợp.</p>
        </div>

        {/* Upload Zone */}
        <Card className="p-12 bg-card border-2 border-dashed border-border hover:border-primary/50 transition-colors group cursor-pointer relative overflow-hidden">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Kéo và thả file tại đây</h3>
              <p className="text-sm text-foreground/60 mb-4">Hỗ trợ định dạng PDF, Word (Max 10MB)</p>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button
              className="bg-primary hover:bg-primary/90 pointer-events-none"
              disabled={isUploading}
            >
              Chọn tệp từ máy tính
            </Button>
          </div>
        </Card>

        {/* Progress Bar */}
        {isUploading && (
          <Card className="p-4 bg-muted/30 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Đang phân tích giáo trình...</span>
              <span className="text-sm text-foreground/60">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </Card>
        )}

        {/* Topics Section */}
        {!isUploading && topics.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Chủ đề đã trích xuất</h2>
              <Badge variant="outline" className="text-xs">{topics.length} Chủ đề</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topics.map((topic: SyllabusTopic) => (
                <Card key={topic.id} className="p-5 bg-card border border-border hover:border-primary/30 transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground leading-tight">{topic.name}</h4>
                      <p className="text-xs text-foreground/60 line-clamp-2">{topic.description}</p>
                    </div>
                    {topic.progress === 100 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-primary/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary/40" />
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold">
                      <span className="text-foreground/40">Tiến độ hoàn thành</span>
                      <span className="text-primary">{topic.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${topic.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Subtopics */}
                  {topic.subtopics && topic.subtopics.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex flex-wrap gap-1.5">
                        {topic.subtopics.map((sub: string) => (
                          <span key={sub} className="px-2 py-0.5 bg-muted rounded-full text-[10px] text-foreground/70 font-medium">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Action Card */}
            <Card className="p-6 bg-primary/5 border border-primary/10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <AlertCircle size={80} />
              </div>
              <div className="flex items-start gap-4 relative z-10">
                <AlertCircle className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground mb-1">Lộ trình học tập đã sẵn sàng</h3>
                  <p className="text-sm text-foreground/70 mb-5">
                    Chúng tôi đã thiết kế một lộ trình luyện tập cá nhân hóa dựa trên giáo trình của bạn. Các bài tập được chọn lọc để khớp với từng chủ đề.
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 px-8" onClick={() => (window.location.href = '/practice')}>
                    Bắt đầu Luyện tập
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RootLayout>
  );
}
