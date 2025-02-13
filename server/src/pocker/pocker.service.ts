import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePockerDto, UpdatePockerDto } from './pocker.dto';

@Injectable()
export class PockerService {
  constructor(private readonly prisma: PrismaService) {}

  async createPocker(data: CreatePockerDto) {
    return this.prisma.pocker.create({ data });
  }

  async getPocker(roomid: number) {
    const pocker = await this.prisma.pocker.findUnique({ where: { roomid } });
    if (!pocker) {
      throw new NotFoundException('Pocker not found');
    }
    return pocker;
  }

  async updatePocker(roomid: number, data: UpdatePockerDto) {
    return this.prisma.pocker.update({ where: { roomid }, data });
  }
}