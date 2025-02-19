import { AnimeData } from '../types';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests

let lastRequestTime = 0;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ensureRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await delay(RATE_LIMIT_DELAY - timeSinceLastRequest);
  }
  
  lastRequestTime = Date.now();
};

export const fetchAnimeList = async (
  genre?: string,
  rating?: string,
  minScore?: number,
  page = 1
): Promise<AnimeData[]> => {
  try {
    await ensureRateLimit();

    let url = `${JIKAN_BASE_URL}/anime?page=${page}&limit=25&order_by=popularity&sort=desc`;
    
    if (genre) url += `&genres=${genre}`;
    if (rating) url += `&rating=${rating}`;
    if (minScore) url += `&min_score=${minScore}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching anime:', error);
    throw error;
  }
};

export const fetchAnimeById = async (id: number): Promise<AnimeData> => {
  try {
    await ensureRateLimit();
    
    const response = await fetch(`${JIKAN_BASE_URL}/anime/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching anime details:', error);
    throw error;
  }
};