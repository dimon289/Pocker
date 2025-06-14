import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { steptype as StepTypeEnum, step} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PlayerService } from '../player/player.service';
import { UserService } from '../User/user.service';
import { PockerService } from '../pocker/pocker.service';
import { StepService } from '../step/step.service';
import { error } from 'console';
import { first } from 'rxjs';

@WebSocketGateway({
  cors: { origin: 'http://142.93.175.150' }, // Налаштуй CORS відповідно до потреб
})

@WebSocketGateway({ namespace: '/rooms', cors: true })
@Injectable()
export class RoomsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(  
    private readonly prisma: PrismaService,
    private readonly playersService: PlayerService,
    private readonly usersService: UserService,
    private readonly pockerService: PockerService,
    private readonly stepService: StepService
  ) {}

  private UseridSocketMap = new Map<number, Socket>();
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
    client.data.isActive = false;

    const roomExists = this.server.sockets.adapter.rooms.has(wsRoomId);
    if (!roomExists) {
      this.UseridSocketMap.set(userId,client);
      client.join(wsRoomId);
      let TableId = await this.handleTableCreate(roomId)
      this.RoomTableMap.set(roomId, TableId)
    }

    this.UseridSocketMap.set(userId,client);
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
    client.data.isActive = true

    this.server.to(String(roomId)).emit('playerJoined', { roomPlayers });

    if(roomPlayers.length>=2)
      this.handleGameStart(roomId, roomPlayers)

  }

  async handleGameStart(roomId: number, roomPlayers: number[]){
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

    const pockerId = await this.RoomTableMap.get(roomId)

    await this.pockerService.update(pockerId!, {
      cards: [drawCard(),drawCard(),drawCard(),drawCard(),drawCard()]
    })

    await Promise.all(
      roomPlayers.map(async (playerId) => {
        const cards = [drawCard(), drawCard()]

        this.playersService.update(playerId, {
          cards: cards
        })

        const player = await this.playersService.findById(playerId);
        const socket = await this.UseridSocketMap.get(player!.userid)

        socket!.emit('yourCards', {cards})
      }
      )
    );

    this.handlePreflop( roomId, pockerId!, roomPlayers)
  }

  async betCircle(pockerId: number, roomPlayers: number[],lastStep: step | null = null){
    for (const playerId of roomPlayers) {
      const player = await this.playersService.findById(playerId);
      const socket = await this.UseridSocketMap.get(player!.userid)!
      this.server.to(String(socket.data.roomId)).emit('playerTurn', {player});

      await new Promise<void>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (resolved) return;
          resolved = true;
          socket.removeAllListeners('myStep');
          socket.data.isActive = false
          resolve(); // ЗРОБИТИ ПРОГРАШ
        }, 30000); // 30 сек
        
        socket.removeAllListeners('myStep');
        socket.on('myStep', async (bet: number) => {
          const user = await this.usersService.finByPlayer(player!)
          const maxBet = Number(user!.mybalance)
          if (bet>Number(user!.mybalance))
            bet = maxBet;
          
          let steptype: StepTypeEnum = StepTypeEnum.Fold;
          if (!lastStep)
            steptype = StepTypeEnum.First;
          else if (bet === Number(user!.mybalance))
            steptype = StepTypeEnum.Allin
          else if(lastStep.steptype == StepTypeEnum.Check && bet === Number(lastStep!.bet))
            steptype = StepTypeEnum.Check;
          else if ((lastStep.steptype === StepTypeEnum.Raise && bet === Number(lastStep!.bet))||
                   (lastStep.steptype === StepTypeEnum.ReRaise&&bet === Number(lastStep!.bet))||
                   (lastStep.steptype === StepTypeEnum.First && bet === Number(lastStep!.bet)))
            steptype = StepTypeEnum.Call;
          else if ((lastStep.steptype === StepTypeEnum.Check && bet > Number(lastStep!.bet))||
                   (lastStep.steptype === StepTypeEnum.First && bet > Number(lastStep!.bet)))
            steptype = StepTypeEnum.Raise;
          else if ((lastStep.steptype === StepTypeEnum.Raise && bet > Number(lastStep!.bet)))
            steptype = StepTypeEnum.ReRaise;

          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          socket.removeAllListeners('myStep');
          
          await this.stepService.create({
            pockerid: pockerId,
            playerid: playerId,
            bet: bet,
            maxbet: maxBet,
            steptype: steptype,
          })
          lastStep = (await this.stepService.findLastActiveByPockerId(pockerId))!

          await this.prisma.balance.create({
            data:{
              stepid:lastStep.id,
              userid:user!.id,
              balancetype: false,
              bet: bet
            }
          })
          resolve()
        });
      }).then(()=>{
        this.server.to(String(socket.data.roomId)).emit('stepDone', {lastStep});
      });
    }
  }

  async balancingCircle(pockerId: number, roomPlayers: number[],lastStep: step | null = null){
    for (const playerId of roomPlayers) {
      const player = await this.playersService.findById(playerId);
      const socket = await this.UseridSocketMap.get(player!.userid)!
      this.server.to(String(socket.data.roomId)).emit('playerTurn', {player});

      if (socket.data.isActive === false)
        return;

      await new Promise<void>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (resolved) return;
          resolved = true;
          socket.removeAllListeners('myStep');
          resolve(); // ЗРОБИТИ ПРОГРАШ
        }, 30000); // 30 сек
        
        socket.removeAllListeners('myStep');
        socket.on('myStep', async (bet: number) => {
          const user = await this.usersService.finByPlayer(player!)
          const maxBet = Number(user!.mybalance)

          if (bet>Number(user!.mybalance))
            bet = maxBet
          
          let steptype: StepTypeEnum = StepTypeEnum.Fold;
          if (!lastStep)
            steptype = StepTypeEnum.First
          else if (bet === Number(user!.mybalance))
            steptype = StepTypeEnum.Allin
          else if(lastStep.steptype == StepTypeEnum.Check && bet === Number(lastStep!.bet))
            steptype = StepTypeEnum.Check;
          else if ((lastStep.steptype === StepTypeEnum.Raise && bet === Number(lastStep!.bet))||
                   (lastStep.steptype === StepTypeEnum.ReRaise&&bet === Number(lastStep!.bet))||
                   (lastStep.steptype === StepTypeEnum.First && bet === Number(lastStep!.bet)))
            steptype = StepTypeEnum.Call;
          else if ((lastStep.steptype === StepTypeEnum.Check && bet > Number(lastStep!.bet))||
                   (lastStep.steptype === StepTypeEnum.First && bet > Number(lastStep!.bet)))
            steptype = StepTypeEnum.Raise;
          else if ((lastStep.steptype === StepTypeEnum.Raise && bet > Number(lastStep!.bet)))
            steptype = StepTypeEnum.ReRaise;

          if(steptype === StepTypeEnum.Check || 
             steptype === StepTypeEnum.Call  ||
             (steptype === StepTypeEnum.Allin&&Number(lastStep!.bet) >= bet)){
             socket.emit('NoRaise')
             return;
             }
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          socket.removeAllListeners('myStep');
                    
          await this.stepService.create({
            pockerid: pockerId,
            playerid: playerId,
            bet: bet,
            maxbet: maxBet,
            steptype: steptype,
          })
          lastStep = (await this.stepService.findLastActiveByPockerId(pockerId))!

          await this.prisma.balance.create({
            data:{
              stepid:lastStep.id,
              userid:user!.id,
              balancetype: false,
              bet: bet
            }
          })

          resolve()
        });
      }).then(()=>{
        this.server.to(String(socket.data.roomId)).emit('stepDone', {lastStep});
      });
    }
  }

  async handlePreflop(roomId: number, pockerId: number, roomPlayers: number[]){
    this.betCircle(pockerId, roomPlayers)
    this.balancingCircle( pockerId, roomPlayers)
    const cardsToOpen: String[] = (await this.pockerService.findById(pockerId)!).cards.slice(0, 3)
    this.server.to(String(roomId)).emit('preFlopEND', {cardsToOpen});
    this.handleFlop(roomId, pockerId, roomPlayers)
  }

  async handleFlop(roomId: number, pockerId: number, roomPlayers: number[]){
    this.betCircle(pockerId, roomPlayers)
    this.balancingCircle( pockerId, roomPlayers)
    const cardsToOpen: String = (await this.pockerService.findById(pockerId)!).cards[3]
    this.server.to(String(roomId)).emit('flopEND', {cardsToOpen});
    this.handleTurn(roomId, pockerId, roomPlayers)
  }

  async handleTurn(roomId: number, pockerId: number, roomPlayers: number[]){
    this.betCircle(pockerId, roomPlayers)
    this.balancingCircle( pockerId, roomPlayers)
    const cardsToOpen: String = (await this.pockerService.findById(pockerId)!).cards[4]
    this.server.to(String(roomId)).emit('Turn', {cardsToOpen});
    this.handleRiver(roomId, pockerId, roomPlayers)
  }  

  async handleRiver(roomId: number, pockerId: number, roomPlayers: number[]){
    this.betCircle(pockerId, roomPlayers)
    this.balancingCircle( pockerId, roomPlayers)
    this.server.to(String(roomId)).emit('River');
  } 
}