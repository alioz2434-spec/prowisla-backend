import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SliderService } from './slider.service';
import { Slider } from './entities/slider.entity';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('slider')
@Controller('slider')
export class SliderController {
  constructor(private readonly sliderService: SliderService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Aktif slider\'ları getir' })
  findActive() {
    return this.sliderService.findActive();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tüm slider\'ları getir (Admin)' })
  findAll() {
    return this.sliderService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni slider oluştur' })
  create(@Body() data: Partial<Slider>) {
    return this.sliderService.create(data);
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Slider sırasını değiştir' })
  reorder(@Body('ids') ids: string[]) {
    return this.sliderService.reorder(ids);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Slider güncelle' })
  update(@Param('id') id: string, @Body() data: Partial<Slider>) {
    return this.sliderService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Slider sil' })
  delete(@Param('id') id: string) {
    return this.sliderService.delete(id);
  }
}
