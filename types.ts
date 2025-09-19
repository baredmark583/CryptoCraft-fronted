// Add type definitions for import.meta.env to resolve TypeScript error.
// This is a standard way to handle Vite environment variables.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_API_BASE_URL?: string;
      // FIX: Add VITE_GEMINI_API_KEY to the environment type definitions.
      readonly VITE_GEMINI_API_KEY?: string;
    };
  }
}


export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  headerImageUrl?: string;
  rating: number;
  reviews: Review[];
  verificationLevel?: 'NONE' | 'PRO';
  businessInfo?: {
    registrationNumber: string;
  };
  following: string[];
  balance: number;
  commissionOwed: number;
  affiliateId?: string;
  defaultShippingAddress?: ShippingAddress;
  phoneNumber?: string;
}

export interface VariantAttribute {
    name: string; // e.g. "Цвет"
    options: string[]; // e.g. ["Красный", "Синий"]
}

export interface ProductVariant {
    id: string;
    attributes: Record<string, string>; // e.g. { "Цвет": "Красный", "Размер": "M" }
    price: number;
    salePrice?: number;
    stock: number; // Quantity available
    sku?: string; // Stock Keeping Unit
    imageUrl?: string; // Optional: specific image for this variant
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price?: number; // Optional: Will represent the base or default variant price if no variants are active
  salePrice?: number;
  imageUrls: string[];
  videoUrl?: string; // New field for video review
  category: string;
  seller: User;
  dynamicAttributes: Record<string, string | number>;
  
  // New Variant System
  variants?: ProductVariant[];
  variantAttributes?: VariantAttribute[]; // Defines what kind of variants are available e.g. [{name: "Цвет", options: ["Красный"]}]

  isPromoted?: boolean;
  uniqueness?: 'ONE_OF_A_KIND' | 'LIMITED_EDITION' | 'MADE_TO_ORDER';
  productType?: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
  digitalFileUrl?: string;
  giftWrapAvailable?: boolean;
  giftWrapPrice?: number;
  purchaseCost?: number; // for seller analytics
  weight?: number; // in grams

  // B2B (Wholesale) fields
  isB2BEnabled?: boolean;
  b2bMinQuantity?: number;
  b2bPrice?: number;

  // Service specific
  turnaroundTime?: string; // e.g., "3-5 business days"
  serviceLocation?: 'REMOTE' | 'ON-SITE';

  // Electronics specific
  warrantyDays?: number;
  serialNumber?: string;

  // Auction specific
  isAuction?: boolean;
  auctionEnds?: number; // timestamp
  startingBid?: number;
  currentBid?: number;
  bidders?: string[]; // user ids
  winnerId?: string;
  finalPrice?: number;

  // Authentication fields
  isAuthenticationAvailable?: boolean;
  authenticationStatus?: 'NONE' | 'PENDING' | 'AUTHENTICATED' | 'REJECTED';
  authenticationReportUrl?: string;
  nftTokenId?: string;
  nftContractAddress?: string;
}

export interface Review {
  id: string;
  author: User;
  rating: number;
  text: string;
  timestamp: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: ProductVariant;
  priceAtTimeOfAddition: number;
  purchaseType: 'RETAIL' | 'WHOLESALE';
}

export interface ShippingAddress {
    city: string;
    postOffice: string;
    recipientName: string;
    phoneNumber: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
  variant?: ProductVariant;
  purchaseType: 'RETAIL' | 'WHOLESALE';
}

export type OrderStatus = 
  'PENDING' | 
  'PAID' | 
  'SHIPPED' | 
  'DELIVERED' | 
  'DISPUTED' | 
  'COMPLETED' | 
  'CANCELLED' |
  // New statuses for expert authentication flow
  'SHIPPED_TO_EXPERT' |
  'PENDING_AUTHENTICATION' |
  'AUTHENTICATION_PASSED' |
  'AUTHENTICATION_FAILED' |
  'NFT_ISSUED';


export interface AuthenticationEvent {
  status: OrderStatus;
  timestamp: number;
  comment?: string;
}

export interface TrackingEvent {
  timestamp: number;
  status: string;
  location: string;
}

export interface Order {
  id: string;
  buyer: User;
  seller: User;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  orderDate: number;
  shippingAddress: ShippingAddress;
  shippingMethod: 'NOVA_POSHTA' | 'UKRPOSHTA';
  paymentMethod: 'ESCROW' | 'DIRECT';
  trackingNumber?: string;
  shippingProvider?: string;
  shippingCost?: number;
  trackingHistory?: TrackingEvent[];
  // New field for authentication
  authenticationRequested?: boolean;
  authenticationEvents?: AuthenticationEvent[];
  // New fields for promo codes
  promoCode?: string;
  discountAmount?: number;
  // New field for disputes
  disputeId?: string;
  // New fields for smart contract escrow
  smartContractAddress?: string;
  transactionHash?: string;
}

export interface GeneratedListing {
  title: string;
  description: string;
  price: number;
  category: string;
  dynamicAttributes: Record<string, string | number>;
}

export interface StructuredSearchQuery {
    keywords: string[];
    category: string;
}

export interface Message {
  id: string;
  senderId: string;
  timestamp: number;
  text?: string;
  imageUrl?: string;
  productContext?: Product;
  quickReplies?: string[];
  // For Live Chat simulation
  senderName?: string; 
  senderAvatar?: string;
}

export type MessageContent = Omit<Message, 'id' | 'senderId' | 'timestamp'>;


