import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from './entities/order-item.entity';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createOrderDto: CreateOrderDto, buyerId: string): Promise<{ success: boolean }> {
    const { cartItems, shippingAddress, shippingMethod, paymentMethod, transactionHash } = createOrderDto;

    const buyer = await this.userRepository.findOneBy({ id: buyerId });
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    // Group items by seller
    const itemsBySeller = new Map<string, typeof cartItems>();
    for (const item of cartItems) {
      const sellerId = item.product.seller.id;
      if (!itemsBySeller.has(sellerId)) {
        itemsBySeller.set(sellerId, []);
      }
      itemsBySeller.get(sellerId).push(item);
    }
    
    // Create an order for each seller
    for (const [sellerId, items] of itemsBySeller.entries()) {
      const seller = await this.userRepository.findOneBy({ id: sellerId });
      if (!seller) {
        throw new NotFoundException(`Seller with id ${sellerId} not found`);
      }

      const productIds = items.map(item => item.product.id);
      const products = await this.productRepository.findBy({ id: In(productIds) });
      const productMap = new Map(products.map(p => [p.id, p]));

      const newOrder = this.orderRepository.create({
        buyer,
        seller,
        shippingAddress,
        shippingMethod,
        paymentMethod,
        transactionHash, // Save the transaction hash
        orderDate: Date.now(),
        items: [],
        total: 0,
      });
      
      let total = 0;
      for (const item of items) {
        const product = productMap.get(item.product.id);
        if (!product) {
          throw new NotFoundException(`Product with id ${item.product.id} not found`);
        }
        
        const orderItem = this.orderItemRepository.create({
          product,
          quantity: item.quantity,
          price: item.priceAtTimeOfAddition,
          variant: item.variant,
          purchaseType: item.purchaseType,
          order: newOrder,
        });
        newOrder.items.push(orderItem);
        total += item.priceAtTimeOfAddition * item.quantity;
      }
      
      newOrder.total = total;
      await this.orderRepository.save(newOrder);
    }
    
    return { success: true };
  }

  findPurchases(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { buyer: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  findSales(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { seller: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderRepository.preload({
      id,
      ...updateOrderDto,
    });
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    return this.orderRepository.save(order);
  }

  async generateWaybill(id: string): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    order.status = 'SHIPPED';
    order.trackingNumber = `59000${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    return this.orderRepository.save(order);
  }
}
