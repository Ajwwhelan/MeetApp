
export interface Venue {
  name: string;
  type: string;
  description: string;
  fairness: string;
  fairness_score?: number;
  location: {
    latitude: number;
    longitude: number;
  };
  tfl_considerations?: string;
  place_id: string;
  photo_url: string;
  rating?: number;
  opening_hours?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface MapsChunk {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  maps?: MapsChunk;
}