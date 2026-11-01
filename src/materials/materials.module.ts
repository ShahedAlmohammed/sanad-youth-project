import { Module } from '@nestjs/common';
import { MaterialsController } from './materials.controller.js';
import { MaterialsService } from './materials.service.js';
import { PrismaService } from '../prisma.service.js';
import { ProgramsModule } from '../programs/programs.module.js';

@Module({
  imports: [ProgramsModule],
  controllers: [MaterialsController],
  providers: [MaterialsService, PrismaService],
})
export class MaterialsModule {}