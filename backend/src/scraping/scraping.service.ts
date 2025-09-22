import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ScrapingService {
  constructor(private readonly configService: ConfigService) {}

  async scrapeUrl(url: string): Promise<{ cleanText: string }> {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    // Используем общедоступный прокси для обхода CORS и базовых мер защиты от ботов.
    // В продакшене это был бы специализированный API для скрапинга.
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
      url,
    )}`;

    try {
      const { data: html } = await axios.get(proxyUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        },
        timeout: 45000, // 45 секунд
      });

      if (!html) {
        throw new Error('Получено пустое HTML-содержимое от прокси.');
      }

      // Загружаем HTML в Cheerio для очистки перед отправкой в AI
      const $ = cheerio.load(html);
      
      const body = $('body');

      // Удаляем ненужные теги, чтобы уменьшить количество токенов и шум для AI
      body.find(
        'script, style, link[rel="stylesheet"], noscript, iframe, footer, header, nav, svg, path',
      ).remove();

      // Удаляем все атрибуты, КРОМЕ 'src' и 'srcset' у изображений
      body.find('*').each(function () {
        const element = $(this);
        const preservedAttrs: { [key: string]: string } = {};
        
        // Сохраняем src и srcset только для тегов <img>
        if (element.is('img')) {
            const src = element.attr('src');
            const srcset = element.attr('srcset');
            if (src) preservedAttrs.src = src;
            if (srcset) preservedAttrs.srcset = srcset;
        }

        // Заменяем все атрибуты элемента только сохраненными (для img) или пустым объектом (для всех остальных)
        this.attribs = preservedAttrs;
      });

      const cleanHtml = body.html();

      if (!cleanHtml || cleanHtml.trim().length < 200) {
        throw new Error(
          'Извлеченный контент слишком короткий, возможно, страница была заблокирована.',
        );
      }

      // Возвращаем очищенный HTML-контент
      return { cleanText: cleanHtml };
    } catch (error) {
      console.error(`Ошибка сбора данных для ${url}:`, error.message);
      // Предоставляем более понятное сообщение об ошибке
      throw new BadRequestException(
        `Не удалось получить данные со страницы. Сайт может быть недоступен или защищен от сбора данных. Попробуйте другую ссылку.`,
      );
    }
  }
}
