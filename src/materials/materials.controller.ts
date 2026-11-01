import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { AuthGuard } from '../auth/auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { MATERIAL_TYPES, uploadOptions } from '../common/upload.js';
import { MaterialsService } from './materials.service.js';
import { CreateMaterialDto } from './dto.js';

@UseGuards(AuthGuard, RolesGuard)
@Controller()
export class MaterialsController {
  constructor(private materials: MaterialsService) {}

  @Roles('SUPERVISOR', 'ADMIN')
  @Post('programs/:programId/materials')
  @UseInterceptors(FileInterceptor('file', uploadOptions(MATERIAL_TYPES, 10)))
  create(
    @CurrentUser() user: any,
    @Param('programId', ParseIntPipe) programId: number,
    @Body() dto: CreateMaterialDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.materials.create(programId, user, dto.title, file.filename);
  }

  @Get('programs/:programId/materials')
  findAll(
    @CurrentUser() user: any,
    @Param('programId', ParseIntPipe) programId: number,
  ) {
    return this.materials.findAll(programId, user);
  }

  @Get('materials/:id/download')
  async download(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const material = await this.materials.getForDownload(id, user);
    return new StreamableFile(createReadStream(join(process.cwd(), material.fileUrl)));
  }
}