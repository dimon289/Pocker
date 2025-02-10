import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UserModule } from 'src/User/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlayerModule } from './player/player.module';
import { RoomsModule } from './rooms/rooms.module';
import { TypeOrmModule } from "@nestjs/typeorm";
import "reflect-metadata";


@Module({
  imports: [UserModule,
            ConfigModule.forRoot({ isGlobal: true }), 
            PlayerModule, 
            RoomsModule,
            TypeOrmModule.forRootAsync({
              imports: [ConfigModule],
              inject: [ConfigService],
              useFactory: (configService: ConfigService) => ({
                type: "postgres",
                host: configService.get("DB_HOST"),
                port: Number(configService.get("DB_PORT")),
                username: configService.get("DB_USER"),
                password: configService.get("DB_PASS"),
                database: configService.get("DB_NAME"),
                entities: ["output/entities/*.ts"], // Список твоїх Entity
                migrations: ["src/migrations/*.ts"],
                synchronize: false, 
                autoLoadEntities: true,}),
            }),
          ],
  controllers: [],
  providers: [],
  
})



export class AppModule  {}
