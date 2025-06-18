import React, { useEffect, useState, useRef } from 'react';
import {  useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState } from "../../Store";
import { io, Socket } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL;

interface Player {
  id: number;
  userid: number;
  cards: string[];
  roomid: number;
}
type ServerToClientEvents = {
  userJoined: (data: { usersId: string[] }) => void;
  Client_disconnected: (data :{userId: string}) => void;
  TableJoined:(data: {player:Player, roomPlayers:Player[]})=>void;
};

type ClientToServerEvents = {
  joinRoom: (data: { roomId: string; userId: string }) => void;
  joinTable: ( userId:number)=>void;
};

const RoomPage: React.FC = () => {
  const { roomId } = useParams();
  // const [users, setUsers] = useState<string[]>([]);
  const [usersId, setUsersId] = useState<string[]>()
  const userId = useSelector((state:RootState) => state.user.userId)
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  // const [yourCards, setYourCards] = useState<string[]>([]);
  // const [communityCards, setCommunityCards] = useState<string[]>([]);
  // const [potChips, setPotChips] = useState<number>(0);
  // const [messages, setMessages] = useState<string[]>([]);
  // const [gameStatus, setGameStatus] = useState<string>('Waiting for players...');

  // Чи приєднаний гравець до столу
  const hasJoinedTable = false;
  // const [hasJoinedTable, setHasJoinedTable] = useState<boolean>(false);

  // // Чи зараз ваш хід (можна розширити під логіку з сервера)
  const isYourTurn = false;
  // const [isYourTurn, setIsYourTurn] = useState<boolean>(false);

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

  newSocket.on('connect', () => {
    console.log('WebSocket connected');
  });

  newSocket.on('userJoined', ({ usersId }) => {
    setUsersId(usersId);
    console.log(`${usersId} joined the room`);
  });
  newSocket.on('Client_disconnected', ({ userId }) => {
    let updated_users = usersId?.filter((id) => id !== userId);
    setUsersId(updated_users);

    console.log(`${userId} left the room`);
  });
  
  newSocket.on('TableJoined', ({ player , roomPlayers }) => {
    setPlayers(roomPlayers)
    console.log(`${player.userid} joined the table`);
  });

  setSocket(newSocket);
  socketRef.current = newSocket;

  return () => {
    newSocket.disconnect();
    };
  }, [roomId, userId]);

  const handleJoinTable = () => {
    if (socket) {
      socket.emit('joinTable', Number(userId) );
      console.log('Запит на приєднання до столу надіслано');
    }
  };


  

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
          {/* {communityCards.map((card, index) => (
            <span key={index}>{card}</span>
          ))} */}
        </div>

        {/* Pot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-16 flex flex-col items-center text-white">
          {/* <div className="text-4xl">♣</div>
          <div className="text-lg font-semibold">Pot: {potChips.toFixed(2)}</div> */}
        </div>

        {/* Players */}
        {players.map((player, index) => {
          const baseClasses = 'absolute flex flex-col items-center';
          const cardClasses = 'flex gap-2 text-5xl mt-2';

          const currentPlayerIndex = players.findIndex(p => p.userid === Number(userId));
          const rotatedIndex = (index - currentPlayerIndex + players.length) % players.length;

          const seatPositions = ['bottom', 'left', 'top', 'right'];
          const seat = seatPositions[rotatedIndex % seatPositions.length];

          let positionClasses = '';
          switch (seat) {
            case 'top':
              positionClasses = 'top-4 left-1/2 -translate-x-1/2';
              break;
            case 'left':
              positionClasses = 'left-4 top-1/2 -translate-y-1/2';
              break;
            case 'right':
              positionClasses = 'right-4 top-1/2 -translate-y-1/2';
              break;
            case 'bottom':
              positionClasses = 'bottom-20 left-1/2 -translate-x-1/2';
              break;
          }

           return (
            <div key={player.id} className={`${baseClasses} ${positionClasses}`}>
              <img

                className="w-16 h-16 rounded-full border-2 border-white"
              />
              <div className="text-sm mt-1">{}</div>
              <div className={cardClasses}>
                {player.cards.map((card, idx) => (
                  <span key={idx}>{card}</span>
                ))}
              </div>
            </div>
          );
        })}
        {/* Your Cards */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
          <div className="flex gap-4 text-6xl">
            {/* {yourCards.map((card, idx) => (
              <span key={idx}>{card}</span>
            ))} */}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col items-center">
        {!hasJoinedTable && (
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
              // onClick={() => handleBet(10)}
              disabled={!isYourTurn}
              className={`bg-gradient-to-br from-yellow-400 to-yellow-600 text-black font-bold py-5 px-10 text-2xl rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2
                ${!isYourTurn ? 'opacity-50 cursor-not-allowed hover:scale-100' : 'hover:from-yellow-500 hover:to-yellow-700'}`}
            >
              💰 <span>Bet 10</span>
            </button>
            <button
              // onClick={handleCall}
              disabled={!isYourTurn}
              className={`bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold py-5 px-10 text-2xl rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2
                ${!isYourTurn ? 'opacity-50 cursor-not-allowed hover:scale-100' : 'hover:from-blue-600 hover:to-blue-800'}`}
            >
              ☎️ <span>Call</span>
            </button>
            <button
              // onClick={handleFold}
              disabled={!isYourTurn}
              className={`bg-gradient-to-br from-red-500 to-red-700 text-white font-bold py-5 px-10 text-2xl rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2
                ${!isYourTurn ? 'opacity-50 cursor-not-allowed hover:scale-100' : 'hover:from-red-600 hover:to-red-800'}`}
            >
              ❌ <span>Fold</span>
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {/* <div className="mt-6 w-[80vw] max-h-40 overflow-y-auto border border-gray-600 rounded p-4 bg-[#1a1a1a] text-sm">
        {messages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div> */}

      {/* Game status */}
      {/* <div className="mt-4 text-yellow-300 font-semibold text-lg">{gameStatus}</div> */}
    </div>
  );
};

export default RoomPage;
