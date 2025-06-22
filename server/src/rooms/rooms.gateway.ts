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
import { use } from 'passport';

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

  stepTypeDefine(lastStep: step|undefined, Bet: number, balance: number){
    if(Bet<0){
      return StepTypeEnum.Fold
    }
    if (!lastStep)
      return StepTypeEnum.First;

    const lastBet = Math.round(Number(lastStep.bet)*100)/100
    if (Bet === balance)
      return StepTypeEnum.Allin

    if(lastStep.steptype === StepTypeEnum.Check && lastBet == Bet)
      return StepTypeEnum.Check;
    
    if ((lastStep.steptype === StepTypeEnum.Raise && Bet === lastBet)||
        (lastStep.steptype === StepTypeEnum.ReRaise&&Bet === lastBet)||
        (lastStep.steptype === StepTypeEnum.Allin && Bet === lastBet)||
        (lastStep.steptype === StepTypeEnum.First && Bet === lastBet))
      return StepTypeEnum.Call;
    
    if (Bet > lastBet&&lastStep.steptype === StepTypeEnum.Raise)
      return StepTypeEnum.ReRaise;

    if (Bet > lastBet)
      return StepTypeEnum.Raise;

    return StepTypeEnum.Fold
  }

  async betCircle(roomId: number, poker: poker, roomPlayers: players[],lastStep: step | undefined = undefined){

    for (const player of roomPlayers) {
      if(!player.status) continue;// skip if player is loose or fold

      const socket = this.UseridSocketMap.get(player.userid)!
      const user = await this.usersService.finByPlayer(player)
      
      const maxBet = Math.round(Number(user!.mybalance)*100)/100
      const lastBet = Math.round(Number(lastStep!.bet)*100)/100
      const prewStep = await this.stepService.findPlayerLastStepByPockerId(poker.id, player.id)
      let minBet: number
      if(lastBet>maxBet)
        minBet = maxBet
      else
        minBet = lastBet

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
            bet: Math.round(Number(prewStep.bet)*100)/100,
            maxbet: maxBet,
            steptype: StepTypeEnum.Fold,
          });}
          resolve(Step); 
        }, 30000); // 30 сек
        
        
        socket.emit('makeYourStep', {maxBet: Math.round(maxBet*100)/100, minBet: Math.round(minBet*100)/100})
        socket.removeAllListeners('myStep');
        socket.on('myStep', async (bet: number) => {
          bet = Math.round(bet*100)/100
          
          if (bet > maxBet)
            bet = maxBet;
          if (bet < lastBet && lastBet<maxBet){
            bet = 0
            player.status = false;
          }
          bet = Math.round(bet*100)/100
          const steptype: StepTypeEnum = this.stepTypeDefine(lastStep, bet, maxBet);

          

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
          poker.bank += bet;

          if (Step.steptype === StepTypeEnum.Fold||Step.steptype ===StepTypeEnum.Allin)
            player.status = false; 
          resolve(Step)
        });
      }).then(()=>{
        this.usersService.updateUser(user!.email,{
          mybalance: maxBet - Number(Step.bet)
        })
        poker.stepsid.push(Step.id)
        if (lastStep) {
          if(lastBet<Number(Step.bet))
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
      
      this.server.to(String(roomId)).emit('playerTurn', {currMaxBet: Math.round(currMaxBet*100)/100})

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

        socket.emit('makeYourStep', {currMaxBet: Math.round(currMaxBet*100)/100, currMinBet: Math.round(currMinBet*100)/100})
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
        this.server.to(String(socket.data.roomId)).emit('stepDone', {lastStep: Step, bank: poker.bank});
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
    const PlayerCombinationMap = new Map<players, { combination: string; value: number }>();

    function handDefine(cards:string[], tableCards:string[]){
      const cardOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '1', 'j', 'q', 'k', 'a'];
      const fleshRoyale: string[][] = [['♥A','♥K','♥Q','♥J','♥1'],['♦A','♦K','♦Q','♦J','♦1'],['♠A','♠K','♠Q','♠J','♠1'],['♣A','♣K','♣Q','♣J','♣1']]
      let i = 100
      for(let combination of fleshRoyale){
        const isMatch = combination.every(card => cards.includes(card));
        if(isMatch) 
          return {combination: 'fleshRoyale', value: 1}
      }
      i-=1
      const streetFlash: string[][][] =
        [[['♥9','♥1','♥J','♥Q','♥K'],['♦9','♦1','♦J','♦Q','♦K'],['♠9','♠1','♠J','♠Q','♠K'],['♣9','♣1','♣J','♣Q','♣K']],
         [['♥8','♥9','♥1','♥J','♥Q'],['♦8','♦9','♦1','♦J','♦Q'],['♠8','♠9','♠1','♠J','♠Q'],['♣8','♣9','♣1','♣J','♣Q']],
         [['♥7','♥8','♥9','♥1','♥J'],['♦7','♦8','♦9','♦1','♦J'],['♠7','♠8','♠9','♠1','♠J'],['♣7','♣8','♣9','♣1','♣J']],
         [['♥7','♥8','♥9','♥1','♥J'],['♦7','♦8','♦9','♦1','♦J'],['♠7','♠8','♠9','♠1','♠J'],['♣7','♣8','♣9','♣1','♣J']],
         [['♥6','♥7','♥8','♥9','♥1'],['♦6','♦7','♦8','♦9','♦1'],['♠6','♠7','♠8','♠9','♠1'],['♣6','♣7','♣8','♣9','♣1']],
         [['♥5','♥6','♥7','♥8','♥9'],['♦5','♦6','♦7','♦8','♦9'],['♠5','♠6','♠7','♠8','♠9'],['♣5','♣6','♣7','♣8','♣9']],
         [['♥4','♥5','♥6','♥7','♥8'],['♦4','♦5','♦6','♦7','♦8'],['♠4','♠5','♠6','♠7','♠8'],['♣4','♣5','♣6','♣7','♣8']],
         [['♥3','♥4','♥5','♥6','♥7'],['♦3','♦4','♦5','♦6','♦7'],['♠3','♠4','♠5','♠6','♠7'],['♣3','♣4','♣5','♣6','♣7']],
         [['♥2','♥3','♥4','♥5','♥6'],['♦2','♦3','♦4','♦5','♦6'],['♠2','♠3','♠4','♠5','♠6'],['♣2','♣3','♣4','♣5','♣6']],
         [['♥A','♥2','♥3','♥4','♥5'],['♦A','♦2','♦3','♦4','♦5'],['♠A','♠2','♠3','♠4','♠5'],['♣A','♣2','♣3','♣4','♣5']]]

      for(let group of streetFlash){
        for(let combination of group){
          const isMatch = combination.every(card => cards.includes(card));
          if(isMatch) 
            return {combination: 'streetFlush', value: i}
        }
        i-=1
      }

      let allRanks: number[] = []
      let flush:string[] = []
      let flushCounter: string[][] = [[], [], [], []]; // 0 - ♥, 1 - ♦, 2 - ♠, 3 - ♣

      cards.forEach((card) => {
        const suit = card[0]; // масть

        if (suit === '♥') {
          flushCounter[0].push(card);
        } else if (suit === '♦') {
          flushCounter[1].push(card);
        } else if (suit === '♠') {
          flushCounter[2].push(card);
        } else if (suit === '♣') {
          flushCounter[3].push(card);
        }
      });

      flushCounter.sort((a,b)=> b.length - a.length)
      if (flushCounter[0].length>=5){
        flush = flushCounter[0]
        flush = flush.filter( card=> !tableCards.includes(card))
        flush.map((card)=> {
          if(card[1] === 'A')
            allRanks.push(14)
          else if(card[1] === 'K')
            allRanks.push(13)
          else if(card[1] === 'Q')
            allRanks.push(12)
          else if(card[1] === 'J')
            allRanks.push(11)
          else if(card[1] === '1')
            allRanks.push(10)
          else allRanks.push(Number(card[1]))
        })
        allRanks.sort((a,b) => b-a)
        return {combination:'flush',value: allRanks[0] }
      }

      allRanks = []
      let sameRanks: number[][] = []
      let rank: number = 0
      let pointer: number = 0

      for (let card of cards) {
        let rankChar = card.slice(1);
        let rank = 0;
        if (rankChar === '1') rank = 10;
        else if (rankChar === 'J') rank = 11;
        else if (rankChar === 'Q') rank = 12;
        else if (rankChar === 'K') rank = 13;
        else if (rankChar === 'A') rank = 14;
        else rank = Number(rankChar);
    
        allRanks.push(rank)
      }
      allRanks.sort((a, b)=> b - a)
      rank = allRanks[0]
      allRanks.splice(0,1)
      sameRanks.push([rank])
      while(allRanks.length!==0){
        if(allRanks[0]===rank)
          sameRanks[pointer].push(rank)
        else{
          rank = allRanks[0]
          sameRanks.push([rank])
          pointer+=1
        }
        allRanks.splice(0,1)
      }

      sameRanks.sort((a,b)=>b.length - a.length)
      if (sameRanks[0].length===4) 
        return{combination: 'kare', value: sameRanks[0][0]}
      else if (sameRanks[0].length===3 && sameRanks[1].length>2) {
        return{combination: 'fullHouse',value: sameRanks[0][0]*15+sameRanks[1][0]}
      }
        
      const street: string[][][] =
        [[['A','1','J','Q','K']],
         [['9','1','J','Q','K']],
         [['8','9','1','J','Q']],
         [['7','8','9','1','J']],
         [['6','7','8','9','1']],
         [['5','6','7','8','9']],
         [['4','5','6','7','8']],
         [['3','4','5','6','7']],
         [['2','3','4','5','6']],
         [['A','2','3','4','5']]]

      for(let group of street){
        for(let combination of group){
          const isMatch = combination.every(card => cards.includes(card));
          if(isMatch) 
            return {combination: 'street', value: i}
        }
        i-=1
      }

      if(sameRanks[0].length===3)
        return{combination: 'set', value: sameRanks[0][0]}
      else if(sameRanks[0].length===2){
        if(sameRanks[1].length === 2)
          return{combination: 'twoPairs', value: sameRanks[0][0]*15+sameRanks[1][0]}
        return{combination: 'pair', value: sameRanks[0][0]}
      }

      return{combination: 'HighestCard',value: sameRanks[0][0]}
    }
    
    let winner: players = roomPlayers[0]

    for (const player of roomPlayers) {
      const step = await this.stepService.findPlayerLastStepByPockerId(poker.id, player.id);
      if (step?.steptype !== StepTypeEnum.Fold) {
        const cards = poker.cards.concat(player.cards);
        const combination = handDefine(cards, poker.cards);
        PlayerCombinationMap.set(player, combination);
      }
    }
    console.warn('PlayerCombinationMap: '+PlayerCombinationMap)
    let fleshRoyales: players[] = []
    let streetFlushes: players[] = []
    let kares: players[] = []
    let fullHouses: players[] = []
    let flushes: players[] = []
    let streets: players[] = []
    let sets: players[] = []
    let twoPairs: players[] = []
    let pairs: players[] = []
    let highestCard: players[] = []
    for(const [key,value] of PlayerCombinationMap.entries()){
      if(PlayerCombinationMap.get(key)?.combination == 'fleshRoyale'){
        fleshRoyales.push(key)
        return
      }else if(PlayerCombinationMap.get(key)?.combination == 'streetFlush'){
        streetFlushes.push(key)
      }else if(PlayerCombinationMap.get(key)?.combination == 'kare'){
        kares.push(key)
      }else if(PlayerCombinationMap.get(key)?.combination == 'fullHouse'){
        fullHouses.push(key)
      }else if(PlayerCombinationMap.get(key)?.combination == 'flush'){
        flushes.push(key)
      }else if(PlayerCombinationMap.get(key)?.combination == 'street'){
        streets.push(key)
      }else if(PlayerCombinationMap.get(key)?.combination == 'set'){
        sets.push(key)
      }else if(PlayerCombinationMap.get(key)?.combination == 'twoPairs'){
        twoPairs.push(key)
      }else if(PlayerCombinationMap.get(key)?.combination == 'pair'){
        pairs.push(key)
      }else if(PlayerCombinationMap.get(key)?.combination == 'HighestCard'){
        highestCard.push(key)
      }
    };
    if(fleshRoyales.length>=1){
      winner = fleshRoyales[0]
    }else if(streetFlushes.length>=1){
      winner=streetFlushes[0]
       if(streetFlushes.length>1){
        streetFlushes.map(player=>{
          if (player!=winner) {
            if(PlayerCombinationMap.get(player)!.value>PlayerCombinationMap.get(winner)!.value)
              winner = player
          }
          
        })
      }
    }else if(kares.length>=1){
      winner=kares[0]
       if(kares.length>1){
        kares.map(player=>{
          if (player!=winner) {
            if(PlayerCombinationMap.get(player)!.value>PlayerCombinationMap.get(winner)!.value)
              winner = player
          }
          
        })
      }
    }else if(fullHouses.length>=1){
      winner=fullHouses[0]
       if(fullHouses.length>1){
        fullHouses.map(player=>{
          if (player!=winner) {
            if(PlayerCombinationMap.get(player)!.value>PlayerCombinationMap.get(winner)!.value)
              winner = player
          }
          
        })
      }
    }else if(fullHouses.length>=1){
      winner=fullHouses[0]
       if(fullHouses.length>1){
        fullHouses.map(player=>{
          if (player!=winner) {
            if(PlayerCombinationMap.get(player)!.value>PlayerCombinationMap.get(winner)!.value)
              winner = player
          }
          
        })
      }
    }else if(flushes.length>=1){
      winner=flushes[0]
       if(flushes.length>1){
        flushes.map(player=>{
          if (player!=winner) {
            if(PlayerCombinationMap.get(player)!.value>PlayerCombinationMap.get(winner)!.value)
              winner = player
          }
          
        })
      }
    }else if(streets.length>=1){
      winner=streets[0]
       if(streets.length>1){
        streets.map(player=>{
          if (player!=winner) {
            if(PlayerCombinationMap.get(player)!.value>PlayerCombinationMap.get(winner)!.value)
              winner = player
          }
          
        })
      }
    }else if(sets.length>=1){
      winner=sets[0]
       if(sets.length>1){
        sets.map(player=>{
          if (player!=winner) {
            if(PlayerCombinationMap.get(player)!.value>PlayerCombinationMap.get(winner)!.value)
              winner = player
          }
          
        })
      }
    }else if(fullHouses.length>=1){
      winner=fullHouses[0]
       if(fullHouses.length>1){
        fullHouses.map(player=>{
          if (player!=winner) {
            if(PlayerCombinationMap.get(player)!.value>PlayerCombinationMap.get(winner)!.value)
              winner = player
          }
          
        })
      }
    }else if(twoPairs.length>=1){
      winner=twoPairs[0]
       if(twoPairs.length>1){
        twoPairs.map(player=>{
          if (player!=winner) {
            if(PlayerCombinationMap.get(player)!.value>PlayerCombinationMap.get(winner)!.value)
              winner = player
          }
          
        })
      }
    }else if(pairs.length>=1){
      winner=pairs[0]
       if(pairs.length>1){
        pairs.map(player=>{
          if (player!=winner) {
            if(PlayerCombinationMap.get(player)!.value>PlayerCombinationMap.get(winner)!.value)
              winner = player
          }
          
        })
      }
    }else if(highestCard.length>=1){
      winner=highestCard[0]
       if(highestCard.length>1){
        highestCard.map(player=>{
          if (player!=winner) {
            if(PlayerCombinationMap.get(player)!.value>PlayerCombinationMap.get(winner)!.value)
              winner = player
          }
          
        })
      }
    }

    this.server.to(String(roomId)).emit('Showdown',{winner: winner, roomPlayers: roomPlayers}); 

    

  }
}