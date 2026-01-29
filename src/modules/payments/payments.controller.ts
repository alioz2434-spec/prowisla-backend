import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ShopierService, ShopierPaymentData } from './shopier.service';
import { OrdersService } from '../orders/orders.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly shopierService: ShopierService,
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {}

  @Post('shopier/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Shopier payment form' })
  async createShopierPayment(
    @Body() body: { orderId: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const order = await this.ordersService.findById(body.orderId);

    if (!order) {
      return { success: false, message: 'Sipariş bulunamadı' };
    }

    // Check if order belongs to user or is a guest order
    if (order.userId && order.userId !== user?.id) {
      return { success: false, message: 'Bu siparişe erişim yetkiniz yok' };
    }

    const paymentData: ShopierPaymentData = {
      buyer: {
        id: user?.id || order.id,
        firstName: order.shippingFirstName,
        lastName: order.shippingLastName,
        email: order.shippingEmail || user?.email || 'guest@prowisla.com',
        phone: order.shippingPhone,
      },
      billingAddress: {
        address: order.shippingAddress,
        city: order.shippingCity,
        country: 'Türkiye',
        postalCode: order.shippingPostalCode || '00000',
      },
      shippingAddress: {
        address: order.shippingAddress,
        city: order.shippingCity,
        country: 'Türkiye',
        postalCode: order.shippingPostalCode || '00000',
      },
      order: {
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        currency: 'TRY',
      },
      product: {
        name: `Prowisla Sipariş #${order.orderNumber}`,
        type: 0, // Real product
      },
    };

    const result = this.shopierService.generatePaymentForm(paymentData);

    return {
      success: true,
      formHtml: result.formHtml,
      paymentUrl: result.paymentUrl,
      formData: result.formData,
    };
  }

  @Public()
  @Post('shopier/callback')
  @ApiOperation({ summary: 'Shopier payment callback' })
  async shopierCallback(
    @Body() body: Record<string, any>,
    @Res() res: Response,
  ) {
    console.log('Shopier callback received:', body);

    const verification = this.shopierService.verifyCallback(body);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://prowisla.com';

    if (!verification.isValid) {
      console.error('Invalid Shopier callback signature');
      return res.redirect(`${frontendUrl}/odeme/basarisiz?reason=invalid_signature`);
    }

    try {
      // Update order status
      if (verification.status === 'paid' && verification.orderNumber) {
        await this.ordersService.updateByOrderNumber(verification.orderNumber, {
          paymentStatus: 'paid',
          status: 'confirmed',
        });

        return res.redirect(
          `${frontendUrl}/odeme/basarili?order=${verification.orderNumber}&payment=${verification.paymentId}`
        );
      } else {
        return res.redirect(
          `${frontendUrl}/odeme/basarisiz?order=${verification.orderNumber}&reason=payment_failed`
        );
      }
    } catch (error) {
      console.error('Error processing Shopier callback:', error);
      return res.redirect(`${frontendUrl}/odeme/basarisiz?reason=processing_error`);
    }
  }

  @Public()
  @Get('shopier/callback')
  @ApiOperation({ summary: 'Shopier payment callback (GET)' })
  async shopierCallbackGet(
    @Query() query: Record<string, any>,
    @Res() res: Response,
  ) {
    // Some payment gateways send callbacks via GET
    return this.shopierCallback(query, res);
  }

  @Public()
  @Get('methods')
  @ApiOperation({ summary: 'Get available payment methods' })
  getPaymentMethods() {
    const shopierEnabled = !!this.configService.get<string>('SHOPIER_API_KEY');

    return {
      methods: [
        {
          id: 'shopier',
          name: 'Kredi/Banka Kartı (Shopier)',
          description: 'Güvenli ödeme ile kredi veya banka kartınızla ödeyin',
          icon: 'credit-card',
          enabled: shopierEnabled,
        },
        {
          id: 'bank_transfer',
          name: 'Havale/EFT',
          description: 'Banka havalesi ile ödeme yapın',
          icon: 'bank',
          enabled: true,
        },
        {
          id: 'cash_on_delivery',
          name: 'Kapıda Ödeme',
          description: 'Teslimat sırasında nakit veya kart ile ödeyin',
          icon: 'truck',
          enabled: true,
        },
      ],
    };
  }
}
