import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { getCategoryNames } from '../constants'; // Assuming constants file is accessible
import type { SellerAnalytics, SellerDashboardData, ImportedListingData } from '../types';

@Injectable()
export class AiService {
  private readonly ai: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('Gemini API key is not configured');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateListingDetails(imageBase64: string, userDescription: string) {
    const prompt = `Ты — интеллектуальный ассистент для маркетплейса CryptoCraft. Твоя задача — проанализировать изображение товара и краткое описание от пользователя, чтобы автоматически создать полноценное объявление.

    Пользовательское описание: "${userDescription}"
    
    Действуй в три этапа:
    1.  **Классификация:** Определи наиболее подходящую категорию для этого товара из списка доступных категорий.
    2.  **Извлечение Атрибутов:** На основе изображения и текста, извлеки значения для специфических характеристик (атрибутов), которые соответствуют выбранной категории. Если какую-то характеристику невозможно определить, оставь для нее пустое значение или пропусти ее.
    3.  **Генерация Контента:** Напиши привлекательный, SEO-дружелюбный заголовок, подробное описание и предложи рыночную цену в USDT.
    
    Твой ответ ДОЛЖЕН быть только в формате JSON и строго соответствовать предоставленной схеме. Ключами в объекте 'dynamicAttributes' должны быть ТОЧНО такие же строки, как 'label' в схемах категорий (например, "Бренд", "Основной материал").
    
    ВАЖНО: Поле 'dynamicAttributes' ДОЛЖНО БЫТЬ СТРОКОЙ, содержащей валидный JSON. Например: "{\\"Материал\\": \\"Керамика\\", \\"Цвет\\": \\"Бежевый\\"}".`;

    const imagePart = {
      inlineData: { mimeType: 'image/jpeg', data: imageBase64 },
    };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              price: { type: Type.NUMBER },
              category: { type: Type.STRING, enum: getCategoryNames() },
              dynamicAttributes: { type: Type.STRING },
            },
            required: ["title", "description", "price", "category", "dynamicAttributes"]
          }
        }
      });
      
      const parsedJson = JSON.parse(response.text);
      if (typeof parsedJson.dynamicAttributes === 'string') {
          parsedJson.dynamicAttributes = JSON.parse(parsedJson.dynamicAttributes);
      }
      return parsedJson;
    } catch (error) {
      console.error("Error in generateListingDetails:", error);
      throw new InternalServerErrorException('Failed to generate listing details from AI');
    }
  }

  async editImage(imageBase64: string, mimeType: string, prompt: string): Promise<{ base64Image: string }> {
     try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [{ inlineData: { data: imageBase64, mimeType } }, { text: prompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return { base64Image: part.inlineData.data };
            }
        }
        throw new Error("AI did not return an image.");
    } catch (error) {
        console.error("Error in editImage:", error);
        if (error.message?.includes('RESOURCE_EXHAUSTED')) {
             throw new BadRequestException('RATE_LIMIT:Слишком много запросов. Пожалуйста, попробуйте еще раз через минуту.');
        }
        throw new InternalServerErrorException('Failed to edit image with AI');
    }
  }
  
  async analyzeDocumentForVerification(imageBase64: string) {
    const prompt = `Проанализируй это изображение. 
1. Определи, является ли это изображение официальным документом, удостоверяющим личность (например, паспорт, водительские права, ID-карта).
2. Если это документ, извлеки из него полное имя (Фамилия, Имя, Отчество). Если имя не указано или его невозможно прочитать, оставь поле пустым.
Ответь только в формате JSON, соответствующем предоставленной схеме.`;

    try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ inlineData: { data: imageBase64, mimeType: 'image/jpeg' } }, { text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isDocument: { type: Type.BOOLEAN },
                        fullName: { type: Type.STRING }
                    },
                    required: ["isDocument"]
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error in analyzeDocumentForVerification:", error);
        throw new InternalServerErrorException('Failed to analyze document with AI');
    }
  }

  async getAnalyticsInsights(analyticsData: SellerAnalytics) {
       const prompt = `Проанализируй JSON-объект с данными по аналитике продавца на маркетплейсе. Выступи в роли эксперта по e-commerce и дай 3-4 кратких, но очень конкретных и действенных совета, которые помогут продавцу увеличить продажи.

        Данные для анализа:
        ${JSON.stringify(analyticsData, null, 2)}
        
        Твоя задача:
        1.  Изучить метрики: просмотры, продажи, конверсию, популярные товары, источники трафика.
        2.  Найти сильные и слабые стороны, а также неиспользованные возможности.
        3.  Сформулировать четкие рекомендации. Например, вместо "улучшите фото", напиши "для товара 'X' с высоким числом просмотров, но низкой конверсией, стоит добавить видеообзор".
        4.  Ответь ТОЛЬКО в формате JSON, строго соответствующем предоставленной схеме.`;

    try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            recommendation: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['OPTIMIZATION', 'OPPORTUNITY', 'WARNING'] }
                        },
                        required: ['title', 'recommendation', 'type']
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error in getAnalyticsInsights:", error);
        throw new InternalServerErrorException('Failed to get analytics insights from AI');
    }
  }
  
  async generateDashboardFocus(dashboardData: SellerDashboardData) {
      const prompt = `Ты — AI-ассистент и бизнес-коуч для продавца на маркетплейсе. Проанализируй JSON с данными о его сегодняшней активности. Твоя задача — определить САМОЕ ВАЖНОЕ действие, на котором ему стоит сфокусироваться ПРЯМО СЕЙЧАС, и дать краткий, мотивирующий совет.

        Приоритеты для анализа:
        1.  Новые заказы (самый высокий приоритет).
        2.  Новые сообщения (второй по важности, требует быстрого ответа).
        3.  Добавления в избранное (отличная возможность для персонального предложения).
        4.  Если ничего срочного нет, предложи стратегическое действие (проанализировать продажи, создать промокод).

        Данные для анализа:
        ${JSON.stringify(dashboardData, null, 2)}

        Твой ответ ДОЛЖЕН быть только в формате JSON и строго соответствовать предоставленной схеме. Поле 'ctaLink' должно быть одним из: 'sales', 'chat', 'analytics', 'settings'.`;

       try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        reason: { type: Type.STRING },
                        ctaText: { type: Type.STRING },
                        ctaLink: { type: Type.STRING, enum: ['sales', 'chat', 'analytics', 'settings'] },
                    },
                    required: ['title', 'reason', 'ctaText', 'ctaLink']
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error in generateDashboardFocus:", error);
        throw new InternalServerErrorException('Failed to generate dashboard focus from AI');
    }
  }
  
  async processImportedHtml(html: string): Promise<ImportedListingData> {
    const prompt = `Ты — эксперт по анализу e-commerce страниц. Тебе предоставлен HTML-код всего тега <body> страницы товара. Твоя задача — тщательно проанализировать его и извлечь всю ключевую информацию, необходимую для создания объявления на нашем маркетплейсе. Игнорируй навигацию, футеры, рекламу и похожие товары.

    Твоя задача:
    1.  **Создай** привлекательный, SEO-оптимизированный заголовок и подробное описание.
    2.  **Извлеки** цену (только число), символ или код валюты (напр., "грн", "$"), и массив ПОЛНЫХ URL-адресов всех изображений.
    3.  **Определи**, является ли это аукционом. Если да, верни "AUCTION", иначе "FIXED_PRICE".
    4.  **Проанализируй** текст на наличие упоминаний подарочной упаковки и верни true/false.
    5.  **Классифицируй** товар в одну из категорий: [${getCategoryNames().join(', ')}].
    6.  **Извлеки** все релевантные характеристики товара (атрибуты) в виде JSON-строки. Например: "{\\"Материал\\": \\"Хлопок\\", \\"Цвет\\": \\"Синий\\"}".

    Твой ответ ДОЛЖЕН быть только в формате JSON и строго соответствовать предоставленной схеме.`;
    
    try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: `HTML для анализа:\n\n${html}` }, { text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        originalPrice: { type: Type.NUMBER },
                        originalCurrency: { type: Type.STRING },
                        imageUrls: { type: Type.ARRAY, items: { type: Type.STRING } },
                        category: { type: Type.STRING, enum: getCategoryNames() },
                        dynamicAttributes: { type: Type.STRING },
                        saleType: { type: Type.STRING, enum: ['FIXED_PRICE', 'AUCTION'] },
                        giftWrapAvailable: { type: Type.BOOLEAN }
                    },
                    required: ["title", "description", "originalPrice", "originalCurrency", "imageUrls", "category", "dynamicAttributes", "saleType", "giftWrapAvailable"]
                }
            }
        });

        const parsedJson = JSON.parse(response.text);
        if (typeof parsedJson.dynamicAttributes === 'string') {
            parsedJson.dynamicAttributes = JSON.parse(parsedJson.dynamicAttributes);
        }
        return parsedJson;
    } catch (error) {
        console.error("Error in processImportedHtml:", error);
        throw new InternalServerErrorException('Failed to process HTML with AI');
    }
  }
}