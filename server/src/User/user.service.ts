import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
// import { PrismaService } from 'src/prisma.service';
import { CreateUserDto, UpdateUserDto } from 'src/User/user.dto';
import { Repository } from "typeorm";
import { Users } from "../output/entities/Users";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(Users)
        private readonly usersRepository: Repository<Users>
    ) {}
    async findAll() {
        try {
            // const users = await this.prisma.users.findMany();
            const users = this.usersRepository.find();
            return users;
        } catch (error) {
            console.error("Помилка підключення до БД:", error);
            throw new Error("Не вдалося отримати користувачів");
        }
    }

    async findName(name: string){
        try {
            // const user = await this.prisma.users.findFirst({where: { nickname: name }});
            const user = await this.usersRepository.findOne({where:{nickname:name}})
            return user || false;
        } catch (error) {
            console.error("Помилка при пошуку name:", error);
            throw new Error("Не вдалося отримати користувача");
        }
    }

    async findEmail(email: string) {
        try {
            // const user = await this.prisma.users.findFirst({where: { email: email }});
            const user = await this.usersRepository.findOne({where:{email:email}})
            return user || false;
        } catch (error) {
            console.error("Помилка при пошуку email:", error);
            throw new Error("Не вдалося отримати користувача");
        }
    }

    async createUser(dto: CreateUserDto) {
        const hashedPassword = await bcrypt.hash(dto.password, 1);
        return await this.usersRepository.save({
            nickname: dto.nickname,
            email: dto.email,
            password: hashedPassword,
            avatar: null
        });
        // this.prisma.users.create({
        //     data: {
        //         nickname: dto.nickname,
        //         email: dto.email,
        //         password: hashedPassword,
        //         avatar: null
        //     },
        // });
    }

    async Auth(email: string, password: string) {
        try {
            // const user = await this.prisma.users.findUnique({
            //     where: { email }
            // });
            const user = await this.usersRepository.findOne({where:{email}});
            if (!user) {
                throw new Error('Користувача з такою електронною скринькою не знайдено');
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            return isPasswordValid;

        } catch (error) {
            console.error("Помилка при авторизації");
            throw new Error("Не вдалося авторизуватися");
        }
    }

    async updateUser(email: string, data: UpdateUserDto) {
        const user = await this.usersRepository.findOne({where:{email}});
        // const user = await this.prisma.users.findUnique({
        //     where: { email },
        // });

        if (!user) {
            throw new BadRequestException('Користувача не знайдено');
        }

        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        return await this.usersRepository.update(
            {email: email},
            data
        );
    }

    async DeleteUser(email: string, password: string): Promise<boolean> {
        const user = await this.usersRepository.findOne({where:{email}})
        // const user = await this.prisma.users.findUnique({
        //     where: { email }
        // });
    
        if (!user) {
            throw new Error('Користувача не знайдено');
        }
    
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Невірний пароль');
        }
    
        await this.usersRepository.delete({email: email });
    
        return true;
    }
}
