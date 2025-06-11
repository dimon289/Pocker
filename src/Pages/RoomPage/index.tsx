import React from 'react';

const players = [
  { id: 1, name: 'Alice', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', cards: ['🂠', '🂠'], seat: 'top' },
  { id: 2, name: 'Bob', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', cards: ['🂠', '🂠'], seat: 'left' },
  { id: 3, name: 'Carol', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', cards: ['🂠', '🂠'], seat: 'right' },
];

const communityCards = ['🂮', '🂾', '🃎', '🂧', '🃇'];

const yourCards = ['🃍', '🃑'];
const potChips = 320.00;

const PokerTable = () => {
  return (
    <div className="fixed inset-0 bg-[#242424] text-white pt-[60px] flex flex-col items-center justify-center">
      {/* Стіл */}
      <div className="relative w-[80vw] h-[80vh] bg-green-900 border-[10px] border-yellow-400 rounded-full flex items-center justify-center shadow-2xl">
        
        {/* Community Cards */}
        <div className="flex gap-6 text-6xl z-10">
          {communityCards.map((card, index) => (
            <span key={index}>{card}</span>
          ))}
        </div>

        {/* Пот (фішки) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-16 flex flex-col items-center text-white">
          <div className="text-4xl">♣</div>
          <div className="text-lg font-semibold">Pot: {potChips.toFixed(2)}</div>
        </div>

        {/* Гравці по краях */}
        {players.map((player) => {
          const baseClasses = 'absolute flex flex-col items-center';
          const cardClasses = 'flex gap-2 text-5xl mt-2';

          let positionClasses = '';
          switch (player.seat) {
            case 'top':
              positionClasses = 'top-4 left-1/2 -translate-x-1/2';
              break;
            case 'left':
              positionClasses = 'left-4 top-1/2 -translate-y-1/2';
              break;
            case 'right':
              positionClasses = 'right-4 top-1/2 -translate-y-1/2';
              break;
            default:
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

        {/* Карти користувача */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
          <div className="flex gap-4 text-6xl">
            {yourCards.map((card, idx) => (
              <span key={idx}>{card}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Кнопки та фішки гравця */}
        <div className="mt-6 flex flex-col items-center">
                <div className="flex gap-6">
                    <button className="bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-5 px-10 text-2xl rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2">
                    💰 <span>Bet</span>
                    </button>
                    <button className="bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-5 px-10 text-2xl rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2">
                    ☎️ <span>Call</span>
                    </button>
                    <button className="bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-5 px-10 text-2xl rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2">
                    ❌ <span>Fold</span>
                    </button>
            </div>
        </div>



    </div>
  );
};

export default PokerTable;
