import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { players, Prisma } from '@prisma/client';
import { CreatePlayerDto, UpdatePlayerDto } from './player.dto';
import { RoomsService } from '../rooms/rooms.service'

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService, roomService: RoomsService) {}


  async findById(id: number){
    return this.prisma.players.findUnique({where: {
      id: id
    }})
  }

  async updateStatus(playerId: number, hasFolded: boolean): Promise<players> {
    return this.prisma.players.update({
      where: { id: playerId },
      data: { status: hasFolded },
    });
  }

  async create(dto: CreatePlayerDto) {
    try {
      return await this.prisma.players.create({
        data:{
          userid: dto.userid,
          cards: dto.cards,
          roomid: dto.roomid,
          status: true,
        }
      });
    } catch (error) {
      console.error('Create player error:', error);
      throw new Error('UnexpectedError');
    } 
  }
  async update(id: number, data: Prisma.pokerUpdateInput): Promise<players> {
      return this.prisma.players.update({ where: {id}, data});
    }
}