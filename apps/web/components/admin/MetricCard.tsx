import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number; // percentage
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "neutral":
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getChangeColor = () => {
    if (!change) return "text-gray-500";
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-red-500";
    return "text-gray-500";
  };

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getChangeColor()}`}>
                {change > 0 ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
