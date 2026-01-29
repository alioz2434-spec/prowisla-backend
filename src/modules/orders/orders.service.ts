import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    private cartService: CartService,
    private productsService: ProductsService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const cart = await this.cartService.getOrCreateCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Sepet boş');
    }

    const orderNumber = this.generateOrderNumber();

    const order = this.ordersRepository.create({
      orderNumber,
      userId,
      ...createOrderDto,
      subtotal: cart.totalAmount,
      shippingCost: this.calculateShipping(cart.totalAmount),
      totalAmount: cart.totalAmount + this.calculateShipping(cart.totalAmount),
    });

    const savedOrder = await this.ordersRepository.save(order);

    for (const cartItem of cart.items) {
      const orderItem = this.orderItemsRepository.create({
        orderId: savedOrder.id,
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        productName: cartItem.product.name,
        variantName: cartItem.variant?.name,
        productImage: cartItem.product.mainImage,
        quantity: cartItem.quantity,
        price: cartItem.price,
        totalPrice: cartItem.totalPrice,
      });
      await this.orderItemsRepository.save(orderItem);
      await this.productsService.updateStock(cartItem.productId, cartItem.quantity);
    }

    await this.cartService.clearCart(userId);

    return this.findById(savedOrder.id);
  }

  async createGuestOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Sipariş için ürün gerekli');
    }

    const orderNumber = this.generateOrderNumber();

    // Calculate totals from provided items
    let subtotal = 0;
    const itemsWithDetails: Array<{
      productId: string;
      variantId?: string;
      productName: string;
      productImage?: string;
      quantity: number;
      price: number;
      totalPrice: number;
    }> = [];

    for (const item of createOrderDto.items) {
      const product = await this.productsService.findById(item.productId);
      if (!product) {
        throw new BadRequestException(`Ürün bulunamadı: ${item.productId}`);
      }

      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      itemsWithDetails.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: product.name,
        productImage: product.mainImage,
        quantity: item.quantity,
        price: item.price,
        totalPrice: itemTotal,
      });
    }

    const shippingCost = this.calculateShipping(subtotal);
    const codFee = createOrderDto.paymentMethod === 'cod' ? 9.90 : 0;
    const totalAmount = subtotal + shippingCost + codFee;

    // Remove items from DTO before spreading (items is for frontend only)
    const { items: _, ...orderData } = createOrderDto;

    const order = this.ordersRepository.create({
      orderNumber,
      ...orderData,
      subtotal,
      shippingCost,
      totalAmount,
    });

    const savedOrder = await this.ordersRepository.save(order);

    for (const itemData of itemsWithDetails) {
      const orderItem = this.orderItemsRepository.create({
        orderId: savedOrder.id,
        ...itemData,
      });
      await this.orderItemsRepository.save(orderItem);
      await this.productsService.updateStock(itemData.productId, itemData.quantity);
    }

    return this.findById(savedOrder.id);
  }

  async findAll(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });
    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { orderNumber },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }
    return order;
  }

  async updateByOrderNumber(orderNumber: string, data: Partial<Order>): Promise<Order> {
    const order = await this.findByOrderNumber(orderNumber);
    Object.assign(order, data);
    return this.ordersRepository.save(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findById(id);
    order.status = status;
    return this.ordersRepository.save(order);
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus, paymentId?: string): Promise<Order> {
    const order = await this.findById(id);
    order.paymentStatus = paymentStatus;
    if (paymentId) {
      order.paymentId = paymentId;
    }
    if (paymentStatus === PaymentStatus.PAID) {
      order.status = OrderStatus.CONFIRMED;
    }
    return this.ordersRepository.save(order);
  }

  async addTrackingInfo(id: string, trackingNumber: string, shippingCompany: string): Promise<Order> {
    const order = await this.findById(id);
    order.trackingNumber = trackingNumber;
    order.shippingCompany = shippingCompany;
    order.status = OrderStatus.SHIPPED;
    return this.ordersRepository.save(order);
  }

  async findAllAdmin(query: any = {}): Promise<{ orders: Order[]; total: number }> {
    const { page = 1, limit = 20, status } = query;

    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user');

    if (status) {
      queryBuilder.where('order.status = :status', { status });
    }

    const total = await queryBuilder.getCount();

    const orders = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { orders, total };
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PRW-${timestamp}-${random}`;
  }

  private calculateShipping(subtotal: number): number {
    return subtotal >= 500 ? 0 : 29.99;
  }
}
