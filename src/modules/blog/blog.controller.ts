import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { BlogPost } from './entities/blog-post.entity';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Blog yazılarını getir' })
  findAll(@Query() query: any) {
    return this.blogService.findAll(query);
  }

  @Public()
  @Get('recent')
  @ApiOperation({ summary: 'Son blog yazılarını getir' })
  findRecent(@Query('limit') limit?: number) {
    return this.blogService.findRecent(limit);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Slug ile blog yazısı getir' })
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni blog yazısı oluştur' })
  create(@CurrentUser() user: User, @Body() data: Partial<BlogPost>) {
    return this.blogService.create({ ...data, authorId: user.id });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Blog yazısı güncelle' })
  update(@Param('id') id: string, @Body() data: Partial<BlogPost>) {
    return this.blogService.update(id, data);
  }

  @Put(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Blog yazısını yayınla' })
  publish(@Param('id') id: string) {
    return this.blogService.publish(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Blog yazısı sil' })
  delete(@Param('id') id: string) {
    return this.blogService.delete(id);
  }
}
