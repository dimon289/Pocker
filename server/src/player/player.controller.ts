import { Body, Controller, Delete, Get, Param, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { PlayerService } from './player.service';
import { CreatePlayerDto, UpdatePlayerDto } from './player.dto';

@Controller('player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}


  @Get("")
  async getPlayer(){
    
  }
}
