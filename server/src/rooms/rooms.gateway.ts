import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { steptype as StepTypeEnum, step,players,poker} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PlayerService } from '../player/player.service';
import { UserService } from '../User/user.service';
import { PockerService } from '../pocker/pocker.service';
import { StepService } from '../step/step.service';
import { error, table } from 'console';
import { first } from 'rxjs';
import e from 'express';

@WebSocketGateway({ namespace: '/rooms', cors: { origin: 'http://localhost:5173', credentials: true } })

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
  private RoomPlayersMap = new Map<number, players[]>();

  async handleConnection(client: Socket) {
    const { wsUserId, wsRoomId } = client.handshake.auth;
    let roomId: number;
    let userId: number;

    roomId = Number(wsRoomId)
    userId = Number(wsUserId)

    client.data.roomId = roomId;
    client.data.userId = userId;
    this.UseridSocketMap.set(userId, client)

    client.join(wsRoomId)
    this.server.to(wsRoomId).emit('userJoined', {userId})
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
    async handleJoinTable(client: Socket, userId: number) {
    const roomId = client.data.roomId
    let player = await this.playersService.create({
      userid: userId,
      cards: [],
      roomid: roomId,
    })
    let roomPlayers = this.RoomPlayersMap.get(roomId)
    if(roomPlayers)
      roomPlayers.push(player)
    else
      roomPlayers = [player]

    this.RoomPlayersMap.set(roomId, [player])
    
    if(roomPlayers.length>=2){
      this.server.to(String(roomId)).emit("prepare")
      const timeout = setTimeout(() => {
        this.handleGameStart(roomId, roomPlayers)
      }, 5000);
    }
  }

  async handleGameStart(roomId: number, roomPlayers: players[]){
    this.server.to(String(roomId)).emit("gameStarted", {roomPlayers})
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

    const poker = await this.pockerService.create({
      roomid: roomId,
      playersid: roomPlayers.map(player => player.id),
      cards: [],
      bank: 0
    });
    poker.cards = [drawCard(),drawCard(),drawCard(),drawCard(),drawCard()]

    for (const player of roomPlayers){
      const socket = this.UseridSocketMap.get(player.userid)
      if (socket){
        const cards = [drawCard(),drawCard()]
        socket.emit('yourCards', {cards})
        player.cards = cards
      }
    }

    this.handlePreflop( roomId, poker, roomPlayers)
  }


  async handleFold(playerId: number){
    this.playersService.updateStatus(playerId, false)
  }

  stepTypeDefine(lastStep: step|null, bet: number, balance: number){
    if (!lastStep)
      return StepTypeEnum.First;
    else if (bet === Number(lastStep.bet))
      return StepTypeEnum.Fold
    else if (bet === balance)
      return StepTypeEnum.Allin
    else if(lastStep.steptype == StepTypeEnum.Check && bet === Number(lastStep!.bet))
      return StepTypeEnum.Check;
    else if ((lastStep.steptype === StepTypeEnum.Raise && bet === Number(lastStep!.bet))||
             (lastStep.steptype === StepTypeEnum.ReRaise&&bet === Number(lastStep!.bet))||
             (lastStep.steptype === StepTypeEnum.First && bet === Number(lastStep!.bet)))
      return StepTypeEnum.Call;
    else if ((lastStep.steptype === StepTypeEnum.Check && bet > Number(lastStep!.bet))||
             (lastStep.steptype === StepTypeEnum.First && bet > Number(lastStep!.bet)))
      return StepTypeEnum.Raise;
    else if ((lastStep.steptype === StepTypeEnum.Raise && bet > Number(lastStep!.bet)))
      return StepTypeEnum.ReRaise;

    return StepTypeEnum.Fold
  }

  async betCircle(roomId: number, poker: poker, roomPlayers: players[],lastStep: step | null = null){
    for (const player of roomPlayers) {
      if(!player.status) return;// skip if player is loose or fold

      const socket = await this.UseridSocketMap.get(player.userid)!
      const user = await this.usersService.finByPlayer(player)
      
      const maxBet = Number(user!.mybalance)
      const prewBet = await this.stepService.findPlayerLastStepByPockerId(poker.id, player.id)
      let currMaxBet: number  
      if(prewBet)
        currMaxBet = maxBet-Number(prewBet.bet)
      else
        currMaxBet = maxBet
      this.server.to(String(roomId)).emit('playerTurn', currMaxBet);

      await new Promise<void>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (resolved) return;
          resolved = true;
          socket.removeAllListeners('myStep');
          player.status = false
          if(!lastStep)
            resolve()
          resolve(); 
        }, 30000); // 30 сек
        
        socket.removeAllListeners('myStep');
        socket.on('myStep', async (currentBet: number) => {
          let bet: number = currentBet;
          
          if (prewBet)
            bet += Number(prewBet.bet);
          if (bet > maxBet)
            bet = maxBet;
          const steptype: StepTypeEnum = this.stepTypeDefine(lastStep, bet, Number(maxBet));

          lastStep = await this.stepService.create({
            pockerid: poker.id,
            playerid: player.id,
            bet: currentBet,
            maxbet: maxBet,
            steptype: steptype,
          });

          if (lastStep.steptype === StepTypeEnum.Fold)
            player.status = false; 
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
          
          const steptype: StepTypeEnum = this.stepTypeDefine(lastStep, bet, Number(user!.mybalance))

          if(steptype === StepTypeEnum.Check || 
             steptype === StepTypeEnum.Call  ||
             (steptype === StepTypeEnum.Allin&&Number(lastStep!.bet) >= bet)){
             socket.emit('stepError', 'No Raise')
             return;
             }
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          socket.removeAllListeners('myStep');
                    
          lastStep = await this.stepService.create({
            pockerid: pockerId,
            playerid: playerId,
            bet: bet,
            maxbet: maxBet,
            steptype: steptype,
          })
          resolve()
        });
      }).then(()=>{
        this.server.to(String(socket.data.roomId)).emit('stepDone', {lastStep});
      });
    }
  }

  async handlePreflop(roomId: number, poker: poker, roomPlayers: players[]){
    this.server.to(String(roomId)).emit("preFlopStarted", {roomPlayers})
    this.betCircle(roomId, poker, roomPlayers)
    // this.balancingCircle( pockerId, roomPlayers)
    // const cardsToOpen: String[] = (await this.pockerService.findById(pockerId)!).cards.slice(0, 3)
    // this.server.to(String(roomId)).emit('preFlopEND', {cardsToOpen});
    // this.handleFlop(roomId, pockerId, roomPlayers)
  }

  // async handleFlop(roomId: number, poker: poker, roomPlayers: players[]){
  //   this.betCircle(roomId, poker, roomPlayers)
  //   this.balancingCircle( pockerId, roomPlayers)
  //   const cardsToOpen: String = (await this.pockerService.findById(pockerId)!).cards[3]
  //   this.server.to(String(roomId)).emit('flopEND', {cardsToOpen});
  //   this.handleTurn(roomId, pockerId, roomPlayers)
  // }

  // async handleTurn(roomId: number, pockerId: number, roomPlayers: number[]){
  //   this.betCircle(pockerId, roomPlayers)
  //   this.balancingCircle( pockerId, roomPlayers)
  //   const cardsToOpen: String = (await this.pockerService.findById(pockerId)!).cards[4]
  //   this.server.to(String(roomId)).emit('Turn', {cardsToOpen});
  //   this.handleRiver(roomId, pockerId, roomPlayers)
  // }  

  // async handleRiver(roomId: number, pockerId: number, roomPlayers: number[]){
  //   this.betCircle(pockerId, roomPlayers)
  //   this.balancingCircle( pockerId, roomPlayers)
  //   this.server.to(String(roomId)).emit('River');
  // } 
}