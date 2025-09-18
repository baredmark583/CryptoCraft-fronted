import { GoogleGenAI, Type, Modality } from "@google/genai";
import { getCategoryNames } from '../constants';
import type { GeneratedListing, StructuredSearchQuery, SellerAnalytics, AiInsight, PromoCode, SellerDashboardData, AiFocus } from '../types';

// IMPORTANT: In a real application, the API key must be secured and not exposed on the client-side.
// This is a placeholder for demonstration purposes, assuming VITE_GEMINI_API_KEY is available.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Conditionally initialize the Gemini client only if the API key is available.
// This prevents the application from crashing if the key is not set in the environment.
let ai: GoogleGenAI | null = null;
if (API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (e) {
    console.error("Failed to initialize GoogleGenAI:", e);
  }
} else {
  console.warn("Gemini API key not found. AI features will be disabled. Please set import.meta.env.VITE_GEMINI_API_KEY.");
}


export interface VerificationAnalysis {
  isDocument: boolean;
  fullName?: string;
}

export const geminiService = {
  generateListingDetails: async (imageBase64: string, userDescription: string): Promise<GeneratedListing> => {
    if (!ai) {
        // Return mock data if API key is not available
        console.log("Using enhanced mock Gemini response with classification.");
        
        // Simulate AI classifying and extracting attributes for "ноутбук razer blade 15"
        const isLaptop = userDescription.toLowerCase().includes('ноутбук');
        const isCar = userDescription.toLowerCase().includes('автомобиль');

        if (isCar) {
            return new Promise(resolve => setTimeout(() => resolve({
                title: "Автомобиль Audi A6 2019",
                description: `Отличный семейный седан в богатой комплектации. Основан на описании: "${userDescription}".`,
                price: 25000.00,
                category: "Автомобили",
                dynamicAttributes: {
                    'Бренд': 'Audi',
                    'Модель': 'A6',
                    'Год выпуска': 2019,
                    'Пробег, км': 85000,
                    'VIN-код': 'WAUZZZF27KN000123',
                    'Коробка передач': 'Роботизированная',
                    'Тип топлива': 'Бензин',
                    'Состояние': 'Б/у',
                }
            }), 2000));
        }
        
        if (isLaptop) {
            return new Promise(resolve => setTimeout(() => resolve({
                title: "Игровой ноутбук Razer Blade 15",
                description: `Мощный и стильный игровой ноутбук Razer Blade 15, идеально подходит для современных игр и работы с графикой. Основан на описании: "${userDescription}".`,
                price: 1150.00,
                category: "Электроника", // AI Classified category
                dynamicAttributes: { // AI Extracted attributes matching the "Электроника" schema
                    "Бренд": "Razer",
                    "Модель": "Blade 15",
                    "Состояние": "Б/у"
                }
            }), 2000));
        }

        const categories = getCategoryNames();
        return new Promise(resolve => setTimeout(() => resolve({
            title: "Сгенерированный заголовок для товара",
            description: `Это подробное описание товара, основанное на кратком вводе пользователя: "${userDescription}". ИИ добавил бы сюда привлекательные детали, чтобы заинтересовать покупателей.`,
            price: parseFloat((Math.random() * 100 + 20).toFixed(2)),
            category: categories[Math.floor(Math.random() * categories.length)],
            dynamicAttributes: {
                "Материал (Пример)": "Сгенерировано ИИ",
            }
        }), 2000));
    }

    const prompt = `Ты — интеллектуальный ассистент для маркетплейса CryptoCraft. Твоя задача — проанализировать изображение товара и краткое описание от пользователя, чтобы автоматически создать полноценное объявление.

Пользовательское описание: "${userDescription}"

Действуй в три этапа:
1.  **Классификация:** Определи наиболее подходящую категорию для этого товара из списка доступных категорий.
2.  **Извлечение Атрибутов:** На основе изображения и текста, извлеки значения для специфических характеристик (атрибутов), которые соответствуют выбранной категории. Если какую-то характеристику невозможно определить, оставь для нее пустое значение или пропусти ее.
3.  **Генерация Контента:** Напиши привлекательный, SEO-дружелюбный заголовок, подробное описание и предложи рыночную цену в USDT.

Твой ответ ДОЛЖЕН быть только в формате JSON и строго соответствовать предоставленной схеме. Ключами в объекте 'dynamicAttributes' должны быть ТОЧНО такие же строки, как 'label' в схемах категорий (например, "Бренд", "Основной материал").

ВАЖНО: Поле 'dynamicAttributes' ДОЛЖНО БЫТЬ СТРОКОЙ, содержащей валидный JSON. Например: "{\\"Материал\\": \\"Керамика\\", \\"Цвет\\": \\"Бежевый\\"}".`;

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Броский, SEO-дружелюбный заголовок для объявления, макс. 80 символов.' },
              description: { type: Type.STRING, description: 'Подробное, убедительное описание товара, подчеркивающее ключевые особенности и преимущества.' },
              price: { type: Type.NUMBER, description: 'Предлагаемая цена в USDT на основе предполагаемой ценности товара.' },
              category: { type: Type.STRING, enum: getCategoryNames(), description: 'Наиболее подходящая категория из предоставленного списка.' },
              dynamicAttributes: {
                type: Type.STRING,
                description: 'JSON-СТРОКА с парами ключ-значение для характеристик товара (напр., "{\\"Материал\\": \\"Керамика\\", \\"Цвет\\": \\"Бежевый\\"}"). Ключи должны соответствовать полю "label" в схеме категории.',
              }
            },
            required: ["title", "description", "price", "category", "dynamicAttributes"]
          }
        }
      });
      
      const resultText = response.text;
      const parsedJson = JSON.parse(resultText);

      // The API returns dynamicAttributes as a string, we need to parse it into an object.
      if (typeof parsedJson.dynamicAttributes === 'string') {
          try {
              // Ensure the string is a valid JSON before parsing
              if (parsedJson.dynamicAttributes.trim().startsWith('{')) {
                 parsedJson.dynamicAttributes = JSON.parse(parsedJson.dynamicAttributes);
              } else {
                 // Handle cases where AI might return a non-JSON string
                 parsedJson.dynamicAttributes = {};
              }
          } catch (e) {
              console.error("Could not parse dynamicAttributes string:", parsedJson.dynamicAttributes, e);
              // If parsing fails, default to an empty object to avoid breaking the UI.
              parsedJson.dynamicAttributes = {};
          }
      } else if (typeof parsedJson.dynamicAttributes !== 'object') {
          // If it's not a string or object for some reason, normalize to an empty object
          parsedJson.dynamicAttributes = {};
      }
      
      return parsedJson as GeneratedListing;

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw new Error("Не удалось сгенерировать описание. Пожалуйста, попробуйте еще раз.");
    }
  },

  editImage: async (imageBase64: string, mimeType: string, prompt: string): Promise<string> => {
    if (!ai) {
        console.log("Using mock Gemini image edit response.");
        // Return a different placeholder image to simulate an edit
        const randomId = Math.floor(Math.random() * 1000);
        const mockImageUrl = `https://picsum.photos/seed/edited${randomId}/600/400`;
        // We need to fetch and convert to base64 to match the expected return type
        const response = await fetch(mockImageUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
  
    try {
        // FIX: Update `contents` payload to match the recommended structure for image editing.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: imageBase64,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("AI did not return an image.");

    } catch (error) {
        console.error("Error calling Gemini Image Edit API:", error);
        throw new Error("Не удалось отредактировать изображение. Пожалуйста, попробуйте еще раз.");
    }
  },

  generateSearchQuery: async (userQuery: string): Promise<StructuredSearchQuery> => {
    if (!ai) {
      console.log("Using mock Gemini search response.");
      // Simple mock: split query into keywords, use first word for category mock
      const keywords = userQuery.toLowerCase().split(' ').filter(word => word.length > 2);
      const categories = getCategoryNames();
      const mockCategory = categories.find(c => c.toLowerCase().includes(keywords[0] || '')) || 'Все';
      return new Promise(resolve => setTimeout(() => resolve({
          keywords,
          category: mockCategory,
      }), 1500));
    }

    const prompt = `Проанализируй поисковый запрос пользователя для маркетплейса товаров ручной работы. Преобразуй его в структурированный JSON-объект для поиска.

Пользовательский запрос: "${userQuery}"

Твоя задача:
1.  Извлечь ключевые слова, описывающие товар (материалы, тип, стиль, цвет, назначение). Создай массив строк 'keywords'.
2.  Определить наиболее подходящую категорию товара из списка. Верни одну строку 'category'. Если не уверен, используй "Все".

Предоставь ответ только в формате JSON, соответствующем схеме.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              keywords: {
                type: Type.ARRAY,
                description: 'Массив ключевых слов для поиска.',
                items: { type: Type.STRING }
              },
              category: {
                type: Type.STRING,
                description: 'Наиболее подходящая категория.',
                enum: ['Все', ...getCategoryNames()]
              }
            },
            required: ["keywords", "category"]
          }
        }
      });

      const resultText = response.text;
      const parsedJson = JSON.parse(resultText) as StructuredSearchQuery;
      return parsedJson;
    } catch (error) {
      console.error("Error calling Gemini API for search:", error);
      // Fallback to simple keyword search on API error
      return {
        keywords: userQuery.toLowerCase().split(' ').filter(word => word.length > 2),
        category: 'Все'
      };
    }
  },

  analyzeDocumentForVerification: async (imageBase64: string): Promise<VerificationAnalysis> => {
    if (!ai) {
      console.log("Using mock Gemini document analysis response.");
      return new Promise(resolve => setTimeout(() => resolve({
        isDocument: true,
        fullName: "Тестовый Тест Тестович"
      }), 2000));
    }

    const prompt = `Проанализируй это изображение. 
1. Определи, является ли это изображение официальным документом, удостоверяющим личность (например, паспорт, водительские права, ID-карта).
2. Если это документ, извлеки из него полное имя (Фамилия, Имя, Отчество). Если имя не указано или его невозможно прочитать, оставь поле пустым.
Ответь только в формате JSON, соответствующем предоставленной схеме.`;

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isDocument: { type: Type.BOOLEAN, description: 'Является ли изображение документом, удостоверяющим личность.' },
              fullName: { type: Type.STRING, description: 'Полное имя (ФИО), извлеченное из документа.' }
            },
            required: ["isDocument"]
          }
        }
      });

      const resultText = response.text;
      const parsedJson = JSON.parse(resultText) as VerificationAnalysis;
      return parsedJson;
    } catch (error) {
      console.error("Error calling Gemini API for document analysis:", error);
      throw new Error("Не удалось проанализировать документ. Пожалуйста, попробуйте еще раз.");
    }
  },

  getAnalyticsInsights: async (analyticsData: SellerAnalytics): Promise<AiInsight[]> => {
    if (!ai) {
        console.log("Using mock Gemini analytics insights.");
        return new Promise(resolve => setTimeout(() => resolve([
            {
                title: "Оптимизация цены",
                recommendation: "Ваш товар 'Handmade Ceramic Mug' имеет много просмотров, но низкую конверсию продаж. Попробуйте провести акцию и снизить цену на 10% на 3 дня, чтобы стимулировать покупки.",
                type: 'OPTIMIZATION',
            },
            {
                title: "Новая возможность",
                recommendation: "Данные показывают высокий интерес к керамике. Рассмотрите возможность расширения ассортимента, добавив, например, 'Керамические тарелки' или 'Наборы посуды'.",
                type: 'OPPORTUNITY',
            },
            {
                title: "Внимание: Источники трафика",
                recommendation: "Большинство ваших визитов - прямые. Усильте продвижение в социальных сетях, чтобы привлечь новую аудиторию.",
                type: 'WARNING',
            }
        ]), 2000));
    }
    
    const prompt = `Проанализируй JSON-объект с данными по аналитике продавца на маркетплейсе. Выступи в роли эксперта по e-commerce и дай 3-4 кратких, но очень конкретных и действенных совета, которые помогут продавцу увеличить продажи.

Данные для анализа:
${JSON.stringify(analyticsData, null, 2)}

Твоя задача:
1.  Изучить метрики: просмотры, продажи, конверсию, популярные товары, источники трафика.
2.  Найти сильные и слабые стороны, а также неиспользованные возможности.
3.  Сформулировать четкие рекомендации. Например, вместо "улучшите фото", напиши "для товара 'X' с высоким числом просмотров, но низкой конверсией, стоит добавить видеообзор".
4.  Ответь ТОЛЬКО в формате JSON, строго соответствующем предоставленной схеме.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: 'Краткий, броский заголовок для рекомендации (2-3 слова).' },
                            recommendation: { type: Type.STRING, description: 'Конкретный, действенный совет для продавца (1-2 предложения).' },
                            type: { 
                                type: Type.STRING, 
                                enum: ['OPTIMIZATION', 'OPPORTUNITY', 'WARNING'], 
                                description: 'Категория совета: OPTIMIZATION (улучшение существующего), OPPORTUNITY (новая возможность), WARNING (предупреждение).' 
                            }
                        },
                        required: ['title', 'recommendation', 'type']
                    }
                }
            }
        });
        
        const resultText = response.text;
        const parsedJson = JSON.parse(resultText) as AiInsight[];
        return parsedJson;
    } catch (error) {
        console.error("Error calling Gemini API for analytics insights:", error);
        throw new Error("Не удалось получить советы от AI. Пожалуйста, попробуйте еще раз.");
    }
  },

  generatePromoCampaign: async (prompt: string): Promise<Partial<PromoCode>> => {
    // This is a mock implementation. A real implementation would call the Gemini API.
    console.log("Mocking Gemini promo campaign generation for prompt:", prompt);
    await new Promise(res => setTimeout(res, 1500));
    return {
        code: 'AI_SUMMER20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        scope: 'CATEGORY',
        applicableCategory: 'Одежда и аксессуары',
        minPurchaseAmount: 50,
    };
  },

  generateDashboardFocus: async (dashboardData: SellerDashboardData): Promise<AiFocus> => {
    if (!ai) {
        console.log("Using mock Gemini dashboard focus.");
        // Mock logic: prioritize new orders, then messages, then wishlist adds.
        const newOrder = dashboardData.actionableItems.find(i => i.type === 'new_order');
        if (newOrder) {
            return { title: 'Обработайте новый заказ', reason: 'Быстрая отправка — ключ к хорошим отзывам и лояльности клиентов.', ctaText: 'Перейти к заказам', ctaLink: 'sales' };
        }
        const newWishlist = dashboardData.recentActivity.find(i => i.type === 'wishlist_add');
        if (newWishlist) {
            // FIX: The 'ctaLink' property must be one of 'sales', 'chat', 'analytics', or 'settings' to match the AI response schema. 'listings' is not a valid option here. Changed to 'settings' as it's the most relevant for creating offers/promo codes.
            return { title: 'Предложите скидку', reason: `Пользователь ${newWishlist.user?.name} заинтересовался вашим товаром. Небольшая скидка может подтолкнуть его к покупке!`, ctaText: 'Отправить предложение', ctaLink: 'settings' }; // CtaLink is a placeholder here
        }
        return { title: 'Проанализируйте продажи', reason: 'Изучите вчерашние тренды, чтобы понять, какие товары привлекают больше всего внимания.', ctaText: 'Смотреть аналитику', ctaLink: 'analytics' };
    }

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
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: 'Заголовок фокуса дня (3-5 слов).' },
                        reason: { type: Type.STRING, description: 'Краткое объяснение, почему это важно (1-2 предложения).' },
                        ctaText: { type: Type.STRING, description: 'Текст для кнопки действия (2-3 слова).' },
                        ctaLink: { type: Type.STRING, enum: ['sales', 'chat', 'analytics', 'settings'], description: 'Ключ для навигации в приложении.' },
                    },
                    required: ['title', 'reason', 'ctaText', 'ctaLink']
                }
            }
        });
        
        const resultText = response.text;
        const parsedJson = JSON.parse(resultText) as AiFocus;
        return parsedJson;
    } catch (error) {
        console.error("Error calling Gemini API for dashboard focus:", error);
        throw new Error("Не удалось получить фокус дня от AI.");
    }
  }
};