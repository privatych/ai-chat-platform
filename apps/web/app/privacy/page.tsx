import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            На главную
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Политика конфиденциальности</h1>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Оператор персональных данных</h2>
            <div className="bg-secondary/20 p-6 rounded-lg mb-6">
              <p className="font-semibold mb-2">Оператором персональных данных является:</p>
              <p className="text-muted-foreground">Индивидуальный предприниматель Правкин Антон Николаевич</p>
              <p className="text-muted-foreground">ИНН: 690708121454</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Введение</h2>
            <p className="text-muted-foreground">
              AI Chat Platform серьезно относится к защите вашей конфиденциальности. Настоящая политика
              описывает, какую информацию мы собираем, как мы ее используем и защищаем.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Собираемая информация</h2>
            <p className="text-muted-foreground mb-2">
              Мы собираем следующие типы информации:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Учетные данные:</strong> email, имя, хешированный пароль</li>
              <li><strong>Данные использования:</strong> история чатов, количество запросов, использованные модели</li>
              <li><strong>Технические данные:</strong> IP-адрес, тип браузера, время доступа</li>
              <li><strong>Платежная информация:</strong> обрабатывается через защищенные платежные шлюзы</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Использование информации</h2>
            <p className="text-muted-foreground mb-2">
              Собранная информация используется для:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Предоставления и улучшения наших сервисов</li>
              <li>Персонализации вашего опыта использования</li>
              <li>Обработки платежей и управления подписками</li>
              <li>Отправки важных уведомлений и обновлений</li>
              <li>Анализа использования для улучшения платформы</li>
              <li>Обеспечения безопасности и предотвращения злоупотреблений</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Хранение данных</h2>
            <p className="text-muted-foreground">
              Ваши данные хранятся на защищенных серверах с применением современных методов шифрования.
              История чатов хранится столько времени, сколько необходимо для предоставления сервиса,
              либо до момента удаления вами.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Передача данных третьим лицам</h2>
            <p className="text-muted-foreground mb-2">
              Мы не продаем ваши личные данные. Данные могут быть переданы третьим лицам только в следующих случаях:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Провайдеры AI моделей:</strong> OpenAI, Anthropic и другие для обработки запросов</li>
              <li><strong>Платежные системы:</strong> для обработки платежей</li>
              <li><strong>Аналитические сервисы:</strong> для анализа использования (анонимизированные данные)</li>
              <li><strong>По требованию закона:</strong> если это требуется законодательством</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Ваши права</h2>
            <p className="text-muted-foreground mb-2">
              Вы имеете право:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Получить доступ к вашим персональным данным</li>
              <li>Исправить неточные данные</li>
              <li>Удалить ваш аккаунт и все связанные данные</li>
              <li>Экспортировать ваши данные</li>
              <li>Отозвать согласие на обработку данных</li>
              <li>Подать жалобу в надзорный орган</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cookies и технологии отслеживания</h2>
            <p className="text-muted-foreground">
              Мы используем cookies для улучшения работы сайта, сохранения ваших предпочтений и аналитики.
              Вы можете настроить использование cookies в настройках браузера.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Безопасность детей</h2>
            <p className="text-muted-foreground">
              Наш сервис не предназначен для лиц младше 18 лет. Мы намеренно не собираем информацию
              от детей. Если вы узнали, что ребенок предоставил нам личную информацию, свяжитесь с нами.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Изменения политики</h2>
            <p className="text-muted-foreground">
              Мы можем обновлять настоящую политику конфиденциальности. О существенных изменениях мы
              уведомим вас по электронной почте или через уведомления на платформе.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Контакты</h2>
            <p className="text-muted-foreground">
              По вопросам конфиденциальности обращайтесь на страницу{' '}
              <Link href="/support" className="text-primary hover:underline">
                поддержки
              </Link>
              {' '}или пишите на email: privacy@aichatplatform.com
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
