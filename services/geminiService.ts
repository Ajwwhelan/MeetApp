
import { GoogleGenAI } from "@google/genai";
import { Venue, GroundingChunk } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const findMeetingPoints = async (
    locationA: string, 
    locationB: string,
    userCoords: { latitude: number; longitude: number; } | null
): Promise<{ venues: Venue[], groundingChunks: GroundingChunk[] } | null> => {
  const prompt = `
    As a London transit expert, find 3-5 public meeting points in London (like cafes, pubs, parks, or museums) that are optimally located for two people traveling from different locations.

    Person A Location: "${locationA}"
    Person B Location: "${locationB}"

    Your goal is to find venues where the public transport travel time from both starting locations is as close to equal as possible.

    **Crucially, incorporate real-time Transport for London (TfL) data into your reasoning.** Consider current and typical service disruptions, line closures (especially on weekends), and delays. For each suggested venue, provide a note about any relevant TfL considerations that might affect the journey.

    Prioritize locations with good, reliable transport links. The suggestions should be diverse.

    Respond ONLY with a valid JSON object in the following format. Do not include any other text, explanations, or markdown formatting.
    {
      "venues": [
        {
          "name": "The name of the venue.",
          "type": "The type of venue (e.g., Cafe, Pub, Park, Museum).",
          "description": "A brief, one-sentence description of the venue and why it's a good meeting spot.",
          "fairness": "A comment on how fair the travel time is from both locations, e.g., 'Almost equal travel time', 'Slightly shorter for person A'.",
          "location": {
            "latitude": 51.5074,
            "longitude": -0.1278
          },
          "tfl_considerations": "A brief note on potential TfL travel disruptions or advantages. For example: 'Well-served by the Central line, but check for weekend closures.' or 'Reliant on the Northern Line which can have delays during peak hours.'",
          "place_id": "The Google Maps Place ID for the venue.",
          "photo_url": "A publicly accessible URL for a high-quality, representative image of the venue, ideally from its Google Maps listing."
        }
      ]
    }
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: userCoords ? {
        retrievalConfig: {
          latLng: {
            latitude: userCoords.latitude,
            longitude: userCoords.longitude
          }
        }
      } : undefined,
    },
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];

  try {
    let jsonString = response.text.trim();
    // Clean up potential markdown formatting from the response
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    }
    const result = JSON.parse(jsonString);
    return { venues: result.venues, groundingChunks };
  } catch (e) {
    console.error("Failed to parse JSON response from Gemini:", response.text, e);
    return null;
  }
};