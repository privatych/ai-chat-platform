'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Brain, Zap, Shield, DollarSign, Sparkles, MessageSquare, ArrowRight, Check } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function Home() {
  const { isAuthenticated, hasHydrated } = useAuthStore();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AI Chat Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {hasHydrated ? (
                isAuthenticated ? (
                  <Link href="/chat">
                    <Button>Перейти в чат</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost">Войти</Button>
                    </Link>
                    <Link href="/register">
                      <Button>Начать бесплатно</Button>
                    </Link>
                  </>
                )
              ) : (
                <div className="h-10 w-32 bg-secondary animate-pulse rounded-md" />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur text-sm font-medium">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Powered by OpenRouter</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              AI Chat Platform
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Общайтесь с <span className="text-primary font-semibold">7 лучшими AI моделями</span> в одном месте.
              GPT-4, Claude 3.5, Gemini 2.5 Pro, Llama 3.3 и другие.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {hasHydrated ? (
                isAuthenticated ? (
                  <Link href="/chat">
                    <Button size="lg" className="text-lg px-8 group">
                      Перейти в чат
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button size="lg" className="text-lg px-8 group">
                        Начать бесплатно
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="lg" variant="outline" className="text-lg px-8">
                        Войти
                      </Button>
                    </Link>
                  </>
                )
              ) : (
                <div className="flex gap-4">
                  <div className="h-12 w-48 bg-secondary animate-pulse rounded-md" />
                  <div className="h-12 w-32 bg-secondary animate-pulse rounded-md" />
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Бесплатный тариф: 50 сообщений в день. Кредитная карта не требуется.
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
            {[
              {
                icon: Brain,
                title: "7 AI Моделей",
                desc: "GPT-4 Turbo, Claude 3.5 Sonnet, Gemini 2.5 Pro, Llama 3.3 70B и другие"
              },
              {
                icon: Zap,
                title: "Быстрые ответы",
                desc: "Потоковая передача ответов в реальном времени для мгновенного взаимодействия"
              },
              {
                icon: MessageSquare,
                title: "История чатов",
                desc: "Все ваши диалоги сохраняются и доступны с любого устройства"
              },
              {
                icon: Shield,
                title: "Безопасность",
                desc: "Ваши данные защищены. Никакая информация не передаётся третьим лицам"
              },
              {
                icon: DollarSign,
                title: "Доступные цены",
                desc: "Начните бесплатно, платите только за то, что используете"
              },
              {
                icon: Sparkles,
                title: "Простой интерфейс",
                desc: "Интуитивный дизайн, не требующий обучения. Просто начните общаться"
              }
            ].map((feature, idx) => (
              <Card key={idx} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <feature.icon className="w-10 h-10 mb-2 text-primary" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="px-4 py-20 bg-secondary/30">
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
              { name: 'GPT-4 Turbo', company: 'OpenAI', desc: 'Самая мощная модель', color: 'from-green-500 to-emerald-600', tier: 'Premium' },
              { name: 'Claude 3.5 Sonnet', company: 'Anthropic', desc: 'Лучшая для анализа', color: 'from-orange-500 to-red-600', tier: 'Premium' },
              { name: 'Gemini 2.5 Pro', company: 'Google', desc: 'Новейшая от Google', color: 'from-blue-500 to-cyan-600', tier: 'Premium' },
              { name: 'Llama 3.3 70B', company: 'Meta', desc: 'Мощная open source', color: 'from-purple-500 to-pink-600', tier: 'Premium' },
              { name: 'GPT-3.5 Turbo', company: 'OpenAI', desc: 'Быстрая и доступная', color: 'from-teal-500 to-green-600', tier: 'Free' },
              { name: 'Gemini 2.0 Flash', company: 'Google', desc: 'Молниеносная скорость', color: 'from-indigo-500 to-purple-600', tier: 'Free' },
              { name: 'Llama 3.1 8B', company: 'Meta', desc: 'Компактная модель', color: 'from-yellow-500 to-orange-600', tier: 'Free' },
            ].map((model, idx) => (
              <Card key={idx} className="group hover:shadow-lg transition-all relative">
                <CardHeader>
                  <div className={`w-full h-1 rounded-full bg-gradient-to-r ${model.color} mb-4`} />
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        {model.company}
                      </CardDescription>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      model.tier === 'Premium'
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                      {model.tier}
                    </span>
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">{model.desc}</p>
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
            <Card className="relative border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <div className="text-4xl font-bold mt-4">
                  $0<span className="text-lg font-normal text-muted-foreground">/месяц</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    '50 сообщений в день',
                    'Доступ к базовым моделям',
                    'История чатов 7 дней',
                    'До 4000 токенов на запрос'
                  ].map((item, idx) => (
                    <p key={idx} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
                {hasHydrated && isAuthenticated ? (
                  <Link href="/chat" className="block">
                    <Button variant="outline" className="w-full" size="lg">
                      Перейти в чат
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register" className="block">
                    <Button variant="outline" className="w-full" size="lg">
                      Начать бесплатно
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className="relative border-2 border-primary shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
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
                <div className="space-y-3">
                  {[
                    '1000 сообщений в день',
                    'Доступ ко всем моделям',
                    'Безлимитная история',
                    'До 32000 токенов на запрос',
                    'Приоритетная поддержка'
                  ].map((item, idx) => (
                    <p key={idx} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
                {hasHydrated && isAuthenticated ? (
                  <Link href="/chat" className="block">
                    <Button className="w-full" size="lg">
                      Перейти в чат
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register" className="block">
                    <Button className="w-full" size="lg">
                      Оформить Premium
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 -z-10" />
        <div className="container mx-auto max-w-4xl text-center text-primary-foreground">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Готовы начать работу с AI?
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Присоединяйтесь к тысячам пользователей, которые уже используют нашу платформу
          </p>
          {hasHydrated && isAuthenticated ? (
            <Link href="/chat">
              <Button size="lg" variant="secondary" className="text-lg px-8 group">
                Перейти в чат
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 group">
                Создать бесплатный аккаунт
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                © 2026 AI Chat Platform. Все права защищены.
              </p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Условия использования</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Конфиденциальность</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Поддержка</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
