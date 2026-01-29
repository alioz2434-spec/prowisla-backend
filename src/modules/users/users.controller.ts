import { Controller, Get, Put, Post, Body, UseGuards, UnauthorizedException, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mevcut kullanıcı bilgileri' })
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcı bilgilerini güncelle' })
  updateProfile(@CurrentUser() user: User, @Body() updateData: Partial<User>) {
    return this.usersService.update(user.id, updateData);
  }

  @Public()
  @Post('reset-admin-password')
  @ApiOperation({ summary: 'Admin şifresini sıfırla (kurulum anahtarı gerekli)' })
  @ApiHeader({ name: 'x-setup-key', description: 'Kurulum anahtarı' })
  async resetAdminPassword(
    @Headers('x-setup-key') setupKey: string,
    @Body() body: { email: string; newPassword: string },
  ) {
    // Use process.env directly as fallback
    const expectedKey = process.env.SETUP_KEY || this.configService.get<string>('SETUP_KEY');

    if (!expectedKey || setupKey !== expectedKey) {
      throw new UnauthorizedException('Geçersiz kurulum anahtarı');
    }

    const user = await this.usersService.findByEmail(body.email);
    if (!user || user.role !== 'admin') {
      throw new UnauthorizedException('Admin kullanıcı bulunamadı');
    }

    await this.usersService.update(user.id, { password: body.newPassword });

    return {
      success: true,
      message: 'Admin şifresi güncellendi',
    };
  }

  @Public()
  @Post('setup-admin')
  @ApiOperation({ summary: 'Admin kullanıcı oluştur (kurulum için - sadece admin yoksa çalışır)' })
  @ApiHeader({ name: 'x-setup-key', description: 'Kurulum anahtarı', required: false })
  async setupAdmin(
    @Headers('x-setup-key') setupKey: string,
    @Body() body: { email: string; password: string; firstName: string; lastName: string },
  ) {
    // Check if any admin exists
    const allUsers = await this.usersService.findAll();
    const adminExists = allUsers.some(u => u.role === 'admin');

    // If admin exists, require setup key
    if (adminExists) {
      const expectedKey = this.configService.get<string>('SETUP_KEY');
      if (!expectedKey || setupKey !== expectedKey) {
        throw new UnauthorizedException('Admin zaten mevcut. Yeni admin eklemek için kurulum anahtarı gerekli.');
      }
    }

    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(body.email);
    if (existingUser) {
      throw new UnauthorizedException('Bu e-posta adresi zaten kayıtlı');
    }

    const admin = await this.usersService.createAdmin(
      body.email,
      body.password,
      body.firstName,
      body.lastName,
    );

    return {
      success: true,
      message: 'Admin kullanıcı oluşturuldu',
      user: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
    };
  }
}
