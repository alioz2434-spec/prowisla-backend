import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { isActive: true },
      relations: ['children', 'parent'],
      order: { order: 'ASC' },
    });
  }

  async findRootCategories(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { parentId: IsNull(), isActive: true },
      relations: ['children'],
      order: { order: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { slug, isActive: true },
      relations: ['children', 'products'],
    });
    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
    }
    return category;
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['children', 'parent'],
    });
    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
    }
    return category;
  }

  async update(id: string, updateData: Partial<CreateCategoryDto>): Promise<Category> {
    const category = await this.findById(id);
    Object.assign(category, updateData);
    return this.categoriesRepository.save(category);
  }

  async delete(id: string): Promise<void> {
    const category = await this.findById(id);
    await this.categoriesRepository.remove(category);
  }
}
