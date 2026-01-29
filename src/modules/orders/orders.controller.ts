import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { OrderStatus } from './entities/order.entity';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni sipariş oluştur (üye veya misafir)' })
  create(@Req() req: Request, @Body() createOrderDto: CreateOrderDto) {
    const user = req.user as User | null;
    if (user) {
      // Authenticated user - use cart from database
      return this.ordersService.create(user.id, createOrderDto);
    } else {
      // Guest user - must provide items in request
      return this.ordersService.createGuestOrder(createOrderDto);
    }
  }

  @Post('authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni sipariş oluştur (üye)' })
  createAuthenticated(@CurrentUser() user: User, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Siparişlerimi getir' })
  findAll(@CurrentUser() user: User) {
    return this.ordersService.findAll(user.id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tüm siparişleri getir (Admin)' })
  findAllAdmin(@Query() query: any) {
    return this.ordersService.findAllAdmin(query);
  }

  @Get('number/:orderNumber')
  @Public()
  @ApiOperation({ summary: 'Sipariş numarası ile getir' })
  findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sipariş detayı getir' })
  findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Sipariş durumunu güncelle (Admin)' })
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateStatus(id, status);
  }

  @Put(':id/tracking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Kargo bilgisi ekle (Admin)' })
  addTrackingInfo(
    @Param('id') id: string,
    @Body('trackingNumber') trackingNumber: string,
    @Body('shippingCompany') shippingCompany: string,
  ) {
    return this.ordersService.addTrackingInfo(id, trackingNumber, shippingCompany);
  }
}
