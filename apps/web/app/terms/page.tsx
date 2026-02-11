import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            На главную
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Условия использования</h1>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Информация о владельце</h2>
            <div className="bg-secondary/20 p-6 rounded-lg mb-6">
              <p className="font-semibold mb-2">Индивидуальный предприниматель:</p>
              <p className="text-muted-foreground">Правкин Антон Николаевич</p>
              <p className="text-muted-foreground">ИНН: 690708121454</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Принятие условий</h2>
            <p className="text-muted-foreground">
              Используя AI Chat Platform, вы соглашаетесь с настоящими условиями использования.
              Если вы не согласны с какими-либо условиями, пожалуйста, не используйте нашу платформу.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Использование сервиса</h2>
            <p className="text-muted-foreground mb-2">
              AI Chat Platform предоставляет доступ к различным AI моделям для обработки текстовых запросов.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Вы обязуетесь использовать сервис только в законных целях</li>
              <li>Запрещено использовать платформу для генерации вредоносного контента</li>
              <li>Запрещается попытки обхода ограничений и лимитов</li>
              <li>Вы несете ответственность за сохранность своих учетных данных</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Тарифные планы</h2>
            <p className="text-muted-foreground mb-2">
              Мы предлагаем бесплатный и премиум тарифные планы:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Бесплатный:</strong> 50 сообщений в день, базовые модели</li>
              <li><strong>Premium:</strong> Безлимитные сообщения, доступ ко всем моделям</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Цены могут быть изменены с уведомлением за 30 дней.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Интеллектуальная собственность</h2>
            <p className="text-muted-foreground">
              Весь контент, генерируемый AI моделями, предоставляется "как есть". Вы сохраняете права
              на свои запросы и полученные ответы, но мы оставляем за собой право использовать
              анонимизированные данные для улучшения сервиса.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Ограничение ответственности</h2>
            <p className="text-muted-foreground">
              AI Chat Platform предоставляется "как есть", без каких-либо гарантий. Мы не несем
              ответственности за:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Точность и корректность ответов AI моделей</li>
              <li>Перебои в работе сервиса</li>
              <li>Любые убытки, возникшие в результате использования платформы</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Изменение условий</h2>
            <p className="text-muted-foreground">
              Мы оставляем за собой право изменять настоящие условия в любое время. Существенные
              изменения будут доведены до вашего сведения по электронной почте или через уведомления
              на платформе.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Контакты</h2>
            <p className="text-muted-foreground">
              По вопросам, связанным с условиями использования, обращайтесь на страницу{' '}
              <Link href="/support" className="text-primary hover:underline">
                поддержки
              </Link>
              .
            </p>
          </section>

          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Последнее обновление: {new Date().toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
