import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { steptype as StepTypeEnum, step,players,poker, room, roomstatus, steptype} from '@prisma/client';
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
    private readonly roomsService: RoomsService,
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
    const roomUsers:number[] = await this.roomsService.updateRoomUsersById(userId, roomId)
    
    let roomPlayers = this.RoomPlayersMap.get(roomId)
    let playersUsersId
    if(!roomPlayers)
      playersUsersId = []
    else
      playersUsersId = await Promise.all(roomPlayers.map(async(player) => {
            const user = await this.usersService.findId(String(player.userid))
            return {
              id: player.id,
              userid: player.userid,
              cards:[],
              status: player.status,
              roomId: player.roomid
            };
      }))
    client.join(wsRoomId)
    this.server.to(wsRoomId).emit('userJoined', {usersId: roomUsers, roomPlayers: playersUsersId})
  }


  async handleDisconnect(client: Socket) {
    const userId: number = client.data.userId;
    const roomId: number = client.data.roomId;
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { usersid: true },
    });
    let players: players[] | undefined = this.RoomPlayersMap.get(roomId)

    if((await this.prisma.room.findUnique({where:{id: roomId}}))?.status !== roomstatus.Playing ){
      if(players){
        players = players.filter((player)=>player.userid!==userId)
        this.RoomPlayersMap.set(roomId,players)
      }
    }
    const updatedUsers: number[] = room!.usersid.filter((id) => id !== userId);
    await this.prisma.room.update({
      where: {id: roomId},
      data: {
        usersid: updatedUsers
      }
    })
    this.server.to(String(roomId)).emit("Client_disconnected", {userId: userId, updatedUsers: updatedUsers, players: players});
  }

  async handleReconnect(client: Socket){
    // this.UseridSocketMap.set(userId, client)
  }

  @SubscribeMessage('joinTable')
  async handleJoinTable(client: Socket, userId: number) {
    const allPlayingUsers:number[] = []
    this.RoomPlayersMap.forEach(room => {
      room.forEach(player => {
        allPlayingUsers.push(player.userid)
      })
    });
    if(allPlayingUsers.includes(userId)){
      return client.emit('you already playing')
    }
    
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
        this.RoomPlayersMap.set(roomId, roomPlayers)
        this.server.to(String(client.data.roomId)).emit("TableJoined", {player:player , roomPlayers:roomPlayers})
        
    }
    else{
      roomPlayers = [player]
      this.RoomPlayersMap.set(roomId, roomPlayers)
      this.server.to(String(client.data.roomId)).emit("TableJoined", {player:player , roomPlayers:roomPlayers})
    }
    
    if(roomPlayers.length==2){
      this.server.to(String(roomId)).emit("prepare")
      const timeout = setTimeout(() => {
        
        if(this.RoomPlayersMap.get(roomId)!.length>=2)
          this.handleGameStart(roomId, roomPlayers)
        else{
          clearTimeout(timeout)
          this.server.to(String(client.data.roomId)).emit("notEnoughtPlayers")
        }
      }, 5000);
    }

    client.on('leaveTable', (client: Socket)=>{
      this.server.to(String(client.data.roomId)).emit('gameIsStartingIn5Seconds')
      let roomPlayers = this.RoomPlayersMap.get(client.data.roomId)!
      roomPlayers = roomPlayers.filter((player)=>player.userid!==userId)
      this.RoomPlayersMap.set(client.data.roomId, roomPlayers)
      this.server.to(String(client.data.roomId)).emit('userLeavedTable', {roomPlayers:roomPlayers})
    })
    
  }


  @SubscribeMessage('balanceUp')
  async handleBalanceUp(client: Socket){
    const user = await this.prisma.users.update({where:{id: client.data.userId}, data:{mybalance: 100}})
  }

  async handleGameStart(roomId: number, roomPlayers: players[]){
    console.warn("start")
    this.server.to(String(roomId)).emit("gameStarted", {roomPlayers})
    roomPlayers.forEach(player => {
      this.UseridSocketMap.get(player.userid)?.removeAllListeners('leaveTable')
    }); 
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
      bank: 0,
      stepsid:[]
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

  stepTypeDefine(lastStep: step|undefined, currBet:number, Bet: number, balance: number){
    // console.warn('lastStep.steptype: '+lastStep?.steptype + ' lastStep.bet: ' + lastStep?.bet + ' currBet: '+currBet+' Bet:'+Bet+' balance: '+balance)
    console.warn(lastStep)
    if (!lastStep)
      return StepTypeEnum.First;

    const lastBet = Math.round(Number(lastStep.bet)*100)/100
    if (Bet === balance)
      return StepTypeEnum.Allin

    if(lastStep.steptype === StepTypeEnum.Check && lastBet == Bet)
      return StepTypeEnum.Check;
    // console.warn('lastStep.steptype === StepTypeEnum.First: ' + (lastStep.steptype === StepTypeEnum.First) + ' Bet === Number(lastStep.bet): '+ (Bet === Number(lastStep.bet)))
    if ((lastStep.steptype === StepTypeEnum.Raise && Bet === lastBet)||
             (lastStep.steptype === StepTypeEnum.ReRaise&&Bet === lastBet)||
             (lastStep.steptype === StepTypeEnum.Allin && Bet === lastBet)||
             (lastStep.steptype === StepTypeEnum.First && Bet === lastBet))
      return StepTypeEnum.Call;
    
    if (Bet > lastBet&&lastStep.steptype === StepTypeEnum.Raise)
      return StepTypeEnum.ReRaise;

    if (Bet > lastBet)
      return StepTypeEnum.Raise;

    if (currBet === 0 && lastStep.steptype !== StepTypeEnum.Check)
      return StepTypeEnum.Fold

    return StepTypeEnum.Fold
  }

  async betCircle(roomId: number, poker: poker, roomPlayers: players[],lastStep: step | undefined = undefined){

    for (const player of roomPlayers) {
      if(!player.status) continue;// skip if player is loose or fold

      const socket = this.UseridSocketMap.get(player.userid)!
      const user = await this.usersService.finByPlayer(player)
      
      const maxBet = Math.round(Number(user!.mybalance)*100)/100
      const prewStep = await this.stepService.findPlayerLastStepByPockerId(poker.id, player.id)
      let lastBet:number, prewBet: number
      let biggestBet = (await this.stepService.findBiggestBet(poker.id))
      let currMaxBet: number, currMinBet: number
        
      if(prewStep){
        prewBet = Math.round(Number(prewStep.bet)*100)/100
        lastBet = Math.round(Number(lastStep!.bet)*100)/100
        currMaxBet = maxBet-prewBet
        currMinBet = (biggestBet - prewBet)
      }
      else{
        currMaxBet = maxBet
        currMinBet = biggestBet 
      }
      if(biggestBet){
        if (biggestBet>currMaxBet) 
          currMinBet = currMaxBet          
      }else
        currMinBet = 0.05
      


      this.server.to(String(roomId)).emit('playerTurn', {playerId: player.id});

      let Step: step
      await new Promise<step>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(async () => {
          if (resolved) return;
          resolved = true;
          socket.removeAllListeners('myStep');
          player.status = false
          if(!prewStep){
            Step = await this.stepService.create({
              pockerid: poker.id,
              playerid: player.id,
              bet: 0.05,
              maxbet: maxBet,
              steptype: StepTypeEnum.Fold,
            });
            poker.bank += 0.05;
          }else{
          Step = await this.stepService.create({
            pockerid: poker.id,
            playerid: player.id,
            bet: prewBet,
            maxbet: maxBet,
            steptype: StepTypeEnum.Fold,
          });}
          resolve(Step); 
        }, 30000); // 30 сек
        
        
        socket.emit('makeYourStep', {currMaxBet: currMaxBet, currMinBet: currMinBet})
        socket.removeAllListeners('myStep');
        socket.on('myStep', async (currentBet: number) => {
          currentBet = Math.round(currentBet*100)/100
          let bet: number = currentBet;
          
          if (prewStep)
            bet += prewBet;
          if (bet > maxBet)
            bet = maxBet;
          if (bet < 0){
            bet = 0.05;
            player.status = false;
          }
          bet = Math.round(bet*100)/100
          const steptype: StepTypeEnum = this.stepTypeDefine(Step,currentBet, bet, maxBet);

          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          socket.removeAllListeners('myStep');

          Step = await this.stepService.create({
            pockerid: poker.id,
            playerid: player.id,
            bet: bet,
            maxbet: maxBet,
            steptype: steptype,
          });
          Step
          poker.bank += currentBet;

          if (Step.steptype === StepTypeEnum.Fold||Step.steptype ===StepTypeEnum.Allin)
            player.status = false; 
          resolve(Step)
        });
      }).then(()=>{
        poker.stepsid.push(Step!.id)
        if (lastStep) {
          if(biggestBet<Number(Step.bet))
            lastStep = Step
        }else
          lastStep = Step

        this.server.to(String(socket.data.roomId)).emit('stepDone', {lastStep: Step, bank: poker.bank});

      });
    }
    return lastStep
  }

  async balancingCircle(roomId: number, poker: poker, roomPlayers: players[],lastStep: step | undefined){
    for (const player of roomPlayers) {
      if(!player.status) continue;// skip if player is loose or fold
      if(Math.round(Number((await this.stepService.findPlayerLastStepByPockerId(poker.id, player.id))!.bet)*100)/100 === Math.round(Number(lastStep!.bet)*100)/100)
        continue

      const socket = this.UseridSocketMap.get(player.userid)!
      const user = await this.usersService.finByPlayer(player)
      
      const maxBet = Math.round(Number(user!.mybalance)*100)/100
      const prewStep = await this.stepService.findPlayerLastStepByPockerId(poker.id, player.id)
      let lastBet:number, prewBet: number
      let biggestBet = (await this.stepService.findBiggestBet(poker.id))
      let currMaxBet: number, currMinBet: number
        
      if(prewStep){
        prewBet = Math.round(Number(prewStep.bet)*100)/100
        lastBet = Math.round(Number(lastStep!.bet)*100)/100
        currMaxBet = maxBet-prewBet
        currMinBet = (lastBet - prewBet)
      }
      else{
        currMaxBet = maxBet
      }
      if(biggestBet){
        currMinBet = biggestBet
        if (biggestBet>currMaxBet) 
          currMinBet = currMaxBet          
      }
      
      this.server.to(String(roomId)).emit('playerTurn', currMaxBet);

      let Step: step
      await new Promise<step>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(async () => {
          if (resolved) return;
          resolved = true;
          socket.removeAllListeners('myStep');
          player.status = false
          Step = await this.stepService.create({
            pockerid: poker.id,
            playerid: player.id,
            bet: prewBet,
            maxbet: maxBet,
            steptype: StepTypeEnum.Fold,
          });
          resolve(Step); 
        }, 30000); // 30 sec technical loose 

        socket.emit('willYouBalance', {currMaxBet: currMaxBet, currMinBet: currMinBet})
        socket.removeAllListeners('myStep');
        socket.on('onmyStep', async (balancing: boolean) => {
          currMinBet = Math.round(currMinBet*100)/100
          let currentBet = prewBet
          let steptype: StepTypeEnum
          if(balancing){
            currentBet = currMinBet
            if(currMaxBet < biggestBet)
              steptype = StepTypeEnum.Allin
            if(currentBet<=biggestBet)
              steptype = StepTypeEnum.Call
            if(currentBet===biggestBet)
              steptype = StepTypeEnum.Check

            Step = await this.stepService.create({
              pockerid: poker.id,
              playerid: player.id,
              bet: currMinBet,
              maxbet: maxBet,
              steptype: steptype!,
            });
          }else{
            Step = await this.stepService.create({
              pockerid: poker.id,
              playerid: player.id,
              bet: currentBet,
              maxbet: maxBet,
              steptype: StepTypeEnum.Fold,
            });
          }    
          
          poker.bank += currentBet;

          if (Step.steptype === StepTypeEnum.Fold||Step.steptype ===StepTypeEnum.Allin)
            player.status = false; 
          resolve(Step)
        });
      }).then(()=>{
        poker.stepsid.push(Step!.id)
        if (lastStep) {
          if(biggestBet<Number(Step.bet))
            lastStep = Step
        }else
          lastStep = Step
        this.server.to(String(socket.data.roomId)).emit('stepDone', {lastStep: Step});

      });
    }
    return lastStep
  }

  async handlePreflop(roomId: number, poker: poker, roomPlayers: players[]){
    this.server.to(String(roomId)).emit("preFlopStarted", {roomPlayers})
    let lastStep = await this.betCircle(roomId, poker, roomPlayers)
    console.warn('preFlop betCirle End')
    lastStep = await this.balancingCircle(roomId, poker, roomPlayers, lastStep)
    console.warn('preFlop balancingCircle End')
    this.server.to(String(roomId)).emit('preFlopEND');
    await this.handleFlop(roomId, poker, roomPlayers, lastStep)
  }

  async handleFlop(roomId: number, poker: poker, roomPlayers: players[], lastStep: step | undefined){
    console.warn('Flop started')
    console.warn(lastStep)
    this.server.to(String(roomId)).emit("FlopStarted", {cards: [poker.cards[0],poker.cards[1],poker.cards[2]]})
    lastStep = await this.betCircle(roomId, poker, roomPlayers, lastStep)
    console.warn('Flop betCirle End')
    lastStep = await this.balancingCircle(roomId, poker, roomPlayers, lastStep)
    console.warn('Flop balancingCircle End')
    this.server.to(String(roomId)).emit('FlopEND');
    await this.handleTurn(roomId, poker, roomPlayers, lastStep)
  }

  async handleTurn(roomId: number, poker: poker, roomPlayers: players[], lastStep){
    console.warn('Turn started')
    console.warn(lastStep)
    this.server.to(String(roomId)).emit("TurnStarted", {cards: [poker.cards[3]]})
    lastStep = await this.betCircle(roomId, poker, roomPlayers, lastStep)
    console.warn('Turn betCirle End')
    lastStep = await this.balancingCircle(roomId, poker, roomPlayers, lastStep)
    console.warn('Turn balancingCircle End')
    this.server.to(String(roomId)).emit('TurnEND');
    await this.handleRiver(roomId, poker, roomPlayers, lastStep)
  }  

  async handleRiver(roomId: number, poker: poker, roomPlayers: players[], lastStep){
    console.warn('River started')
    console.warn(lastStep)
    this.server.to(String(roomId)).emit("RiverStarted", {cards: [poker.cards[4]]})
    lastStep = await this.betCircle(roomId, poker, roomPlayers, lastStep)
    console.warn('River betCirle End')
    lastStep = await this.balancingCircle(roomId, poker, roomPlayers, lastStep)
    console.warn('River balancingCircle End')
    this.server.to(String(roomId)).emit('RiverEND');
    await this.handleShowdown(roomId, poker, roomPlayers, lastStep)
  } 
  async handleShowdown(roomId: number, poker: poker, roomPlayers: players[], lastStep){
    this.server.to(String(roomId)).emit('Showdown'); 
    // const PlayerCombinationMap = new Map<players, >
  }
}