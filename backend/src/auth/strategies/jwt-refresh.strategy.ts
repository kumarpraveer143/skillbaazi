import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; email: string }) {
    const authHeader = req.get('authorization');
    if (!authHeader) throw new UnauthorizedException();
    const refreshToken = authHeader.replace('Bearer', '').trim();
    // Ideally we should validate if this refresh token matches what's in DB if we store it
    // But for this requirement we just check user existence and return logic
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
     if (!user) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    return { ...result, refreshToken };
  }
}
