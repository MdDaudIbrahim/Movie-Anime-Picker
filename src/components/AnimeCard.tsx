import React from 'react';
import { Heart, Share2, Star, Calendar, BookOpen } from 'lucide-react';
import { AnimeData, FavoriteAnime } from '../types';
import { addFavorite, removeFavorite, getFavorites } from '../utils/storage';

interface AnimeCardProps {
  anime: AnimeData;
  onGetAnother: () => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onGetAnother }) => {
  const [isFavorite, setIsFavorite] = React.useState(false);

  React.useEffect(() => {
    const favorites = getFavorites();
    setIsFavorite(favorites.some(fav => fav.id === anime.mal_id));
  }, [anime.mal_id]);

  const handleFavoriteClick = () => {
    if (isFavorite) {
      removeFavorite(anime.mal_id);
      setIsFavorite(false);
    } else {
      const favoriteAnime: FavoriteAnime = {
        id: anime.mal_id,
        title: anime.title,
        image: anime.images.jpg.image_url,
        score: anime.score
      };
      addFavorite(favoriteAnime);
      setIsFavorite(true);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: anime.title,
        text: `Check out this anime: ${anime.title}`,
        url: `https://myanimelist.net/anime/${anime.mal_id}`
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg backdrop-blur-sm p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <img
            src={anime.images.jpg.large_image_url}
            alt={anime.title}
            className="w-full rounded-lg shadow-lg"
          />
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={handleFavoriteClick}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Share anime"
            >
              <Share2 className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        
        <div className="w-full md:w-2/3">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white mb-1">{anime.title}</h2>
            <h3 className="text-lg text-gray-300">{anime.title_japanese}</h3>
          </div>
          
          <p className="text-gray-300 mb-4 line-clamp-4">{anime.synopsis}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span>{anime.score.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span>{anime.episodes || '?'} episodes</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-400" />
              <span>{new Date(anime.aired.from).getFullYear()}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {anime.genres.map(genre => (
              <span
                key={genre.mal_id}
                className="px-3 py-1 rounded-full bg-purple-500/30 text-sm"
              >
                {genre.name}
              </span>
            ))}
          </div>
          
          <button
            onClick={onGetAnother}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Get Another Recommendation
          </button>
        </div>
      </div>
    </div>
  );
};