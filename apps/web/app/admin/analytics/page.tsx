'use client';

import { useEffect, useState } from 'react';
import { adminApi, type DashboardOverview } from '@/lib/api/admin';
import { MetricCard } from '@/components/admin/MetricCard';
import {
  Activity,
  MessageSquare,
  Users,
  UserCheck,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await adminApi.dashboard.getOverview(period);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка аналитики...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
          <p className="text-destructive font-semibold mb-2">Ошибка загрузки</p>
          <p className="text-muted-foreground">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-4"
          >
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Calculate engagement metrics
  const engagementRate = data.metrics.totalUsers > 0
    ? ((data.metrics.activeUsers / data.metrics.totalUsers) * 100).toFixed(1)
    : '0.0';

  const avgRequestsPerUser = data.metrics.activeUsers > 0
    ? (data.metrics.totalRequests / data.metrics.activeUsers).toFixed(1)
    : '0.0';

  const totalModelRequests = data.topModels.reduce((sum, model) => sum + model.requestCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Аналитика</h1>
          <p className="text-muted-foreground">
            Детальная аналитика использования платформы
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-2">
          <Button
            variant={period === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('7d')}
          >
            7 дней
          </Button>
          <Button
            variant={period === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('30d')}
          >
            30 дней
          </Button>
          <Button
            variant={period === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('90d')}
          >
            90 дней
          </Button>
        </div>
      </div>

      {/* User Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Всего пользователей"
          value={data.metrics.totalUsers.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Активные пользователи"
          value={data.metrics.activeUsers.toLocaleString()}
          icon={<UserCheck className="h-5 w-5" />}
          trend="up"
        />
        <MetricCard
          title="Вовлеченность"
          value={`${engagementRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={parseFloat(engagementRate) > 50 ? 'up' : 'neutral'}
        />
        <MetricCard
          title="Ср. запросов/польз."
          value={avgRequestsPerUser}
          icon={<Zap className="h-5 w-5" />}
        />
      </div>

      {/* Request Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Активность запросов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Всего запросов</span>
              <span className="text-2xl font-bold">{data.metrics.totalRequests.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Средний чек (USD)</span>
              <span className="font-mono">
                ${data.metrics.totalRequests > 0
                  ? (data.metrics.totalCosts / data.metrics.totalRequests).toFixed(4)
                  : '0.0000'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Активность</span>
              <Badge variant={data.metrics.totalRequests > 100 ? 'default' : 'secondary'}>
                <Activity className="h-3 w-3 mr-1" />
                {data.metrics.totalRequests > 1000 ? 'Высокая' : data.metrics.totalRequests > 100 ? 'Средняя' : 'Низкая'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Метрики пользователей</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Вовлеченность</span>
                <span className="text-sm font-medium">{engagementRate}%</span>
              </div>
              <Progress value={parseFloat(engagementRate)} className="h-2" />
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Активные</span>
                <span className="font-medium">{data.metrics.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Неактивные</span>
                <span className="text-muted-foreground">
                  {data.metrics.totalUsers - data.metrics.activeUsers}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Models */}
      <Card>
        <CardHeader>
          <CardTitle>Популярные модели</CardTitle>
          <p className="text-sm text-muted-foreground">
            Статистика использования AI моделей
          </p>
        </CardHeader>
        <CardContent>
          {data.topModels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет данных за выбранный период
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Модель</TableHead>
                    <TableHead className="text-right">Запросов</TableHead>
                    <TableHead className="text-right">Доля</TableHead>
                    <TableHead className="text-right">Стоимость (USD)</TableHead>
                    <TableHead className="text-right">Средняя цена</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topModels.map((model, index) => {
                    const sharePercent = totalModelRequests > 0
                      ? ((model.requestCount / totalModelRequests) * 100).toFixed(1)
                      : '0.0';
                    const avgCost = model.requestCount > 0
                      ? (model.totalCost / model.requestCount).toFixed(4)
                      : '0.0000';

                    return (
                      <TableRow key={model.model}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant={index < 3 ? 'default' : 'secondary'}>
                              #{index + 1}
                            </Badge>
                            <span className="font-mono text-sm">{model.model}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {model.requestCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={parseFloat(sharePercent)} className="w-16 h-2" />
                            <span className="text-sm w-12 text-right">{sharePercent}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${model.totalCost.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          ${avgCost}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Model insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Всего моделей</p>
                  <p className="text-2xl font-bold">{data.topModels.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Самая популярная</p>
                  <p className="text-sm font-mono font-medium">
                    {data.topModels[0]?.model || 'N/A'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Самая дорогая</p>
                  <p className="text-sm font-mono font-medium">
                    {data.topModels.reduce((max, model) =>
                      model.totalCost > (max?.totalCost || 0) ? model : max
                    , data.topModels[0])?.model || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Active Users */}
      <Card>
        <CardHeader>
          <CardTitle>Самые активные пользователи</CardTitle>
          <p className="text-sm text-muted-foreground">
            Пользователи с наибольшим количеством запросов
          </p>
        </CardHeader>
        <CardContent>
          {data.topUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет активных пользователей за выбранный период
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead className="text-right">Запросов</TableHead>
                  <TableHead className="text-right">Активность</TableHead>
                  <TableHead className="text-right">Расход (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topUsers.map((user, index) => {
                  const activityLevel = user.requestCount > 100 ? 'Высокая'
                    : user.requestCount > 50 ? 'Средняя'
                    : 'Низкая';

                  return (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Badge variant={index < 3 ? 'default' : 'secondary'}>
                            #{index + 1}
                          </Badge>
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          {user.requestCount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={activityLevel === 'Высокая' ? 'default' : activityLevel === 'Средняя' ? 'secondary' : 'outline'}
                        >
                          {activityLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${user.totalCost.toFixed(4)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
