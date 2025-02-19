export interface AnimeData {
  mal_id: number;
  title: string;
  title_japanese: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  synopsis: string;
  rating: string;
  episodes: number;
  aired: {
    from: string;
    to: string;
  };
  score: number;
  genres: Array<{
    mal_id: number;
    name: string;
  }>;
  status: string;
}

export interface FavoriteAnime {
  id: number;
  title: string;
  image: string;
  score: number;
}

export interface MovieData {
  title: string;
  genre: string;
  mood: string;
  isHiddenGem: boolean;
  rating: number;
  poster?: string;
  plot?: string;
  year?: string;
}