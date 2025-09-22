// This file contains shared complex types used across different modules,
// especially for DTOs that receive complex objects from the frontend.

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

export interface GeneratedListing {
    title: string;
    description: string;
    price: number;
    category: string;
    dynamicAttributes: Record<string, string | number>;
}

export type ImportedListingData = GeneratedListing & {
  imageUrls: string[];
  originalPrice: number;
  originalCurrency: string;
  saleType: 'FIXED_PRICE' | 'AUCTION';
  giftWrapAvailable: boolean;
};
