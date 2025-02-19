import { FavoriteAnime } from '../types';

const FAVORITES_KEY = 'favorites';

export const saveFavorite = (favorites: FavoriteAnime[]) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

export const getFavorites = (): FavoriteAnime[] => {
  return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
};

export const addFavorite = (anime: FavoriteAnime) => {
  const favorites = getFavorites();
  if (!favorites.some(fav => fav.id === anime.id)) {
    favorites.push(anime);
    saveFavorite(favorites);
  }
};

export const removeFavorite = (animeId: number) => {
  const updatedFavorites = getFavorites().filter(anime => anime.id !== animeId);
  saveFavorite(updatedFavorites);
};