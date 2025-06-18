import React, { useEffect, useState, useRef } from 'react';
import {  useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState } from "../../Store";
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;
interface Player {
  id: number;
  userid: number;
  cards: string[];
  roomid: number;
  status:Boolean;
}
interface PlayerinGame {
  player: Player
  useravatar : string
  usernickname : string
  positionClasses: string
  yourStep: boolean
}
type ServerToClientEvents = {
  userJoined: (data: { usersId: string[], roomPlayers:Player[]   }) => void;
  Client_disconnected: (data :{userId: string}) => void;
  TableJoined:(data: {player:Player, roomPlayers:Player[]})=>void;
  gameStarted:(data: {roomPlayers:Player[]})=>void;
  yourCards: (data: {cards:string[]})=>void;
  playerTurn: (data: {playerId:number}) =>void;
  makeYourStep: (data: {currMaxBet:number, currMinBet:number}) => void;
  FlopStarted: (data: {cards:string[]})=>void;
  TurnStarted: (data: {cards:string[]})=>void;
  RiverStarted:(data: {cards:string[]})=>void;
};

type ClientToServerEvents = {
  joinRoom: (data: { roomId: string; userId: string }) => void;
  joinTable: ( userId:number)=>void;
  myStep: ( currentBet:number)=>void
};

