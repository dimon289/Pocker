import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePlayerDto, UpdatePlayerDto } from './player.dto';


@Injectable()
export class PlayerService {
    constructor(private readonly prisma:PrismaService){}
    async createPlayer(data: CreatePlayerDto) {
        return this.prisma.players.create({
            data: {
                userid: data.userid,
                cards: data.cards,
                roomid: data.roomid,
            },
        });
        }

    async getPlayerByUserId(userid: number) {
        const player = await this.prisma.players.findUnique({
            where: { userid },
        });
        if (!player) {
            throw new NotFoundException('Player not found');
        }
        return player;
    }
    
    async updatePlayer(userid: number, data: UpdatePlayerDto) {
        return this.prisma.players.update({
            where: { userid },
            data,
        });
    }
    
        async deletePlayer(userid: number) {
        return this.prisma.players.delete({
            where: { userid },
        });
    }
}