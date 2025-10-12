// This file contains the core type definitions for the CryptoCraft application.

export interface User {
  id: string;
  telegramId?: number;
  name: string;
  avatarUrl: string;
  headerImageUrl?: string;
  rating: number;
  reviews: Review[];
  following: string[];
  balance: number;
  commissionOwed: number;
  affiliateId?: string;
  phoneNumber?: string;
  defaultShippingAddress?: ShippingAddress;
  businessInfo?: {
    registrationNumber: string;
  };
  tonWalletAddress?: string;
  paymentCard?: string;
  // FIX: Add verificationLevel to User interface to support Pro status features.
  verificationLevel?: 'NONE' | 'PRO';
  // FIX: Added 'role' property to User interface for admin panel compatibility.
  role?: 'USER' | 'MODERATOR' | 'SUPER_ADMIN';
  // FIX: Add email property to User interface for admin panel compatibility.
  email?: string;
}

export type AuthenticationStatus =
  | 'NONE'
  | 'PENDING'
  | 'AUTHENTICATED'
  | 'REJECTED';
  
export interface VariantAttribute {
  name: string;
  options: string[];
}

export interface ProductVariant {
  id: string;
  attributes: Record<string, string>;
  price: number;
  salePrice?: number;
  stock: number;
  sku?: string;
  imageUrl?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price?: number;
  salePrice?: number;
  imageUrls: string[];
  videoUrl?: string;
  category: string;
  seller: User;
  dynamicAttributes: Record<string, string | number>;
  isPromoted?: boolean;
  uniqueness?: 'ONE_OF_A_KIND' | 'LIMITED_EDITION' | 'MADE_TO_ORDER';
  giftWrapAvailable?: boolean;
  giftWrapPrice?: number;
  purchaseCost?: number;
  weight?: number; // grams
  productType?: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
  digitalFileUrl?: string;

  // B2B
  isB2BEnabled?: boolean;
  b2bMinQuantity?: number;
  b2bPrice?: number;

  // Auction
  isAuction?: boolean;
  auctionEnds?: number;
  startingBid?: number;
  currentBid?: number;
  bidders?: string[];
  winnerId?: string;
  finalPrice?: number;
  
  // Variants
  variants?: ProductVariant[];
  variantAttributes?: VariantAttribute[];

  // Electronics
  isAuthenticationAvailable?: boolean;
  authenticationStatus?: AuthenticationStatus;
  authenticationReportUrl?: string;
  nftTokenId?: string;
  nftContractAddress?: string;
  
  // Admin-related fields
  // FIX: Add status, rejectionReason, and createdAt to Product interface for admin panel compatibility.
  status?: 'Pending Moderation' | 'Active' | 'Rejected';
  rejectionReason?: string;
  createdAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  author: User;
  rating: number;
  text: string;
  timestamp: number;
  imageUrl?: string;
}

export interface MessageContent {
  text?: string;
  imageUrl?: string;
  productContext?: Product;
  quickReplies?: string[];
}

export interface Message extends MessageContent {
  id: string;
  sender: Partial<User>;
  timestamp: number;
  chat?: { id: string };
}

export interface Chat {
  id: string;
  participant: User;
  messages: Message[];
  lastMessage: Message;
}

export interface ShippingAddress {
  recipientName: string;
  phoneNumber: string;
  city: string;
  postOffice: string;
  // For Nova Poshta integration
  cityRef?: string;
  warehouseRef?: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  price: number; // price at time of order
  variant?: ProductVariant;
  purchaseType: 'RETAIL' | 'WHOLESALE';
}

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'SHIPPED'
  | 'SHIPPED_TO_EXPERT'
  | 'PENDING_AUTHENTICATION'
  | 'AUTHENTICATION_PASSED'
  | 'NFT_ISSUED'
  | 'AUTHENTICATION_FAILED'
  | 'DELIVERED'
  | 'DISPUTED'
  | 'COMPLETED'
  | 'CANCELLED';
  
