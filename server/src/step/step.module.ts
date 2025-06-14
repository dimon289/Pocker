import { Module } from '@nestjs/common';
import { StepService } from './step.service';
import { StepController } from './step.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [StepController],
  providers: [StepService, PrismaService],
  exports:[StepService]
})
export class StepModule {}
