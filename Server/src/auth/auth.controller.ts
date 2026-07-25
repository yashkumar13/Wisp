import { Controller, Post, Body, Req, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import type { Request } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto.email, loginAuthDto.password);
  }

  @Post('logout')
  logout(@Req() req: Request) {
    const authorization = req.headers['authorization'] || req.headers['Authorization'];
    const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : null;

    if (!token) {
      throw new BadRequestException('Authorization token missing');
    }

    return this.authService.logout(token);
  }
}
