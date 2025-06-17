import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { steptype as StepTypeEnum, step,players,poker} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PlayerService } from '../player/player.service';
import { UserService } from '../User/user.service';
import { PockerService } from '../pocker/pocker.service';
import { StepService } from '../step/step.service';
import { RoomsService } from './rooms.service';
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
    private readonly stepService: StepService,
    private readonly roomsServie: RoomsService,
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
    const roomUsers:number[] = await this.roomsServie.updateRoomUsersById(userId, roomId) 

    client.join(wsRoomId)
    this.server.to(wsRoomId).emit('userJoined', {usersId: roomUsers})
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
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { usersid: true },
    });
    
    const updatedUsers = room!.usersid.filter((id) => id !== userId);
    await this.prisma.room.update({
      where: {id: roomId},
      data: {
        usersid: updatedUsers
      }
    })
    this.server.to(String(roomId)).emit("Client_disconnected", {userId: userId});
  }

  async handleReconnect(client: Socket){
    // this.UseridSocketMap.set(userId, client)
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
    if(roomPlayers){
      if (roomPlayers.length >= 6)
        client.emit("TableFull")
      else
        roomPlayers.push(player)
    }
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

      const socket = this.UseridSocketMap.get(player.userid)!
      const user = await this.usersService.finByPlayer(player)
      
      const maxBet = Number(user!.mybalance)
      const prewBet = await this.stepService.findPlayerLastStepByPockerId(poker.id, player.id)
      let currMaxBet: number  
      if(prewBet){
        currMaxBet = maxBet-Number(prewBet.bet)
        if (currMaxBet <= 0.05) 
          return;
      }
      else
        currMaxBet = maxBet
      this.server.to(String(roomId)).emit('playerTurn', currMaxBet);

      await new Promise<void>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(async () => {
          if (resolved) return;
          resolved = true;
          socket.removeAllListeners('myStep');
          player.status = false
          if(!prewBet){
            lastStep = await this.stepService.create({
              pockerid: poker.id,
              playerid: player.id,
              bet: 0.05,
              maxbet: maxBet,
              steptype: StepTypeEnum.Fold,
            });
            poker.bank += 0.05;
          }
          lastStep = await this.stepService.create({
            pockerid: poker.id,
            playerid: player.id,
            bet: Number(prewBet!.bet),
            maxbet: maxBet,
            steptype: StepTypeEnum.Fold,
          });
          resolve(); 
        }, 30000); // 30 сек
        
        socket.removeAllListeners('myStep');
        socket.on('myStep', async (currentBet: number) => {
          let bet: number = currentBet;
          
          if (prewBet)
            bet += Number(prewBet.bet);
          if (bet > maxBet)
            bet = maxBet;
          if (bet < 0){
            bet = 0.05;
            player.status = false;
          }
          const steptype: StepTypeEnum = this.stepTypeDefine(lastStep, bet, Number(maxBet));

          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          socket.removeAllListeners('myStep');

          lastStep = await this.stepService.create({
            pockerid: poker.id,
            playerid: player.id,
            bet: bet,
            maxbet: maxBet,
            steptype: steptype,
          });

          poker.bank += currentBet;

          if (lastStep.steptype === StepTypeEnum.Fold)
            player.status = false; 
          resolve()
        });
      }).then(()=>{
        this.server.to(String(socket.data.roomId)).emit('stepDone', {lastStep});
      });
    }
    return lastStep
  }

  async balancingCircle(roomId: number, poker: poker, roomPlayers: players[],lastStep: step | null = null){
    for (const player of roomPlayers) {
      if(!player.status) return;// skip if player is loose or fold

      const socket = this.UseridSocketMap.get(player.userid)!
      const user = await this.usersService.finByPlayer(player)
      
      const maxBet = Number(user!.mybalance)
      const prewBet = await this.stepService.findPlayerLastStepByPockerId(poker.id, player.id)
      let currMaxBet: number  
      if(prewBet){
        currMaxBet = maxBet-Number(prewBet.bet)
        if (Number(prewBet.bet) >= await this.stepService.findBiggestBet(poker.id)||currMaxBet === 0)
          return;
      }
      else
        currMaxBet = maxBet

      this.server.to(String(roomId)).emit('playerTurn', currMaxBet);

      await new Promise<void>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(async () => {
          if (resolved) return;
          resolved = true;
          socket.removeAllListeners('myStep');
          player.status = false
          if(!prewBet){
            lastStep = await this.stepService.create({
              pockerid: poker.id,
              playerid: player.id,
              bet: 0.05,
              maxbet: maxBet,
              steptype: StepTypeEnum.Fold,
            });
            poker.bank += 0.05;
          }
          lastStep = await this.stepService.create({
            pockerid: poker.id,
            playerid: player.id,
            bet: Number(prewBet!.bet),
            maxbet: maxBet,
            steptype: StepTypeEnum.Fold,
          });
          resolve(); 
        }, 30000); // 30 sec technical loose 
        
        socket.removeAllListeners('myStep');
        socket.on('myStep', async (currentBet: number) => {
          let bet: number = currentBet;
          
          if (prewBet)
            bet += Number(prewBet.bet);
          if (bet > maxBet)
            bet = maxBet;
          const steptype: StepTypeEnum = this.stepTypeDefine(lastStep, bet, Number(maxBet));

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
    return lastStep
  }

  async handlePreflop(roomId: number, poker: poker, roomPlayers: players[]){
    this.server.to(String(roomId)).emit("preFlopStarted", {roomPlayers})
    let lastStep = await this.betCircle(roomId, poker, roomPlayers)
    lastStep = await this.balancingCircle(roomId, poker, roomPlayers, lastStep)
    this.server.to(String(roomId)).emit('preFlopEND');
    this.handleFlop(roomId, poker, roomPlayers, lastStep)
  }

  async handleFlop(roomId: number, poker: poker, roomPlayers: players[], lastStep){
    this.server.to(String(roomId)).emit("FlopStarted", {cards: [poker.cards[0],poker.cards[1],poker.cards[2]]})
    lastStep = await this.betCircle(roomId, poker, roomPlayers, lastStep)
    lastStep = await this.balancingCircle(roomId, poker, roomPlayers, lastStep)
    this.server.to(String(roomId)).emit('FlopEND');
    this.handleTurn(roomId, poker, roomPlayers, lastStep)
  }

  async handleTurn(roomId: number, poker: poker, roomPlayers: players[], lastStep){
    this.server.to(String(roomId)).emit("TurnStarted", {cards: [poker.cards[3]]})
    lastStep = await this.betCircle(roomId, poker, roomPlayers, lastStep)
    lastStep = await this.balancingCircle(roomId, poker, roomPlayers, lastStep)
    this.server.to(String(roomId)).emit('TurnEND');
    this.handleRiver(roomId, poker, roomPlayers, lastStep)
  }  

  async handleRiver(roomId: number, poker: poker, roomPlayers: players[], lastStep){
    this.server.to(String(roomId)).emit("RiverStarted", {cards: [poker.cards[4]]})
    lastStep = await this.betCircle(roomId, poker, roomPlayers, lastStep)
    lastStep = await this.balancingCircle(roomId, poker, roomPlayers, lastStep)
    this.server.to(String(roomId)).emit('RiverEND');
    this.handleShowdown(roomId, poker, roomPlayers, lastStep)
  } 
  async handleShowdown(roomId: number, poker: poker, roomPlayers: players[], lastStep){
    this.server.to(String(roomId)).emit('Showdown');  
  }
}