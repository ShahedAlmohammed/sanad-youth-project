import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from './prisma.service.js';
import { AuthModule } from './auth/auth.module.js';
import { ProgramsModule } from './programs/programs.module.js';
import { ApplicationsModule } from './applications/applications.module.js';
import { AnnouncementsModule } from './announcements/announcements.module.js';
import { SessionsModule } from './sessions/sessions.module.js';
import { MaterialsModule } from './materials/materials.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    AuthModule,
    ProgramsModule,
    ApplicationsModule,
    AnnouncementsModule,
    SessionsModule,
    MaterialsModule,
  ],
  providers: [PrismaService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
  exports: [PrismaService],
})
export class AppModule { }