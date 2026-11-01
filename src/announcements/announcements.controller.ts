import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AnnouncementsService } from './announcements.service.js';
import { CreateAnnouncementDto } from './dto.js';

@UseGuards(AuthGuard, RolesGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private service: AnnouncementsService) {}

  @Roles('ADMIN', 'SUPERVISOR')
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateAnnouncementDto) {
    return this.service.create(user, dto);
  }

  @Roles('YOUTH')
  @Get()
  list(@CurrentUser() user: any) {
    return this.service.forUser(user);
  }
}