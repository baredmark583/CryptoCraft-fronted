// This service now acts as a hybrid: part real API client, part mock service.
// This allows for gradual backend integration without breaking the UI.
import type {
  User, Product, ProductRevision, Review, ReviewMediaAttachment, Chat, Message, Order, Notification, Collection,
  WorkshopPost, WorkshopComment, ForumThread, ForumPost, SellerAnalytics, FeedItem,
  PromoCode, SellerDashboardData, CartItem, ShippingAddress, MessageContent, Dispute, DisputeMessage, LiveStream, OrderItem, TrackingEvent, Proposal, VoteChoice,
  GeneratedListing, VerificationAnalysis, AiInsight, AiFocus, ImportedListingData, Icon, NovaPoshtaCity, NovaPoshtaWarehouse, AiResponse
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
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
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
    return null;
  } catch (error) {
    console.error(`API fetch error: ${options.method || 'GET'} ${endpoint}`, error);
    throw error;
  }
};

const RESPONSE_CACHE = new Map<string, { data: unknown; expiresAt: number }>();
const DEFAULT_CACHE_TTL = 60 * 1000;
const LONG_CACHE_TTL = 5 * 60 * 1000;

const withCache = async <T>(key: string, fetcher: () => Promise<T>, ttl = DEFAULT_CACHE_TTL): Promise<T> => {
  const cached = RESPONSE_CACHE.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }
  const data = await fetcher();
  RESPONSE_CACHE.set(key, { data, expiresAt: Date.now() + ttl });
  return data;
};

const invalidateCacheByPrefix = (prefix: string) => {
  for (const key of RESPONSE_CACHE.keys()) {
    if (key.startsWith(prefix)) {
      RESPONSE_CACHE.delete(key);
    }
  }
};

const normalizeReview = (review: Review & { product?: Product }): Review => {
  if (!review) return review;
  const attachments =
    Array.isArray(review.attachments) && review.attachments.length
      ? review.attachments
      : review.imageUrl
      ? [{ type: 'image', url: review.imageUrl }]
      : [];

  return {
    ...review,
    attachments,
    productId: review.productId || review.product?.id || review.productId,
    createdAt: review.createdAt || (typeof review.timestamp === 'number' ? new Date(review.timestamp).toISOString() : review.timestamp),
  };
};


