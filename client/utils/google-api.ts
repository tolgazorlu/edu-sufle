/**
 * Utility functions for working with Google API
 */

/**
 * Get the Google API key from localStorage
 * This function can be used throughout the application to access the API key
 */
export const getGoogleApiKey = (): string | null => {
  // Only run on client side
  if (typeof window === 'undefined') {
    return null;
  }
  
  return localStorage.getItem('googleApiKey');
};

/**
 * Checks if a Google API key is available
 */
export const hasGoogleApiKey = (): boolean => {
  return getGoogleApiKey() !== null;
};

/**
 * Fetch the Google API key from the server
 * @param userId The user ID to fetch the API key for
 */
export const fetchGoogleApiKey = async (userId: string): Promise<string | null> => {
  try {
    const response = await fetch(`/api/settings?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch API key');
    }
    
    const data = await response.json();
    return data.googleApiKey || null;
  } catch (error) {
    console.error('Error fetching Google API key:', error);
    return null;
  }
};

/**
 * Example function for making requests to Google APIs
 * @param endpoint The API endpoint to call
 * @param params Additional parameters for the request
 */
export const callGoogleApi = async <T>(
  endpoint: string, 
  params: Record<string, any> = {}
): Promise<T | null> => {
  const apiKey = getGoogleApiKey();
  
  if (!apiKey) {
    console.error('No Google API key found');
    return null;
  }
  
  try {
    const url = new URL(endpoint);
    
    // Add API key to the params
    url.searchParams.append('key', apiKey);
    
    // Add any other parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google API request failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling Google API:', error);
    return null;
  }
}; 