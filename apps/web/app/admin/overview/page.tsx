'use client';

import { useEffect, useState } from 'react';
import { adminApi, type DashboardOverview } from '@/lib/api/admin';
import { MetricCard } from '@/components/admin/MetricCard';
import { RevenueChart } from '@/components/admin/charts/RevenueChart';
import {
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OverviewPage() {
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
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
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
            <p className="text-muted-foreground">Загрузка данных...</p>
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

  return (
    <div className="p-6 space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Обзор</h1>
          <p className="text-muted-foreground">
            Общая статистика платформы
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setPeriod('7d')}
            variant={period === '7d' ? 'default' : 'outline'}
            size="sm"
          >
            7 дней
          </Button>
          <Button
            onClick={() => setPeriod('30d')}
            variant={period === '30d' ? 'default' : 'outline'}
            size="sm"
          >
            30 дней
          </Button>
          <Button
            onClick={() => setPeriod('90d')}
            variant={period === '90d' ? 'default' : 'outline'}
            size="sm"
          >
            90 дней
          </Button>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Общие расходы"
          value={`$${data.metrics.totalCosts.toFixed(2)}`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <MetricCard
          title="Общий доход"
          value={`₽${data.metrics.totalRevenue.toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Прибыль"
          value={`₽${data.metrics.totalProfit.toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Всего пользователей"
          value={data.metrics.totalUsers.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Активных пользователей"
          value={data.metrics.activeUsers.toLocaleString()}
          icon={<UserCheck className="h-5 w-5" />}
        />
        <MetricCard
          title="Всего запросов"
          value={data.metrics.totalRequests.toLocaleString()}
          icon={<MessageSquare className="h-5 w-5" />}
        />
      </div>

      {/* Cost vs Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Расходы vs Доходы</CardTitle>
          <p className="text-sm text-muted-foreground">
            Динамика расходов и доходов за выбранный период
          </p>
        </CardHeader>
        <CardContent>
          <RevenueChart data={data.costRevenueChart} />
        </CardContent>
      </Card>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle>Топ 10 пользователей</CardTitle>
            <p className="text-sm text-muted-foreground">
              По общим расходам за период
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Расходы (USD)</TableHead>
                  <TableHead className="text-right">Запросов</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Нет данных
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topUsers.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-right">
                        ${user.totalCost.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.requestCount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Models */}
        <Card>
          <CardHeader>
            <CardTitle>Топ 10 моделей</CardTitle>
            <p className="text-sm text-muted-foreground">
              По общим расходам за период
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Модель</TableHead>
                  <TableHead className="text-right">Расходы (USD)</TableHead>
                  <TableHead className="text-right">Запросов</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topModels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Нет данных
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topModels.map((model) => (
                    <TableRow key={model.model}>
                      <TableCell className="font-medium">
                        {model.model}
                      </TableCell>
                      <TableCell className="text-right">
                        ${model.totalCost.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right">
                        {model.requestCount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
