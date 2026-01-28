import { Controller, Get, Post, Put, Delete, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Sepeti getir' })
  getCart(@CurrentUser() user: User, @Headers('x-session-id') sessionId: string) {
    return this.cartService.getOrCreateCart(user?.id, sessionId);
  }

  @Public()
  @Post('items')
  @ApiOperation({ summary: 'Sepete ürün ekle' })
  addItem(
    @Body() addToCartDto: AddToCartDto,
    @CurrentUser() user: User,
    @Headers('x-session-id') sessionId: string,
  ) {
    return this.cartService.addItem(addToCartDto, user?.id, sessionId);
  }

  @Public()
  @Put('items/:itemId')
  @ApiOperation({ summary: 'Sepet öğesi miktarını güncelle' })
  updateItemQuantity(
    @Param('itemId') itemId: string,
    @Body('quantity') quantity: number,
    @CurrentUser() user: User,
    @Headers('x-session-id') sessionId: string,
  ) {
    return this.cartService.updateItemQuantity(itemId, quantity, user?.id, sessionId);
  }

  @Public()
  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Sepetten ürün çıkar' })
  removeItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
    @Headers('x-session-id') sessionId: string,
  ) {
    return this.cartService.removeItem(itemId, user?.id, sessionId);
  }

  @Public()
  @Delete()
  @ApiOperation({ summary: 'Sepeti temizle' })
  clearCart(@CurrentUser() user: User, @Headers('x-session-id') sessionId: string) {
    return this.cartService.clearCart(user?.id, sessionId);
  }

  @Post('merge')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Misafir sepetini kullanıcı sepetine birleştir' })
  mergeCart(@CurrentUser() user: User, @Headers('x-session-id') sessionId: string) {
    return this.cartService.mergeGuestCart(sessionId, user.id);
  }
}
