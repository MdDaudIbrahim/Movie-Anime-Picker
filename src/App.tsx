import React, { useState, useEffect } from 'react';
import { Sparkles, Film, Heart, Search, Star, Tv, Eye, BookOpen, BookmarkIcon, Bookmark, Trash2 } from 'lucide-react';
import { fetchAnimeList, fetchAnimeById } from './utils/api';
import { AnimeCard } from './components/AnimeCard';
import type { AnimeData, MovieData } from './types';
import { motion, AnimatePresence } from 'framer-motion';

// Add these interfaces to your types.ts file or define them here
interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  poster_path: string | null;
  genre_ids: number[];
}

interface Genre {
  id: number;
  name: string;
}

// Update movieGenres with TMDb genre IDs
const movieGenres = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" }
];

const moodKeywords = {
  "Happy": ["happy", "cheerful", "fun", "comedy"],
  "Sad": ["sad", "emotional", "tearjerker"],
  "Action": ["action", "exciting", "thrilling"],
  "Romantic": ["romantic", "love", "sweet"],
  "Scary": ["horror", "scary", "creepy"],
  "Funny": ["funny", "humorous", "comedy"],
  "Adventure": ["adventure", "journey", "quest"],
  "Mystery": ["mystery", "suspense", "detective"],
  "Family": ["family", "heartwarming", "wholesome"]
};

const animeGenres = [
  { id: 1, name: "Action" },
  { id: 2, name: "Adventure" },
  { id: 4, name: "Comedy" },
  { id: 8, name: "Drama" },
  { id: 10, name: "Fantasy" },
  { id: 22, name: "Romance" },
  { id: 24, name: "Sci-Fi" },
  { id: 36, name: "Slice of Life" },
  { id: 37, name: "Supernatural" },
  { id: 41, name: "Thriller" }
];

const animeRatings = [
  { value: "g", label: "G - All Ages" },
  { value: "pg", label: "PG - Children" },
  { value: "pg13", label: "PG-13 - Teens 13 and older" },
  { value: "r17", label: "R - 17+ (violence & profanity)" }
];

const TMDB_API_KEY = '16d0713af7a1e05f271aea0bde788fab';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Add this interface near the top with other interfaces
interface FavoriteItem {
  id: string;
  title: string;
  poster?: string;
  rating: number;
  type: "movie" | "anime";
  mal_id?: number;
}

