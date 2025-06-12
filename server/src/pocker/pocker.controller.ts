import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { PockerService } from './pocker.service';
import { CreatePockerDto, UpdatePockerDto } from './pocker.dto';

@Controller('pocker')
export class PockerController {
  constructor(private readonly pockerService: PockerService) {}

}
