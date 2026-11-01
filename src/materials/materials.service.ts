import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ProgramsService } from '../programs/programs.service.js';

type AuthUser = { id: number; role: string };

@Injectable()
export class MaterialsService {
  constructor(
    private prisma: PrismaService,
    private programs: ProgramsService,
  ) {}

  async create(programId: number, user: AuthUser, title: string, filename: string) {
    await this.programs.assertOwner(programId, user);
    return this.prisma.material.create({
      data: { programId, title, fileUrl: `uploads/${filename}` },
    });
  }

  // أدمن، أو مشرف صاحب البرنامج، أو شاب مقبول
  private async assertCanView(programId: number, user: AuthUser) {
    const program = await this.prisma.program.findUnique({ where: { id: programId } });
    if (!program) throw new NotFoundException('Program not found');

    if (user.role === 'ADMIN' || program.supervisorId === user.id) return;

    const app = await this.prisma.application.findUnique({
      where: { userId_programId: { userId: user.id, programId } },
    });
    if (!app || app.status !== 'ACCEPTED') {
      throw new ForbiddenException('Accepted applicants only');
    }
  }

  async findAll(programId: number, user: AuthUser) {
    await this.assertCanView(programId, user);
    return this.prisma.material.findMany({
      where: { programId },
      orderBy: { id: 'asc' },
    });
  }

  async getForDownload(id: number, user: AuthUser) {
    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material) throw new NotFoundException('Material not found');
    await this.assertCanView(material.programId, user);
    return material;
  }
}