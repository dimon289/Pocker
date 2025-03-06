import { Injectable } from '@nestjs/common';
import { CreateRoomDto, PatchRoomDto} from './rooms.dto'
import { PrismaService } from 'src/prisma.service';
import { error } from 'console';
import { Cron } from '@nestjs/schedule';
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

    async updateRooms(id:number, password:string|null,data:PatchRoomDto){
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
    
    async deleteRoom(id:number, password:string|null){
        try{
            const room = await this.prisma.room.findUnique({where:{"id":id}})
            if (!room){
                throw new error("такої кімнати немає")
            }
            else if (room.password != password){
                throw new error("пароль не вірний")
            }
            else{
                return this.prisma.room.delete({where: {"id":id}})
            }
        } catch(error){
            console.error(error)
        }
    }

    @Cron('0 0 0 * * *')  
    async checkEmptyRooms() {
    // try {
    //     const rooms = await this.prisma.room.findMany({
    //         where: {
    //             players: { none: {} },  
    //     },
    //     });

    //     for (const room of rooms) {
    //     await this.prisma.room.delete({
    //         where: { id: room.id },
    //     });
    //     console.log(`Кімната ${room.id} була видалена, оскільки вона порожня.`);
    //     }
    // } catch (error) {
    //     console.error('Помилка при видаленні порожніх кімнат:', error);
    // }
    }
}

