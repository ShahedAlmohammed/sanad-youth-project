import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller.js';
import { ApplicationsService } from './applications.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService, PrismaService],
})
export class ApplicationsModule {}