import { Controller, Get, Body, Post, ValidationPipe, UsePipes, Query, BadRequestException, UnauthorizedException, Delete, Patch, Param } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, PatchRoomDto } from './rooms.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(dto);
  }

  @Get()
  findsRooms(){
    return this.roomsService.findsRooms();
  }
  @Get('id')
  findroombyid(@Query("id") id:number){
    return this.roomsService.findsRoombyid(id);
  }

  @Patch(':id')
  updateRooms(@Param("id") id: string, @Query("password") password: string | undefined, @Body() dto: PatchRoomDto) {
    return this.roomsService.updateRooms(parseInt(id), password ?? null, dto);
  }

  
  @Delete()
  deleteRoom(@Query("id")id:string, @Query("password")password:string|null){
    return this.roomsService.deleteRoom(parseInt(id), password ? password : null)
  }
}
