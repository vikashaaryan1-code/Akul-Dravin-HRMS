import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change_this_for_production',
    });
  }

  validate(payload: { sub: string; tenantId: string | null; role: string; email: string }) {
    return {
      sub:      payload.sub,
      tenantId: payload.tenantId,
      role:     payload.role,
      email:    payload.email,
    };
  }
}