export interface Chat {
  id: string;
  participant: User;
  messages: Message[];
  lastMessage: Message;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'new_message' | 'sale' | 'new_review' | 'outbid' | 'auction_won' | 'auction_ended_seller' | 'new_dispute_seller' | 'new_listing_from_followed' | 'personal_offer';
  text: string;
  link: string;
  timestamp: number;
  read: boolean;
}

export interface Collection {
    id: string;
    userId: string;
    name: string;
    productIds: string[];
}

export interface FeedItem {
    post: WorkshopPost;
    seller: User;
}

export interface WorkshopComment {
    id: string;
    author: User;
    text: string;
    timestamp: number;
}

export interface WorkshopPost {
    id: string;
    sellerId: string;
    text: string;
    imageUrl?: string;
    timestamp: number;
    likedBy: string[];
    comments: WorkshopComment[];
}

export interface ForumPost {
    id: string;
    threadId: string;
    author: User;
    content: string;
    createdAt: number;
}

export interface ForumThread {
    id: string;
    title: string;
    author: User;
    createdAt: number;
    replyCount: number;
    lastReplyAt: number;
    isPinned?: boolean;
}

export interface TimeSeriesDataPoint {
    date: string;
    value: number;
}

export interface TopProduct {
    id: string;
    title: string;
    imageUrl: string;
    views: number;
    sales: number;
}

export interface SellerAnalytics {
    profileVisits: number;
    totalProductViews: number;
    totalSales: number;
    conversionRate: number; // percentage
    salesOverTime: TimeSeriesDataPoint[];
    viewsOverTime: TimeSeriesDataPoint[];
    topProducts: TopProduct[];
    trafficSources: { source: string; visits: number }[];
}

export interface AiInsight {
  title: string;
  recommendation: string;
  type: 'OPTIMIZATION' | 'OPPORTUNITY' | 'WARNING';
}


export interface PromoCode {
  id: string;
  code: string;
  sellerId: string;
  isActive: boolean;
  // Discount Type & Value
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number; // e.g., 10 for 10% or 10 for 10 USDT
  // Scope
  scope: 'ENTIRE_ORDER' | 'CATEGORY' | 'SPECIFIC_PRODUCTS';
  applicableCategory?: string; // Category name
  applicableProductIds?: string[]; // Array of product IDs
  // Conditions
  minPurchaseAmount?: number; // Minimum cart subtotal to apply
  // Limits & Validity
  validFrom?: number; // timestamp
  validUntil?: number; // timestamp
  maxUses?: number; // Total number of uses for this code
  uses?: number; // How many times it has been used
}

// New types for Seller Dashboard
export interface DashboardMetrics {
    revenueToday: number;
    salesToday: number;
    profileVisitsToday: number;
}

export interface DashboardActionableItem {
    id: string;
    type: 'new_order' | 'new_message' | 'low_stock' | 'dispute';
    text: string;
    linkTo: 'sales' | 'chat' | 'listings';
    entityId?: string; // orderId, chatId, productId
}

export interface DashboardActivity {
    id: string;
    type: 'new_review' | 'wishlist_add' | 'sale';
    icon: string;
    time: string;
    text?: string;
    user?: { id: string, name: string };
    product?: { id: string, name: string };
}

export interface SellerDashboardData {
    metrics: DashboardMetrics;
    actionableItems: DashboardActionableItem[];
    recentActivity: DashboardActivity[];
}

// New types for Dispute Center
export interface DisputeMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: number;
  text?: string;
  imageUrl?: string;
}

export interface Dispute {
  id: string; // Will be the same as orderId for simplicity
  order: Order;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_BUYER' | 'RESOLVED_SELLER';
  messages: DisputeMessage[];
  resolution?: string;
}

// New type for Live Commerce
export interface LiveStream {
  id: string;
  title: string;
  seller: User;
  status: 'LIVE' | 'UPCOMING' | 'ENDED';
  featuredProductId: string;
  moderatorId?: string;
  isAiModeratorEnabled?: boolean;
  scheduledStartTime?: number;
  welcomeMessage?: string;
}

// New types for DAO Governance
export type ProposalStatus = 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED';
export type VoteChoice = 'FOR' | 'AGAINST';

export interface Proposal {
    id: string;
    title: string;
    description: string;
    proposer: User;
    status: ProposalStatus;
    createdAt: number;
    endsAt: number;
    votesFor: number;
    votesAgainst: number;
    voters: Record<string, VoteChoice>; // Tracks who voted and what their choice was
}

export interface AiFocus {
    title: string;
    reason: string;
    ctaText: string;
    ctaLink: 'sales' | 'chat' | 'analytics' | 'settings';
    ctaEntityId?: string; // Optional: for linking to a specific chat or order
}

// New type for AI Import feature
export interface ImportItem {
  id: string;
  url: string;
  status: 'pending' | 'scraping' | 'parsing' | 'enriching' | 'success' | 'error' | 'publishing' | 'published' | 'publish_error';
  errorMessage?: string;
  // FIX: Update the `listing` type to correctly match the expected structure of an editable imported listing. This resolves TypeScript errors in `ImportPage.tsx`.
  listing?: (Omit<GeneratedListing, 'price'> & { price?: number }) & {
    imageUrls: string[];
    originalPrice: number;
    originalCurrency: string;
    saleType: 'FIXED_PRICE' | 'AUCTION';
    giftWrapAvailable: boolean;
  };
}