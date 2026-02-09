'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus, FolderOpen, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onProjectChange: (projectId: string) => void;
}

export function ProjectSelector({
  selectedProjectId,
  onProjectChange,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const response = await apiClient.listProjects();
    if (response.success && response.data) {
      setProjects(response.data);
      // Auto-select first project if none selected
      if (!selectedProjectId && response.data.length > 0) {
        onProjectChange(response.data[0].id);
      }
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Введите название проекта');
      return;
    }

    setIsLoading(true);
    const response = await apiClient.createProject(
      newProjectName.trim(),
      newProjectDescription.trim() || undefined
    );

    if (response.success && response.data) {
      setProjects([...projects, response.data]);
      onProjectChange(response.data.id);
      setIsCreateDialogOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
      toast.success('Проект создан');
    }
    setIsLoading(false);
  };

  const handleRenameClick = () => {
    const project = projects.find(p => p.id === selectedProjectId);
    if (project) {
      setSelectedProject(project);
      setNewProjectName(project.name);
      setNewProjectDescription(project.description || '');
      setIsRenameDialogOpen(true);
    }
  };

  const handleRenameProject = async () => {
    if (!selectedProject || !newProjectName.trim()) {
      toast.error('Введите название проекта');
      return;
    }

    setIsLoading(true);
    const response = await apiClient.updateProject(
      selectedProject.id,
      newProjectName.trim(),
      newProjectDescription.trim() || undefined
    );

    if (response.success) {
      setProjects(projects.map(p =>
        p.id === selectedProject.id
          ? { ...p, name: newProjectName, description: newProjectDescription }
          : p
      ));
      setIsRenameDialogOpen(false);
      setSelectedProject(null);
      setNewProjectName('');
      setNewProjectDescription('');
      toast.success('Проект переименован');
    }
    setIsLoading(false);
  };

  const handleDeleteClick = () => {
    const project = projects.find(p => p.id === selectedProjectId);
    if (project) {
      setSelectedProject(project);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;

    setIsLoading(true);
    const response = await apiClient.deleteProject(selectedProject.id);

    if (response.success) {
      const newProjects = projects.filter(p => p.id !== selectedProject.id);
      setProjects(newProjects);

      // Select first project or null
      if (selectedProjectId === selectedProject.id) {
        onProjectChange(newProjects[0]?.id || '');
      }

      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
      toast.success('Проект удалён');
    }
    setIsLoading(false);
  };

  return (
    <>
      <div className="flex gap-2 items-center">
        <Select value={selectedProjectId || ''} onValueChange={onProjectChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Выберите проект">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                {projects.find(p => p.id === selectedProjectId)?.name || 'Проект'}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  {project.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCreateDialogOpen(true)}
          title="Создать проект"
        >
          <Plus className="h-4 w-4" />
        </Button>

        {selectedProjectId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title="Управление проектом">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRenameClick}>
                <Pencil className="mr-2 h-4 w-4" />
                Переименовать
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Rename Project Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переименовать проект</DialogTitle>
            <DialogDescription>
              Изменить название и описание проекта
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-name">Название</Label>
              <Input
                id="rename-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Название проекта"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rename-description">Описание (опционально)</Label>
              <Textarea
                id="rename-description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Краткое описание проекта"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRenameDialogOpen(false);
                setSelectedProject(null);
                setNewProjectName('');
                setNewProjectDescription('');
              }}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button onClick={handleRenameProject} disabled={isLoading}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Проект "{selectedProject?.name}" и все связанные чаты будут удалены навсегда.
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый проект</DialogTitle>
            <DialogDescription>
              Создайте проект для организации чатов и контекста
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Название проекта"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleCreateProject();
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Описание (опционально)</Label>
              <Textarea
                id="description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Краткое описание проекта"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button onClick={handleCreateProject} disabled={isLoading}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
