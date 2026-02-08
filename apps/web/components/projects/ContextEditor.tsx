'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus, FileText, User, Code, FolderOpen } from 'lucide-react';

interface ContextEditorProps {
  projectId: string | null;
}

const SECTION_TYPES = [
  { value: 'about_project', label: 'О проекте', icon: FolderOpen },
  { value: 'about_user', label: 'О пользователе', icon: User },
  { value: 'technical', label: 'Техническая информация', icon: Code },
  { value: 'documents', label: 'Документы', icon: FileText },
] as const;

export function ContextEditor({ projectId }: ContextEditorProps) {
  const [sections, setSections] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    sectionType: 'about_project' as const,
    title: '',
    content: '',
  });

  useEffect(() => {
    if (projectId) {
      loadSections();
    } else {
      setSections([]);
    }
  }, [projectId]);

  const loadSections = async () => {
    if (!projectId) return;

    const response = await apiClient.listContextSections(projectId);
    if (response.success && response.data) {
      setSections(response.data);
    }
  };

  const handleCreateSection = async () => {
    if (!projectId || !formData.title.trim()) {
      toast.error('Заполните название секции');
      return;
    }

    setIsLoading(true);
    const response = await apiClient.createContextSection(
      projectId,
      formData.sectionType,
      formData.title.trim(),
      formData.content.trim() || undefined
    );

    if (response.success && response.data) {
      setSections([...sections, response.data]);
      setIsCreateDialogOpen(false);
      setFormData({ sectionType: 'about_project', title: '', content: '' });
      toast.success('Секция создана');
    }
    setIsLoading(false);
  };

  const getSectionIcon = (type: string) => {
    const section = SECTION_TYPES.find(s => s.value === type);
    const Icon = section?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getSectionLabel = (type: string) => {
    return SECTION_TYPES.find(s => s.value === type)?.label || type;
  };

  if (!projectId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Выберите проект для редактирования контекста
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Контекст проекта</h3>
          <p className="text-sm text-muted-foreground">
            Информация, которая будет доступна AI в чатах этого проекта
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить секцию
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Нет секций контекста. Добавьте первую секцию.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getSectionIcon(section.sectionType)}
                    <div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {getSectionLabel(section.sectionType)}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {section.content && (
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {section.content.length > 200
                      ? section.content.substring(0, 200) + '...'
                      : section.content}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Section Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить секцию контекста</DialogTitle>
            <DialogDescription>
              Информация из этой секции будет доступна AI при общении
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Тип секции</Label>
              <Select
                value={formData.sectionType}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, sectionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Например: О проекте, Требования, Стиль кода"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Содержимое</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Введите информацию для AI..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setFormData({ sectionType: 'about_project', title: '', content: '' });
              }}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button onClick={handleCreateSection} disabled={isLoading}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
