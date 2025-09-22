import { Controller, Post, Body, UseGuards, Req, Get, Patch, Param, ParseUUIDPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    const userId = req.user.userId;
    return this.ordersService.create(createOrderDto, userId);
  }

  @Get('purchases')
  findPurchases(@Req() req) {
    const userId = req.user.userId;
    return this.ordersService.findPurchases(userId);
  }

  @Get('sales')
  findSales(@Req() req) {
    const userId = req.user.userId;
    return this.ordersService.findSales(userId);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }
  
  @Post(':id/generate-waybill')
  generateWaybill(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.generateWaybill(id);
  }
}
