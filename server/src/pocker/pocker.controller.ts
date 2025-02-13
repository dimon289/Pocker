import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { PockerService } from './pocker.service';
import { CreatePockerDto, UpdatePockerDto } from './pocker.dto';

@Controller('pocker')
export class PockerController {
  constructor(private readonly pockerService: PockerService) {}

  @Post()
  async createPocker(@Body() data: CreatePockerDto) {
    return this.pockerService.createPocker(data);
  }

  @Get(':roomid')
  async getPocker(@Param('roomid') roomid: number) {
    return this.pockerService.getPocker(roomid);
  }

  @Patch(':roomid')
  async updatePocker(@Param('roomid') roomid: number, @Body() data: UpdatePockerDto) {
    return this.pockerService.updatePocker(roomid, data);
  }
}
