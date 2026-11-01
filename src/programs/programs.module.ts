import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller.js';
import { ProgramsService } from './programs.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [ProgramsController],
  providers: [ProgramsService, PrismaService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
