import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ProgramsService } from '../programs/programs.service.js';
import { CreateSessionDto } from './dto.js';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private programs: ProgramsService,
  ) {}

  async create(
    programId: number,
    dto: CreateSessionDto,
    user: { id: number; role: string },
  ) {
    if (!dto.location && !dto.link) {
      throw new BadRequestException('Provide a location or a link');
    }

    await this.programs.assertOwner(programId, user);

    return this.prisma.session.create({
      data: {
        programId,
        startsAt: new Date(dto.startsAt),
        location: dto.location,
        link: dto.link,
      },
    });
  }

  async findAll(programId: number) {
    await this.programs.findOne(programId); // بيرمي 404 إذا البرنامج مو موجود
    return this.prisma.session.findMany({
      where: { programId },
      orderBy: { startsAt: 'asc' },
    });
  }
}