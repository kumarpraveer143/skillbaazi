import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          password: hash,
        },
      });
      return this.signToken(user.id, user.email, user.role);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException('Credentials taken');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) throw new ForbiddenException('Credentials incorrect');

    const pwMatches = await bcrypt.compare(dto.password, user.password);
    if (!pwMatches) throw new ForbiddenException('Credentials incorrect');

    return this.signToken(user.id, user.email, user.role);
  }

  async signToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });

    const refreshPayload = { sub: userId, email, role };
    const refreshSecret = this.config.get('JWT_REFRESH_SECRET');
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: '7d',
      secret: refreshSecret,
    });

    return {
      access_token: token,
      refresh_token: refreshToken,
    };
  }

  async refreshToken(userId: string, email: string, role: string) {
      // In a real app you might compare the refresh token against a stored hash
      return this.signToken(userId, email, role);
  }
}
