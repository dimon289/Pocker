import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRoomDto, JoinRoomDto } from './rooms.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(dto: CreateRoomDto) {
    const player = await this.prisma.players.create({
      data: {
        userid: dto.userID,
        cards: [],
        roomid: 0, // тимчасово, оновиться нижче
      },
    });

    const room = await this.prisma.room.create({
      data: {
        name: dto.name,
        password: dto.pass ?? '',
        usersid: [],
        status: 'Waiting',
        players: {
          connect: { id: player.id },
        },
      },
    });

    await this.prisma.players.update({
      where: { id: player.id },
      data: { roomid: room.id },
    });

    return room;
  }

  async joinRoom(dto: JoinRoomDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomID },
      include: { players: true },
    });
    if (!room) throw new BadRequestException('Room not found');
    if (room.players.length >= 8) throw new BadRequestException('Room is full');

    const player = await this.prisma.players.create({
      data: {
        userid: dto.userID,
        cards: [],
        roomid: dto.roomID,
      },
    });

    return { message: `User ${dto.userID} joined room ${dto.roomID} as player ${player.id}` };
  }
}