import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma.service.js';
import { CreateAnnouncementDto } from './dto.js';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async create(user: { id: number; role: string }, dto: CreateAnnouncementDto) {
    if (user.role === 'ADMIN') {
      // الأدمن ينشر إعلانات عامة فقط
      dto.programId = undefined;
    } else {
      // المشرف لازم يحدد برنامجه ويكون هو صاحبه
      if (!dto.programId) throw new ForbiddenException('programId required');
      const p = await this.prisma.program.findUnique({ where: { id: dto.programId } });
      if (!p) throw new NotFoundException('Program not found');
      if (p.supervisorId !== user.id) throw new ForbiddenException('Not your program');
    }
    const created = await this.prisma.announcement.create({
      data: { title: dto.title, body: dto.body, programId: dto.programId, authorId: user.id },
    });
    await this.cache.clear(); // مسح الكاش عشان الشاب يشوف آخر نسخة
    return created;
  }

  async forUser(user: { id: number; role: string }) {
    const key = `announcements:${user.id}`;
    const cached = await this.cache.get(key);
    if (cached) return cached;

    const mine = await this.prisma.application.findMany({
      where: { userId: user.id, status: 'ACCEPTED' },
      select: { programId: true },
    });
    const ids = mine.map((m) => m.programId);
    const data = await this.prisma.announcement.findMany({
      where: { OR: [{ programId: null }, { programId: { in: ids } }] },
      orderBy: { id: 'desc' },
    });
    await this.cache.set(key, data, 60_000);
    return data;
  }
}