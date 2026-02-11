'use client';

import { useEffect, useState } from 'react';
import { adminApi, type DashboardOverview } from '@/lib/api/admin';
import { MetricCard } from '@/components/admin/MetricCard';
import { RevenueChart } from '@/components/admin/charts/RevenueChart';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Users,
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

export default function AdminFinancePage() {
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
            <p className="text-muted-foreground">Загрузка финансовых данных...</p>
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

  const profitMargin = data.metrics.totalRevenue > 0
    ? ((data.metrics.totalProfit / data.metrics.totalRevenue) * 100).toFixed(1)
    : '0.0';

  const isProfitable = data.metrics.totalProfit > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Финансы</h1>
          <p className="text-muted-foreground">
            Финансовая статистика и доходы
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

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Общий доход"
          value={`₽${data.metrics.totalRevenue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<Wallet className="h-5 w-5" />}
          trend={isProfitable ? 'up' : 'neutral'}
        />
        <MetricCard
          title="Расходы (API)"
          value={`$${data.metrics.totalCosts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<CreditCard className="h-5 w-5" />}
          trend="down"
        />
        <MetricCard
          title="Чистая прибыль"
          value={`₽${data.metrics.totalProfit.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={isProfitable ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          trend={isProfitable ? 'up' : 'down'}
        />
        <MetricCard
          title="Маржа прибыли"
          value={`${profitMargin}%`}
          icon={<DollarSign className="h-5 w-5" />}
          trend={parseFloat(profitMargin) > 50 ? 'up' : parseFloat(profitMargin) > 0 ? 'neutral' : 'down'}
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Динамика доходов и расходов</CardTitle>
          <p className="text-sm text-muted-foreground">
            График показывает доходы от подписок (₽) и расходы на API ($) за период
          </p>
        </CardHeader>
        <CardContent>
          <RevenueChart data={data.costRevenueChart} />
        </CardContent>
      </Card>

      {/* Top Revenue Users */}
      <Card>
        <CardHeader>
          <CardTitle>Топ пользователей по расходам</CardTitle>
          <p className="text-sm text-muted-foreground">
            Пользователи, генерирующие наибольшие расходы на API
          </p>
        </CardHeader>
        <CardContent>
          {data.topUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет данных за выбранный период
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Запросов</TableHead>
                  <TableHead className="text-right">Стоимость (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topUsers.map((user, index) => (
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
                      {user.requestCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${user.totalCost.toFixed(4)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Финансовая сводка</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Источники дохода
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Premium подписки (990 ₽/мес)</span>
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {data.metrics.totalUsers} польз.
                  </Badge>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Итого доход</span>
                  <span className="font-mono font-bold text-green-600">
                    ₽{data.metrics.totalRevenue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Структура расходов
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">API запросы (OpenAI, Anthropic)</span>
                  <Badge variant="secondary">
                    {data.metrics.totalRequests.toLocaleString()} запр.
                  </Badge>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Итого расходы</span>
                  <span className="font-mono font-bold text-red-600">
                    ${data.metrics.totalCosts.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Общая прибыль за период</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isProfitable ? 'Бизнес рентабелен' : 'Требуется оптимизация расходов'}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                  ₽{data.metrics.totalProfit.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Маржа: {profitMargin}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
