import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../users/repositories/user.repository';
import { RegisterDto, LoginDto, VerifyEmailDto } from './dto/auth.dto';
import { UserResponseDto } from '../users/dto/user.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const verificationCode = crypto.randomBytes(32).toString('hex');
    const verificationCodeExpires = new Date();
    verificationCodeExpires.setHours(verificationCodeExpires.getHours() + 24);

    const user = await this.userRepository.create({
      ...registerDto,
      verificationCode,
      verificationCodeExpires,
    });

    return {
      message:
        'Registration successful. Please check your email for verification.',
      user: new UserResponseDto(user),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user || !(await user.validatePassword(loginDto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      access_token: token,
      user: new UserResponseDto(user),
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.userRepository.findByEmail(verifyEmailDto.email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (
      !user.verificationCode ||
      user.verificationCode !== verifyEmailDto.code ||
      user.verificationCodeExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const updatedUser = await this.userRepository.update(user.id, {
      isVerified: true,
      verificationCode: undefined,
      verificationCodeExpires: undefined,
    });

    return {
      message: 'Email verified successfully',
      user: new UserResponseDto(updatedUser),
    };
  }
}
