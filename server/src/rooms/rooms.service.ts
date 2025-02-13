import { Injectable } from '@nestjs/common';
import { CreateRoomDto, PatchRoomDto} from './rooms.dto'
import { PrismaService } from 'src/prisma.service';
import { error } from 'console';
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

    async findsRooms(){
        try {
            const rooms = await this.prisma.room.findMany();
            return rooms;
        } catch (error) {
            console.error("Помилка підключення до БД:", error);
            throw new Error("Не вдалося отримати Кімнати");
        }
    }

    
    async findsRoombyid(id){
        try {
            const room = await this.prisma.room.findFirst({where:{id:id}});
            return room;
        } catch (error) {
            console.error("Помилка підключення до БД:", error);
            throw new Error("Не вдалося отримати Кімнату");
        }
    }

    async updateRooms(id:number, password:string,data:PatchRoomDto){
        try{
            const room = await this.prisma.room.findUnique({where:{id}})
            if (!room){
                throw new error("такої кімнати немає")
            }
            else if (room.password != password){
                throw new error("пароль не вірний")
            }
            else{
                return this.prisma.room.update({
                    where: {id},
                    data
                })
            }
        } catch(error){
            console.error(error)
        }
    }
}

