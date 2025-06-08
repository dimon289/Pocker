import { Injectable, UnauthorizedException  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../User/user.service';

@Injectable()
export class AuthService { 
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}


  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findEmail(email);
    if (!user) {
      throw new UnauthorizedException('Користувача не знайдено');
    }
    const isValid = await this.userService.Auth(email, password);
    if (!isValid) {
      throw new UnauthorizedException('Невірний пароль');
    }
    // Приховуємо пароль
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, nickname: user.nickname };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