const RoomPage: React.FC = () => {
  const { roomId } = useParams();
  const [usersId, setUsersId] = useState<string[]>()
  const userId = useSelector((state:RootState) => state.user.userId)
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersInGame, setPlayersInGame] = useState<PlayerinGame[]>([])
  const [yourCards, setYourCards] = useState<string[]>([]);
  const [communityCards, setCommunityCards] = useState<string[]>([]);
  const [potChips, setPotChips] = useState<number>(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('Waiting for players...');
  const [minBet, setMinbet] = useState<Number>(0);
   const [maxBet, setMaxbet] = useState<Number>(0);
  const [myBet, setmyBet] = useState<Number>(0);
  const [openRaise, setopenRaise] = useState<boolean>()
  // Чи приєднаний гравець до столу
  const [hasJoinedTable, setHasJoinedTable] = useState<boolean>(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);

  // // Чи зараз ваш хід (можна розширити під логіку з сервера)
  const [isYourTurn, setIsYourTurn] = useState<boolean>(false);

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  
  useEffect(() => {
  const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(`${apiUrl}/rooms`, {
    withCredentials: true,
    transports: ['websocket'],
    auth: {
      wsUserId: String(userId),
      wsRoomId: String(roomId),
    }
  });
  newSocket.on('userJoined', ({ usersId, roomPlayers}) => {
    setPlayers(roomPlayers)
    setUsersId(usersId);
    setMessages(prevMessages => [...prevMessages,`${usersId} joined the room`]);
  });
  newSocket.on('Client_disconnected', ({ userId }) => {
    let updated_users = usersId?.filter((id) => id !== userId);
    setUsersId(updated_users);

    setMessages(prevMessages => [...prevMessages,`${userId} left the room`]);
  });
  
  newSocket.on('TableJoined', ({ player , roomPlayers }) => {
    setPlayers(roomPlayers)
    setMessages(prevMessages => [...prevMessages,`${player.userid} joined the table`]);
    setHasJoinedTable(true)
  });
  newSocket.on('gameStarted', ({roomPlayers})=>{
      setPlayers(roomPlayers)
      setMessages(prevMessages => [...prevMessages,'Game Started'])
      setGameStatus('Game Started');
  })
  newSocket.on('yourCards', ({cards})=>{
    setMessages(prevMessages => [...prevMessages,'Видано карти'])
    setYourCards(cards)
  })

  newSocket.on('playerTurn',({playerId})=>{
      setCurrentPlayerId(playerId);
      setPlayersInGame(prevPlayers =>
      prevPlayers.map(p => ({
        ...p,
        player: {
          ...p.player,
          cards: ["🂠", "🂠"] 
        }
      }))
    );
  })
  newSocket.on('makeYourStep',({currMaxBet, currMinBet})=>{
    setIsYourTurn(true)
    setMaxbet(currMaxBet)
    setMinbet(currMinBet)
  })  
  newSocket.on('FlopStarted', ({cards})=>{
    setCommunityCards(prevCards => [...prevCards, ...cards])
  })
  newSocket.on('TurnStarted', ({cards})=>{
    setCommunityCards(prevCards => [...prevCards, ...cards])
  })
  newSocket.on('RiverStarted', ({cards})=>{
    setCommunityCards(prevCards => [...prevCards, ...cards])
  })
  setSocket(newSocket);
  socketRef.current = newSocket;

  return () => {
    newSocket.disconnect();
    };
  }, [roomId, userId]);






  const handleJoinTable = () => {
    if (socket) {
      socket.emit('joinTable', Number(userId) );
      setMessages(prevMessages => [...prevMessages,'Запит на приєднання до столу надіслано']);
    }
  };
  const Bet= () => {
    if (socket) {
      socket.emit('myStep', Number(myBet) );
      setMessages(prevMessages => [...prevMessages,'зроблена ставка ' + myBet ]);
      setIsYourTurn(false)
    }
  };

  const getUser = async(userId:number) => {
    const user = await axios({
        method:"Get",
        url:`${apiUrl}/api/user/id?id=${userId}`,
    })  
    
    return user 
  }
  useEffect(() => {
    const updatePlayersInGame = async () => {
      const seatPositions = ['bottom-left', 'top-left', 'top', 'top-right', 'bottom-right', 'bottom'];

      for (let index = 0; index < players.length; index++) {
        const player = players[index];

        try {
          const user = await getUser(player.userid);
          const avatar = user.data.avatar;
          const username = user.data.nickname;

          const seat = seatPositions[index];
          let positionClasses = '';
          switch (seat) {
            case 'top':
              positionClasses = 'top-4 left-1/2 -translate-x-1/2';
              break;
            case 'top-left':
              positionClasses = 'top-10 left-24';
              break;
            case 'top-right':
              positionClasses = 'top-10 right-24';
              break;
            case 'bottom-left':
              positionClasses = 'bottom-16 left-24';
              break;
            case 'bottom-right':
              positionClasses = 'bottom-16 right-24';
              break;
            case 'bottom':
              positionClasses = 'bottom-16 left-1/2 -translate-x-1/2';
              break;
          }

          const updatedPlayer = {
            player: player,
            useravatar: avatar,
            usernickname: username,
            positionClasses: positionClasses,
            yourStep: false
          };

          setPlayersInGame(prevPlayers => {
            const idx = prevPlayers.findIndex(p => p.player.id === player.id);
            if (idx !== -1) {
              const updated = [...prevPlayers];
              updated[idx] = updatedPlayer;
              return updated;
            } else {
              return [...prevPlayers, updatedPlayer];
            }
          });
        } catch (error) {
          console.error("Error loading user for player", player, error);
        }
      }
    };

    if (players.length > 0) {
      updatePlayersInGame();
    }
  }, [players, userId]);

      function getCardUnicode(card: string): string {
      const suit = card[0]; // '♦'
      const value = card.slice(1); // '1'

      // Мапа мастей до base Unicode значень
      const suitBase: { [key: string]: number } = {
        '♠': 0x1F0A0, // Spades
        '♥': 0x1F0B0, // Hearts
        '♦': 0x1F0C0, // Diamonds
        '♣': 0x1F0D0, // Clubs
      };

      // Мапа значень (у Unicode деякі значення пропущені)
      const valueMap: { [key: string]: number } = {
        'A': 0x1,   // Туз
        '2': 0x2,
        '3': 0x3,
        '4': 0x4,
        '5': 0x5,
        '6': 0x6,
        '7': 0x7,
        '8': 0x8,
        '9': 0x9,
        '1': 0xA,
        'J': 0xB,  // Валет
        'Q': 0xD,  // Дама (C пропущено)
        'K': 0xE,  // Король
      };

      const base = suitBase[suit];
      const code = valueMap[value];

      if (!base || !code) return '🂠'; // невідома карта

      // Отримаємо символ карти
      return String.fromCodePoint(base + code);
    }


  
  

  return (
    <div className="fixed inset-0 bg-[#242424] text-white pt-[60px] flex flex-col items-center justify-center">
      <ul>
        {(usersId || []).map((id, index) => (
          <li key={index}>{id}</li>
        ))}
      </ul>
      {/* Poker Table */}
      <div className="relative w-[80vw] h-[80vh] bg-green-900 border-[10px] border-yellow-400 rounded-full flex items-center justify-center shadow-2xl">

        {/* Community Cards */}
        <div className="flex gap-6 text-6xl z-10">
          {communityCards.map((card, index) => (
            <span key={index}>{getCardUnicode(card)}</span>
          ))} 
        </div>

        {/* Pot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-16 flex flex-col items-center text-white">
          <div className="text-4xl">♣</div>
          <div className="text-lg font-semibold">Pot: {potChips.toFixed(2)}</div> 
        </div>

        {/* Players */}
        {playersInGame && playersInGame.map(player => {
          const isCurrent = player.player.id === currentPlayerId;

          return (
            <div
              key={player.player.id}
              className={`absolute flex flex-col items-center transition-all duration-300 ${player.positionClasses} ${
                isCurrent ? 'scale-110 z-10' : ''
              }`}
            >
              <img
                className={`w-16 h-16 rounded-full border-2 ${
                  isCurrent ? 'border-green-400 ring-4 ring-green-300 animate-pulse' : 'border-white'
                }`}
                src={player.useravatar}
                alt={`Player ${player.usernickname}`}
              />
              <div
                className={`mt-1 px-2 py-1 rounded-md ${
                  isCurrent
                    ? 'text-yellow-400 font-extrabold text-lg animate-pulse'
                    : 'text-white text-sm'
                }`}
              >
                {player.usernickname}
              </div>
              <div className={'flex gap-2 text-5xl mt-2'}>
                {player.player.cards.map((card, idx) => (
                  <span key={idx}>{getCardUnicode(card)}</span>
                ))}
              </div>
            </div>
          );
        })}
        {/* Your Cards */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
          <div className="flex gap-4 text-6xl">
              {yourCards.map((card, idx) => (
                <span key={idx}>{getCardUnicode(card)}</span>
              ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col items-center">
        {(!hasJoinedTable && gameStatus =='Waiting for players...') && (
          <button
            onClick={handleJoinTable}
            className="mb-4 bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-4 px-12 text-2xl rounded-2xl shadow-lg transition-transform hover:scale-105"
          >
            Join Table
          </button>
        )}

        {hasJoinedTable && (
          <div className="flex gap-6">
            <button
              onClick={() => setopenRaise(!openRaise)}
              disabled={!isYourTurn}
              className={`bg-gradient-to-br from-yellow-400 to-yellow-600 text-black font-bold py-5 px-10 text-2xl rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2
                ${!isYourTurn ? 'opacity-50 cursor-not-allowed hover:scale-100' : 'hover:from-yellow-500 hover:to-yellow-700'}`}
            >
              💰 <span>Raise</span>
            </button>
            {openRaise && (
                <div className="flex flex-col items-center gap-2">
                  <input
                    type="range"
                    min={Number(minBet)}
                    max={Number(maxBet)}
                    step={0.01}
                    value={Number(myBet)}
                    onChange={(e) => setmyBet(Number(e.target.value))}
                    className="w-64"

                  />
                </div>
              )}
            <button
              onClick={() => setmyBet(Number(minBet))}
              disabled={!isYourTurn}
              className={`bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold py-5 px-10 text-2xl rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2
                ${!isYourTurn ? 'opacity-50 cursor-not-allowed hover:scale-100' : 'hover:from-blue-600 hover:to-blue-800'}`}
            >
              ☎️ <span>Call</span>
            </button>
            <button
              onClick={() => setmyBet(0)}
              disabled={!isYourTurn}
              className={`bg-gradient-to-br from-red-500 to-red-700 text-white font-bold py-5 px-10 text-2xl rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2
                ${!isYourTurn ? 'opacity-50 cursor-not-allowed hover:scale-100' : 'hover:from-red-600 hover:to-red-800'}`}
            >
              ❌ <span>Fold</span>
            </button>
            <button
                onClick={Bet}
                disabled={!isYourTurn}
                className={`bg-gradient-to-br from-green-500 to-green-700 text-white font-bold py-5 px-10 text-2xl rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2
                  ${!isYourTurn ? 'opacity-50 cursor-not-allowed hover:scale-100' : 'hover:from-green-600 hover:to-green-800'}`}>
                🪙 <span>{`Bet ${myBet}`}</span>
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="mt-6 w-[80vw] max-h-40 overflow-y-auto border border-gray-600 rounded p-4 bg-[#1a1a1a] text-sm">
        {messages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>

      {/* Game status */}
       <div className="mt-4 text-yellow-300 font-semibold text-lg">{gameStatus}</div> 
    </div>
  );
};

export default RoomPage;
