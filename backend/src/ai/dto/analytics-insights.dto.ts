import { IsObject } from 'class-validator';
import { SellerAnalytics } from '../../types';

export class AnalyticsInsightsDto {
  @IsObject()
  analyticsData: SellerAnalytics;
}