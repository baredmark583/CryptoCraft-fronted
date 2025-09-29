// This service now acts as a hybrid: part real API client, part mock service.
// This allows for gradual backend integration without breaking the UI.
import type {
  User, Product, Review, Chat, Message, Order, Notification, Collection,
  WorkshopPost, WorkshopComment, ForumThread, ForumPost, SellerAnalytics, FeedItem,
  PromoCode, SellerDashboardData, CartItem, ShippingAddress, MessageContent, Dispute, DisputeMessage, LiveStream, OrderItem, TrackingEvent, Proposal, VoteChoice,
  GeneratedListing, VerificationAnalysis, AiInsight, AiFocus, ImportedListingData, Icon
} from '../types';
import type { CategorySchema } from '../constants';


// --- REAL API IMPLEMENTATION ---

// This URL is now dynamic. It uses an environment variable for production
// and falls back to localhost for local development.
// FIX: Cast import.meta to any to resolve TypeScript error in environments where Vite types are not configured.
const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * A helper function to make fetch requests to the backend API.
 * It automatically sets content type to JSON, adds the auth token, and handles errors.
 */
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || 'An API error occurred');
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return;
  } catch (error) {
    console.error(`API fetch error: ${options.method || 'GET'} ${endpoint}`, error);
    throw error;
  }
};


