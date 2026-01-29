import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface ShopierBuyer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ShopierAddress {
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface ShopierOrder {
  orderNumber: string;
  amount: number;
  currency?: 'TRY' | 'USD' | 'EUR';
}

export interface ShopierProduct {
  name: string;
  type?: 0 | 1 | 2; // 0: Real, 1: Virtual/Downloadable, 2: Default
}

export interface ShopierPaymentData {
  buyer: ShopierBuyer;
  billingAddress: ShopierAddress;
  shippingAddress: ShopierAddress;
  order: ShopierOrder;
  product: ShopierProduct;
}

@Injectable()
export class ShopierService {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly callbackUrl: string;
  private readonly websiteIndex: number = 1;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SHOPIER_API_KEY') || '';
    this.apiSecret = this.configService.get<string>('SHOPIER_API_SECRET') || '';
    this.callbackUrl = this.configService.get<string>('SHOPIER_CALLBACK_URL') ||
      'https://prowisla.vercel.app/api/payments/shopier/callback';
  }

  generatePaymentForm(data: ShopierPaymentData): {
    formHtml: string;
    paymentUrl: string;
    formData: Record<string, string>;
  } {
    const currency = this.getCurrencyCode(data.order.currency || 'TRY');
    const productType = data.product.type ?? 2;
    const lang = 'tr';

    // Prepare form data
    const formData: Record<string, string> = {
      'API_key': this.apiKey,
      'website_index': this.websiteIndex.toString(),
      'platform_order_id': data.order.orderNumber,
      'product_name': data.product.name,
      'product_type': productType.toString(),
      'buyer_name': data.buyer.firstName,
      'buyer_surname': data.buyer.lastName,
      'buyer_email': data.buyer.email,
      'buyer_phone': data.buyer.phone,
      'buyer_id_nr': data.buyer.id,
      'billing_address': data.billingAddress.address,
      'billing_city': data.billingAddress.city,
      'billing_country': data.billingAddress.country,
      'billing_postcode': data.billingAddress.postalCode,
      'shipping_address': data.shippingAddress.address,
      'shipping_city': data.shippingAddress.city,
      'shipping_country': data.shippingAddress.country,
      'shipping_postcode': data.shippingAddress.postalCode,
      'total_order_value': data.order.amount.toFixed(2),
      'currency': currency.toString(),
      'platform': '0',
      'is_in_frame': '0',
      'current_language': lang,
      'modul_version': '1.0.0',
      'random_nr': this.generateRandomNumber(),
    };

    // Generate signature
    const signatureData = [
      formData['random_nr'],
      formData['platform_order_id'],
      formData['total_order_value'],
      formData['currency'],
    ].join('');

    formData['signature'] = this.generateSignature(signatureData);
    formData['callback'] = Buffer.from(this.callbackUrl).toString('base64');

    // Generate form HTML
    const paymentUrl = 'https://www.shopier.com/ShowProduct/api_pay4.php';

    let formHtml = `<form id="shopier-form" method="POST" action="${paymentUrl}">`;
    for (const [key, value] of Object.entries(formData)) {
      formHtml += `<input type="hidden" name="${key}" value="${this.escapeHtml(value)}" />`;
    }
    formHtml += `<button type="submit" class="btn-shopier">Shopier ile Öde</button></form>`;

    return {
      formHtml,
      paymentUrl,
      formData,
    };
  }

  verifyCallback(responseData: Record<string, any>): {
    isValid: boolean;
    orderNumber?: string;
    status?: string;
    installment?: number;
    paymentId?: string;
  } {
    try {
      const {
        platform_order_id,
        status,
        installment,
        payment_id,
        random_nr,
        signature,
      } = responseData;

      // Verify signature
      const signatureData = [
        random_nr,
        platform_order_id,
        status,
        payment_id,
      ].join('');

      const expectedSignature = this.generateSignature(signatureData);
      const isValid = signature === expectedSignature;

      return {
        isValid,
        orderNumber: platform_order_id,
        status: status === 'success' ? 'paid' : 'failed',
        installment: parseInt(installment) || 1,
        paymentId: payment_id,
      };
    } catch (error) {
      console.error('Shopier callback verification error:', error);
      return { isValid: false };
    }
  }

  private generateSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(data)
      .digest('base64');
  }

  private generateRandomNumber(): string {
    return Math.floor(Math.random() * 1000000000).toString();
  }

  private getCurrencyCode(currency: string): number {
    const currencies: Record<string, number> = {
      'TRY': 0,
      'TL': 0,
      'USD': 1,
      'EUR': 2,
    };
    return currencies[currency] ?? 0;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
