'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export interface Attachment {
  type: 'image' | 'file';
  name: string;
  mimeType: string;
  data: string; // base64 or URL
  size: number;
}

interface FileUploadProps {
  onAttachmentsChange: (attachments: Attachment[]) => void;
  supportsVision: boolean;
  supportsFiles: boolean;
  disabled?: boolean;
  attachments?: Attachment[]; // Make it controlled
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
];

export function FileUpload({
  onAttachmentsChange,
  supportsVision,
  supportsFiles,
  disabled,
  attachments: externalAttachments = [],
}: FileUploadProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with external attachments (when parent clears)
  useEffect(() => {
    if (externalAttachments.length === 0 && attachments.length > 0) {
      setAttachments([]);
    }
  }, [externalAttachments.length]);

  // Notify parent when attachments change
  useEffect(() => {
    onAttachmentsChange(attachments);
  }, [attachments]);

  if (!supportsVision && !supportsFiles) {
    return null;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Файл ${file.name} слишком большой. Максимум 10MB.`);
        continue;
      }

      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isAllowedFile = ALLOWED_FILE_TYPES.includes(file.type);

      // Check file type
      if (isImage && !supportsVision) {
        toast.error('Текущая модель не поддерживает изображения');
        continue;
      }

      if (!isImage && !supportsFiles) {
        toast.error('Текущая модель не поддерживает файлы');
        continue;
      }

      if (!isAllowedFile) {
        toast.error(`Формат файла ${file.name} не поддерживается`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        const attachment: Attachment = {
          type: isImage ? 'image' : 'file',
          name: file.name,
          mimeType: file.type,
          data: base64,
          size: file.size,
        };

        setAttachments(prev => [...prev, attachment]);

        toast.success(`Файл ${file.name} загружен`);
      } catch (error) {
        toast.error(`Ошибка загрузки ${file.name}`);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/png;base64, prefix for cleaner storage
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-secondary rounded-lg p-2 pr-1 max-w-xs"
            >
              {attachment.type === 'image' ? (
                <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={`data:${attachment.mimeType};base64,${attachment.data}`}
                    alt={attachment.name}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => removeAttachment(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={supportsFiles ? ALLOWED_FILE_TYPES.join(',') : ALLOWED_IMAGE_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        title={
          supportsVision && supportsFiles
            ? 'Загрузить изображения или файлы'
            : supportsVision
            ? 'Загрузить изображения'
            : 'Загрузить файлы'
        }
      >
        <Paperclip className="h-5 w-5" />
      </Button>
    </div>
  );
}
