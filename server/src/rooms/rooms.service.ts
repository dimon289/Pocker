import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRoomDto, JoinRoomDto } from './rooms.dto';
import { error } from 'console';
import { data } from 'react-router-dom';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(dto: CreateRoomDto) {

    const room = await this.prisma.room.create({
      data: {
        name: dto.name,
        password: dto.password ?? '',
        usersid: [dto.userID],
        status: 'Waiting'
      },
    });

    return room;
  }

  async findRoom(roomid: number) {
    const room = await this.prisma.room.findUnique({where: {id: roomid}})
    return room || false 
  }

  async findAllRooms() {
    const rooms = await this.prisma.room.findMany()
    return rooms 
  }

  async updateRoomUsersById(userId: number, roomId: number){
    const room = await this.prisma.room.findUnique({where: {id:roomId}})
    if (room){
      room.usersid.push(userId)
      await this.prisma.room.update({
        where:{id:roomId}, 
        data:{
          usersid: room.usersid
        }})
        console.log( room.usersid)
    return room.usersid
    }else{
      throw new error('invalid roomId')
    }
  }
  
  async deleteById(id: number){
    await this.prisma.room.delete({where: {id}})
    return true;
  }

}