'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileImage, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useCode } from '@/lib/context';

export function ImportDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { setProblem } = useCode();

  const handleFile = async (file: File) => {
    setIsUploading(true);
    const toastId = toast.loading('AI đang đọc đề bài của bạn...');
    try {
      let result;
      if (file.type.includes('image')) {
        result = await apiClient.ocrImage(file);
      } else if (file.type.includes('pdf')) {
        // Assume apiClient has ocrPdf or handle in ocrImage
        result = await apiClient.ocrImage(file); 
      } else {
        throw new Error('Định dạng file không hỗ trợ. Vui lòng chọn Ảnh hoặc PDF.');
      }

      setProblem({
        id: Math.floor(Math.random() * 1000).toString(),
        title: result.title || 'Bài tập mới',
        description: result.description || '',
        difficulty: (result.difficulty || 'medium') as any,
        tags: result.tags || [],
        acceptance: 0,
        examples: result.examples || [],
        constraints: result.constraints || [],
      });

      toast.success('Nhập đề bài thành công!', { id: toastId });
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Không thể đọc đề bài', { id: toastId, description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nhập đề bài từ Ảnh/PDF</DialogTitle>
          <DialogDescription>
            Tải lên ảnh chụp đề bài hoặc file PDF để AI tự động trích xuất nội dung.
          </DialogDescription>
        </DialogHeader>

        <div
          className={`mt-4 p-8 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-4 ${
            dragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm font-medium">Đang xử lý...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Kéo thả hoặc nhấp để tải lên</p>
                <p className="text-xs text-muted-foreground mt-1">Ảnh (PNG, JPG) hoặc PDF • Tối đa 10MB</p>
              </div>
              <input
                type="file"
                className="hidden"
                id="ocr-upload"
                accept="image/*,.pdf"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <Button variant="secondary" onClick={() => document.getElementById('ocr-upload')?.click()}>
                Chọn tệp
              </Button>
            </>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-secondary/30 flex items-center gap-3">
            <FileImage className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium">Ảnh chụp màn hình</span>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 flex items-center gap-3">
            <FileText className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium">Đề bài PDF</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
