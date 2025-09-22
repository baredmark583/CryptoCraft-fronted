// Этот файл служит для определения интерфейса TelegramUser.
// Сама стратегия не нужна, так как валидация происходит вручную в auth.service.

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}
