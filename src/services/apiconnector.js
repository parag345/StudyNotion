import axios from "axios"

// Create axios instance
export const axiosInstance = axios.create({});

/**
 * API connector for making HTTP requests
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} url - API endpoint URL
 * @param {object} bodyData - Request body data (for POST, PUT, etc.)
 * @param {object} headers - Request headers
 * @param {object} params - URL parameters
 * @returns {Promise} - Returns axios promise
 */
export const apiConnector = (method, url, bodyData, headers, params) => {
  // Convert null values to proper defaults
  const requestHeaders = headers || {};
  const requestParams = params || {};
  
  // Make sure we explicitly handle the Authorization header correctly
  // when it's present
  if (headers && headers.Authorization) {
    // Log token being used for debugging (remove in production)
    console.log("Using authorization token:", headers.Authorization.substring(0, 20) + "...");
  }
  
  return axiosInstance({
    method: method,
    url: url,
    data: bodyData || null,
    headers: requestHeaders,
    params: requestParams,
  }).catch(error => {
    // Enhanced error logging
    if (error.response) {
      // Server responded with error status
      console.error(`API Error ${error.response.status}:`, error.response.data);
      
      // Specific handling for auth errors
      if (error.response.status === 401) {
        console.error("Authentication error - Token may be invalid or expired");
      }
    } else if (error.request) {
      // Request made but no response received
      console.error("API Error: No response received", error.request);
    } else {
      // Error in setting up the request
      console.error("API Request Error:", error.message);
    }
    
    // Re-throw to let caller handle it
    throw error;
  });
}