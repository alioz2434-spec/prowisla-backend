import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Favori ürünleri getir' })
  findAll(@CurrentUser() user: User) {
    return this.favoritesService.findAll(user.id);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Favorilere ekle' })
  add(@CurrentUser() user: User, @Param('productId') productId: string) {
    return this.favoritesService.add(user.id, productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Favorilerden çıkar' })
  remove(@CurrentUser() user: User, @Param('productId') productId: string) {
    return this.favoritesService.remove(user.id, productId);
  }

  @Post(':productId/toggle')
  @ApiOperation({ summary: 'Favori durumunu değiştir' })
  toggle(@CurrentUser() user: User, @Param('productId') productId: string) {
    return this.favoritesService.toggle(user.id, productId);
  }

  @Get(':productId/check')
  @ApiOperation({ summary: 'Ürün favorilerde mi kontrol et' })
  check(@CurrentUser() user: User, @Param('productId') productId: string) {
    return this.favoritesService.isFavorite(user.id, productId);
  }
}
