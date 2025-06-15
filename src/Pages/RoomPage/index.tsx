import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState } from "../../Store";
import { io, Socket } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL;

interface Player {
  id: number;
  userid: number;
  cards: string[];
  roomid: number;
  status: boolean;
  name: string;
  avatar: string;
  // seat: 'top' | 'left' | 'right' | 'bottom';
}

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const userId = Number(useSelector((state: RootState) => state.user.userName));

  const [socket, setSocket] = useState<Socket | null>(null);

  // Стан гри
  const [players, setPlayers] = useState<Player[]>([]);
  const [yourCards, setYourCards] = useState<string[]>([]);
  const [communityCards, setCommunityCards] = useState<string[]>([]);
  const [potChips, setPotChips] = useState<number>(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('Waiting for players...');

  // Чи приєднаний гравець до столу
  const [hasJoinedTable, setHasJoinedTable] = useState<boolean>(false);

  // Чи зараз ваш хід (можна розширити під логіку з сервера)
  const [isYourTurn, setIsYourTurn] = useState<boolean>(false);

  useEffect(() => {
    const newSocket = io(`${apiUrl}/rooms`, {
      auth: {
        wsUserId: userId,
        wsRoomId: roomId,
      },
      transports: ['websocket'],
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      addMessage('Connected to the room');
    });

    newSocket.on('disconnect', () => {
      addMessage('Disconnected from the room');
      setHasJoinedTable(false);
      setIsYourTurn(false);
    });

    newSocket.on('userJoined', ({ userId }) => {
      addMessage(`User ${userId} joined the room.`);
    });

    newSocket.on('playerJoined', ({ players: roomPlayers }: { players: Player[] }) => {
      setPlayers(roomPlayers);
      addMessage(`Players updated: ${roomPlayers.length} players in room.`);
    });

    newSocket.on('yourCards', ({ cards }: { cards: string[] }) => {
      setYourCards(cards);
      addMessage('You received your cards');
    });

    newSocket.on('communityCardsUpdate', ({ cards }: { cards: string[] }) => {
      setCommunityCards(cards);
      addMessage('Community cards updated');
    });

    newSocket.on('potUpdate', ({ pot }: { pot: number }) => {
      setPotChips(pot);
      addMessage(`Pot updated: ${pot.toFixed(2)}`);
    });

    newSocket.on('gameStatus', ({ status }: { status: string }) => {
      setGameStatus(status);
    });

    // Подія, що підтверджує приєднання до столу
    newSocket.on('joinedTable', () => {
      setHasJoinedTable(true);
      addMessage('Ви приєдналися до гри.');
    });

    // Приклад події для позначення вашого ходу (потрібно реалізувати на сервері)
    newSocket.on('yourTurn', () => {
      setIsYourTurn(true);
      addMessage('Ваш хід!');
    });

    // Коли хід закінчився
    newSocket.on('turnEnded', () => {
      setIsYourTurn(false);
      addMessage('Хід завершено.');
    });

    newSocket.on('connection_error', (err) => {
      addMessage(`Connection error: ${err.reason}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId, roomId]);

  function addMessage(msg: string) {
    setMessages((prev) => [...prev, msg]);
  }

  // Обробники кнопок ставок
  const handleBet = (amount: number) => {
    if (socket && isYourTurn) {
      socket.emit('myStep', amount);
      addMessage(`Bet made: ${amount}`);
      setIsYourTurn(false); // хід зроблено
    }
  };

  const handleCall = () => {
    if (socket && isYourTurn) {
      socket.emit('myStep', 'call');
      addMessage('Call made');
      setIsYourTurn(false);
    }
  };

  const handleFold = () => {
    if (socket && isYourTurn) {
      socket.emit('myStep', 'fold');
      addMessage('Fold made');
      setIsYourTurn(false);
    }
  };

  const handleJoinTable = () => {
    if (socket) {
      socket.emit('joinTable');
      addMessage('Надіслано запит на приєднання...');
      setHasJoinedTable(true); // Тепер чекаємо підтвердження від сервера
    }
  };

  return (
    <div className="fixed inset-0 bg-[#242424] text-white pt-[60px] flex flex-col items-center justify-center">
      {/* Poker Table */}
      <div className="relative w-[80vw] h-[80vh] bg-green-900 border-[10px] border-yellow-400 rounded-full flex items-center justify-center shadow-2xl">

        {/* Community Cards */}
        <div className="flex gap-6 text-6xl z-10">
          {communityCards.map((card, index) => (
            <span key={index}>{card}</span>
          ))}
        </div>

        {/* Pot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-16 flex flex-col items-center text-white">
          <div className="text-4xl">♣</div>
          <div className="text-lg font-semibold">Pot: {potChips.toFixed(2)}</div>
        </div>

        {/* Players */}
        {players.map((player, index) => {
          const baseClasses = 'absolute flex flex-col items-center';
          const cardClasses = 'flex gap-2 text-5xl mt-2';

          const currentPlayerIndex = players.findIndex(p => p.userid === userId);
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
                src={player.avatar}
                alt={player.name}
                className="w-16 h-16 rounded-full border-2 border-white"
              />
              <div className="text-sm mt-1">{player.name}</div>
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
            {yourCards.map((card, idx) => (
              <span key={idx}>{card}</span>
            ))}
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
              onClick={() => handleBet(10)}
              disabled={!isYourTurn}
              className={`bg-gradient-to-br from-yellow-400 to-yellow-600 text-black font-bold py-5 px-10 text-2xl rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2
                ${!isYourTurn ? 'opacity-50 cursor-not-allowed hover:scale-100' : 'hover:from-yellow-500 hover:to-yellow-700'}`}
            >
              💰 <span>Bet 10</span>
            </button>
            <button
              onClick={handleCall}
              disabled={!isYourTurn}
              className={`bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold py-5 px-10 text-2xl rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2
                ${!isYourTurn ? 'opacity-50 cursor-not-allowed hover:scale-100' : 'hover:from-blue-600 hover:to-blue-800'}`}
            >
              ☎️ <span>Call</span>
            </button>
            <button
              onClick={handleFold}
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