export interface AuthenticationEvent {
  status: OrderStatus;
  timestamp: number;
  comment?: string;
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
  smartContractAddress?: string;
  transactionHash?: string;
  disputeId?: string;
  authenticationRequested?: boolean;
  authenticationEvents?: AuthenticationEvent[];
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

export interface FeedItem {
    post: WorkshopPost;
    seller: User;
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
    conversionRate: number;
    salesOverTime: TimeSeriesDataPoint[];
    viewsOverTime: TimeSeriesDataPoint[];
    topProducts: TopProduct[];
    trafficSources: { source: string; visits: number }[];
}

export interface PromoCode {
    id: string;
    sellerId: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    isActive: boolean;
    uses: number;
    maxUses?: number;
    minPurchaseAmount?: number;
    scope: 'ENTIRE_ORDER' | 'CATEGORY';
    applicableCategory?: string;
    validUntil?: number;
}

export interface SellerDashboardData {
    metrics: {
        revenueToday: number;
        salesToday: number;
        profileVisitsToday: number;
    };
    actionableItems: {
        id: string;
        type: 'new_order' | 'new_message' | 'low_stock' | 'dispute';
        text: string;
        linkTo: 'sales' | 'chat' | 'listings' | 'settings';
        entityId?: string;
    }[];
    recentActivity: {
        id: string;
        type: 'wishlist_add' | 'new_follower' | 'review_received';
        icon: string;
        time: string;
        text?: string;
        user?: { id: string, name: string };
        product?: { id: string, name: string };
    }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: ProductVariant;
  priceAtTimeOfAddition: number;
  purchaseType: 'RETAIL' | 'WHOLESALE';
}

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
    id: string; // Same as orderId
    order: Order;
    messages: DisputeMessage[];
    status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_BUYER' | 'RESOLVED_SELLER';
    // FIX: Add createdAt to match backend entity for admin panel compatibility.
    createdAt?: number;
}

export interface LiveStream {
    id: string;
    title: string;
    seller: User;
    status: 'UPCOMING' | 'LIVE' | 'ENDED';
    featuredProduct: Product;
    scheduledStartTime?: number;
    moderatorId?: string;
    isAiModeratorEnabled?: boolean;
    welcomeMessage?: string;
    likes?: number;
    viewerCount?: number;
    isPromoted?: boolean;
}

export interface TrackingEvent {
    timestamp: number;
    status: string;
    location: string;
}

export type ProposalStatus = 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED';
export type VoteChoice = 'FOR' | 'AGAINST';
export interface Proposal {
    id: string;
    title: string;
    description: string;
    proposer: User;
    createdAt: number;
    endsAt: number;
    status: ProposalStatus;
    votesFor: number;
    votesAgainst: number;
    voters: Record<string, VoteChoice>; // userId -> choice
}

// AI Service Types
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

export interface AiInsight {
    title: string;
    recommendation: string;
    type: 'OPTIMIZATION' | 'OPPORTUNITY' | 'WARNING';
}

export interface AiFocus {
    title: string;
    reason: string;
    ctaText: string;
    ctaLink: 'sales' | 'chat' | 'analytics' | 'settings';
}

// FIX: Add VerificationAnalysis type definition for use in AI services.
export interface VerificationAnalysis {
    isDocument: boolean;
    fullName?: string;
}

export interface ImportItem {
    id: string;
    url: string;
    status: 'pending' | 'scraping' | 'parsing' | 'enriching' | 'success' | 'publishing' | 'published' | 'error' | 'publish_error';
    listing?: ImportedListingData;
    errorMessage?: string;
}

export type ImportedListingData = GeneratedListing & {
  imageUrls: string[];
  originalPrice: number;
  originalCurrency: string;
  saleType: 'FIXED_PRICE' | 'AUCTION';
  giftWrapAvailable: boolean;
};

export interface Icon {
    id: string;
    name: string;
    svgContent: string;
    width?: number;
    height?: number;
}

// --- Nova Poshta Types ---
export interface NovaPoshtaCity {
    Description: string;
    Ref: string;
}
export interface NovaPoshtaWarehouse {
    Description: string;
    Ref: string;
}