function App() {
  const [contentType, setContentType] = useState<"movies" | "anime">("movies");
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [minScore, setMinScore] = useState<number>(7);
  const [showHiddenGemsOnly, setShowHiddenGemsOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedContent, setSuggestedContent] = useState<MovieData | AnimeData | null>(null);
  const [animeCache, setAnimeCache] = useState<AnimeData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [minimumScore, setMinimumScore] = useState<number>(6);
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFavorite = (content: MovieData | AnimeData) => {
    const isAnime = 'mal_id' in content;
    const id = isAnime ? `anime-${content.mal_id}` : `movie-${content.title}`;
    
    setFavorites(prev => {
      const exists = prev.some(item => item.id === id);
      
      if (exists) {
        const newFavorites = prev.filter(item => item.id !== id);
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
        return newFavorites;
      } else {
        const newItem: FavoriteItem = {
          id,
          title: content.title,
          poster: isAnime ? content.images?.jpg?.image_url : content.poster,
          rating: isAnime ? content.score || 0 : content.rating,
          type: isAnime ? 'anime' : 'movie',
          mal_id: isAnime ? content.mal_id : undefined
        };
        const newFavorites = [...prev, newItem];
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
        return newFavorites;
      }
    });
  };

  const fetchMovieRecommendation = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!selectedMood || !selectedGenre) {
        throw new Error("Please select both mood and genre!");
      }

      console.log('Fetching movie with:', { selectedMood, selectedGenre, minimumScore, currentPage });

      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?` +
        `api_key=${TMDB_API_KEY}` +
        `&with_genres=${selectedGenre}` +
        `&page=${currentPage}` +
        `&vote_average.gte=${minimumScore}` +
        `&language=en-US` +
        `&sort_by=popularity.desc`
      );

      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Initial movie data:', data);
      
      if (!data.results || data.results.length === 0) {
        throw new Error("No movies found with these criteria. Try different filters!");
      }

      const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
      console.log('Selected random movie:', randomMovie);

      const movieDetailsResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${randomMovie.id}?api_key=${TMDB_API_KEY}&language=en-US`
      );

      if (!movieDetailsResponse.ok) {
        throw new Error(`Error fetching movie details: ${movieDetailsResponse.statusText}`);
      }

      const movieDetails = await movieDetailsResponse.json();
      console.log('Movie details:', movieDetails);

      const transformedData: MovieData = {
        title: movieDetails.title,
        genre: movieDetails.genres?.[0]?.name || "Unknown",
        mood: selectedMood,
        isHiddenGem: movieDetails.vote_count < 1000 && movieDetails.vote_average >= 7,
        rating: movieDetails.vote_average,
        poster: movieDetails.poster_path 
          ? `${TMDB_IMAGE_BASE_URL}${movieDetails.poster_path}`
          : undefined,
        plot: movieDetails.overview,
        year: movieDetails.release_date?.split('-')[0]
      };

      console.log('Transformed data:', transformedData);
      setSuggestedContent(transformedData);
      setCurrentPage(prev => prev + 1);

    } catch (error) {
      console.error('Error fetching movie:', error);
      setError(error instanceof Error ? error.message : "An error occurred. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMood, selectedGenre, minimumScore]);

  // Update getRandomContent to use the new function for movies
  const getRandomContent = async () => {
    if (contentType === "movies") {
      await fetchMovieRecommendation();
    } else {
      setLoading(true);
      setError(null);

      try {
        let animeList = animeCache;
        
        if (animeCache.length === 0) {
          animeList = await fetchAnimeList(
            selectedGenre,
            selectedRating,
            minScore
          );
          setAnimeCache(animeList);
        }

        if (animeList.length === 0) {
          throw new Error("No anime found with these criteria. Try different filters!");
        }

        const randomAnime = animeList[Math.floor(Math.random() * animeList.length)];
        const animeDetails = await fetchAnimeById(randomAnime.mal_id);
        setSuggestedContent(animeDetails);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred. Please try again!");
      } finally {
        setLoading(false);
      }
    }
  };

  // Clear cache when filters change
  useEffect(() => {
    setAnimeCache([]);
  }, [selectedGenre, selectedRating, minScore]);

  const resetWebsite = () => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset all state to initial values
    setContentType("movies");
    setSelectedMood("");
    setSelectedGenre("");
    setSelectedRating("");
    setMinScore(7);
    setShowHiddenGemsOnly(false);
    setLoading(false);
    setError(null);
    setSuggestedContent(null);
    setAnimeCache([]);
    setCurrentPage(1);
    setMinimumScore(6);
    setFavorites([]);
  };

  return (
    <div className="min-h-screen bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <h1 className="text-4xl md:text-7xl font-bold mb-4 flex items-center justify-center gap-2 md:gap-3 hover:scale-105 transition-transform duration-300">
            {contentType === "movies" ? (
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Film className="w-8 h-8 md:w-14 md:h-14" />
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Tv className="w-8 h-8 md:w-14 md:h-14" />
              </motion.div>
            )}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 hover:from-pink-400 hover:to-purple-400 transition-all duration-300">
              {contentType === "movies" ? "Movie" : "Anime"} Magic
            </span>
          </h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-purple-200"
          >
            Discover your next favorite Anime & {contentType === "movies" ? "Movies" : "anime"}
          </motion.p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="flex flex-wrap justify-center gap-2 md:gap-4 mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setContentType("movies");
                setSuggestedContent(null);
                setSelectedGenre("");
                setSelectedRating("");
              }}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-full flex items-center gap-2 transition-all duration-200 ${
                contentType === "movies"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              <Film className="w-4 h-4 md:w-5 md:h-5" />
              Movies
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setContentType("anime");
                setSuggestedContent(null);
                setSelectedGenre("");
                setSelectedRating("");
              }}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-full flex items-center gap-2 transition-all duration-200 ${
                contentType === "anime"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              <Tv className="w-4 h-4 md:w-5 md:h-5" />
              Anime
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetWebsite}
              className="px-4 md:px-6 py-2 md:py-3 rounded-full flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
            >
              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
              Reset
            </motion.button>
          </motion.div>

          <motion.div 
            className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-8 shadow-2xl hover:shadow-purple-500/10 transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6 md:mb-8">
              {contentType === "movies" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-medium mb-2 hover:text-purple-300 transition-colors">
                    How are you feeling?
                  </label>
                  <select
                    className="w-full bg-white/20 rounded-lg p-2 md:p-3 outline-none focus:ring-2 focus:ring-purple-400 text-white [&>option]:text-gray-900 hover:bg-white/30 transition-colors cursor-pointer"
                    value={selectedMood}
                    onChange={(e) => setSelectedMood(e.target.value)}
                  >
                    <option value="">Select Mood</option>
                    {Object.keys(moodKeywords).map(mood => (
                      <option key={mood} value={mood}>{mood}</option>
                    ))}
                  </select>
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  {contentType === "movies" ? "Preferred Genre" : "Anime Genre"}
                </label>
                <select
                  className="w-full bg-white/20 rounded-lg p-2 md:p-3 outline-none focus:ring-2 focus:ring-purple-400 text-white [&>option]:text-gray-900"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                >
                  <option value="">Select Genre</option>
                  {(contentType === "movies" ? movieGenres : animeGenres).map(genre => (
                    <option 
                      key={typeof genre === 'string' ? genre : genre.id} 
                      value={typeof genre === 'string' ? genre : genre.id}
                    >
                      {typeof genre === 'string' ? genre : genre.name}
                    </option>
                  ))}
                </select>
              </div>

              {contentType === "movies" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Minimum IMDb Score</label>
                  <select
                    className="w-full bg-white/20 rounded-lg p-2 md:p-3 outline-none focus:ring-2 focus:ring-purple-400 text-white [&>option]:text-gray-900"
                    value={minimumScore}
                    onChange={(e) => setMinimumScore(Number(e.target.value))}
                  >
                    {[6, 7, 8, 9].map(score => (
                      <option key={score} value={score}>
                        {score}+
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {contentType === "anime" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Age Rating</label>
                    <select
                      className="w-full bg-white/20 rounded-lg p-2 md:p-3 outline-none focus:ring-2 focus:ring-purple-400 text-white [&>option]:text-gray-900"
                      value={selectedRating}
                      onChange={(e) => setSelectedRating(e.target.value)}
                    >
                      <option value="">Any Rating</option>
                      {animeRatings.map(rating => (
                        <option key={rating.value} value={rating.value}>
                          {rating.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                     MAL Minimum Ratings ({minScore.toFixed(1)})
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.1"
                      value={minScore}
                      onChange={(e) => setMinScore(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>

            {contentType === "movies" && (
              <div className="flex items-center mb-6 md:mb-8">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 md:h-5 md:w-5 text-purple-500"
                    checked={showHiddenGemsOnly}
                    onChange={(e) => setShowHiddenGemsOnly(e.target.checked)}
                  />
                  <span className="ml-2 flex items-center gap-2 text-sm md:text-base">
                    Show Hidden Gems Only <Sparkles className="w-4 h-4 text-yellow-400" />
                  </span>
                </label>
              </div>
            )}

            {error && (
              <div className="mb-6 md:mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-center text-sm md:text-base">
                {error}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={getRandomContent}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 md:py-4 px-4 md:px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base relative overflow-hidden group"
            >
              {loading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Search className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform" />
                  <span className="relative">
                    Find Me {contentType === "movies" ? "a Movie" : "an Anime"}!
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </span>
                </>
              )}
            </motion.button>

            <AnimatePresence>
              {suggestedContent && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6 md:mt-8"
                >
                  {contentType === "anime" && 'mal_id' in suggestedContent ? (
                    <div className="p-4 md:p-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg backdrop-blur-sm">
                      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                        {suggestedContent.images?.jpg?.image_url && (
                          <div className="w-full md:w-1/3">
                            <img 
                              src={suggestedContent.images.jpg.image_url} 
                              alt={suggestedContent.title}
                              className="w-full rounded-lg shadow-lg"
                            />
                          </div>
                        )}
                        <div className="w-full md:w-2/3">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl md:text-2xl font-bold">{suggestedContent.title}</h2>
                            <button 
                              onClick={() => toggleFavorite(suggestedContent)}
                              className="text-pink-400 hover:text-pink-300 transition-colors"
                            >
                              <Heart 
                                className={`w-6 h-6 ${
                                  favorites.some(f => f.id === `anime-${suggestedContent.mal_id}`) 
                                    ? 'fill-current' 
                                    : ''
                                }`} 
                              />
                            </button>
                          </div>
                          
                          {suggestedContent.synopsis && (
                            <p className="text-gray-300 mb-4 text-sm md:text-base">
                              {suggestedContent.synopsis}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-4">
                            {suggestedContent.genres && suggestedContent.genres.length > 0 && (
                              <span className="bg-purple-500/30 px-2 md:px-3 py-1 rounded-full">
                                {suggestedContent.genres.map(genre => genre.name).join(', ')}
                              </span>
                            )}
                            
                            {suggestedContent.score && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                                {suggestedContent.score.toFixed(1)}
                              </span>
                            )}
                            
                            {suggestedContent.episodes && (
                              <span className="flex items-center gap-1">
                                <Tv className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                                {suggestedContent.episodes} episodes
                              </span>
                            )}
                            
                            {suggestedContent.rating && (
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                                {suggestedContent.rating}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={getRandomContent}
                              disabled={loading}
                              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 md:py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                            >
                              {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <Search className="w-4 h-4 md:w-5 md:h-5" />
                                  Get Another Anime
                                </>
                              )}
                            </button>
                            
                            {suggestedContent.url && (
                              <a
                                href={suggestedContent.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 md:py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                              >
                                <BookmarkIcon className="w-4 h-4 md:w-5 md:h-5" />
                                MAL Page
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 md:p-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg backdrop-blur-sm">
                      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                        {'poster' in suggestedContent && suggestedContent.poster && (
                          <div className="w-full md:w-1/3">
                            <img 
                              src={suggestedContent.poster} 
                              alt={suggestedContent.title}
                              className="w-full rounded-lg shadow-lg"
                            />
                          </div>
                        )}
                        <div className={`w-full ${'poster' in suggestedContent && suggestedContent.poster ? 'md:w-2/3' : ''}`}>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl md:text-2xl font-bold">
                              {suggestedContent.title}
                              {'year' in suggestedContent && suggestedContent.year && (
                                <span className="text-base md:text-lg font-normal ml-2 text-gray-300">
                                  ({suggestedContent.year})
                                </span>
                              )}
                            </h2>
                            <button 
                              onClick={() => toggleFavorite(suggestedContent)}
                              className="text-pink-400 hover:text-pink-300 transition-colors"
                            >
                              <Heart 
                                className={`w-6 h-6 ${
                                  favorites.some(f => f.id === `movie-${suggestedContent.title}`) 
                                    ? 'fill-current' 
                                    : ''
                                }`} 
                              />
                            </button>
                          </div>
                          {'plot' in suggestedContent && suggestedContent.plot && (
                            <p className="text-gray-300 mb-4 text-sm md:text-base">{suggestedContent.plot}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-4">
                            <span className="bg-purple-500/30 px-2 md:px-3 py-1 rounded-full">
                              {suggestedContent.genre}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3 md:w-4 md:h-4 text-pink-400" />
                              {suggestedContent.mood}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                              {suggestedContent.rating.toFixed(1)}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={getRandomContent}
                              disabled={loading}
                              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 md:py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                            >
                              {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <Search className="w-4 h-4 md:w-5 md:h-5" />
                                  Get Another Movie
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Add the favorites section */}
      {favorites.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-400" />
            My Favorites
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {favorites.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative group"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                  {item.poster ? (
                    <img 
                      src={item.poster} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-purple-900/50 flex items-center justify-center">
                      <BookOpen className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => {
                        const content = item.type === 'anime' 
                          ? { mal_id: item.mal_id, title: item.title, images: { jpg: { image_url: item.poster } }, score: item.rating }
                          : { title: item.title, poster: item.poster, rating: item.rating, genre: "", mood: "" };
                        toggleFavorite(content as any);
                      }}
                      className="text-white hover:text-pink-400 transition-colors"
                    >
                      <Heart className="w-8 h-8 fill-current" />
                    </button>
                  </div>
                </div>
                <h3 className="mt-2 text-sm font-medium truncate">{item.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <footer className="text-center py-4 text-white">
        © 2024 <a href="https://daudibrahim.com/" className="text-blue-400 hover:underline">Md. Daud Ibrahim</a> | All rights reserved.
      </footer>
    </div>
  );
}

export default App;