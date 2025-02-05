import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from 'src/User/user.dto';

@Injectable()
export class UserService {
    constructor(private readonly prisma:PrismaService){}

    findAll(){
        return this.prisma.users.findMany();
    }
    create(dto: CreateUserDto){
        return this.prisma.users.create({
            data:dto,
        })
    }

}
