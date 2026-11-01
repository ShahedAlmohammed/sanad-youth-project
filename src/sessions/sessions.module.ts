import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller.js';
import { SessionsService } from './sessions.service.js';
import { PrismaService } from '../prisma.service.js';
import { ProgramsModule } from '../programs/programs.module.js';

@Module({
  imports: [ProgramsModule],
  controllers: [SessionsController],
  providers: [SessionsService, PrismaService],
})
export class SessionsModule {}