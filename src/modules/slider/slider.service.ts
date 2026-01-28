import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { Slider } from './entities/slider.entity';

@Injectable()
export class SliderService {
  constructor(
    @InjectRepository(Slider)
    private sliderRepository: Repository<Slider>,
  ) {}

  async create(data: Partial<Slider>): Promise<Slider> {
    const slider = this.sliderRepository.create(data);
    return this.sliderRepository.save(slider);
  }

  async findAll(): Promise<Slider[]> {
    return this.sliderRepository.find({
      order: { order: 'ASC' },
    });
  }

  async findActive(): Promise<Slider[]> {
    const now = new Date();
    return this.sliderRepository
      .createQueryBuilder('slider')
      .where('slider.isActive = :isActive', { isActive: true })
      .andWhere('(slider.startDate IS NULL OR slider.startDate <= :now)', { now })
      .andWhere('(slider.endDate IS NULL OR slider.endDate >= :now)', { now })
      .orderBy('slider.order', 'ASC')
      .getMany();
  }

  async findById(id: string): Promise<Slider> {
    const slider = await this.sliderRepository.findOne({ where: { id } });
    if (!slider) {
      throw new NotFoundException('Slider bulunamadı');
    }
    return slider;
  }

  async update(id: string, data: Partial<Slider>): Promise<Slider> {
    const slider = await this.findById(id);
    Object.assign(slider, data);
    return this.sliderRepository.save(slider);
  }

  async delete(id: string): Promise<void> {
    const slider = await this.findById(id);
    await this.sliderRepository.remove(slider);
  }

  async reorder(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.sliderRepository.update(ids[i], { order: i });
    }
  }
}