// --- MOCKED DATA (for features not yet on backend) ---
// We keep this data to ensure the rest of the application continues to function.
const users: User[] = [
  { id: 'user-1', name: 'Pottery Master', avatarUrl: 'https://picsum.photos/seed/seller1/100/100', headerImageUrl: 'https://picsum.photos/seed/header1/1000/300', rating: 4.9, reviews: [], following: ['user-2', 'user-3'], balance: 1250.75, commissionOwed: 25.01, affiliateId: 'POTTERYPRO', tonWalletAddress: 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_______' },
  { id: 'user-2', name: 'Jewelry Queen', avatarUrl: 'https://picsum.photos/seed/seller2/100/100', headerImageUrl: 'https://picsum.photos/seed/header2/1000/300', rating: 4.8, reviews: [], following: ['user-1'], balance: 2500, commissionOwed: 150 },
  { id: 'user-3', name: 'Leather Crafter', avatarUrl: 'https://picsum.photos/seed/seller3/100/100', headerImageUrl: 'https://picsum.photos/seed/header3/1000/300', rating: 4.7, reviews: [], following: [], balance: 500, commissionOwed: 0 },
  { id: 'user-4', name: 'Digital Artist', avatarUrl: 'https://picsum.photos/seed/seller4/100/100', headerImageUrl: 'https://picsum.photos/seed/header4/1000/300', rating: 5.0, reviews: [], following: [], balance: 10000, commissionOwed: 420.69 },
  { id: 'user-5', name: 'Car Dealer Pro', avatarUrl: 'https://picsum.photos/seed/seller5/100/100', headerImageUrl: 'https://picsum.photos/seed/header5/1000/300', rating: 4.9, reviews: [], following: [], balance: 50000, commissionOwed: 1250, phoneNumber: '+380501234567' },
  { id: 'buyer-1', name: 'Craft Enthusiast', avatarUrl: 'https://picsum.photos/seed/buyer1/100/100', rating: 0, reviews: [], following: ['user-1', 'user-2', 'user-3', 'user-4'], balance: 100, commissionOwed: 0 },
  { id: 'arbitrator-01', name: 'CryptoCraft Support', avatarUrl: 'https://picsum.photos/seed/support/100/100', rating: 0, reviews: [], following: [], balance: 0, commissionOwed: 0 },
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


let orders: Order[] = [
  { id: 'order-1', buyer: users[5], seller: users[0], items: [{ product: products[0], quantity: 1, price: 35, purchaseType: 'RETAIL' }], total: 35, status: 'SHIPPED', orderDate: Date.now() - 86400000, shippingAddress: { city: 'Киев', postOffice: 'Отделение №1', recipientName: 'Craft Enthusiast', phoneNumber: '+380991234567' }, shippingMethod: 'NOVA_POSHTA', paymentMethod: 'ESCROW', trackingNumber: '20450123456789' },
  { id: 'order-2', buyer: users[5], seller: users[1], items: [{ product: products[1], quantity: 1, price: 99, purchaseType: 'RETAIL' }], total: 99, status: 'DELIVERED', orderDate: Date.now() - 2 * 86400000, shippingAddress: { city: 'Киев', postOffice: 'Отделение №1', recipientName: 'Craft Enthusiast', phoneNumber: '+380991234567' }, shippingMethod: 'NOVA_POSHTA', paymentMethod: 'ESCROW' },
  { id: 'order-3', buyer: users[0], seller: users[5], items: [{ product: products[4], quantity: 1, price: 950, purchaseType: 'RETAIL' }], total: 950, status: 'PAID', orderDate: Date.now() - 3 * 86400000, shippingAddress: { city: 'Львов', postOffice: 'Отделение №5', recipientName: 'Pottery Master', phoneNumber: '+380507654321' }, shippingMethod: 'NOVA_POSHTA', paymentMethod: 'ESCROW', smartContractAddress: '0:abc...def', transactionHash: 'tx_hash_123' },
  { id: 'order-4', buyer: users[5], seller: users[4], items: [{ product: products[5], quantity: 1, price: 55000, purchaseType: 'RETAIL' }], total: 55000, status: 'SHIPPED_TO_EXPERT', orderDate: Date.now() - 4 * 86400000, shippingAddress: { city: 'Киев', postOffice: 'Отделение №1', recipientName: 'Craft Enthusiast', phoneNumber: '+380991234567' }, shippingMethod: 'NOVA_POSHTA', paymentMethod: 'ESCROW', authenticationRequested: true, authenticationEvents: [{ status: 'SHIPPED_TO_EXPERT', timestamp: Date.now() - 3 * 86400000, comment: "Seller has shipped the car to CryptoCraft hub." }] },
  { id: 'order-5', buyer: users[5], seller: users[4], items: [{ product: products[7], quantity: 1, price: 8500, purchaseType: 'RETAIL' }], total: 8500, status: 'NFT_ISSUED', orderDate: Date.now() - 5 * 86400000, shippingAddress: { city: 'Киев', postOffice: 'Отделение №1', recipientName: 'Craft Enthusiast', phoneNumber: '+380991234567' }, shippingMethod: 'NOVA_POSHTA', paymentMethod: 'ESCROW', authenticationRequested: true, authenticationEvents: [{ status: 'NFT_ISSUED', timestamp: Date.now() - 4 * 86400000, comment: "NFT Certificate minted." }] },
];

// --- API SERVICE IMPLEMENTATION ---

export const apiService = {
  // --- REAL API METHODS ---
  novaPoshtaGetCities: async (search: string): Promise<NovaPoshtaCity[]> => {
    if (search.length < 2) return [];
    // The backend will proxy this, so no API key is exposed.
    const response = await apiFetch(`/nova-poshta/cities?search=${encodeURIComponent(search)}`);
    // Assuming the backend nests the data under a 'data' key.
    return response.data || [];
  },

  novaPoshtaGetWarehouses: async (cityRef: string, search: string = ''): Promise<NovaPoshtaWarehouse[]> => {
    if (!cityRef) return [];
    // The backend will proxy this.
    const response = await apiFetch(`/nova-poshta/warehouses?cityRef=${cityRef}&search=${encodeURIComponent(search)}`);
    return response.data || [];
  },
  
  getPublicIcons: async (): Promise<Icon[]> => {
    return withCache('icons:public', () => apiFetch('/icons/public'), LONG_CACHE_TTL);
  },

  getCategories: async (): Promise<CategorySchema[]> => {
    return withCache('categories:all', () => apiFetch('/categories'), LONG_CACHE_TTL);
  },

  getMe: async (): Promise<User> => {
    return apiFetch('/auth/me');
  },

  loginWithTelegram: async (initData: string): Promise<{ access_token: string; user: User }> => {
    return apiFetch('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });
  },
  
  loginWithTelegramWidget: async (widgetData: any): Promise<{ user: User }> => {
    return apiFetch('/auth/telegram/web-login', {
      method: 'POST',
      body: JSON.stringify(widgetData),
    });
  },

  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      credentials: 'include',
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

  getProductRevisions: async (productId: string): Promise<ProductRevision[]> => {
      return apiFetch(`/products/${productId}/revisions`);
  },

  restoreProductRevision: async (productId: string, revisionId: string): Promise<Product> => {
      return apiFetch(`/products/${productId}/revisions/${revisionId}/restore`, {
          method: 'POST',
      });
  },

  appealProductModeration: async (productId: string, message: string): Promise<Product> => {
      return apiFetch(`/products/${productId}/moderation/appeal`, {
          method: 'POST',
          body: JSON.stringify({ message }),
      });
  },

  // --- AI Service Proxies ---
  generateListingWithAi: async (imageBase64: string, userDescription: string): Promise<GeneratedListing> => {
    return apiFetch('/ai/generate-listing', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, userDescription }),
    });
  },
  
  processHtmlWithAi: async (html: string): Promise<ImportedListingData> => {
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
  
  uploadFileFromUrl: async (url: string): Promise<{ url: string }> => {
    return apiFetch('/upload/url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
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
        filteredProducts = filteredProducts.filter(p => p.seller);
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

  getChats: async (): Promise<Chat[]> => {
    const chats = await apiFetch('/chats');
    if (!Array.isArray(chats)) {
      return [];
    }
    return chats.map((chat) => ({
      ...chat,
      messages: Array.isArray(chat.messages) ? chat.messages : [],
    }));
  },

  getChatById: async (chatId: string): Promise<Chat | null> => {
    const chat = await apiFetch(`/chats/${chatId}`);
    if (!chat) return null;
    return {
      ...chat,
      messages: Array.isArray(chat.messages) ? chat.messages : [],
    };
  },
  
  findOrCreateChat: async (userId1: string, userId2: string): Promise<Chat> => {
    return apiFetch('/chats', {
        method: 'POST',
        body: JSON.stringify({ recipientId: userId2 })
    });
  },

  sendMessage: async (chatId: string, content: MessageContent): Promise<Message> => {
    const payload = {
        text: content.text,
        imageUrl: content.imageUrl,
        productContext: content.productContext ? { id: content.productContext.id } : undefined,
        attachments: content.attachments,
        quickReplies: content.quickReplies,
    };
    return apiFetch(`/chats/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
  },

  // --- MOCKED API METHODS (for features not yet on backend) ---
  
  getReviewsByUserId: async (userId: string): Promise<Review[]> => {
    const reviews = await apiFetch(`/reviews/user/${userId}`);
    return Array.isArray(reviews) ? reviews.map(normalizeReview) : [];
  },

  getReviewsByProductId: async (productId: string): Promise<Review[]> => {
    const reviews = await apiFetch(`/reviews/product/${productId}`);
    return Array.isArray(reviews) ? reviews.map(normalizeReview) : [];
  },
  
  submitReview: async (payload: {
    productId: string;
    orderId: string;
    rating: number;
    text?: string;
    attachments?: ReviewMediaAttachment[];
  }): Promise<Review> => {
    const review = await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return normalizeReview(review);
  },

  getNotificationsByUserId: async (userId: string): Promise<Notification[]> => {
      // Backend gets userId from token
      return apiFetch('/notifications');
  },

  markAllNotificationsAsRead: async (userId: string): Promise<void> => {
      // Backend gets userId from token
      return apiFetch('/notifications/read', { method: 'POST' });
  },
  
  getCollectionsByUserId: async (userId: string): Promise<Collection[]> => {
      // Backend gets userId from token
      return apiFetch('/collections');
  },
  
  getCollectionById: async (id: string, userId: string): Promise<{collection: Collection, products: Product[]} | null> => {
      // Backend can perform auth check using token.
      return apiFetch(`/collections/${id}`);
  },
  
  createCollection: async (userId: string, name: string): Promise<Collection> => {
      // Backend gets userId from token.
      return apiFetch('/collections', {
          method: 'POST',
          body: JSON.stringify({ name }),
      });
  },
  
  addProductToCollection: async (collectionId: string, productId: string): Promise<void> => {
      return apiFetch(`/collections/${collectionId}/products`, {
          method: 'POST',
          body: JSON.stringify({ productId }),
      });
  },

  removeProductFromCollection: async (collectionId: string, productId: string): Promise<void> => {
      return apiFetch(`/collections/${collectionId}/products/${productId}`, {
          method: 'DELETE',
      });
  },
  
  getFeedForUser: async(userId: string): Promise<{ items: FeedItem[], isDiscovery: boolean }> => {
      // Backend gets userId from token.
      return withCache(`workshop:feed:${userId}`, () => apiFetch('/workshop/feed'));
  },
  
  getPostsBySellerId: async (sellerId: string): Promise<WorkshopPost[]> => {
      return withCache(`workshop:user:${sellerId}`, () => apiFetch(`/workshop/posts/user/${sellerId}`));
  },

  likeWorkshopPost: async (postId: string): Promise<void> => {
      return apiFetch(`/workshop/posts/${postId}/like`, { method: 'POST' });
  },

  addCommentToWorkshopPost: async (postId: string, text: string): Promise<WorkshopComment> => {
      return apiFetch(`/workshop/posts/${postId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ text }),
      });
  },

  reportWorkshopPost: async (postId: string, reason: string): Promise<void> => {
      return apiFetch(`/workshop/posts/${postId}/report`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
      });
  },

  reportWorkshopComment: async (commentId: string, reason: string): Promise<void> => {
      return apiFetch(`/workshop/comments/${commentId}/report`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
      });
  },
  
  createWorkshopPost: async (postData: { text: string; imageUrl?: string }): Promise<WorkshopPost> => {
      const result = await apiFetch('/workshop/posts', {
          method: 'POST',
          body: JSON.stringify({ text: postData.text, imageUrl: postData.imageUrl }),
      });
      invalidateCacheByPrefix('workshop:');
      return result;
  },

   getForumThreads: async (params?: { page?: number; limit?: number; search?: string; tag?: string; pinnedOnly?: boolean }): Promise<ForumThread[]> => {
       const query = new URLSearchParams();
       if (params?.page) query.append('page', String(params.page));
       if (params?.limit) query.append('limit', String(params.limit));
       if (params?.search) query.append('search', params.search);
       if (params?.tag) query.append('tag', params.tag);
       if (params?.pinnedOnly) query.append('pinnedOnly', 'true');
       const suffix = query.toString() ? `?${query.toString()}` : '';
       const cacheKey = `forum:threads:${suffix || 'root'}`;
       const response = await withCache(cacheKey, () => apiFetch(`/forum/threads${suffix}`));
       return response?.data ?? [];
   },
   
   getForumThreadById: async (id: string): Promise<ForumThread | null> => {
       return apiFetch(`/forum/threads/${id}`);
   },

   getForumPostsByThreadId: async (threadId: string, params?: { page?: number; limit?: number }): Promise<ForumPost[]> => {
       const query = new URLSearchParams();
       if (params?.page) query.append('page', String(params.page));
       if (params?.limit) query.append('limit', String(params.limit));
       const suffix = query.toString() ? `?${query.toString()}` : '';
       const response = await apiFetch(`/forum/threads/${threadId}/posts${suffix}`);
       return response?.data ?? [];
   },
   
   createForumThread: async (title: string, content: string, author: User, tags?: string[]): Promise<ForumThread> => {
       const thread = await apiFetch('/forum/threads', {
           method: 'POST',
           body: JSON.stringify({ title, content, tags }),
       });
       invalidateCacheByPrefix('forum:threads:');
       return thread;
   },
   
   createForumPost: async (threadId: string, content: string, author: User): Promise<ForumPost> => {
       const post = await apiFetch(`/forum/threads/${threadId}/posts`, {
           method: 'POST',
           body: JSON.stringify({ content }),
       });
       invalidateCacheByPrefix('forum:threads:');
       return post;
   },

   reportForumPost: async (postId: string, reason: string): Promise<void> => {
       return apiFetch(`/forum/posts/${postId}/report`, {
           method: 'POST',
           body: JSON.stringify({ reason }),
       });
   },
   
    getSellerAnalytics: async (sellerId: string, period: '7d' | '30d' | 'all'): Promise<SellerAnalytics> => {
        return apiFetch(`/analytics/seller/${sellerId}?period=${period}`);
    },
    
    validatePromoCode: async(code: string, sellerId: string, items: CartItem[]): Promise<{discountValue: number, discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'}> => {
        return apiFetch('/promocodes/validate', {
            method: 'POST',
            body: JSON.stringify({ code, sellerId, items }),
        });
    },
    
    createPromoCode: async (sellerId: string, data: Partial<PromoCode>): Promise<PromoCode> => {
        // Backend gets sellerId from token.
        return apiFetch('/promocodes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    deletePromoCode: async (promoId: string, sellerId: string): Promise<void> => {
        // Backend checks ownership via token.
        return apiFetch(`/promocodes/${promoId}`, {
            method: 'DELETE'
        });
    },
    
    getPromoCodesBySellerId: async (sellerId: string): Promise<PromoCode[]> => {
        return apiFetch(`/promocodes/seller/${sellerId}`);
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
        // Backend gets sellerId from token
        return apiFetch('/notifications/personal-offer', {
            method: 'POST',
            body: JSON.stringify({ recipientId, productId, promoId })
        });
    },
    
    getDisputeById: async(orderId: string): Promise<Dispute | null> => {
        return apiFetch(`/disputes/${orderId}`);
    },

    addMessageToDispute: async(orderId: string, message: Omit<DisputeMessage, 'id' | 'timestamp'>): Promise<DisputeMessage> => {
        return apiFetch(`/disputes/${orderId}/messages`, {
            method: 'POST',
            body: JSON.stringify(message),
        });
    },
    
    getLiveStreams: async (): Promise<LiveStream[]> => {
        return withCache('livestreams:all', () => apiFetch('/livestreams'), 30 * 1000);
    },

    getLiveStreamById: async (id: string): Promise<LiveStream | null> => {
        return apiFetch(`/livestreams/${id}`);
    },

    getLiveStreamToken: async (streamId: string): Promise<{ token: string }> => {
        return apiFetch(`/livestreams/${streamId}/token`, { method: 'POST' });
    },

    createLiveStream: async (title: string, featuredProductId: string, options: any): Promise<LiveStream> => {
        // Backend gets seller from token.
        return apiFetch('/livestreams', {
            method: 'POST',
            body: JSON.stringify({ title, featuredProductId, ...options })
        });
    },
    
    endLiveStream: async (id: string): Promise<LiveStream> => {
        return apiFetch(`/livestreams/${id}/end`, {
            method: 'PATCH',
        });
    },

    reportLiveStream: async (id: string, reason: string): Promise<void> => {
        return apiFetch(`/livestreams/${id}/report`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },

    attachLivestreamRecording: async (id: string, recordingUrl: string): Promise<LiveStream> => {
        return apiFetch(`/livestreams/${id}/recording`, {
            method: 'POST',
            body: JSON.stringify({ recordingUrl, storageProvider: 'livekit' }),
        });
    },

    getLivestreamAnalytics: async (id: string): Promise<LiveStream> => {
        return apiFetch(`/livestreams/${id}/analytics`);
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
        return apiFetch('/governance/proposals');
    },

    getProposalById: async (id: string): Promise<Proposal | null> => {
        return apiFetch(`/governance/proposals/${id}`);
    },
    
    castVote: async (proposalId: string, userId: string, choice: VoteChoice): Promise<Proposal> => {
        // userId from token on backend
        return apiFetch(`/governance/proposals/${proposalId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ choice }),
        });
    },

    createProposal: async (title: string, description: string, endsAt: number): Promise<Proposal> => {
        return apiFetch('/governance/proposals', {
            method: 'POST',
            body: JSON.stringify({ title, description, endsAt }),
        });
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
