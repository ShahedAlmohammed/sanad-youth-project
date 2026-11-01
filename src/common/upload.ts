import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

export function uploadOptions(allowed: string[], maxMb: number) {
  return {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) =>
        cb(null, randomUUID() + extname(file.originalname)),
    }),
    limits: { fileSize: maxMb * 1024 * 1024 },
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
      if (!allowed.includes(file.mimetype)) {
        return cb(new BadRequestException('File type not allowed'), false);
      }
      cb(null, true);
    },
  };
}

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const CV_TYPES = ['application/pdf'];

export const MATERIAL_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];