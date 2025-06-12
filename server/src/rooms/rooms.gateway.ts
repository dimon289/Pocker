import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlayerService } from '../player/player.service';
import { PockerService } from '../pocker/pocker.service';
import { StepService } from '../step/step.service';
import { error } from 'console';

@WebSocketGateway({
  cors: { origin: 'http://142.93.175.150/' }, // Налаштуй CORS відповідно до потреб
})

@WebSocketGateway({ namespace: '/rooms', cors: true })
@Injectable()
export class RoomsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private roomReadyStatus: Map<string, Set<string>> = new Map();
  private roomTimers: Map<string, NodeJS.Timeout> = new Map();
  private playerSockets: Map<string, Socket> = new Map();

  constructor(  
    private readonly prisma: PrismaService,
    private readonly playersService: PlayerService,
    private readonly pockerService: PockerService,
    private readonly stepService: StepService
  ) {}

  private SocketUseridMap = new Map<Socket, number>();
  private RoomTableMap = new Map<number, number>();

  async handleConnection(client: Socket) {
    const { wsUserId, wsRoomId } = client.handshake.auth;
    let roomId: number;
    let userId: number;

    try {
      if (!wsUserId) {
        client.emit('connection_error', { reason: 'missing userId' });
        client.disconnect(true);
        return;
      }else if(!wsRoomId) {
        client.emit('connection_error', { reason: 'missing roomId' });
        client.disconnect(true);
        return;
      }

      userId = Number(wsUserId);
      roomId = Number(wsRoomId);

      if (isNaN(userId) || isNaN(roomId)) {
        throw new Error();
      }
    } catch (error) {
      client.emit('connection_error', { reason: 'wrong data' });
      client.disconnect(true);
      return;
    }
    
    client.data.userId = userId;
    client.data.roomId = roomId;

    const roomExists = this.server.sockets.adapter.rooms.has(wsRoomId);
    if (!roomExists) {
      this.SocketUseridMap.set(client, userId);
      client.join(wsRoomId);
      let TableId = await this.handleTableCreate(roomId)
      this.RoomTableMap.set(client.data.roomId, TableId)
    }

    this.SocketUseridMap.set(client, userId);
    client.join(wsRoomId);

    this.server.to(wsRoomId).emit('userJoined', { userId });
  }

  async handleTableCreate(roomId: number) {
    this.pockerService.create({
      roomid: roomId, 
      playersid: [], 
      cards:[],
      bank: 0,
    })
    return (await this.pockerService.findByRoomId(roomId)).id
  }

  



  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    const roomId = client.data.roomId;

    if (!userId || !roomId) {
      console.warn('Missing user or room info on disconnect');
      return;
    }
    
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { usersid: true },
    });

    const updatedUsers = room!.usersid.filter((id) => id !== userId);

    this.prisma.room.update({
      where: {id: Number(client.rooms)},
      data: {
        usersid: updatedUsers
      }
    })
    console.log(`Client disconnected: ${client.id}`);
  }
  





  @SubscribeMessage('joinTable')
    async handleJoinTable(client: Socket) {
    const roomId = client.data.roomId
    const userId = client.data.userId
    const roomPlayers = (await this.pockerService.findByRoomId(roomId)).playersid
    const player = await this.playersService.create({
      userid: userId,
      cards:[],
      roomid: roomId
    })
    roomPlayers.push(player.id)
    this.pockerService.updatePlayers(roomId, roomPlayers)

    this.server.to(roomId).emit('playerJoined', { roomPlayers });

    if(roomPlayers.length>=2)
      this.handleGameStart(client, roomPlayers)

  }

  async handleGameStart(client: Socket, roomPlayers: number[]){
    // Формуємо колоду карт
    const suits = ['♥', '♦', '♠', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '1', 'J', 'Q', 'K', 'A'];
    let deck: string[] = suits.flatMap(suit => ranks.map(rank => `${suit}${rank}`));

    const drawCard = () => {
      const idx = Math.floor(Math.random() * deck.length);
      const card = deck[idx];
      deck.splice(idx, 1);
      return card;
    };

    const pockerId = this.RoomTableMap.get(client.data.roomId)

    this.pockerService.update(pockerId!, {
      cards: [drawCard(),drawCard(),drawCard(),drawCard(),drawCard()]
    })

    await Promise.all(
      roomPlayers.map(playerId => 
        this.playersService.update(playerId, {
          cards: [drawCard(), drawCard()]
        })
      )
    );
  }
}