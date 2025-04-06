import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { GetUser } from './auth/decorators/get-user.decorator';
import { UserEntity } from './users/entities/user.entity';
import { UserResponseDto } from './users/dto/user.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('me')
  getProfile(@GetUser() user: UserEntity) {
    return new UserResponseDto(user);
  }
}
