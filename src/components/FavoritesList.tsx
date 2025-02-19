import React from 'react';
import { getFavorites } from '../utils/storage';
import { FavoriteAnime } from '../types';
import { Star, X } from 'lucide-react';
import { removeFavorite } from '../utils/storage';

interface FavoritesListProps {
  onClose: () => void;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({ onClose }) => {
  const [favorites, setFavorites] = React.useState<FavoriteAnime[]>([]);

  React.useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const handleRemove = (animeId: number) => {
    removeFavorite(animeId);
    setFavorites(getFavorites());
  };

  if (favorites.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-6 max-w-lg w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Your Favorites</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-center text-gray-300">No favorites yet!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Favorites</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid gap-4">
          {favorites.map(anime => (
            <div
              key={anime.id}
              className="flex items-center gap-4 bg-white/10 rounded-lg p-3"
            >
              <img
                src={anime.image}
                alt={anime.title}
                className="w-16 h-24 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{anime.title}</h3>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4" />
                  <span>{anime.score.toFixed(1)}</span>
                </div>
              </div>
              <button
                onClick={() => handleRemove(anime.id)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Remove from favorites"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};