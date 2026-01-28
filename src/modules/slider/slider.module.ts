import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SliderService } from './slider.service';
import { SliderController } from './slider.controller';
import { Slider } from './entities/slider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Slider])],
  controllers: [SliderController],
  providers: [SliderService],
  exports: [SliderService],
})
export class SliderModule {}
