import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AnnouncementsController } from './announcements.controller.js';
import { AnnouncementsService } from './announcements.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  imports: [CacheModule.register()],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, PrismaService],
})
export class AnnouncementsModule {}