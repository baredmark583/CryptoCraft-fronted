// This service now acts as a hybrid: part real API client, part mock service.
// This allows for gradual backend integration without breaking the UI.
import type {
  User, Product, Review, Chat, Message, Order, Notification, Collection,
  WorkshopPost, WorkshopComment, ForumThread, ForumPost, SellerAnalytics, FeedItem,
  PromoCode, SellerDashboardData, CartItem, ShippingAddress, MessageContent, Dispute, DisputeMessage, LiveStream, OrderItem, TrackingEvent, Proposal, VoteChoice,
  GeneratedListing, VerificationAnalysis, AiInsight, AiFocus, ImportedListingData
} from '../types';


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
  { id: 'prod-5', title: 'Игровой ноутбук Razer Blade 15', description: 'Мощный игровой ноутбук в отличном состоянии. Intel Core i7, RTX 3070, 16GB RAM, 1TB SSD.', price: 1150, imageUrls: ['https://picsum.photos/seed/prod5/600/400'], category: 'Электроника', seller: users[4], dynamicAttributes: { 'Бренд': 'Razer', 'Модель': 'Blade 15', 'Состояние': 'Б/у' }, isAuthenticationAvailable: true, authenticationStatus: 'NONE', productType: 'PHYSICAL' },
  { id: 'prod-6', title: 'Audi A6 2019', description: 'Автомобиль в идеальном состоянии. Один владелец. Полная комплектация. Пробег 85000 км.', price: 25000, imageUrls: ['https://picsum.photos/seed/prod6/600/400'], category: 'Автомобили', seller: users[4], dynamicAttributes: { 'Бренд': 'Audi', 'Модель': 'A6', 'Год выпуска': 2019, 'Пробег, км': 85000, 'VIN-код': 'WAUZZZF27KN000123' }, isAuthenticationAvailable: true, authenticationStatus: 'AUTHENTICATED', nftTokenId: 'mock_nft_123', productType: 'PHYSICAL' },
  { id: 'prod-7', title: 'Винтажная брошь', description: 'Элегантная винтажная брошь 60-х годов. Серебро с эмалью.', price: 95, imageUrls: ['https://picsum.photos/seed/prod7/600/400'], category: 'Винтаж', seller: users[1], dynamicAttributes: { 'Период': '1960-e', 'Состояние': 'Отличное' }, productType: 'PHYSICAL' },
  { id: 'prod-8', title: 'Акварельный пейзаж', description: 'Оригинальная акварельная работа. Размер 30х40 см.', price: 150, imageUrls: ['https://picsum.photos/seed/prod8/600/400'], category: 'Искусство и коллекционирование', seller: users[3], dynamicAttributes: { 'Автор': 'Digital Artist', 'Стиль': 'Реализм' }, productType: 'PHYSICAL' },
];

let orders: Order[] = [
    {
        id: 'order-1',
        buyer: users[0], // Logged-in user
        seller: users[3],
        items: [{
            product: products.find(p => p.id === 'prod-8')!,
            quantity: 1,
            price: 150,
            purchaseType: 'RETAIL'
        }],
        total: 150,
        status: 'COMPLETED',
        orderDate: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        shippingAddress: { city: 'Киев', postOffice: 'Отделение 1', recipientName: 'Pottery Master', phoneNumber: '123456789' },
        shippingMethod: 'NOVA_POSHTA',
        paymentMethod: 'ESCROW',
    }
];
let reviews: Review[] = [];
let chats: Chat[] = [];
let notifications: Notification[] = [];
let collections: Collection[] = [];
let workshopPosts: WorkshopPost[] = [];
let forumThreads: ForumThread[] = [];
let forumPosts: ForumPost[] = [];
let promoCodes: PromoCode[] = [];
let disputes: Dispute[] = [];
let liveStreams: LiveStream[] = [];
let proposals: Proposal[] = [];


