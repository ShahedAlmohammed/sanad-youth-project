import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { IMAGE_TYPES, uploadOptions } from '../common/upload.js';
import { ProgramsService } from './programs.service.js';
import { CreateProgramDto, ListProgramsDto } from './dto.js';

@UseGuards(AuthGuard, RolesGuard)
@Controller('programs')
export class ProgramsController {
  constructor(private programs: ProgramsService) {}

  @Roles('SUPERVISOR', 'ADMIN')
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateProgramDto) {
    return this.programs.create(user.id, dto);
  }

  @Get()
  list(@Query() q: ListProgramsDto) {
    return this.programs.list(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.programs.findOne(id);
  }

  @Roles('SUPERVISOR', 'ADMIN')
  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image', uploadOptions(IMAGE_TYPES, 2)))
  uploadImage(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (!image) throw new BadRequestException('Image file is required');
    return this.programs.setImage(id, user, image.filename);
  }
}