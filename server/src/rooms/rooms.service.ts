import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './rooms.dto'
import { PrismaService } from 'src/prisma.service';
@Injectable()
export class RoomsService {
    constructor(private readonly prisma:PrismaService){}

    async createRoom(dto: CreateRoomDto) {
        return this.prisma.room.create({
            data: {
                name: dto.name,
                status: dto.status,
                usersid: dto.usersid,
                password: dto.password || undefined
            },
        });
    }
}

