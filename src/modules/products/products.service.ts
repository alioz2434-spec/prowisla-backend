import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { CreateProductDto } from './dto/create-product.dto';

export interface ProductQuery {
  categoryId?: string;
  featured?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private productImagesRepository: Repository<ProductImage>,
    @InjectRepository(ProductVariant)
    private productVariantsRepository: Repository<ProductVariant>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  async findAll(query: ProductQuery = {}): Promise<{ products: Product[]; total: number }> {
    const {
      categoryId,
      featured,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.isActive = :isActive', { isActive: true });

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (featured !== undefined) {
      queryBuilder.andWhere('product.featured = :featured', { featured });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('COALESCE(product.salePrice, product.price) >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('COALESCE(product.salePrice, product.price) <= :maxPrice', { maxPrice });
    }

    const total = await queryBuilder.getCount();

    queryBuilder
      .orderBy(`product.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const products = await queryBuilder.getMany();

    return { products, total };
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { slug, isActive: true },
      relations: ['category', 'images', 'variants'],
    });
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }
    await this.productsRepository.increment({ id: product.id }, 'viewCount', 1);
    return product;
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'images', 'variants'],
    });
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }
    return product;
  }

  async findFeatured(limit: number = 8): Promise<Product[]> {
    return this.productsRepository.find({
      where: { featured: true, isActive: true },
      relations: ['images'],
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findRelated(productId: string, limit: number = 4): Promise<Product[]> {
    const product = await this.findById(productId);
    return this.productsRepository.find({
      where: { categoryId: product.categoryId, isActive: true },
      relations: ['images'],
      take: limit + 1,
    }).then(products => products.filter(p => p.id !== productId).slice(0, limit));
  }

  async update(id: string, updateData: Partial<CreateProductDto>): Promise<Product> {
    const product = await this.findById(id);
    Object.assign(product, updateData);
    return this.productsRepository.save(product);
  }

  async delete(id: string): Promise<void> {
    const product = await this.findById(id);
    await this.productsRepository.remove(product);
  }

  async addImage(productId: string, imageData: Partial<ProductImage>): Promise<ProductImage> {
    const product = await this.findById(productId);
    const image = this.productImagesRepository.create({
      ...imageData,
      productId: product.id,
    });
    return this.productImagesRepository.save(image);
  }

  async removeImage(imageId: string): Promise<void> {
    await this.productImagesRepository.delete(imageId);
  }

  async addVariant(productId: string, variantData: Partial<ProductVariant>): Promise<ProductVariant> {
    const product = await this.findById(productId);
    const variant = this.productVariantsRepository.create({
      ...variantData,
      productId: product.id,
    });
    return this.productVariantsRepository.save(variant);
  }

  async updateStock(productId: string, quantity: number): Promise<void> {
    await this.productsRepository.decrement({ id: productId }, 'stock', quantity);
    const product = await this.findById(productId);
    if (product.stock <= 0) {
      await this.productsRepository.update(productId, { inStock: false });
    }
  }
}
