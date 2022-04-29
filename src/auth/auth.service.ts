/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signUp(dto: AuthDto) {
    try {
      // Generate password hash
      const hash = await argon.hash(dto.password);
      // Save new user
      const user = await this.prismaService.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          password: hash,
        },
      });

      return await this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'p2002') {
          throw new ForbiddenException('Credential taken');
        }
      }
      throw error;
    }
  }

  async signIn(dto: AuthDto) {
    // Find user by email
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    // If user does not exit, throw error
    if (!user) throw new ForbiddenException('Credential incorrect');
    // Compare password
    const comparePassword = await argon.verify(user.password, dto.password);
    // throw exception if not password
    if (!comparePassword) throw new ForbiddenException('Credential incorrect');

    return await this.signToken(user.id, user.email);
  }

  signToken(userId: number, email: string): Promise<any> {
    const payload = {
      email,
      sub: userId,
    };
    const secret = this.config.get('JWT_SECRET');
    const token = this.jwt.signAsync(payload, {
      secret,
      expiresIn: '1d',
    });

    return token;
  }
}
