// This service now acts as a hybrid: part real API client, part mock service.
// This allows for gradual backend integration without breaking the UI.
import type {
  User, Product, Review, Chat, Message, Order, Notification, Collection,
  WorkshopPost, WorkshopComment, ForumThread, ForumPost, SellerAnalytics, FeedItem,
  PromoCode, SellerDashboardData, CartItem, ShippingAddress, MessageContent, Dispute, DisputeMessage, LiveStream, OrderItem, TrackingEvent, Proposal, VoteChoice
} from '../types';


// --- REAL API IMPLEMENTATION ---

// This URL is now dynamic. It uses an environment variable for production
// and falls back to localhost for local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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
  { id: 'user-1', name: 'Pottery Master', avatarUrl: 'https://picsum.photos/seed/seller1/100/100', headerImageUrl: 'https://picsum.photos/seed/header1/1000/300', rating: 4.9, reviews: [], following: ['user-2', 'user-3'], balance: 1250.75, commissionOwed: 25.01, verificationLevel: 'PRO', affiliateId: 'POTTERYPRO' },
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

  // Products
  getProducts: async (filters: any): Promise<Product[]> => {
    // TODO: Backend filtering is not fully implemented yet for dynamic attributes etc.
    // Fetching all and filtering on client for now.
    const allProducts: Product[] = await apiFetch('/products');
    
    // Fetch real orders to determine sold products
    const realOrders: Order[] = await apiFetch('/orders/purchases');
    const soldProductIds = new Set(realOrders.flatMap(o => o.items.map(i => i.product.id)));
    
    let baseProducts: Product[];
    if (filters.specialFilter === 'sold') {
        baseProducts = allProducts.filter(p => soldProductIds.has(p.id));
    } else {
        baseProducts = allProducts.filter(p => !soldProductIds.has(p.id));
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
            case 'priceDesc': return priceB - a.price;
            case 'rating': return b.seller.rating - a.seller.rating;
            default: return 0; // Backend returns sorted by creation date
        }
    });
  },
  getProductById: async (id: string): Promise<Product | undefined> => {
    try {
        return await apiFetch(`/products/${id}`);
    } catch (e) {
        console.error(`Failed to fetch product ${id}`, e);
        return undefined; // Return undefined on 404 or other errors
    }
  },
  createListing: async (data: Partial<Product>, imageUrls: string[], videoUrl: string | undefined, seller: User): Promise<Product> => {
    const payload = {
        ...data,
        sellerId: seller.id,
        imageUrls: imageUrls,
        videoUrl: videoUrl,
    };
    return apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
  },
  updateListing: async (id: string, data: Partial<Product>): Promise<Product> => {
    return apiFetch(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    return apiFetch('/users');
  },
  getUserById: async (id: string): Promise<User | undefined> => {
    try {
        return await apiFetch(`/users/${id}`);
    } catch (e) {
        console.error(`Failed to fetch user ${id}`, e);
        return undefined;
    }
  },
  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    return apiFetch(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
  },
  
  // File Upload
  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // apiFetch is not used here because we are sending FormData, not JSON.
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

  // Orders - REAL IMPLEMENTATION
// FIX: Update function signature to accept all 8 arguments passed from CheckoutPage.tsx.
  createOrdersFromCart: async (cartItems: CartItem[], user: User, paymentMethod: 'ESCROW' | 'DIRECT', shippingMethod: 'NOVA_POSHTA' | 'UKRPOSHTA', shippingAddress: ShippingAddress, requestAuthentication: boolean, appliedPromos: any, shippingCosts: any) => {
    const payload = {
      cartItems: cartItems.map(item => ({
        product: {
          id: item.product.id,
          seller: { id: item.product.seller.id },
        },
        quantity: item.quantity,
        priceAtTimeOfAddition: item.priceAtTimeOfAddition,
        variant: item.variant,
        purchaseType: item.purchaseType,
      })),
      paymentMethod,
      shippingMethod,
      shippingAddress,
      requestAuthentication,
      appliedPromos,
      shippingCosts,
    };
    return apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getPurchasesByBuyerId: async (): Promise<Order[]> => {
    return apiFetch('/orders/purchases');
  },
  getSalesBySellerId: async (): Promise<Order[]> => {
    return apiFetch('/orders/sales');
  },
  updateOrder: async (orderId: string, updates: Partial<Order>): Promise<Order> => {
    return apiFetch(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  generateWaybill: async (orderId: string): Promise<Order> => {
    return apiFetch(`/orders/${orderId}/generate-waybill`, {
        method: 'POST'
    });
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
    // In a real scenario, the backend would have a flag for this. We'll mock it.
    return allProducts.slice(0, 2).map(p => ({ ...p, isPromoted: true }));
  },
  getAuctions: async function(): Promise<Product[]> {
    const allProducts = await this.getProducts({});
    // Mocking auctions
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
    // This now calls the real endpoint in a loop. Not efficient, but works for now.
    const productPromises = ids.map(id => this.getProductById(id));
    const resolvedProducts = await Promise.all(productPromises);
    return resolvedProducts.filter((p): p is Product => p !== undefined);
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
      const allOrders: Order[] = await apiFetch('/orders/purchases');
      return allOrders.filter(o => o.authenticationRequested && (o.buyer.id === userId || o.seller.id === userId));
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