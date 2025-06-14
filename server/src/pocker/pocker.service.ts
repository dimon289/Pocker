import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { poker, step, Prisma } from '@prisma/client';

@Injectable()
export class PockerService {
  constructor(private readonly prisma: PrismaService) {}

  // Створити нову гру
  async create(data: {
    roomid: number;
    playersid: number[];
    cards: string[];
    bank: number;
  }): Promise<poker> {
    return this.prisma.poker.create({ data });
  }

  // Отримати гру за ID кімнати або помилка, якщо не знайдено
  async findByRoomId(roomId: number): Promise<poker> {
    const game = await this.prisma.poker.findFirst({
      where: { roomid: roomId },
      orderBy: {id: 'desc'},
    });
    if (!game) {
      throw new NotFoundException(`Game for room ${roomId} not found`);
    }
    return game;
  }

  // Отримати гру за її ID або помилка, якщо не знайдено
  async findById(id: number): Promise<poker & { step: step | null }> {
    const game = await this.prisma.poker.findUnique({
      where: { id },
      include: { step: true },
    });
    if (!game) {
      throw new NotFoundException(`Pocker with id ${id} not found`);
    }
    return game;
  }

  // Збільшити банк гри
  async incrementBank(id: number, amount: number): Promise<poker> {
    return this.prisma.poker.update({
      where: { id },
      data: { bank: { increment: amount } },
    });
  }

  async update(id: number, data: Prisma.pokerUpdateInput): Promise<poker> {
    return this.prisma.poker.update({ where: { id }, data });
  }

  evaluateHand(cards: string[]): { name: string; rank: number } {
    return { name: 'High Card', rank: 1 }; // Заглушка
  }

  async updatePlayers(roomId: number, updatedPlayers: number[]){
    await this.prisma.poker.update({
      where: { id: roomId },
      data: {
        playersid: updatedPlayers,
      },
    });
  }

}