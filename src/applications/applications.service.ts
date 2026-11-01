import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async apply(userId: number, programId: number, cvUrl?: string) {
    const program = await this.prisma.program.findUnique({ where: { id: programId } });
    if (!program) throw new NotFoundException('Program not found');

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.application.findUnique({
        where: { userId_programId: { userId, programId } },
      });

      // حجز مقعد: التحديث الشرطي هو ما يمنع التسجيل الزائد
      const taken = await tx.program.updateMany({
        where: { id: programId, availableSeats: { gt: 0 } },
        data: { availableSeats: { decrement: 1 } },
      });
      if (taken.count === 0) throw new ConflictException('Program is full');

      if (existing) {
        if (existing.status !== 'CANCELLED' && existing.status !== 'REJECTED') {
          throw new ConflictException('Already applied');
        }
        return tx.application.update({
          where: { id: existing.id },
          data: { status: 'PENDING', cvUrl },
        });
      }
      return tx.application.create({ data: { userId, programId, cvUrl } });
    });
  }

  myApplications(userId: number) {
    return this.prisma.application.findMany({
      where: { userId },
      include: { program: { select: { id: true, title: true } } },
      orderBy: { id: 'desc' },
    });
  }

  async cancel(userId: number, id: number) {
    return this.prisma.$transaction(async (tx) => {
      const app = await tx.application.findUnique({ where: { id } });
      if (!app || app.userId !== userId) throw new NotFoundException('Application not found');
      if (app.status === 'CANCELLED' || app.status === 'REJECTED') {
        throw new BadRequestException('Already closed');
      }
      await tx.program.update({
        where: { id: app.programId },
        data: { availableSeats: { increment: 1 } },
      });
      return tx.application.update({ where: { id }, data: { status: 'CANCELLED' } });
    });
  }

  async decide(adminId: number, id: number, accept: boolean) {
    return this.prisma.$transaction(async (tx) => {
      const app = await tx.application.findUnique({ where: { id } });
      if (!app) throw new NotFoundException('Application not found');
      if (app.status !== 'PENDING') throw new BadRequestException('Not pending');
      if (!accept) {
        await tx.program.update({
          where: { id: app.programId },
          data: { availableSeats: { increment: 1 } },
        });
      }
      return tx.application.update({
        where: { id },
        data: { status: accept ? 'ACCEPTED' : 'REJECTED' },
      });
    });
  }
}
