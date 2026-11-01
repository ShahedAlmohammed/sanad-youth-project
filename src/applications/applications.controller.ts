import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { CV_TYPES, uploadOptions } from '../common/upload.js';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ApplicationsService } from './applications.service.js';



@UseGuards(AuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private apps: ApplicationsService) { }

  @Roles('YOUTH')
  @Post(':programId')
  @UseInterceptors(FileInterceptor('cv', uploadOptions(CV_TYPES, 2)))
  apply(
    @CurrentUser() user: any,
    @Param('programId', ParseIntPipe) programId: number,
    @UploadedFile() cv?: Express.Multer.File,
  ) {
    return this.apps.apply(user.id, programId, cv ? `uploads/${cv.filename}` : undefined);
  }
  @Roles('YOUTH')
  @Get('me')
  mine(@CurrentUser() user: any) {
    return this.apps.myApplications(user.id);
  }

  @Roles('YOUTH')
  @Patch(':id/cancel')
  cancel(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.apps.cancel(user.id, id);
  }

  @Roles('ADMIN')
  @Patch(':id/accept')
  accept(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.apps.decide(user.id, id, true);
  }

  @Roles('ADMIN')
  @Patch(':id/reject')
  reject(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.apps.decide(user.id, id, false);
  }
}