export const apiService = {
  // --- REAL API METHODS ---

  // Authentication
  loginWithTelegram: async (initData: string): Promise<{ access_token: string, user: User }> => {
    return apiFetch('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });
  },
  
  // AI Service Methods (delegated to backend)
  generateListingWithAi: async (imageBase64: string, userDescription: string): Promise<GeneratedListing> => {
    return apiFetch('/ai/generate-listing', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, userDescription }),
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
  processImportedHtmlWithAi: async (html: string): Promise<ImportedListingData> => {
      return apiFetch('/ai/process-html', {
          method: 'POST',
          body: JSON.stringify({ html }),
      });
  },


  // Products
  getProducts: async (filters: any): Promise<Product[]> => {
    // MOCKED: Reverted from real API call to mock data
    await new Promise(res => setTimeout(res, 500)); // Simulate latency
    
    const soldProductIds = new Set(orders.flatMap(o => o.items.map(i => i.product.id)));
    
    let baseProducts: Product[];
    if (filters.specialFilter === 'sold') {
        baseProducts = products.filter(p => soldProductIds.has(p.id));
    } else {
        baseProducts = products.filter(p => !soldProductIds.has(p.id));
    }

    const filtered = baseProducts.filter(p => {
        let match = true;
        if (filters.category && filters.category !== 'Все') match = match && p.category === filters.category;
        if (filters.specialFilter === 'verified') match = match && p.seller.verificationLevel === 'PRO';
        const price = p.salePrice ?? p.price ?? 0;
        if (filters.priceMin && price < filters.priceMin) match = false;
        if (filters.priceMax && price > filters.priceMax) match = false;
        if (filters.dynamic && Object.keys(filters.dynamic).length > 0) {
            for (const [key, values] of Object.entries(filters.dynamic as Record<string, string[]>)) {
                if (values.length > 0) {
                    const productValue = p.dynamicAttributes[key];
                    if (!productValue || !values.includes(String(productValue))) {
                        match = false;
                        break; 
                    }
                }
            }
        }
        return match;
    });

    return filtered.sort((a, b) => {
        const priceA = a.salePrice ?? a.price ?? 0;
        const priceB = b.salePrice ?? b.price ?? 0;
        switch (filters.sortBy) {
            case 'priceAsc': return priceA - priceB;
            case 'priceDesc': return priceB - a.seller.rating;
            default: return 0;
        }
    });
  },
  getProductById: async (id: string): Promise<Product | undefined> => {
    // MOCKED: Reverted from real API call to mock data
    await new Promise(res => setTimeout(res, 200));
    const product = products.find(p => p.id === id);
    if (product) {
        // Return a copy to prevent direct mutation of mock data
        return { ...product };
    }
    return undefined;
  },
  createListing: async (data: Partial<Product>, imageUrls: string[], videoUrl: string | undefined, seller: User): Promise<Product> => {
    // MOCKED: This simulates creating a new product.
    await new Promise(res => setTimeout(res, 800));
    const newProduct: Product = {
        id: `prod-${Date.now()}`,
        ...data,
        seller,
        imageUrls,
        videoUrl,
        dynamicAttributes: data.dynamicAttributes || {},
    } as Product;
    products.unshift(newProduct);
    return newProduct;
  },
  updateListing: async (id: string, data: Partial<Product>): Promise<Product> => {
    // MOCKED: This simulates updating a product.
    await new Promise(res => setTimeout(res, 500));
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) throw new Error("Product not found");
    products[productIndex] = { ...products[productIndex], ...data };
    return products[productIndex];
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    // MOCKED
    await new Promise(res => setTimeout(res, 100));
    return users;
  },
  getUserById: async (id: string): Promise<User | undefined> => {
    // MOCKED
     await new Promise(res => setTimeout(res, 100));
    return users.find(u => u.id === id);
  },
  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    // MOCKED
    await new Promise(res => setTimeout(res, 300));
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");
    users[userIndex] = { ...users[userIndex], ...data };
    return users[userIndex];
  },
  
  // File Upload
  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'File upload failed');
    }

    return response.json();
  },

  uploadFileFromUrl: async (url: string): Promise<{ url: string }> => {
    return apiFetch('/upload/url', {
        method: 'POST',
        body: JSON.stringify({ url }),
    });
  },

  // Orders - REAL IMPLEMENTATION
  createOrdersFromCart: async (cartItems: CartItem[], user: User, paymentMethod: 'ESCROW' | 'DIRECT', shippingMethod: 'NOVA_POSHTA' | 'UKRPOSHTA', shippingAddress: ShippingAddress, requestAuthentication: boolean, appliedPromos: any, shippingCosts: any, transactionHash?: string): Promise<{success: boolean}> => {
    // MOCKED
    await new Promise(res => setTimeout(res, 1000));
    console.log("Simulating order creation with transaction hash:", transactionHash);
    return { success: true };
  },
  getPurchasesByBuyerId: async (): Promise<Order[]> => {
    // MOCKED
    await new Promise(res => setTimeout(res, 300));
    return orders.filter(o => o.buyer.id === users[0].id); // Logged in user is users[0]
  },
  getSalesBySellerId: async (): Promise<Order[]> => {
    // MOCKED
    await new Promise(res => setTimeout(res, 300));
    return orders.filter(o => o.seller.id === users[0].id);
  },
  updateOrder: async (orderId: string, updates: Partial<Order>): Promise<Order> => {
    // MOCKED
    await new Promise(res => setTimeout(res, 300));
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");
    orders[orderIndex] = { ...orders[orderIndex], ...updates };
    return orders[orderIndex];
  },
  generateWaybill: async (orderId: string): Promise<Order> => {
    // MOCKED
    await new Promise(res => setTimeout(res, 800));
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");
    orders[orderIndex].status = 'SHIPPED';
    orders[orderIndex].trackingNumber = `59000${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    return orders[orderIndex];
  },

  // Scraping
  scrapeUrl: async (url: string): Promise<{ cleanText: string }> => {
    return apiFetch('/scrape', {
        method: 'POST',
        body: JSON.stringify({ url }),
    });
  },
  
  // Currency Conversion (Mock)
  convertCurrency: async (amount: number, fromCurrency: string): Promise<number> => {
    // This is a mock. A real service would call a currency API.
    await new Promise(res => setTimeout(res, 100)); // Simulate network latency
    const from = fromCurrency.toUpperCase();

    // Rough exchange rates
    const rates: Record<string, number> = {
        'UAH': 0.025, // 1 UAH = 0.025 USDT
        'ГРН': 0.025,
        'USD': 1.0,
        '$': 1.0,
        'EUR': 1.08, // 1 EUR = 1.08 USDT
        '€': 1.08,
    };

    const rate = rates[from];
    if (rate) {
      return amount * rate;
    }
    
    // If currency is unknown, return original amount
    return amount;
  },

  // --- MOCKED API METHODS (for remaining features) ---
  
  // This function now uses the real getProducts and filters on the client side.
  getProductsBySellerId: async function(sellerId: string): Promise<Product[]> {
    const allProducts = await this.getProducts({});
    return allProducts.filter(p => p.seller.id === sellerId);
  },
  
  // This is a mocked function, but it uses the real getProducts as its data source.
  getPromotedProducts: async function(): Promise<Product[]> {
    const allProducts = await this.getProducts({});
    return allProducts.filter(p => p.isPromoted);
  },
  getAuctions: async function(): Promise<Product[]> {
    const allProducts = await this.getProducts({});
    return allProducts.filter(p => p.isAuction);
  },
  placeBid: async (productId: string, amount: number, userId: string): Promise<Product> => {
      await new Promise(res => setTimeout(res, 500));
      const product = products.find(p => p.id === productId); // using mock data
      if (!product || !product.isAuction) throw new Error("Auction not found");
      product.currentBid = amount;
      if (!product.bidders?.includes(userId)) {
          product.bidders?.push(userId);
      }
      return product;
  },
  getProductsByIds: async function(ids: string[]): Promise<Product[]> {
    const allProducts = await this.getProducts({});
    return allProducts.filter(p => ids.includes(p.id));
  },

  getReviewsByUserId: async (userId: string): Promise<Review[]> => {
    // MOCKED: No reviews endpoint yet.
    await new Promise(res => setTimeout(res, 300));
    return reviews.filter(r => products.find(p => p.id === 'prod-1')?.seller.id === userId); // Mock
  },
  updateUserBalance: async (userId: string, newBalance: number): Promise<User> => {
    // MOCKED
    await new Promise(res => setTimeout(res, 300));
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");
    users[userIndex].balance = newBalance;
    return users[userIndex];
  },

  // Chat
  getChats: async (userId: string): Promise<Chat[]> => {
     await new Promise(res => setTimeout(res, 500));
     return chats; // simplified mock
  },
  getChatById: async (chatId: string, userId: string): Promise<Chat | null> => {
     await new Promise(res => setTimeout(res, 200));
     return chats.find(c => c.id === chatId) || null;
  },
  findOrCreateChat: async (userId1: string, userId2: string): Promise<Chat> => {
      await new Promise(res => setTimeout(res, 500));
      let chat = chats.find(c => (c.participant.id === userId2));
      if (chat) return chat;
      const participant = users.find(u => u.id === userId2);
      if (!participant) throw new Error("Participant not found");
      const newChat: Chat = {
          id: `chat-${Date.now()}`,
          participant,
          messages: [],
          lastMessage: { id: '', senderId: '', text: 'New chat created', timestamp: Date.now() },
      };
      chats.push(newChat);
      return newChat;
  },
  sendMessage: async (chatId: string, content: MessageContent, senderId: string): Promise<Message> => {
    await new Promise(res => setTimeout(res, 200));
    const chat = chats.find(c => c.id === chatId);
    if (!chat) throw new Error("Chat not found");
    const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId,
        timestamp: Date.now(),
        ...content,
    };
    chat.messages.push(newMessage);
    chat.lastMessage = newMessage;
    return newMessage;
  },
  
  // Notifications
  getNotificationsByUserId: async (userId: string): Promise<Notification[]> => {
    await new Promise(res => setTimeout(res, 500));
    return notifications.filter(n => n.userId === userId).sort((a,b) => b.timestamp - a.timestamp);
  },
  markAllNotificationsAsRead: async (userId: string): Promise<void> => {
      await new Promise(res => setTimeout(res, 200));
      notifications.forEach(n => {
          if (n.userId === userId) n.read = true;
      });
  },
  
  // Collections
  getCollectionsByUserId: async (userId: string): Promise<Collection[]> => {
      await new Promise(res => setTimeout(res, 400));
      return collections.filter(c => c.userId === userId);
  },
  createCollection: async (userId: string, name: string): Promise<Collection> => {
      await new Promise(res => setTimeout(res, 500));
      const newCollection: Collection = { id: `col-${Date.now()}`, userId, name, productIds: [] };
      collections.push(newCollection);
      return newCollection;
  },
  addProductToCollection: async (collectionId: string, productId: string): Promise<void> => {
      await new Promise(res => setTimeout(res, 200));
      const collection = collections.find(c => c.id === collectionId);
      if (collection && !collection.productIds.includes(productId)) {
          collection.productIds.push(productId);
      }
  },
  removeProductFromCollection: async (collectionId: string, productId: string): Promise<void> => {
      await new Promise(res => setTimeout(res, 200));
      const collection = collections.find(c => c.id === collectionId);
      if (collection) {
          collection.productIds = collection.productIds.filter(id => id !== productId);
      }
  },
  getCollectionById: async (id: string, userId: string): Promise<{ collection: Collection, products: Product[] } | null> => {
      await new Promise(res => setTimeout(res, 500));
      const collection = collections.find(c => c.id === id && c.userId === userId);
      if (!collection) return null;
      const collectionProducts = products.filter(p => collection.productIds.includes(p.id));
      return { collection, products: collectionProducts };
  },

  // Feed/Community
  getForYouFeed: async function(userId: string): Promise<Product[]> {
    const allProducts = await this.getProducts({});
    return allProducts.slice(0, 4); // simple mock
  },
  getFeedForUser: async (userId: string): Promise<{ items: FeedItem[], isDiscovery: boolean }> => {
    await new Promise(res => setTimeout(res, 700));
    const user = users.find(u => u.id === userId);
    if (!user || user.following.length === 0) {
        return { items: [], isDiscovery: true };
    }
    const items = workshopPosts
        .filter(p => user.following.includes(p.sellerId))
        .map(post => ({ post, seller: users.find(u => u.id === post.sellerId)! }));
    return { items, isDiscovery: false };
  },
  likeWorkshopPost: async (postId: string, userId: string): Promise<void> => {
    await new Promise(res => setTimeout(res, 200));
    const post = workshopPosts.find(p => p.id === postId);
    if (post) {
        const index = post.likedBy.indexOf(userId);
        if (index > -1) post.likedBy.splice(index, 1);
        else post.likedBy.push(userId);
    }
  },
  addCommentToWorkshopPost: async (postId: string, authorId: string, text: string): Promise<WorkshopComment> => {
      await new Promise(res => setTimeout(res, 500));
      const post = workshopPosts.find(p => p.id === postId);
      const author = users.find(u => u.id === authorId);
      if (!post || !author) throw new Error("Not found");
      const newComment: WorkshopComment = {
          id: `comment-${Date.now()}`,
          author,
          text,
          timestamp: Date.now(),
      };
      post.comments.push(newComment);
      return newComment;
  },
  createWorkshopPost: async (postData: { sellerId: string, text: string, imageUrl?: string }): Promise<WorkshopPost> => {
      await new Promise(res => setTimeout(res, 1000));
      const newPost: WorkshopPost = {
          id: `wp-${Date.now()}`,
          ...postData,
          timestamp: Date.now(),
          likedBy: [],
          comments: [],
      };
      workshopPosts.unshift(newPost);
      return newPost;
  },

  // Forum
  getForumThreads: async (): Promise<ForumThread[]> => {
      await new Promise(res => setTimeout(res, 600));
      return forumThreads.sort((a,b) => b.lastReplyAt - a.lastReplyAt);
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
      await new Promise(res => setTimeout(res, 800));
      const now = Date.now();
      const newThread: ForumThread = { id: `thread-${now}`, title, author, createdAt: now, replyCount: 0, lastReplyAt: now };
      const newPost: ForumPost = { id: `post-${now}`, threadId: newThread.id, author, content, createdAt: now };
      forumThreads.unshift(newThread);
      forumPosts.push(newPost);
      return newThread;
  },
  createForumPost: async (threadId: string, content: string, author: User): Promise<ForumPost> => {
      await new Promise(res => setTimeout(res, 500));
      const thread = forumThreads.find(t => t.id === threadId);
      if (!thread) throw new Error("Thread not found");
      const now = Date.now();
      const newPost: ForumPost = { id: `post-${now}`, threadId, author, content, createdAt: now };
      forumPosts.push(newPost);
      thread.replyCount++;
      thread.lastReplyAt = now;
      return newPost;
  },

  // Analytics & Seller Tools
  getSellerAnalytics: async (sellerId: string, period: '7d' | '30d' | 'all'): Promise<SellerAnalytics> => {
      await new Promise(res => setTimeout(res, 800));
      return { // mock data
          profileVisits: 1234, totalProductViews: 5678, totalSales: 98, conversionRate: 1.72,
          salesOverTime: [{date: '1', value: 5}, {date: '2', value: 8}, {date: '3', value: 3}],
          viewsOverTime: [{date: '1', value: 120}, {date: '2', value: 200}, {date: '3', value: 150}],
          topProducts: products.filter(p => p.seller.id === sellerId).slice(0,3).map(p => ({id: p.id, title: p.title, imageUrl: p.imageUrls[0], views: 500, sales: 20})),
          trafficSources: [{source: 'Direct', visits: 800}, {source: 'Social', visits: 300}, {source: 'Search', visits: 134}],
      };
  },
  getPromoCodesBySellerId: async (sellerId: string): Promise<PromoCode[]> => {
      await new Promise(res => setTimeout(res, 500));
      return promoCodes.filter(p => p.sellerId === sellerId);
  },
  createPromoCode: async (sellerId: string, data: Omit<PromoCode, 'id' | 'sellerId' | 'isActive' | 'uses'>): Promise<PromoCode> => {
      await new Promise(res => setTimeout(res, 500));
      if (promoCodes.some(p => p.code === data.code && p.sellerId === sellerId)) throw new Error("Такой код уже существует");
      const newCode: PromoCode = { 
          id: `promo-${Date.now()}`, 
          sellerId, 
          isActive: true,
          uses: 0,
          ...data
      };
      promoCodes.push(newCode);
      return newCode;
  },
  deletePromoCode: async (promoId: string, sellerId: string): Promise<void> => {
      await new Promise(res => setTimeout(res, 300));
      const index = promoCodes.findIndex(p => p.id === promoId && p.sellerId === sellerId);
      if (index > -1) {
          promoCodes.splice(index, 1);
      } else {
        throw new Error("Промокод не найден");
      }
  },
  getSellerDashboardData: async (sellerId: string): Promise<SellerDashboardData> => {
      await new Promise(res => setTimeout(res, 600));
      return {
          metrics: { revenueToday: 125.50, salesToday: 3, profileVisitsToday: 45 },
          actionableItems: [
              { id: 'a1', type: 'new_order', text: 'Новый заказ #12345', linkTo: 'sales' },
              { id: 'a2', type: 'new_message', text: 'Новое сообщение от Craft Enthusiast', linkTo: 'chat' },
          ],
          recentActivity: [
              { id: 'r1', type: 'wishlist_add', icon: '❤️', time: '5 минут назад', user: {id: 'buyer-1', name: 'Craft Enthusiast'}, product: {id: 'prod-1', name: 'Handmade Ceramic Mug'} }
          ]
      };
  },

  // Checkout & Orders (Mocks)
  validatePromoCode: async (code: string, sellerId: string, cartItems: CartItem[]): Promise<{ discountValue: number, discountType: 'PERCENTAGE' | 'FIXED_AMOUNT', codeId: string }> => {
      await new Promise(res => setTimeout(res, 500));
      const promo = promoCodes.find(p => p.code.toUpperCase() === code.toUpperCase() && p.sellerId === sellerId && p.isActive);
      if (!promo) throw new Error("Промокод недействителен или не найден.");
      return { discountValue: promo.discountValue, discountType: promo.discountType, codeId: promo.id };
  },
  reserveProductsForCheckout: async (cartItems: CartItem[]): Promise<{ success: boolean, failedItems: CartItem[] }> => {
    await new Promise(res => setTimeout(res, 700)); // Simulate network latency
    return { success: true, failedItems: [] }; // Mock success
  },
  calculateShippingCost: async (cartItems: CartItem[], shippingMethod: 'NOVA_POSHTA' | 'UKRPOSHTA'): Promise<{ cost: number }> => {
    await new Promise(res => setTimeout(res, 600)); // Simulate API call
    return { cost: 2.5 };
  },
  getTrackingHistory: async (orderId: string): Promise<TrackingEvent[] | null> => {
    await new Promise(res => setTimeout(res, 500));
    return [{ timestamp: Date.now(), status: 'Принято в отделении', location: 'Киев' }];
  },
  requestProductAuthentication: async (productId: string): Promise<Product> => {
    await new Promise(res => setTimeout(res, 1000));
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error("Product not found");
    product.authenticationStatus = 'PENDING';
    return product;
  },
  getAuthenticationOrders: async (userId: string): Promise<Order[]> => {
      await new Promise(res => setTimeout(res, 500));
      return orders.filter(o => o.authenticationRequested && (o.buyer.id === userId || o.seller.id === userId));
  },
  getDisputeById: async (orderId: string): Promise<Dispute | null> => {
      await new Promise(res => setTimeout(res, 500));
      return disputes.find(d => d.id === orderId) || null;
  },
  addMessageToDispute: async (orderId: string, message: Omit<DisputeMessage, 'id' | 'timestamp'>): Promise<DisputeMessage> => {
      await new Promise(res => setTimeout(res, 500));
      const newMsg: DisputeMessage = { ...message, id: `dm-${Date.now()}`, timestamp: Date.now() };
      return newMsg;
  },
  getLiveStreams: async(): Promise<LiveStream[]> => {
      await new Promise(res => setTimeout(res, 500));
      return liveStreams;
  },
  getLiveStreamById: async(streamId: string): Promise<LiveStream | null> => {
      await new Promise(res => setTimeout(res, 300));
      return liveStreams.find(s => s.id === streamId) || null;
  },
  createLiveStream: async (title: string, seller: User, featuredProductId: string, options: Partial<LiveStream>): Promise<LiveStream> => {
      await new Promise(res => setTimeout(res, 1000));
      const newStream: LiveStream = { id: `stream-${Date.now()}`, title, seller, status: 'LIVE', featuredProductId, ...options };
      liveStreams.unshift(newStream);
      return newStream;
  },
  sendPersonalOffer: async(sellerId: string, recipientId: string, productId: string, promoCodeId: string): Promise<void> => {
      await new Promise(res => setTimeout(res, 800));
  },
  getProposals: async (): Promise<Proposal[]> => {
    await new Promise(res => setTimeout(res, 700));
    return proposals;
  },
  getProposalById: async (id: string): Promise<Proposal | null> => {
    await new Promise(res => setTimeout(res, 400));
    return proposals.find(p => p.id === id) || null;
  },
  castVote: async (proposalId: string, userId: string, choice: VoteChoice): Promise<Proposal> => {
    await new Promise(res => setTimeout(res, 600));
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) throw new Error("Proposal not found");
    proposal.voters[userId] = choice;
    return proposal;
  },
};