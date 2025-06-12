import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { pocker, step, Prisma } from '@prisma/client';

@Injectable()
export class PockerService {
  constructor(private readonly prisma: PrismaService) {}

  // Створити нову гру
  async create(data: {
    roomid: number;
    playersid: number[];
    cards: string[];
    bank: number;
  }): Promise<pocker> {
    return this.prisma.pocker.create({ data });
  }

  // Отримати гру за ID кімнати або помилка, якщо не знайдено
  async findByRoomId(roomId: number): Promise<pocker> {
    const game = await this.prisma.pocker.findFirst({
      where: { roomid: roomId },
      orderBy: {id: 'desc'},
    });
    if (!game) {
      throw new NotFoundException(`Game for room ${roomId} not found`);
    }
    return game;
  }

  // Отримати гру за її ID або помилка, якщо не знайдено
  async findById(id: number): Promise<pocker & { step: step | null }> {
    const game = await this.prisma.pocker.findUnique({
      where: { id },
      include: { step: true },
    });
    if (!game) {
      throw new NotFoundException(`Pocker with id ${id} not found`);
    }
    return game;
  }

  // Збільшити банк гри
  async incrementBank(id: number, amount: number): Promise<pocker> {
    return this.prisma.pocker.update({
      where: { id },
      data: { bank: { increment: amount } },
    });
  }

  async update(id: number, data: Prisma.pockerUpdateInput): Promise<pocker> {
    return this.prisma.pocker.update({ where: { id }, data });
  }

  evaluateHand(cards: string[]): { name: string; rank: number } {
    // Примітивна реалізація — замініть своєю логікою
    // Наприклад: обчисліть силу руки, визначте комбінацію (пара, стріт, флеш тощо)
    return { name: 'High Card', rank: 1 }; // Заглушка
  }

  async updatePlayers(roomId: number, updatedPlayers: number[]){
    await this.prisma.pocker.update({
      where: { id: roomId },
      data: {
        playersid: updatedPlayers,
      },
    });
  }

}