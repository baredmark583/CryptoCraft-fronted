import { apiService } from './apiService';
// FIX: Import VerificationAnalysis from types.ts.
import type { GeneratedListing, StructuredSearchQuery, SellerAnalytics, AiInsight, PromoCode, SellerDashboardData, AiFocus, Product, ImportedListingData, VerificationAnalysis } from '../types';

// This service now acts as a secure proxy to our backend's AI capabilities.
// All logic is handled server-side to protect the API key.
export const geminiService = {
  generateListingDetails: async (imageBase64: string, userDescription: string): Promise<GeneratedListing> => {
    try {
      return await apiService.generateListingWithAi(imageBase64, userDescription);
    } catch (error) {
      console.error("Error calling backend for listing generation:", error);
      throw new Error("Не удалось сгенерировать описание через бэкенд.");
    }
  },
  
  processImportedHtml: async (cleanHtml: string): Promise<ImportedListingData> => {
    try {
      return await apiService.processHtmlWithAi(cleanHtml);
    } catch (error) {
      console.error("Error calling backend for HTML processing:", error);
      throw new Error("Не удалось обработать HTML через бэкенд.");
    }
  },

  editImage: async (imageBase64: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const response = await apiService.editImageWithAi(imageBase64, mimeType, prompt);
        return response.base64Image;
    } catch (error: any) {
        console.error("Error calling backend for image editing:", error);
         if (error.message?.includes('RATE_LIMIT')) {
            // Re-throw specific error types for the UI to handle
            throw error;
        }
        throw new Error("Не удалось отредактировать изображение через бэкенд.");
    }
  },

  generateSearchQuery: async (userQuery: string): Promise<StructuredSearchQuery> => {
    // This can remain on the frontend for now as it doesn't expose sensitive data,
    // but for consistency, it could be moved to the backend as well.
    // For now, we use a simple mock as the direct Gemini call is removed.
    console.log("Using mock search response as direct Gemini call is deprecated.");
    const keywords = userQuery.toLowerCase().split(' ').filter(word => word.length > 2);
    return new Promise(resolve => setTimeout(() => resolve({
        keywords,
        category: 'Все',
    }), 500));
  },

  analyzeDocumentForVerification: async (imageBase64: string): Promise<VerificationAnalysis> => {
    try {
        return await apiService.analyzeDocumentForVerificationWithAi(imageBase64);
    } catch (error) {
        console.error("Error calling backend for document analysis:", error);
        throw new Error("Не удалось проанализировать документ через бэкенд.");
    }
  },

  getAnalyticsInsights: async (analyticsData: SellerAnalytics): Promise<AiInsight[]> => {
    try {
        return await apiService.getAnalyticsInsightsWithAi(analyticsData);
    } catch (error) {
        console.error("Error calling backend for analytics insights:", error);
        throw new Error("Не удалось получить AI-советы через бэкенд.");
    }
  },

  generatePromoCampaign: async (prompt: string): Promise<Partial<PromoCode>> => {
    // This would also be a call to a backend endpoint.
    console.log("Mocking backend promo campaign generation for prompt:", prompt);
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
    try {
        return await apiService.generateDashboardFocusWithAi(dashboardData);
    } catch (error) {
        console.error("Error calling backend for dashboard focus:", error);
        throw new Error("Не удалось получить фокус дня от AI через бэкенд.");
    }
  }
};