import { Body, Controller, Delete, Get, Param, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { PlayerService } from './player.service';
import { CreatePlayerDto, UpdatePlayerDto } from './player.dto';

@Controller('player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Post()
  @UsePipes(new ValidationPipe())
    create(@Body() dto: CreatePlayerDto) {
      return this.playerService.createPlayer(dto);
    }

    @Get(':userid')
    async getPlayerByUserId(@Param('userid') userid: number) {
      return this.playerService.getPlayerByUserId(userid);
    }
      
    @Patch(':userid')
    async updatePlayer(@Param('userid') userid: number, @Body() data: UpdatePlayerDto) {
      return this.playerService.updatePlayer(userid, data);
    }
  
    @Delete(':userid')
    async deletePlayer(@Param('userid') userid: number) {
      return this.playerService.deletePlayer(userid);
    }

}
