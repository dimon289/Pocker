import { Prisma } from '@prisma/client';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma.service';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({ namespace: '/rooms' })
@Injectable()
export class RoomsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly prisma: PrismaService) {}

  private roomReadyStatus: Map<string, Set<string>> = new Map();
  private roomTimers: Map<string, NodeJS.Timeout> = new Map();
  private userSockets: Map<string, Socket> = new Map();

  handleConnection(client: Socket) {
    const userID = client.handshake.query.userID as string;
    if (userID) {
      this.userSockets.set(userID, client);
    }
    console.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: { roomID: string; userID: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomID);
    if (!this.roomReadyStatus.has(data.roomID)) {
      this.roomReadyStatus.set(data.roomID, new Set());
    }
    client.emit('joinedRoom', { success: true });
  }

  @SubscribeMessage('ready')
  async handleReady(@MessageBody() data: { roomID: string; userID: string }) {
    const readySet = this.roomReadyStatus.get(data.roomID);
    if (readySet) {
      readySet.add(data.userID);
      this.server.to(data.roomID).emit('readyUpdate', Array.from(readySet));

      if (readySet.size === 2 && !this.roomTimers.has(data.roomID)) {
        const timer = setTimeout(async () => {
          this.roomTimers.delete(data.roomID);
          this.server.to(data.roomID).emit('startGame', { message: 'Game is starting!' });

          const roomID = parseInt(data.roomID);
          const readyUserIDs: number[] = Array.from(readySet).map((id) => parseInt(id));

          const suits = ['♥', '♦', '♠', '♣'];
          const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];
          let deck: string[] = suits.flatMap((suit) => ranks.map((rank) => `${suit}${rank}`));

          const drawCard = (): string => {
            const index = Math.floor(Math.random() * deck.length);
            const card = deck[index];
            deck.splice(index, 1);
            return card;
          };

          const createdPlayers = await Promise.all(
            readyUserIDs.map(async (userID) => {
              const playerCards = [drawCard(), drawCard()];
              const player = await this.prisma.players.create({
                data: {
                  userid: userID,
                  cards: playerCards,
                  roomid: roomID,
                },
              });
              const socket = this.userSockets.get(userID.toString());
              if (socket) {
                socket.emit('playerCards', { playerID: player.id, cards: playerCards });
              }
              return player;
            })
          );

          const playerIDs = createdPlayers.map((p) => p.id);
          const tableCards = [drawCard(), drawCard(), drawCard(), drawCard(), drawCard()];

          const createdPocker = await this.prisma.pocker.create({
            data: {
              roomid: roomID,
              playersid: playerIDs,
              cards: tableCards,
              bank: 0,
            },
          });

          const thisPlayer = createdPlayers[Math.floor(Math.random() * createdPlayers.length)];
          const nextPlayer = createdPlayers[(createdPlayers.indexOf(thisPlayer) + 1) % createdPlayers.length];

          const maxBet = new Prisma.Decimal(0.05);

          const step = await this.prisma.step.create({
            data: {
              pockerid: createdPocker.id,
              playerid: thisPlayer.id,
              next_playerid: nextPlayer.id,
              bet: 0,
              maxbet: maxBet,
              steptype: 'PreFlop',
            },
          });

          await this.prisma.pocker.update({
            where: { id: createdPocker.id },
            data: {
              step: {
                connect: { id: step.id },
              },
            },
          });
        }, 10000);

        this.roomTimers.set(data.roomID, timer);
        this.server.to(data.roomID).emit('countdownStarted', { seconds: 10 });
      }
    }
  }
}
