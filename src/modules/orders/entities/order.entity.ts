import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'text', default: 'pending' })
  status: string;

  @Column({ type: 'text', default: 'pending' })
  paymentStatus: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentId: string;

  @Column()
  shippingFirstName: string;

  @Column()
  shippingLastName: string;

  @Column()
  shippingAddress: string;

  @Column()
  shippingCity: string;

  @Column()
  shippingDistrict: string;

  @Column({ nullable: true })
  shippingPostalCode: string;

  @Column()
  shippingPhone: string;

  @Column({ nullable: true })
  shippingEmail: string;

  @Column({ nullable: true })
  billingFirstName: string;

  @Column({ nullable: true })
  billingLastName: string;

  @Column({ nullable: true })
  billingAddress: string;

  @Column({ nullable: true })
  billingCity: string;

  @Column({ nullable: true })
  billingDistrict: string;

  @Column({ nullable: true })
  billingPostalCode: string;

  @Column({ nullable: true })
  billingPhone: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ nullable: true })
  shippingCompany: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
