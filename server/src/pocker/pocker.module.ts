import { Module } from '@nestjs/common';
import { PockerService } from './pocker.service';
import { PockerController } from './pocker.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [PockerController],
  providers: [PockerService, PrismaService],
})
export class PockerModule {}

