import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateProgramDto, ListProgramsDto } from './dto.js';

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  create(supervisorId: number, dto: CreateProgramDto) {
    return this.prisma.program.create({
      data: { ...dto, availableSeats: dto.totalSeats, supervisorId },
    });
  }

  async list(q: ListProgramsDto) {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 10, 50);
    const where = q.search
      ? { title: { contains: q.search, mode: 'insensitive' as const } }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.program.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          supervisor: { select: { id: true, name: true } },
          sessions: { orderBy: { startsAt: 'asc' } },
        },
      }),
      this.prisma.program.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const p = await this.prisma.program.findUnique({
      where: { id },
      include: {
        supervisor: { select: { id: true, name: true } },
        sessions: true,
      },
    });
    if (!p) throw new NotFoundException('Program not found');
    return p;
  }

  async assertOwner(programId: number, user: { id: number; role: string }) {
    const p = await this.prisma.program.findUnique({ where: { id: programId } });
    if (!p) throw new NotFoundException('Program not found');
    if (user.role !== 'ADMIN' && p.supervisorId !== user.id) {
      throw new ForbiddenException('Not your program');
    }
    return p;
  }
  async setImage(programId: number, user: { id: number; role: string }, filename: string) {
  await this.assertOwner(programId, user);
  return this.prisma.program.update({
    where: { id: programId },
    data: { imageUrl: `uploads/${filename}` },
  });
}
}