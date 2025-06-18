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
  async findPlayerLastStepByPockerId(pockerid, playerId: number){
    return await this.prisma.step.findFirst({
      where:{
        pockerid: pockerid,
        playerid: playerId,
        steptype: {not: steptype.Fold}
      },
      orderBy:{id: 'desc'}})
  }

  async findBiggestBet(pokerId:number){
    const pokerSteps = await this.prisma.step.findMany({where:{pockerid: pokerId}})
    let pokerStepsBets:number[] = pokerSteps.map(step => Number(step.bet))
    return Math.max(...pokerStepsBets)
  }
  async findLastPokerStep(pokerId: number){
    return await this.prisma.step.findFirst({
      where:{
        pockerid: pokerId,
      },
      orderBy:{id: 'desc'}
    })
  }
}