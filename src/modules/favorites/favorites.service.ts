import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
  ) {}

  async add(userId: string, productId: string): Promise<Favorite> {
    const existing = await this.favoritesRepository.findOne({
      where: { userId, productId },
    });

    if (existing) {
      throw new ConflictException('Ürün zaten favorilerde');
    }

    const favorite = this.favoritesRepository.create({ userId, productId });
    return this.favoritesRepository.save(favorite);
  }

  async remove(userId: string, productId: string): Promise<void> {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, productId },
    });

    if (!favorite) {
      throw new NotFoundException('Favori bulunamadı');
    }

    await this.favoritesRepository.remove(favorite);
  }

  async findAll(userId: string): Promise<Favorite[]> {
    return this.favoritesRepository.find({
      where: { userId },
      relations: ['product', 'product.images'],
      order: { createdAt: 'DESC' },
    });
  }

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, productId },
    });
    return !!favorite;
  }

  async toggle(userId: string, productId: string): Promise<{ isFavorite: boolean }> {
    const existing = await this.favoritesRepository.findOne({
      where: { userId, productId },
    });

    if (existing) {
      await this.favoritesRepository.remove(existing);
      return { isFavorite: false };
    } else {
      const favorite = this.favoritesRepository.create({ userId, productId });
      await this.favoritesRepository.save(favorite);
      return { isFavorite: true };
    }
  }
}