// --- MOCKED DATA (for features not yet on backend) ---
// We keep this data to ensure the rest of the application continues to function.
const users: User[] = [
  { id: 'user-1', name: 'Pottery Master', avatarUrl: 'https://picsum.photos/seed/seller1/100/100', headerImageUrl: 'https://picsum.photos/seed/header1/1000/300', rating: 4.9, reviews: [], following: ['user-2', 'user-3'], balance: 1250.75, commissionOwed: 25.01, verificationLevel: 'PRO', affiliateId: 'POTTERYPRO', tonWalletAddress: 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_______' },
  { id: 'user-2', name: 'Jewelry Queen', avatarUrl: 'https://picsum.photos/seed/seller2/100/100', headerImageUrl: 'https://picsum.photos/seed/header2/1000/300', rating: 4.8, reviews: [], following: ['user-1'], balance: 2500, commissionOwed: 150, verificationLevel: 'NONE' },
  { id: 'user-3', name: 'Leather Crafter', avatarUrl: 'https://picsum.photos/seed/seller3/100/100', headerImageUrl: 'https://picsum.photos/seed/header3/1000/300', rating: 4.7, reviews: [], following: [], balance: 500, commissionOwed: 0, verificationLevel: 'NONE' },
  { id: 'user-4', name: 'Digital Artist', avatarUrl: 'https://picsum.photos/seed/seller4/100/100', headerImageUrl: 'https://picsum.photos/seed/header4/1000/300', rating: 5.0, reviews: [], following: [], balance: 10000, commissionOwed: 420.69, verificationLevel: 'PRO' },
  { id: 'user-5', name: 'Car Dealer Pro', avatarUrl: 'https://picsum.photos/seed/seller5/100/100', headerImageUrl: 'https://picsum.photos/seed/header5/1000/300', rating: 4.9, reviews: [], following: [], balance: 50000, commissionOwed: 1250, verificationLevel: 'PRO', phoneNumber: '+380501234567' },
  { id: 'buyer-1', name: 'Craft Enthusiast', avatarUrl: 'https://picsum.photos/seed/buyer1/100/100', rating: 0, reviews: [], following: ['user-1', 'user-2', 'user-3', 'user-4'], balance: 100, commissionOwed: 0, verificationLevel: 'NONE' },
  { id: 'arbitrator-01', name: 'CryptoCraft Support', avatarUrl: 'https://picsum.photos/seed/support/100/100', rating: 0, reviews: [], following: [], balance: 0, commissionOwed: 0, verificationLevel: 'NONE' },
];

const products: Product[] = [
  { id: 'prod-1', title: 'Handmade Ceramic Mug', description: 'A beautiful, one-of-a-kind ceramic mug, perfect for your morning coffee. Glazed with a unique deep blue finish.', price: 35, imageUrls: ['https://picsum.photos/seed/prod1/600/400'], category: 'Товары ручной работы', seller: users[0], dynamicAttributes: {'Материал': 'Керамика', 'Объем (мл)': 350}, isPromoted: true, uniqueness: 'ONE_OF_A_KIND', giftWrapAvailable: true, giftWrapPrice: 5, purchaseCost: 15, weight: 450, productType: 'PHYSICAL', isB2BEnabled: true, b2bMinQuantity: 10, b2bPrice: 25 },
  { id: 'prod-2', title: 'Silver Necklace with Moonstone', description: 'Elegant sterling silver necklace featuring a mesmerizing moonstone pendant. A timeless piece.', price: 120, salePrice: 99, imageUrls: ['https://picsum.photos/seed/prod2/600/400'], category: 'Ювелирные изделия', seller: users[1], dynamicAttributes: {'Металл': 'Серебро 925', 'Камень': 'Лунный камень'}, isPromoted: true, purchaseCost: 60, weight: 150, productType: 'PHYSICAL' },
  { id: 'prod-3', title: 'Кожаная куртка', description: 'Стильная куртка из натуральной кожи. Ручная работа.', price: 250, imageUrls: ['https://picsum.photos/seed/prod3/600/400'], category: 'Одежда и аксессуары', seller: users[2], dynamicAttributes: { 'Материал': 'Кожа', 'Размер': 'L', 'Цвет': 'Черный' }, productType: 'PHYSICAL' },
  { id: 'prod-4', title: 'Шаблон для Figma "E-commerce"', description: 'Готовый шаблон для дизайна интернет-магазина. Легко редактировать.', price: 50, imageUrls: ['https://picsum.photos/seed/prod4/600/400'], category: 'Цифровые товары', seller: users[3], dynamicAttributes: { 'Тип файла': 'FIG', 'Лицензия': 'Personal Use' }, productType: 'DIGITAL', digitalFileUrl: 'mock_download_link' },
  { id: 'prod-5', title: 'iPhone 14 Pro Max', description: 'Used but in great condition. Unlocked. 256GB.', price: 950, imageUrls: ['https://picsum.photos/seed/prod5/600/400'], category: 'Электроника', seller: users[4], dynamicAttributes: { 'Бренд': 'Apple', 'Модель': 'iPhone 14 Pro Max', 'Состояние': 'Б/у' }, productType: 'PHYSICAL', isAuthenticationAvailable: true, authenticationStatus: 'NONE' },
  { id: 'prod-6', title: 'BMW X5 2022', description: 'Low mileage, one owner. Excellent condition.', price: 55000, imageUrls: ['https://picsum.photos/seed/prod6/600/400'], category: 'Автомобили', seller: users[4], dynamicAttributes: { 'Бренд': 'BMW', 'Модель': 'X5', 'Год выпуска': 2022, 'Пробег, км': 15000 }, productType: 'PHYSICAL', isAuthenticationAvailable: true, authenticationStatus: 'PENDING' },
  { id: 'prod-7', title: 'Аукцион: Картина "Закат"', description: 'Уникальная картина маслом на холсте.', imageUrls: ['https://picsum.photos/seed/prod7/600/400'], category: 'Искусство и коллекционирование', seller: users[3], dynamicAttributes: { 'Автор': 'Неизвестен', 'Стиль': 'Импрессионизм' }, isAuction: true, auctionEnds: Date.now() + 3 * 24 * 60 * 60 * 1000, startingBid: 200, currentBid: 250, bidders: ['user-1', 'buyer-1'], productType: 'PHYSICAL' },
  { id: 'prod-8', title: 'Authenticated Rolex Watch', description: 'Vintage Rolex, authenticated by our experts. Comes with an NFT certificate.', price: 8500, imageUrls: ['https://picsum.photos/seed/prod8/600/400'], category: 'Электроника', seller: users[4], dynamicAttributes: { 'Бренд': 'Rolex', 'Модель': 'Submariner', 'Состояние': 'Б/у' }, productType: 'PHYSICAL', isAuthenticationAvailable: true, authenticationStatus: 'AUTHENTICATED', authenticationReportUrl: 'mock_report_url', nftTokenId: '0x123...abc', nftContractAddress: '0x456...def' },
  {
    id: 'prod-9',
    title: 'Customizable T-Shirt',
    description: 'High-quality cotton t-shirt. Choose your color and size.',
    imageUrls: ['https://picsum.photos/seed/prod9/600/400'],
    category: 'Одежда и аксессуары',
    seller: users[2],
    dynamicAttributes: { 'Материал': 'Хлопок' },
    productType: 'PHYSICAL',
    variantAttributes: [
      { name: 'Цвет', options: ['Красный', 'Синий', 'Черный'] },
      { name: 'Размер', options: ['S', 'M', 'L'] },
    ],
    variants: [
      { id: 'v1', attributes: { 'Цвет': 'Красный', 'Размер': 'S' }, price: 25, stock: 10, imageUrl: 'https://picsum.photos/seed/prod9-red-s/600/400' },
      { id: 'v2', attributes: { 'Цвет': 'Красный', 'Размер': 'M' }, price: 25, stock: 15 },
      { id: 'v3', attributes: { 'Цвет': 'Красный', 'Размер': 'L' }, price: 25, stock: 5, salePrice: 22 },
      { id: 'v4', attributes: { 'Цвет': 'Синий', 'Размер': 'S' }, price: 26, stock: 8 },
      { id: 'v5', attributes: { 'Цвет': 'Синий', 'Размер': 'M' }, price: 26, stock: 12 },
      { id: 'v6', attributes: { 'Цвет': 'Синий', 'Размер': 'L' }, price: 26, stock: 9 },
      { id: 'v7', attributes: { 'Цвет': 'Черный', 'Размер': 'S' }, price: 25, stock: 20 },
      { id: 'v8', attributes: { 'Цвет': 'Черный', 'Размер': 'M' }, price: 25, stock: 0 },
      { id: 'v9', attributes: { 'Цвет': 'Черный', 'Размер': 'L' }, price: 25, stock: 18 },
    ],
  },
];


let reviews: Review[] = [
    { id: 'rev-1', productId: 'prod-1', author: users[5], rating: 5, text: 'Отличная чашка, очень качественная работа!', timestamp: Date.now() - 86400000, imageUrl: 'https://picsum.photos/seed/rev1/400/400' },
    { id: 'rev-2', productId: 'prod-2', author: users[5], rating: 4, text: 'Красивое ожерелье, но доставка была долгой.', timestamp: Date.now() - 172800000 },
];

let chats: Chat[] = [
    { id: 'chat-1', participant: users[1], messages: [
        { id: 'msg-1', senderId: 'buyer-1', text: 'Здравствуйте! Ожерелье еще в наличии?', timestamp: Date.now() - 3600000 },
        { id: 'msg-2', senderId: 'user-2', text: 'Добрый день! Да, в наличии.', timestamp: Date.now() - 3540000 },
    ], lastMessage: { id: 'msg-2', senderId: 'user-2', text: 'Добрый день! Да, в наличии.', timestamp: Date.now() - 3540000 } },
    { id: 'chat-2', participant: users[2], messages: [
        { id: 'msg-3', senderId: 'buyer-1', text: 'Торг уместен?', timestamp: Date.now() - 7200000 },
    ], lastMessage: { id: 'msg-3', senderId: 'buyer-1', text: 'Торг уместен?', timestamp: Date.now() - 7200000 } },
];

let orders: Order[] = [
  { id: 'order-1', buyer: users[5], seller: users[0], items: [{ product: products[0], quantity: 1, price: 35, purchaseType: 'RETAIL' }], total: 35, status: 'SHIPPED', orderDate: Date.now() - 86400000, shippingAddress: { city: 'Киев', postOffice: 'Отделение №1', recipientName: 'Craft Enthusiast', phoneNumber: '+380991234567' }, shippingMethod: 'NOVA_POSHTA', paymentMethod: 'ESCROW', trackingNumber: '20450123456789' },
  { id: 'order-2', buyer: users[5], seller: users[1], items: [{ product: products[1], quantity: 1, price: 99, purchaseType: 'RETAIL' }], total: 99, status: 'DELIVERED', orderDate: Date.now() - 2 * 86400000, shippingAddress: { city: 'Киев', postOffice: 'Отделение №1', recipientName: 'Craft Enthusiast', phoneNumber: '+380991234567' }, shippingMethod: 'NOVA_POSHTA', paymentMethod: 'ESCROW' },
  { id: 'order-3', buyer: users[0], seller: users[5], items: [{ product: products[4], quantity: 1, price: 950, purchaseType: 'RETAIL' }], total: 950, status: 'PAID', orderDate: Date.now() - 3 * 86400000, shippingAddress: { city: 'Львов', postOffice: 'Отделение №5', recipientName: 'Pottery Master', phoneNumber: '+380507654321' }, shippingMethod: 'NOVA_POSHTA', paymentMethod: 'ESCROW', smartContractAddress: '0:abc...def', transactionHash: 'tx_hash_123' },
  { id: 'order-4', buyer: users[5], seller: users[4], items: [{ product: products[5], quantity: 1, price: 55000, purchaseType: 'RETAIL' }], total: 55000, status: 'SHIPPED_TO_EXPERT', orderDate: Date.now() - 4 * 86400000, shippingAddress: { city: 'Киев', postOffice: 'Отделение №1', recipientName: 'Craft Enthusiast', phoneNumber: '+380991234567' }, shippingMethod: 'NOVA_POSHTA', paymentMethod: 'ESCROW', authenticationRequested: true, authenticationEvents: [{ status: 'SHIPPED_TO_EXPERT', timestamp: Date.now() - 3 * 86400000, comment: "Seller has shipped the car to CryptoCraft hub." }] },
  { id: 'order-5', buyer: users[5], seller: users[4], items: [{ product: products[7], quantity: 1, price: 8500, purchaseType: 'RETAIL' }], total: 8500, status: 'NFT_ISSUED', orderDate: Date.now() - 5 * 86400000, shippingAddress: { city: 'Киев', postOffice: 'Отделение №1', recipientName: 'Craft Enthusiast', phoneNumber: '+380991234567' }, shippingMethod: 'NOVA_POSHTA', paymentMethod: 'ESCROW', authenticationRequested: true, authenticationEvents: [{ status: 'NFT_ISSUED', timestamp: Date.now() - 4 * 86400000, comment: "NFT Certificate minted." }] },
];

let notifications: Notification[] = [
    { id: 'notif-1', userId: 'user-1', type: 'new_message', text: 'У вас новое сообщение от Jewelry Queen', link: '/chat/chat-1', timestamp: Date.now() - 3600000, read: false },
    { id: 'notif-2', userId: 'user-1', type: 'sale', text: 'Поздравляем! Вы продали "Handmade Ceramic Mug"', link: '/profile?tab=sales', timestamp: Date.now() - 86400000, read: true },
    { id: 'notif-3', userId: 'user-2', type: 'new_review', text: 'Craft Enthusiast оставил отзыв 4 звезды на ваш товар.', link: '/profile', timestamp: Date.now() - 172800000, read: true },
    { id: 'notif-4', userId: 'user-1', type: 'outbid', text: 'Вашу ставку на "Картина Закат" перебили!', link: '/product/prod-7', timestamp: Date.now() - 1800000, read: false },
    { id: 'notif-5', userId: 'user-3', type: 'auction_ended_seller', text: 'Ваш аукцион "Картина Закат" завершился! Победитель - buyer-1.', link: '/product/prod-7', timestamp: Date.now(), read: false },
    { id: 'notif-6', userId: 'user-1', type: 'new_dispute_seller', text: 'Покупатель открыл спор по заказу #order-1.', link: '/dispute/order-1', timestamp: Date.now() - 900000, read: false },
];

let collections: Collection[] = [
    { id: 'col-1', userId: 'buyer-1', name: 'Вдохновение для дома', productIds: ['prod-1'] },
    { id: 'col-2', userId: 'buyer-1', name: 'Подарки', productIds: ['prod-1', 'prod-2'] },
];

let workshopPosts: WorkshopPost[] = [
    { id: 'post-1', sellerId: 'user-1', text: 'Работаю над новой партией чашек! Скоро в продаже. #керамика #ручнаяработа', imageUrl: 'https://picsum.photos/seed/post1/600/400', timestamp: Date.now() - 2 * 86400000, likedBy: ['buyer-1', 'user-2'], comments: [{id: 'wc-1', author: users[5], text: 'Очень красиво!', timestamp: Date.now() - 86400000}] },
    { id: 'post-2', sellerId: 'user-2', text: 'Новое поступление лунных камней для ваших украшений.', timestamp: Date.now() - 3 * 86400000, likedBy: ['buyer-1'], comments: [] },
];

let forumThreads: ForumThread[] = [
    { id: 'thread-1', title: 'Как правильно фотографировать товары для продажи?', author: users[0], createdAt: Date.now() - 5 * 86400000, replyCount: 2, lastReplyAt: Date.now() - 86400000, isPinned: true },
    { id: 'thread-2', title: 'Обсуждение: Комиссии на платформе', author: users[2], createdAt: Date.now() - 2 * 86400000, replyCount: 0, lastReplyAt: Date.now() - 2 * 86400000 },
];

let forumPosts: ForumPost[] = [
    { id: 'fp-1', threadId: 'thread-1', author: users[0], content: 'Коллеги, поделитесь советами, как вы делаете такие красивые фото? У меня получается не очень.', createdAt: Date.now() - 5 * 86400000 },
    { id: 'fp-2', threadId: 'thread-1', author: users[3], content: 'Главное - это хороший дневной свет! И не используйте вспышку.', createdAt: Date.now() - 4 * 86400000 },
    { id: 'fp-3', threadId: 'thread-1', author: users[1], content: 'Согласна! Еще можно использовать Lightroom для небольшой коррекции.', createdAt: Date.now() - 86400000 },
];

let promoCodes: PromoCode[] = [
    { id: 'promo-1', sellerId: 'user-1', code: 'CRAFT10', discountType: 'PERCENTAGE', discountValue: 10, isActive: true, uses: 5, scope: 'ENTIRE_ORDER' },
    { id: 'promo-2', sellerId: 'user-2', code: 'JEWEL20', discountType: 'PERCENTAGE', discountValue: 20, isActive: true, uses: 2, minPurchaseAmount: 100, scope: 'CATEGORY', applicableCategory: 'Ювелирные изделия' },
];

let disputes: Dispute[] = [
    { id: 'order-1', order: orders.find(o => o.id === 'order-1')!, messages: [
        { id: 'dm-1', senderId: 'buyer-1', senderName: 'Craft Enthusiast', senderAvatar: 'https://picsum.photos/seed/buyer1/100/100', timestamp: Date.now() - 900000, text: 'Я получил чашку, но она разбита! Требую возврата.' },
        { id: 'dm-2', senderId: 'user-1', senderName: 'Pottery Master', senderAvatar: 'https://picsum.photos/seed/seller1/100/100', timestamp: Date.now() - 840000, text: 'Я очень хорошо упаковал ее. Возможно, это вина службы доставки.' },
        { id: 'dm-3', senderId: 'arbitrator-01', senderName: 'CryptoCraft Support', senderAvatar: 'https://picsum.photos/seed/support/100/100', timestamp: Date.now() - 600000, text: 'Здравствуйте. Я арбитр CryptoCraft. Пожалуйста, предоставьте фото упаковки и поврежденного товара.' },
    ], status: 'UNDER_REVIEW' }
];

let liveStreams: LiveStream[] = [
    { id: 'stream-1', title: 'Новая коллекция керамики!', seller: users[0], status: 'LIVE', featuredProductId: 'prod-1', welcomeMessage: 'Всем привет! Сегодня показываю новые поступления, задавайте вопросы!' },
    { id: 'stream-2', title: 'Эксклюзивные украшения', seller: users[1], status: 'UPCOMING', featuredProductId: 'prod-2', scheduledStartTime: Date.now() + 2 * 60 * 60 * 1000 },
    { id: 'stream-3', title: 'Винтажные находки', seller: users[2], status: 'ENDED', featuredProductId: 'prod-3' },
];

// --- API SERVICE IMPLEMENTATION ---

export const apiService = {
  // --- REAL API METHODS ---
  getPublicIcons: async (): Promise<Icon[]> => {
    return apiFetch('/icons/public');
  },

  getCategories: async (): Promise<CategorySchema[]> => {
    return apiFetch('/categories');
  },

  loginWithTelegram: async (initData: string): Promise<{ access_token: string; user: User }> => {
    return apiFetch('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });
  },

  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) throw new Error('File upload failed');
    return response.json();
  },

  createListing: async (
    productData: Partial<Product>,
    imageUrls: string[],
    videoUrl: string | undefined,
    user: User
  ): Promise<Product> => {
     // Backend expects `sellerId`, not the full user object
    const payload = {
      ...productData,
      imageUrls,
      videoUrl,
      sellerId: user.id,
    };
    return apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  
  updateListing: async (id: string, updates: Partial<Product>): Promise<Product> => {
      return apiFetch(`/products/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
      });
  },

  // --- AI Service Proxies ---
  generateListingWithAi: async (imageBase64: string, userDescription: string): Promise<GeneratedListing> => {
    return apiFetch('/ai/generate-listing', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, userDescription }),
    });
  },
  
  processImportedHtmlWithAi: async (html: string): Promise<ImportedListingData> => {
      return apiFetch('/ai/process-html', {
          method: 'POST',
          body: JSON.stringify({ html }),
      });
  },

  editImageWithAi: async (imageBase64: string, mimeType: string, prompt: string): Promise<{ base64Image: string }> => {
    return apiFetch('/ai/edit-image', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, mimeType, prompt }),
    });
  },

  analyzeDocumentForVerificationWithAi: async (imageBase64: string): Promise<VerificationAnalysis> => {
      return apiFetch('/ai/analyze-document', {
          method: 'POST',
          body: JSON.stringify({ imageBase64 }),
      });
  },
  
  getAnalyticsInsightsWithAi: async (analyticsData: SellerAnalytics): Promise<AiInsight[]> => {
      return apiFetch('/ai/analytics-insights', {
          method: 'POST',
          body: JSON.stringify({ analyticsData }),
      });
  },

  generateDashboardFocusWithAi: async (dashboardData: SellerDashboardData): Promise<AiFocus> => {
      return apiFetch('/ai/dashboard-focus', {
          method: 'POST',
          body: JSON.stringify({ dashboardData }),
      });
  },
  
  scrapeUrlFromClient: async (url: string): Promise<{ html: string }> => {
    // This now runs on the client, using a proxy to bypass CORS.
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch from proxy with status: ${response.status}`);
      }
      const html = await response.text();
      return { html };
    } catch (error) {
      console.error(`Client-side scraping error for ${url}:`, error);
      throw new Error(`Не удалось получить данные со страницы. Сайт может быть недоступен или защищен от сбора данных.`);
    }
  },
  
  uploadFileFromUrl: async (url: string): Promise<{ url: string }> => {
    return apiFetch('/upload/url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },
  
  convertCurrency: async (amount: number, from: string): Promise<number> => {
      // Mocked on frontend for now
      await new Promise(res => setTimeout(res, 300));
      // Simple mock conversion
      const rates: Record<string, number> = { 'ГРН': 0.025, 'USD': 1, '$': 1, 'USDT': 1 };
      const rate = Object.keys(rates).find(key => from.toUpperCase().includes(key.toUpperCase())) || 'USD';
      return amount * (rates[rate] || 1);
  },

  getProducts: async (filters?: any): Promise<Product[]> => {
    const allProducts: Product[] = await apiFetch('/products');
    
    console.log("Filtering with:", filters);
    let filteredProducts = [...allProducts];

    if (filters?.category && filters.category !== 'Все') {
      filteredProducts = filteredProducts.filter(p => p.category === filters.category);
    }
    
    // specialFilter logic
    if (filters?.specialFilter === 'sold') {
      // Backend doesn't support this yet. For now, we return nothing.
      return [];
    }
    if (filters?.specialFilter === 'verified') {
        filteredProducts = filteredProducts.filter(p => p.seller.verificationLevel === 'PRO');
    }
    
    // Dynamic attribute filtering
    if (filters?.dynamic && Object.keys(filters.dynamic).length > 0) {
        filteredProducts = filteredProducts.filter(p => {
            return Object.entries(filters.dynamic).every(([key, values]) => {
                const productValue = p.dynamicAttributes[key];
                if (productValue === undefined || productValue === null) return false;
                return (values as string[]).includes(String(productValue));
            });
        });
    }

    // Sorting
    if (filters?.sortBy) {
        switch (filters.sortBy) {
            case 'priceAsc':
                filteredProducts.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
                break;
            case 'priceDesc':
                filteredProducts.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
                break;
            case 'rating':
                filteredProducts.sort((a, b) => b.seller.rating - a.seller.rating);
                break;
            case 'newest':
            default:
                 filteredProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                break;
        }
    }


    return filteredProducts.filter(p => !p.isAuction);
  },
  
  getAuctions: async (): Promise<Product[]> => {
      const allProducts: Product[] = await apiFetch('/products');
      return allProducts.filter(p => p.isAuction);
  },

  getPromotedProducts: async (): Promise<Product[]> => {
    const allProducts: Product[] = await apiFetch('/products');
    return allProducts.filter(p => p.isPromoted);
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    return apiFetch(`/products/${id}`);
  },
  
  getProductsByIds: async (ids: string[]): Promise<Product[]> => {
    if (ids.length === 0) return [];
    const allProducts: Product[] = await apiFetch('/products');
    return allProducts.filter(p => ids.includes(p.id));
  },
  
  getProductsBySellerId: async (sellerId: string): Promise<Product[]> => {
    const allProducts: Product[] = await apiFetch('/products');
    return allProducts.filter(p => p.seller?.id === sellerId);
  },
  
  getUserById: async (id: string): Promise<User | undefined> => {
      return apiFetch(`/users/${id}`);
  },

  getPurchasesByBuyerId: async (): Promise<Order[]> => {
      return apiFetch('/orders/purchases');
  },

  getSalesBySellerId: async (): Promise<Order[]> => {
      return apiFetch('/orders/sales');
  },
  
  getForYouFeed: async(userId: string): Promise<Product[]> => {
      const allProducts = await apiFetch('/products');
      // Simple mock: return some promoted products and some random ones
      return [...allProducts.filter(p => p.isPromoted), ...allProducts.slice(2, 4)].slice(0, 8);
  },
  
  createOrdersFromCart: async (cartItems: CartItem[], buyer: User, paymentMethod: 'ESCROW' | 'DIRECT', shippingMethod: 'NOVA_POSHTA' | 'UKRPOSHTA', shippingAddress: ShippingAddress, authenticationRequested: boolean, appliedPromos: any, shippingCosts: any, txHash: string): Promise<void> => {
    const payload = {
        cartItems: cartItems.map(item => ({
            // We only need IDs for the backend
            product: { id: item.product.id, seller: { id: item.product.seller.id } },
            quantity: item.quantity,
            priceAtTimeOfAddition: item.priceAtTimeOfAddition,
            variant: item.variant,
            purchaseType: item.purchaseType,
        })),
        paymentMethod,
        shippingMethod,
        shippingAddress,
        transactionHash: txHash
    };
    return apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
  },

  // --- MOCKED API METHODS (for features not yet on backend) ---
  
  getReviewsByUserId: async (userId: string): Promise<Review[]> => {
      await new Promise(res => setTimeout(res, 400));
      return reviews.filter(r => r.productId.startsWith('prod-') && products.find(p => p.id === r.productId)?.seller.id === userId);
  },
  
  submitReview: async (productId: string, author: User, rating: number, text: string, imageUrl?: string): Promise<Review> => {
    await new Promise(res => setTimeout(res, 600));
    const newReview: Review = {
        id: `rev-${Date.now()}`,
        productId,
        author,
        rating,
        text,
        timestamp: Date.now(),
        imageUrl
    };
    reviews.unshift(newReview);
    return newReview;
  },

  getChats: async (userId: string): Promise<Chat[]> => {
      await new Promise(res => setTimeout(res, 600));
      return [...chats].sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
  },

  getChatById: async (chatId: string, userId: string): Promise<Chat | null> => {
      await new Promise(res => setTimeout(res, 300));
      return chats.find(c => c.id === chatId) || null;
  },
  
  findOrCreateChat: async (userId1: string, userId2: string): Promise<Chat> => {
      await new Promise(res => setTimeout(res, 300));
      const existingChat = chats.find(c => (c.participant.id === userId1 || c.participant.id === userId2));
      if(existingChat) return existingChat;
      
      const otherUser = users.find(u => u.id === userId2);
      if(!otherUser) throw new Error("User not found");

      const newChat: Chat = {
          id: `chat-${Date.now()}`,
          participant: otherUser,
          messages: [],
          lastMessage: {id: 'temp', senderId: '', timestamp: Date.now(), text: 'Чат создан'}
      };
      chats.push(newChat);
      return newChat;
  },

  sendMessage: async (chatId: string, content: MessageContent, senderId: string): Promise<Message> => {
    await new Promise(res => setTimeout(res, 250));
    const chat = chats.find(c => c.id === chatId);
    if (!chat) throw new Error("Chat not found");

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId,
      timestamp: Date.now(),
      ...content
    };
    chat.messages.push(newMessage);
    chat.lastMessage = newMessage;
    return newMessage;
  },

  getNotificationsByUserId: async (userId: string): Promise<Notification[]> => {
      await new Promise(res => setTimeout(res, 800));
      return [...notifications].sort((a,b) => b.timestamp - a.timestamp);
  },

  markAllNotificationsAsRead: async (userId: string): Promise<void> => {
      await new Promise(res => setTimeout(res, 200));
      notifications = notifications.map(n => n.userId === userId ? { ...n, read: true } : n);
  },
  
  getCollectionsByUserId: async (userId: string): Promise<Collection[]> => {
      await new Promise(res => setTimeout(res, 400));
      return collections.filter(c => c.userId === userId);
  },
  
  getCollectionById: async (id: string, userId: string): Promise<{collection: Collection, products: Product[]} | null> => {
      await new Promise(res => setTimeout(res, 500));
      const collection = collections.find(c => c.id === id && c.userId === userId);
      if (!collection) return null;
      const collectionProducts = products.filter(p => collection.productIds.includes(p.id));
      return { collection, products: collectionProducts };
  },
  
  createCollection: async (userId: string, name: string): Promise<Collection> => {
      await new Promise(res => setTimeout(res, 300));
      const newCollection: Collection = {
          id: `col-${Date.now()}`,
          userId,
          name,
          productIds: [],
      };
      collections.push(newCollection);
      return newCollection;
  },
  
  addProductToCollection: async (collectionId: string, productId: string): Promise<void> => {
      await new Promise(res => setTimeout(res, 200));
      const collection = collections.find(c => c.id === collectionId);
      if(collection && !collection.productIds.includes(productId)) {
          collection.productIds.push(productId);
      }
  },

  removeProductFromCollection: async (collectionId: string, productId: string): Promise<void> => {
      await new Promise(res => setTimeout(res, 200));
      const collection = collections.find(c => c.id === collectionId);
      if(collection) {
          collection.productIds = collection.productIds.filter(id => id !== productId);
      }
  },
  
  getFeedForUser: async(userId: string): Promise<{ items: FeedItem[], isDiscovery: boolean }> => {
      await new Promise(res => setTimeout(res, 700));
      const followingIds = users.find(u => u.id === userId)?.following || [];
      
      if (followingIds.length === 0) {
          const popularSellers = users.filter(u => u.rating > 4.8);
          const feedPosts = workshopPosts.filter(p => popularSellers.some(s => s.id === p.sellerId));
          const feedItems: FeedItem[] = feedPosts.map(post => ({ post, seller: users.find(u => u.id === post.sellerId)! }));
          return { items: feedItems.slice(0, 5), isDiscovery: true };
      }
      
      const feedPosts = workshopPosts.filter(p => followingIds.includes(p.sellerId));
      const feedItems: FeedItem[] = feedPosts.map(post => ({ post, seller: users.find(u => u.id === post.sellerId)! }));
      return { items: feedItems, isDiscovery: false };
  },
  
  likeWorkshopPost: async (postId: string, userId: string): Promise<void> => {
      await new Promise(res => setTimeout(res, 150));
      const post = workshopPosts.find(p => p.id === postId);
      if (post) {
          const index = post.likedBy.indexOf(userId);
          if (index > -1) {
              post.likedBy.splice(index, 1);
          } else {
              post.likedBy.push(userId);
          }
      }
  },

  addCommentToWorkshopPost: async (postId: string, userId: string, text: string): Promise<WorkshopComment> => {
      await new Promise(res => setTimeout(res, 400));
      const post = workshopPosts.find(p => p.id === postId);
      const author = users.find(u => u.id === userId);
      if (!post || !author) throw new Error("Post or user not found");
      const newComment: WorkshopComment = {
          id: `wc-${Date.now()}`,
          author,
          text,
          timestamp: Date.now(),
      };
      post.comments.push(newComment);
      return newComment;
  },
  
  createWorkshopPost: async (postData: { sellerId: string; text: string; imageUrl?: string }): Promise<WorkshopPost> => {
      await new Promise(res => setTimeout(res, 500));
      const author = users.find(u => u.id === postData.sellerId);
      if (!author) throw new Error("User not found");
      const newPost: WorkshopPost = {
          id: `post-${Date.now()}`,
          sellerId: postData.sellerId,
          text: postData.text,
          imageUrl: postData.imageUrl,
          timestamp: Date.now(),
          likedBy: [],
          comments: [],
      };
      workshopPosts.unshift(newPost);
      return newPost;
  },

   getForumThreads: async (): Promise<ForumThread[]> => {
        await new Promise(res => setTimeout(res, 600));
        return [...forumThreads].sort((a, b) => (b.isPinned ? 1 : -1) - (a.isPinned ? -1 : 1) || b.lastReplyAt - a.lastReplyAt);
   },
   
   getForumThreadById: async (id: string): Promise<ForumThread | null> => {
       await new Promise(res => setTimeout(res, 300));
       return forumThreads.find(t => t.id === id) || null;
   },

   getForumPostsByThreadId: async (threadId: string): Promise<ForumPost[]> => {
       await new Promise(res => setTimeout(res, 400));
       return forumPosts.filter(p => p.threadId === threadId).sort((a,b) => a.createdAt - b.createdAt);
   },
   
   createForumThread: async (title: string, content: string, author: User): Promise<ForumThread> => {
       await new Promise(res => setTimeout(res, 500));
       const now = Date.now();
       const newThread: ForumThread = {
           id: `thread-${now}`,
           title,
           author,
           createdAt: now,
           lastReplyAt: now,
           replyCount: 1,
       };
       const newPost: ForumPost = {
           id: `fp-${now}`,
           threadId: newThread.id,
           author,
           content,
           createdAt: now,
       };
       forumThreads.unshift(newThread);
       forumPosts.push(newPost);
       return newThread;
   },
   
   createForumPost: async (threadId: string, content: string, author: User): Promise<ForumPost> => {
       await new Promise(res => setTimeout(res, 400));
       const thread = forumThreads.find(t => t.id === threadId);
       if (!thread) throw new Error("Thread not found");
       
       const now = Date.now();
       const newPost: ForumPost = {
           id: `fp-${now}`,
           threadId,
           author,
           content,
           createdAt: now,
       };
       forumPosts.push(newPost);
       thread.replyCount++;
       thread.lastReplyAt = now;
       return newPost;
   },
   
    getSellerAnalytics: async (sellerId: string, period: '7d' | '30d' | 'all'): Promise<SellerAnalytics> => {
        await new Promise(res => setTimeout(res, 900));
        const days = period === '7d' ? 7 : 30;
        return {
            profileVisits: Math.floor(Math.random() * 500 * (days/7)),
            totalProductViews: Math.floor(Math.random() * 2000 * (days/7)),
            totalSales: Math.floor(Math.random() * 50 * (days/7)),
            conversionRate: parseFloat((Math.random() * 5).toFixed(2)),
            salesOverTime: Array.from({length: days}, (_, i) => ({ date: `Day ${i+1}`, value: Math.floor(Math.random() * 10) })),
            viewsOverTime: Array.from({length: days}, (_, i) => ({ date: `Day ${i+1}`, value: Math.floor(Math.random() * 100) })),
            topProducts: products.filter(p => p.seller.id === sellerId).slice(0, 3).map(p => ({ id: p.id, title: p.title, imageUrl: p.imageUrls[0], views: Math.floor(Math.random() * 500), sales: Math.floor(Math.random() * 20) })),
            trafficSources: [
                { source: 'Поиск CryptoCraft', visits: 120 },
                { source: 'Прямые заходы', visits: 80 },
                { source: 'Telegram', visits: 65 },
                { source: 'Другое', visits: 30 },
            ]
        };
    },
    
    validatePromoCode: async(code: string, sellerId: string, items: CartItem[]): Promise<{discountValue: number, discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'}> => {
        await new Promise(res => setTimeout(res, 500));
        const promo = promoCodes.find(p => p.code === code && p.sellerId === sellerId && p.isActive);
        if(!promo) throw new Error("Промокод не найден или неактивен.");
        
        const total = items.reduce((sum, item) => sum + item.priceAtTimeOfAddition * item.quantity, 0);

        if(promo.minPurchaseAmount && total < promo.minPurchaseAmount) {
            throw new Error(`Минимальная сумма заказа для этого кода: ${promo.minPurchaseAmount} USDT`);
        }
        
        return { discountValue: promo.discountValue, discountType: promo.discountType };
    },
    
    createPromoCode: async (sellerId: string, data: Partial<PromoCode>): Promise<PromoCode> => {
        await new Promise(res => setTimeout(res, 400));
        const newPromo: PromoCode = {
            id: `promo-${Date.now()}`,
            sellerId,
            code: data.code!,
            discountType: data.discountType!,
            discountValue: data.discountValue!,
            isActive: true,
            uses: 0,
            scope: data.scope!,
            ...data
        };
        promoCodes.push(newPromo);
        return newPromo;
    },

    deletePromoCode: async (promoId: string, sellerId: string): Promise<void> => {
        await new Promise(res => setTimeout(res, 300));
        promoCodes = promoCodes.filter(p => !(p.id === promoId && p.sellerId === sellerId));
    },
    
    getPromoCodesBySellerId: async (sellerId: string): Promise<PromoCode[]> => {
        await new Promise(res => setTimeout(res, 400));
        return promoCodes.filter(p => p.sellerId === sellerId);
    },

    getSellerDashboardData: async (sellerId: string): Promise<SellerDashboardData> => {
        await new Promise(res => setTimeout(res, 700));
        return {
            metrics: {
                revenueToday: Math.random() * 200,
                salesToday: Math.floor(Math.random() * 10),
                profileVisitsToday: Math.floor(Math.random() * 50),
            },
            actionableItems: [
                { id: 'ac-1', type: 'new_order', text: 'Новый заказ #order-3 ожидает отправки.', linkTo: 'sales', entityId: 'order-3' },
                { id: 'ac-2', type: 'new_message', text: 'У вас новое сообщение в чате с Jewelry Queen.', linkTo: 'chat', entityId: 'chat-1' },
            ],
            recentActivity: [
                { id: 'ra-1', type: 'wishlist_add', icon: '❤️', time: '5 минут назад', user: {id: 'buyer-1', name: 'Craft Enthusiast'}, product: {id: 'prod-1', name: 'Handmade Ceramic Mug'} },
                { id: 'ra-2', type: 'new_follower', icon: '➕', time: '1 час назад', text: 'Пользователь Jewelry Queen подписался на вас.' },
            ]
        };
    },
    
    sendPersonalOffer: async(sellerId: string, recipientId: string, productId: string, promoId: string): Promise<void> => {
        await new Promise(res => setTimeout(res, 600));
        console.log(`Sending offer from ${sellerId} to ${recipientId} for product ${productId} with promo ${promoId}`);
        const product = products.find(p => p.id === productId);
        const promo = promoCodes.find(p => p.id === promoId);
        
        notifications.unshift({
            id: `notif-${Date.now()}`,
            userId: recipientId,
            type: 'personal_offer',
            text: `У вас персональное предложение от ${product?.seller.name}: Скидка ${promo?.discountValue}${promo?.discountType === 'PERCENTAGE' ? '%' : ' USDT'} на товар "${product?.title}"!`,
            link: `/product/${productId}`,
            timestamp: Date.now(),
            read: false,
        });
    },
    
    getDisputeById: async(orderId: string): Promise<Dispute | null> => {
        await new Promise(res => setTimeout(res, 400));
        return disputes.find(d => d.id === orderId) || null;
    },

    addMessageToDispute: async(orderId: string, message: Omit<DisputeMessage, 'id' | 'timestamp'>): Promise<DisputeMessage> => {
        await new Promise(res => setTimeout(res, 300));
        const dispute = disputes.find(d => d.id === orderId);
        if(!dispute) throw new Error("Dispute not found");

        const newMessage: DisputeMessage = {
            id: `dm-${Date.now()}`,
            timestamp: Date.now(),
            ...message
        };
        dispute.messages.push(newMessage);
        
        if (dispute.messages.length % 3 === 0) {
             const arbitratorMessage: DisputeMessage = {
                id: `dm-${Date.now() + 1}`,
                timestamp: Date.now() + 1,
                senderId: 'arbitrator-01',
                senderName: 'CryptoCraft Support',
                senderAvatar: 'https://picsum.photos/seed/support/100/100',
                text: 'Спасибо за предоставленную информацию. Мы изучаем ваше дело и скоро вернемся с решением.',
            };
            dispute.messages.push(arbitratorMessage);
        }

        return newMessage;
    },
    
    getLiveStreams: async (): Promise<LiveStream[]> => {
        await new Promise(res => setTimeout(res, 500));
        return liveStreams;
    },

    getLiveStreamById: async (id: string): Promise<LiveStream | null> => {
        await new Promise(res => setTimeout(res, 300));
        return liveStreams.find(s => s.id === id) || null;
    },

    createLiveStream: async (title: string, seller: User, featuredProductId: string, options: any): Promise<LiveStream> => {
        await new Promise(res => setTimeout(res, 800));
        const newStream: LiveStream = {
            id: `stream-${Date.now()}`,
            title,
            seller,
            featuredProductId,
            status: options.scheduledStartTime ? 'UPCOMING' : 'LIVE',
            ...options
        };
        liveStreams.unshift(newStream);
        return newStream;
    },
    
    updateOrder: async (orderId: string, updates: Partial<Order>): Promise<Order> => {
        await new Promise(res => setTimeout(res, 300));
        const order = orders.find(o => o.id === orderId);
        if (!order) throw new Error("Order not found");
        Object.assign(order, updates);
        return order;
    },

    generateWaybill: async (orderId: string): Promise<Order> => {
        const order = await apiService.updateOrder(orderId, {
            status: 'SHIPPED',
            trackingNumber: `TTN${Date.now()}`
        });
        return order;
    },
    
    calculateShippingCost: async (items: CartItem[], method: 'NOVA_POSHTA' | 'UKRPOSHTA'): Promise<{cost: number}> => {
        await new Promise(res => setTimeout(res, 600));
        const baseCost = method === 'NOVA_POSHTA' ? 3 : 2;
        const weight = items.reduce((sum, item) => sum + ((item.product.weight || 200) * item.quantity), 0);
        const weightCost = Math.ceil(weight / 1000) * 0.5;
        return { cost: baseCost + weightCost };
    },
    
    getTrackingHistory: async (orderId: string): Promise<TrackingEvent[] | null> => {
        await new Promise(res => setTimeout(res, 700));
        const order = orders.find(o => o.id === orderId);
        if (!order || !order.trackingNumber) return null;
        return [
            { timestamp: order.orderDate + 100000, status: 'Принято в отделении', location: 'Киев, Отделение №5' },
            { timestamp: order.orderDate + 2000000, status: 'Направляется в город получателя', location: 'Сортировочный центр, Киев' },
            { timestamp: Date.now() - 100000, status: 'Прибыло в отделение получателя', location: 'Львов, Отделение №1' },
        ];
    },
    
    placeBid: async (productId: string, amount: number, userId: string): Promise<Product> => {
        await new Promise(res => setTimeout(res, 400));
        const product = products.find(p => p.id === productId);
        if (!product) throw new Error("Product not found");
        if (amount <= (product.currentBid || product.startingBid || 0)) throw new Error("Bid must be higher than current bid");

        product.currentBid = amount;
        if (!product.bidders?.includes(userId)) {
            product.bidders?.push(userId);
        }
        return product;
    },
    
    getProposals: async (): Promise<Proposal[]> => {
        await new Promise(res => setTimeout(res, 500));
        return [
            { id: 'prop-1', title: 'Снизить комиссию платформы до 1.5%', description: 'Предлагаю снизить комиссию для всех сделок с 2% до 1.5% для стимуляции активности продавцов.', proposer: users[1], createdAt: Date.now() - 5*86400000, endsAt: Date.now() + 2*86400000, status: 'ACTIVE', votesFor: 125, votesAgainst: 30, voters: {'user-1': 'FOR'} },
            { id: 'prop-2', title: 'Выделить гранты на продвижение для новых мастеров', description: 'Создать фонд в 10,000 USDT для выдачи грантов по 100 USDT новым талантливым мастерам на продвижение их первых товаров.', proposer: users[0], createdAt: Date.now() - 10*86400000, endsAt: Date.now() - 3*86400000, status: 'PASSED', votesFor: 210, votesAgainst: 15, voters: {} },
            { id: 'prop-3', title: 'Добавить категорию "Антиквариат"', description: '...', proposer: users[2], createdAt: Date.now() - 12*86400000, endsAt: Date.now() - 5*86400000, status: 'REJECTED', votesFor: 50, votesAgainst: 150, voters: {} },
        ];
    },

    getProposalById: async (id: string): Promise<Proposal | null> => {
        const proposals = await apiService.getProposals();
        return proposals.find(p => p.id === id) || null;
    },
    
    castVote: async (proposalId: string, userId: string, choice: VoteChoice): Promise<Proposal> => {
        await new Promise(res => setTimeout(res, 600));
        const proposal = (await apiService.getProposals()).find(p => p.id === proposalId);
        if(!proposal) throw new Error("Proposal not found");
        
        if (!proposal.voters[userId]) {
             proposal.voters[userId] = choice;
             if (choice === 'FOR') proposal.votesFor++;
             else proposal.votesAgainst++;
        }
        return proposal;
    },
    
    getAuthenticationOrders: async (userId: string): Promise<Order[]> => {
        await new Promise(res => setTimeout(res, 500));
        return orders.filter(o => o.authenticationRequested);
    },

    requestProductAuthentication: async (productId: string): Promise<Product> => {
        await new Promise(res => setTimeout(res, 700));
        const product = products.find(p => p.id === productId);
        if (!product) throw new Error("Product not found");
        product.authenticationStatus = 'PENDING';
        return product;
    },
    
    updateUserBalance: async (userId: string, newBalance: number): Promise<void> => {
        await new Promise(res => setTimeout(res, 200));
        const user = users.find(u => u.id === userId);
        if (user) {
            user.balance = newBalance;
        }
    },
    
    getUsers: async(): Promise<User[]> => {
        return apiFetch('/users');
    },
    
    updateUser: async(userId: string, updates: Partial<User>): Promise<User> => {
        return apiFetch(`/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }
};