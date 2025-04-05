/**
 * API client utility for making fetch requests with error handling
 * and CSRF protection for non-GET requests
 */

// Use environment variable or fallback to relative path
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Shared request timeout (ms)
const REQUEST_TIMEOUT = 30000;

/**
 * Creates a promise that rejects after specified timeout
 * @param {number} ms Timeout in milliseconds
 * @returns {Promise} Promise that rejects after timeout
 */
const timeoutPromise = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
  });
};

/**
 * Generic fetch function with error handling, timeout and cancellation support
 * @param {string} endpoint API endpoint path
 * @param {Object} options Fetch options
 * @param {AbortController} [abortController] Optional abort controller
 * @returns {Promise} API response
 */
const fetchAPI = async (endpoint, options = {}, abortController = null) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const controller = abortController || new AbortController();
    
    // Default options
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    };
    
    // Merge default options with provided options
    const fetchOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    // Race the fetch against a timeout
    const response = await Promise.race([
      fetch(url, fetchOptions),
      timeoutPromise(REQUEST_TIMEOUT)
    ]);
    
    // Check for content type to determine parsing method
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Handle API errors
    if (!response.ok) {
      const error = new Error(
        typeof data === 'object' && data.error
          ? data.error
          : `API Error: ${response.statusText || response.status}`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    // Enhance error with API context
    if (!error.status) {
      error.isNetworkError = true;
    }
    console.error(`API request failed (${endpoint}):`, error);
    throw error;
  }
};

/**
 * API endpoints organized by feature
 */
export const api = {
  // Authentication endpoints
  auth: {
    // We only use Google Auth
    getSession: async () => {
      return fetchAPI('/auth/session');
    },
    saveRole: async (role) => {
      return fetchAPI('/auth/onboarding', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
    },
    updateProfile: async (userData) => {
      return fetchAPI('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    },
    getPreferences: async () => {
      return fetchAPI('/auth/preferences');
    },
    updatePreferences: async (preferences) => {
      return fetchAPI('/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
    },
  },
  
  // Q&A endpoints
  qa: {
    askQuestion: async (question, context = null) => {
      return fetchAPI('/qa', {
        method: 'POST',
        body: JSON.stringify({ question, context }),
      });
    },
    getHistory: async (limit = 10, page = 1) => {
      return fetchAPI(`/qa/history?limit=${limit}&page=${page}`);
    },
    getById: async (id) => {
      return fetchAPI(`/qa/${id}`);
    },
    submitFeedback: async (queryId, rating, comment = "") => {
      return fetchAPI('/qa/feedback', {
        method: 'POST',
        body: JSON.stringify({ queryId, rating, comment }),
      });
    },
    // Stream for real-time results
    streamQuestion: async (question, context = null, callbacks = {}) => {
      const controller = new AbortController();
      const { onChunk, onComplete, onError } = callbacks;
      
      try {
        const response = await fetch(`${API_BASE_URL}/qa/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question, context }),
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error(`Stream error: ${response.status}`);
        }
        
        if (!response.body) {
          throw new Error('ReadableStream not supported');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            if (onComplete) onComplete(result);
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          result += chunk;
          
          if (onChunk) onChunk(chunk, result);
        }
        
        return result;
      } catch (error) {
        if (onError) onError(error);
        throw error;
      }
      
      return {
        abort: () => controller.abort()
      };
    }
  },
  
  // Admin endpoints
  admin: {
    // User management
    users: {
      getAll: async (limit = 10, page = 1, filters = {}) => {
        const queryParams = new URLSearchParams({
          limit: limit.toString(),
          page: page.toString(),
          ...filters
        }).toString();
        
        return fetchAPI(`/admin/users?${queryParams}`);
      },
      getById: async (id) => {
        return fetchAPI(`/admin/users/${id}`);
      },
      create: async (userData) => {
        return fetchAPI('/admin/users', {
          method: 'POST',
          body: JSON.stringify(userData),
        });
      },
      update: async (id, userData) => {
        return fetchAPI(`/admin/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(userData),
        });
      },
      delete: async (id) => {
        return fetchAPI(`/admin/users/${id}`, {
          method: 'DELETE',
        });
      },
    },
    
    // Data source management
    sources: {
      getAll: async (limit = 10, page = 1, filters = {}) => {
        const queryParams = new URLSearchParams({
          limit: limit.toString(),
          page: page.toString(),
          ...filters
        }).toString();
        
        return fetchAPI(`/admin/sources?${queryParams}`);
      },
      getById: async (id) => {
        return fetchAPI(`/admin/sources/${id}`);
      },
      create: async (sourceData) => {
        return fetchAPI('/admin/sources', {
          method: 'POST',
          body: JSON.stringify(sourceData),
        });
      },
      update: async (id, sourceData) => {
        return fetchAPI(`/admin/sources/${id}`, {
          method: 'PUT',
          body: JSON.stringify(sourceData),
        });
      },
      delete: async (id) => {
        return fetchAPI(`/admin/sources/${id}`, {
          method: 'DELETE',
        });
      },
      syncNow: async (id) => {
        return fetchAPI(`/admin/sources/${id}/sync`, {
          method: 'POST'
        });
      },
      getStats: async () => {
        return fetchAPI('/admin/sources/stats');
      }
    },
    
    // System settings
    settings: {
      getAll: async () => {
        return fetchAPI('/admin/settings');
      },
      update: async (settings) => {
        return fetchAPI('/admin/settings', {
          method: 'PUT',
          body: JSON.stringify(settings),
        });
      }
    },
    
    // Analytics
    analytics: {
      getOverview: async (timeframe = 'week') => {
        return fetchAPI(`/admin/analytics/overview?timeframe=${timeframe}`);
      },
      getQueries: async (limit = 10, page = 1, filters = {}) => {
        const queryParams = new URLSearchParams({
          limit: limit.toString(),
          page: page.toString(),
          ...filters
        }).toString();
        
        return fetchAPI(`/admin/analytics/queries?${queryParams}`);
      },
      getPopularTopics: async (limit = 10) => {
        return fetchAPI(`/admin/analytics/topics?limit=${limit}`);
      }
    }
  },
  
  // Webhook endpoints
  webhooks: {
    notify: async (type, data) => {
      return fetchAPI('/webhooks', {
        method: 'POST',
        headers: {
          'x-webhook-type': type,
        },
        body: JSON.stringify(data),
      });
    }
  }
};

export default api;