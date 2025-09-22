import { IsObject } from 'class-validator';
import { SellerDashboardData } from '../../types';

export class DashboardFocusDto {
  @IsObject()
  dashboardData: SellerDashboardData;
}