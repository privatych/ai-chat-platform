import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Brain, Zap, Shield, DollarSign, Sparkles, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Powered by OpenRouter</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              AI Chat Platform
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Общайтесь с 20+ лучшими AI моделями в одном месте.
              GPT-4, Claude, Gemini, DeepSeek и другие.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8">
                  Начать бесплатно
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Войти
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              Бесплатный тариф: 50 сообщений в день
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Возможности платформы
            </h2>
            <p className="text-lg text-muted-foreground">
              Всё что нужно для работы с AI в одном месте
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Brain className="w-10 h-10 mb-2 text-primary" />
                <CardTitle>20+ AI Моделей</CardTitle>
                <CardDescription>
                  GPT-4 Turbo, Claude 3.5, Gemini Pro, DeepSeek, Llama 3, Mistral и другие
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="w-10 h-10 mb-2 text-primary" />
                <CardTitle>Быстрые ответы</CardTitle>
                <CardDescription>
                  Потоковая передача ответов в реальном времени для мгновенного взаимодействия
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="w-10 h-10 mb-2 text-primary" />
                <CardTitle>История чатов</CardTitle>
                <CardDescription>
                  Все ваши диалоги сохраняются и доступны с любого устройства
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-10 h-10 mb-2 text-primary" />
                <CardTitle>Безопасность</CardTitle>
                <CardDescription>
                  Ваши данные защищены. Никакая информация не передаётся третьим лицам
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="w-10 h-10 mb-2 text-primary" />
                <CardTitle>Доступные цены</CardTitle>
                <CardDescription>
                  Начните бесплатно, платите только за то, что используете
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="w-10 h-10 mb-2 text-primary" />
                <CardTitle>Простой интерфейс</CardTitle>
                <CardDescription>
                  Интуитивный дизайн, не требующий обучения. Просто начните общаться
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="px-4 py-20 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Доступные AI модели
            </h2>
            <p className="text-lg text-muted-foreground">
              Выбирайте лучшую модель для вашей задачи
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'GPT-4 Turbo', company: 'OpenAI', desc: 'Самая мощная модель' },
              { name: 'Claude 3.5 Sonnet', company: 'Anthropic', desc: 'Лучшая для анализа' },
              { name: 'Gemini Pro', company: 'Google', desc: 'Быстрая и точная' },
              { name: 'DeepSeek V3', company: 'DeepSeek', desc: 'Новейшая технология' },
              { name: 'Llama 3 70B', company: 'Meta', desc: 'Open source модель' },
              { name: 'Mistral Large', company: 'Mistral AI', desc: 'Европейская модель' },
              { name: 'GPT-3.5 Turbo', company: 'OpenAI', desc: 'Быстрая и доступная' },
              { name: 'Claude 3 Haiku', company: 'Anthropic', desc: 'Молниеносная скорость' },
            ].map((model, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{model.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {model.company}
                  </CardDescription>
                  <p className="text-sm mt-2">{model.desc}</p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Тарифные планы
            </h2>
            <p className="text-lg text-muted-foreground">
              Выберите план, который подходит вам
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <div className="text-4xl font-bold mt-4">
                  $0<span className="text-lg font-normal text-muted-foreground">/месяц</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    50 сообщений в день
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Доступ к базовым моделям
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    История чатов 7 дней
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    До 4000 токенов на запрос
                  </p>
                </div>
                <Link href="/register" className="block">
                  <Button variant="outline" className="w-full">
                    Начать бесплатно
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="relative border-primary shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Популярный
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Premium</CardTitle>
                <div className="text-4xl font-bold mt-4">
                  $9.99<span className="text-lg font-normal text-muted-foreground">/месяц</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    1000 сообщений в день
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Доступ ко всем моделям
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Безлимитная история
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    До 32000 токенов на запрос
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Приоритетная поддержка
                  </p>
                </div>
                <Link href="/register" className="block">
                  <Button className="w-full">
                    Оформить Premium
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Готовы начать работу с AI?
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Присоединяйтесь к тысячам пользователей, которые уже используют нашу платформу
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Создать бесплатный аккаунт
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 AI Chat Platform. Все права защищены.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground">Условия использования</Link>
              <Link href="#" className="hover:text-foreground">Конфиденциальность</Link>
              <Link href="#" className="hover:text-foreground">Поддержка</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
