import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private productsService: ProductsService,
  ) {}

  async getOrCreateCart(userId?: string, sessionId?: string): Promise<Cart> {
    let cart: Cart | null = null;

    if (userId) {
      cart = await this.cartRepository.findOne({
        where: { userId },
        relations: ['items', 'items.product', 'items.variant'],
      });
    } else if (sessionId) {
      cart = await this.cartRepository.findOne({
        where: { sessionId },
        relations: ['items', 'items.product', 'items.variant'],
      });
    }

    if (!cart) {
      cart = this.cartRepository.create({ userId, sessionId, items: [] });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  async addItem(addToCartDto: AddToCartDto, userId?: string, sessionId?: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const product = await this.productsService.findById(addToCartDto.productId);

    const price = product.salePrice || product.price;

    let existingItem = cart.items?.find(
      (item) =>
        item.productId === addToCartDto.productId &&
        item.variantId === addToCartDto.variantId,
    );

    if (existingItem) {
      existingItem.quantity += addToCartDto.quantity;
      existingItem.totalPrice = existingItem.quantity * Number(existingItem.price);
      await this.cartItemRepository.save(existingItem);
    } else {
      const newItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId: addToCartDto.productId,
        variantId: addToCartDto.variantId,
        quantity: addToCartDto.quantity,
        price: price,
        totalPrice: addToCartDto.quantity * Number(price),
      });
      await this.cartItemRepository.save(newItem);
    }

    return this.updateCartTotals(cart.id);
  }

  async updateItemQuantity(itemId: string, quantity: number, userId?: string, sessionId?: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const item = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Sepet öğesi bulunamadı');
    }

    if (quantity <= 0) {
      await this.cartItemRepository.remove(item);
    } else {
      item.quantity = quantity;
      item.totalPrice = quantity * Number(item.price);
      await this.cartItemRepository.save(item);
    }

    return this.updateCartTotals(cart.id);
  }

  async removeItem(itemId: string, userId?: string, sessionId?: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const item = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (item) {
      await this.cartItemRepository.remove(item);
    }

    return this.updateCartTotals(cart.id);
  }

  async clearCart(userId?: string, sessionId?: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId, sessionId);
    await this.cartItemRepository.delete({ cartId: cart.id });
    return this.updateCartTotals(cart.id);
  }

  async mergeGuestCart(sessionId: string, userId: string): Promise<Cart> {
    const guestCart = await this.cartRepository.findOne({
      where: { sessionId },
      relations: ['items'],
    });

    const userCart = await this.getOrCreateCart(userId);

    if (guestCart && guestCart.items?.length > 0) {
      for (const item of guestCart.items) {
        await this.addItem(
          { productId: item.productId, variantId: item.variantId, quantity: item.quantity },
          userId,
        );
      }
      await this.cartRepository.remove(guestCart);
    }

    return this.getOrCreateCart(userId);
  }

  private async updateCartTotals(cartId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items', 'items.product', 'items.variant'],
    });

    if (cart) {
      const totalAmount = cart.items?.reduce((sum, item) => sum + Number(item.totalPrice), 0) || 0;
      const itemCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      cart.totalAmount = totalAmount;
      cart.itemCount = itemCount;
      await this.cartRepository.save(cart);
    }

    return cart!;
  }
}
