import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from './entities/page.entity';

@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(Page)
    private pagesRepository: Repository<Page>,
  ) {}

  async create(data: Partial<Page>): Promise<Page> {
    const page = this.pagesRepository.create(data);
    return this.pagesRepository.save(page);
  }

  async findAll(): Promise<Page[]> {
    return this.pagesRepository.find({
      where: { isActive: true },
      order: { title: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Page> {
    const page = await this.pagesRepository.findOne({
      where: { slug, isActive: true },
    });
    if (!page) {
      throw new NotFoundException('Sayfa bulunamadı');
    }
    return page;
  }

  async findById(id: string): Promise<Page> {
    const page = await this.pagesRepository.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException('Sayfa bulunamadı');
    }
    return page;
  }

  async update(id: string, data: Partial<Page>): Promise<Page> {
    const page = await this.findById(id);
    Object.assign(page, data);
    return this.pagesRepository.save(page);
  }

  async delete(id: string): Promise<void> {
    const page = await this.findById(id);
    await this.pagesRepository.remove(page);
  }
}
