/**
 * TODO: Email Service Integration
 *
 * Current State: Support form only logs to console (line 42)
 *
 * Implementation Steps:
 * 1. Choose email service provider:
 *    - SendGrid (https://sendgrid.com)
 *    - AWS SES (https://aws.amazon.com/ses/)
 *    - Resend (https://resend.com)
 *
 * 2. Create API endpoint:
 *    - File: services/api/src/routes/support/contact.ts
 *    - Validate form data
 *    - Send email via chosen provider
 *    - Add rate limiting (max 5 requests per hour per user)
 *
 * 3. Add spam protection:
 *    - Integrate Google reCAPTCHA v3
 *    - Or use Cloudflare Turnstile
 *
 * 4. Update this file:
 *    - Replace console.log with apiClient.sendSupportMessage()
 *    - Add proper error handling
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, MessageSquare, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

const supportSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Некорректный email адрес'),
  subject: z.string().min(5, 'Тема должна содержать минимум 5 символов'),
  message: z.string().min(20, 'Сообщение должно содержать минимум 20 символов'),
});

type SupportForm = z.infer<typeof supportSchema>;

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupportForm>({
    resolver: zodResolver(supportSchema),
  });

  const onSubmit = async (data: SupportForm) => {
    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call when email service is set up
      console.log('Support form submitted:', data);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
      reset();
    } catch (error) {
      toast.error('Ошибка при отправке сообщения. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            На главную
          </Button>
        </Link>

        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Поддержка</h1>
          <p className="text-xl text-muted-foreground">
            Мы здесь, чтобы помочь вам
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Mail className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Email</CardTitle>
              <CardDescription>
                Свяжитесь с нами по электронной почте
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                support@aichatplatform.com
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Ответим в течение 24 часов
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Документация</CardTitle>
              <CardDescription>
                Изучите наши руководства
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Подробная документация по использованию платформы
              </p>
              <Button variant="link" className="mt-2 p-0 h-auto">
                Перейти к документации →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <HelpCircle className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>FAQ</CardTitle>
              <CardDescription>
                Часто задаваемые вопросы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Найдите ответы на распространенные вопросы
              </p>
              <Button variant="link" className="mt-2 p-0 h-auto">
                Смотреть FAQ →
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Отправить сообщение</CardTitle>
            <CardDescription>
              Заполните форму ниже, и мы свяжемся с вами в ближайшее время
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя *</Label>
                  <Input
                    id="name"
                    placeholder="Ваше имя"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Тема *</Label>
                <Input
                  id="subject"
                  placeholder="Кратко опишите проблему"
                  {...register('subject')}
                />
                {errors.subject && (
                  <p className="text-sm text-destructive">{errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Сообщение *</Label>
                <Textarea
                  id="message"
                  placeholder="Подробно опишите вашу проблему или вопрос..."
                  className="min-h-[150px]"
                  {...register('message')}
                />
                {errors.message && (
                  <p className="text-sm text-destructive">{errors.message.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Отправляя форму, вы соглашаетесь с нашей{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  политикой конфиденциальности
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Часто задаваемые вопросы</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Как обновить тариф до Premium?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  В меню пользователя нажмите кнопку "Перейти на Premium" и следуйте инструкциям
                  для оплаты. Premium дает доступ к расширенным моделям и безлимитным сообщениям.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Какие AI модели доступны?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Бесплатным пользователям доступны GPT-3.5 Turbo и Claude Haiku. Premium пользователи
                  получают доступ к GPT-4, Claude Opus, Gemini Pro и другим продвинутым моделям.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Как удалить мой аккаунт?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Напишите нам через эту форму поддержки с запросом на удаление аккаунта. Мы
                  обработаем ваш запрос в течение 7 рабочих дней.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
