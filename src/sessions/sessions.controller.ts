import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionsService } from './sessions.service.js';
import { CreateSessionDto } from './dto.js';

@Controller('programs/:programId/sessions')
@UseGuards(AuthGuard, RolesGuard)
export class SessionsController {
  constructor(private sessions: SessionsService) {}

  @Post()
  @Roles('SUPERVISOR', 'ADMIN')
  create(
    @Param('programId', ParseIntPipe) programId: number,
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.sessions.create(programId, dto, user);
  }

  @Get()
  findAll(@Param('programId', ParseIntPipe) programId: number) {
    return this.sessions.findAll(programId);
  }
}