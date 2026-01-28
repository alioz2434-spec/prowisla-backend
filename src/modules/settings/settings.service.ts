import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    return setting?.value || null;
  }

  async set(key: string, value: string, group?: string): Promise<Setting> {
    let setting = await this.settingsRepository.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
      if (group) setting.group = group;
    } else {
      setting = this.settingsRepository.create({ key, value, group });
    }
    return this.settingsRepository.save(setting);
  }

  async getByGroup(group: string): Promise<Setting[]> {
    return this.settingsRepository.find({ where: { group } });
  }

  async getAll(): Promise<Setting[]> {
    return this.settingsRepository.find();
  }

  async delete(key: string): Promise<void> {
    await this.settingsRepository.delete({ key });
  }

  async getMultiple(keys: string[]): Promise<Record<string, string>> {
    const settings = await this.settingsRepository
      .createQueryBuilder('setting')
      .where('setting.key IN (:...keys)', { keys })
      .getMany();

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  }

  async setMultiple(data: Record<string, string>, group?: string): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value, group);
    }
  }
}
