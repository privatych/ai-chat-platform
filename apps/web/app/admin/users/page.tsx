'use client';

import { useEffect, useState } from 'react';
import { adminApi, type User } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [blockReason, setBlockReason] = useState('');

  async function fetchUsers() {
    setLoading(true);
    try {
      const result = await adminApi.users.getList({
        search: search || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit,
      });
      setUsers(result.users);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [page, limit]);

  function handleSearch() {
    setPage(1);
    fetchUsers();
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  async function handleChangeRole() {
    if (!selectedUser || !newRole) return;

    setActionLoading(true);
    try {
      await adminApi.users.updateRole(selectedUser.id, newRole);
      toast.success('Роль пользователя успешно изменена');
      fetchUsers();
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Failed to update role:', err);
      toast.error('Не удалось изменить роль');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBlock() {
    if (!selectedUser) return;

    const isBlocking = !selectedUser.isBlocked;

    if (isBlocking && !blockReason.trim()) {
      toast.error('Укажите причину блокировки');
      return;
    }

    setActionLoading(true);
    try {
      await adminApi.users.block(
        selectedUser.id,
        isBlocking,
        isBlocking ? blockReason : undefined
      );
      toast.success(
        isBlocking
          ? 'Пользователь успешно заблокирован'
          : 'Пользователь успешно разблокирован'
      );
      fetchUsers();
      setShowBlockModal(false);
      setSelectedUser(null);
      setBlockReason('');
    } catch (err) {
      console.error('Failed to block/unblock user:', err);
      toast.error('Не удалось выполнить операцию');
    } finally {
      setActionLoading(false);
    }
  }

  function openRoleModal(user: User) {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  }

  function openBlockModal(user: User) {
    setSelectedUser(user);
    setBlockReason('');
    setShowBlockModal(true);
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
            Админ
          </Badge>
        );
      case 'premiumuser':
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            Премиум
          </Badge>
        );
      case 'user':
      default:
        return <Badge variant="secondary">Пользователь</Badge>;
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Пользователи</h1>
        <p className="text-muted-foreground">
          Управление пользователями платформы
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Поиск по email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          className="max-w-xs"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Все роли" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            <SelectItem value="admin">Админ</SelectItem>
            <SelectItem value="premiumuser">Премиум</SelectItem>
            <SelectItem value="user">Пользователь</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="blocked">Заблокированные</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>Поиск</Button>

        {/* Items per page selector */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">На странице:</span>
          <Select
            value={String(limit)}
            onValueChange={(val) => {
              setLimit(Number(val));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-muted-foreground">Загрузка...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">
                    Пользователи не найдены
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <Badge variant="destructive">Заблокирован</Badge>
                    ) : (
                      <Badge variant="outline">Активен</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRoleModal(user)}
                      >
                        Изменить роль
                      </Button>
                      <Button
                        size="sm"
                        variant={user.isBlocked ? 'outline' : 'destructive'}
                        onClick={() => openBlockModal(user)}
                      >
                        {user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Всего пользователей: <span className="font-medium">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
            size="sm"
          >
            Назад
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm">
              Страница <span className="font-medium">{page}</span> из{' '}
              <span className="font-medium">{totalPages || 1}</span>
            </span>
          </div>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            variant="outline"
            size="sm"
          >
            Вперед
          </Button>
        </div>
      </div>

      {/* Role Change Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить роль пользователя</DialogTitle>
            <DialogDescription>
              Выберите новую роль для пользователя {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="premiumuser">Премиум</SelectItem>
                  <SelectItem value="admin">Админ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRoleModal(false)}
              disabled={actionLoading}
            >
              Отмена
            </Button>
            <Button onClick={handleChangeRole} disabled={actionLoading}>
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block/Unblock Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.isBlocked ? 'Разблокировать' : 'Заблокировать'}{' '}
              пользователя
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.isBlocked
                ? `Вы уверены, что хотите разблокировать ${selectedUser.email}?`
                : `Вы уверены, что хотите заблокировать ${selectedUser?.email}?`}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && !selectedUser.isBlocked && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Причина блокировки <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Укажите причину блокировки..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          {selectedUser?.isBlocked && selectedUser.blockedReason && (
            <div className="py-4">
              <div className="space-y-2">
                <Label>Причина блокировки:</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.blockedReason}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBlockModal(false)}
              disabled={actionLoading}
            >
              Отмена
            </Button>
            <Button
              variant={selectedUser?.isBlocked ? 'default' : 'destructive'}
              onClick={handleBlock}
              disabled={actionLoading}
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {selectedUser?.isBlocked ? 'Разблокировать' : 'Заблокировать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
