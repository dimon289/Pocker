import { Injectable, NotFoundException  } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { step, Prisma, players, users, steptype} from '@prisma/client';

@Injectable()
export class StepService {
  constructor(private readonly prisma: PrismaService) {}

  // Створити новий крок гри
  async create(data: {
    pockerid: number;
    playerid: number;
    bet: number;
    maxbet: number;
    steptype: steptype;
  }): Promise<step> {
    return this.prisma.step.create({ data });
  }

  // Знайти крок за його ID або помилка
  async findById(id: number): Promise<step> {
    const st = await this.prisma.step.findUnique({ where: { id } });
    if (!st) {
      throw new NotFoundException(`Step with id ${id} not found`);
    }
    return st;
  }

  async findLastActiveByPockerId(id: number){
    return await this.prisma.step.findFirst({
      where:{
        pockerid: id,
        steptype: {not: steptype.Fold}
      },
      orderBy:{id: 'desc'}})
  }

  // Оновити крок (наприклад, змінити ставку або тип фази)
  async update(params: {
    where: Prisma.stepWhereUniqueInput;
    data: Prisma.stepUpdateInput;
  }): Promise<step> {
    return this.prisma.step.update(params);
  }

  // Встановити цей крок як поточний у грі
  async setCurrent(stepId: number): Promise<void> {
    const st = await this.findById(stepId);
    await this.prisma.poker.update({
      where: { id: st.pockerid },
      data: { step: { connect: { id: stepId } } },
    });
  }

  // Обчислити і повернути наступний крок або null, якщо раунд ставок завершено
  async moveToNext(
    currentStepId: number,
    activePlayers: (players & { users: users })[]
  ): Promise<step | null> {
    const current = await this.findById(currentStepId);
    const idx = activePlayers.findIndex(p => p.id === current.playerid);
    if (idx === -1) return null;
    const nextIdx = (idx + 1) % activePlayers.length;
    const next = activePlayers[nextIdx];
    if (next.id === current.playerid) {
      // Лише один гравець активний
      return null;
    }
    // Оновити існуючий крок: передати хід наступному гравцю
    return this.prisma.step.update({
      where: { id: currentStepId },
      data: {
        playerid: next.id,
        bet: 0,
        maxbet: Number(next.users.mybalance ?? 0),
      },
    });
  }
}