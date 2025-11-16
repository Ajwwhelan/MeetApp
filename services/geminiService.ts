
import { GoogleGenAI } from "@google/genai";
import { Venue, GroundingChunk } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const findMeetingPoints = async (
    locationA: string, 
    locationB: string,
    userCoords: { latitude: number; longitude: number; } | null,
    transitPreferences: string[]
): Promise<{ venues: Venue[], groundingChunks: GroundingChunk[] } | null> => {
  const prompt = `
    As an expert London travel planner, your task is to find 3-5 ideal public meeting points in London for two people. The "best" meeting point is not just about equal travel time, but a nuanced balance of total journey duration, convenience, and user preferences.

    **User Inputs:**
    *   Person A Start: "${locationA}"
    *   Person B Start: "${locationB}"
    *   Preferred Transit Modes: ${transitPreferences.length > 0 ? transitPreferences.join(', ') : 'All modes are acceptable'}.

    **Your Calculation Must Consider These Factors:**

    1.  **Total Journey Time (Crucial):** This includes both the time on public transport AND the walking time from the final station/stop to the venue's entrance. Aim for venues with minimal walking time (ideally under 10 minutes) unless it's a park.
    2.  **Travel Fairness (Nuanced Score):**
        *   Calculate the total journey time for both Person A and Person B.
        *   The primary goal is to minimize the *difference* in their total journey times.
        *   Incorporate the user's **Preferred Transit Modes**. A route that uses preferred modes might be considered better, even if it adds a few minutes to the total journey, as it improves the travel experience.
    3.  **TfL Real-time Data:** Use your knowledge of the TfL network, including typical service patterns, potential disruptions, weekend closures, and peak-hour congestion to assess route reliability.
    4.  **Venue Quality:** Suggest diverse, well-regarded venues (cafes, pubs, museums, parks) suitable for meeting.

    **Response Format:**
    Respond ONLY with a valid JSON object. Do not include any other text, explanations, or markdown formatting. The \`fairness\` description should now be more detailed, explaining *why* a location is fair by mentioning total travel time, walking distance, and adherence to transit preferences.
    {
      "venues": [
        {
          "name": "The name of the venue.",
          "type": "The type of venue (e.g., Cafe, Pub, Park, Museum).",
          "description": "A brief, one-sentence description of the venue and why it's a good meeting spot.",
          "fairness": "A detailed comment on fairness. Example: 'Excellent fairness. Total travel time is nearly identical (approx. 35-40 mins each), with a short 5-minute walk from the station. The route relies on the Tube, aligning with user preferences.'",
          "rating": 4.5,
          "opening_hours": "A string indicating current opening hours, e.g., 'Open ⋅ Closes 11PM' or 'Closed'.",
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
