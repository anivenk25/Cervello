'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for data fetching with caching, state management and automatic revalidation
 * 
 * @param {string} url - The URL to fetch from
 * @param {Object} options - Fetch options and hook configuration
 * @param {Object} options.fetchOptions - Standard fetch API options
 * @param {boolean} options.skipFetch - Skip the fetch request entirely
 * @param {boolean} options.skipCache - Skip using cached data
 * @param {number} options.revalidateInterval - Time in ms to automatically revalidate data
 * @param {boolean} options.dedupingInterval - Time in ms to dedupe requests
 * @returns {Object} Request state and control functions
 */
export function useFetch(url, options = {}) {
  const {
    fetchOptions = {},
    skipFetch = false,
    skipCache = false,
    revalidateInterval = 0,
    dedupingInterval = 2000,
  } = options;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Use refs to avoid recreating the fetchData function on every render
  const cache = useRef({});
  const pendingRef = useRef({});
  const optionsRef = useRef(fetchOptions);
  const revalidateTimerRef = useRef(null);
  const controller = useRef(null);

  // Update options ref when fetchOptions change
  useEffect(() => {
    optionsRef.current = fetchOptions;
  }, [fetchOptions]);

  // Create a stable cache key
  const getCacheKey = useCallback(() => {
    return `${url}${JSON.stringify(fetchOptions)}`;
  }, [url, fetchOptions]);

  // Fetch data function
  const fetchData = useCallback(async (forceSkipCache = false) => {
    // Skip if explicitly told to
    if (skipFetch) return;
    
    const cacheKey = getCacheKey();
    
    // Check if we have a pending request for this URL
    if (pendingRef.current[cacheKey]) {
      // If request was made less than dedupingInterval ago, return early
      if (Date.now() - pendingRef.current[cacheKey] < dedupingInterval) {
        return;
      }
    }
    
    // Return cached data if available and not skipping cache
    if (cache.current[cacheKey] && !skipCache && !forceSkipCache) {
      const { data: cachedData, timestamp } = cache.current[cacheKey];
      setData(cachedData);
      
      // If data is too old, fetch in background
      if (revalidateInterval > 0 && timestamp && Date.now() - timestamp > revalidateInterval) {
        // Set a small timeout to avoid blocking the current execution
        setTimeout(() => fetchData(true), 10);
      }
      return;
    }
    
    // Record the time of this request for deduping
    pendingRef.current[cacheKey] = Date.now();
    
    // Cancel previous request if it exists
    if (controller.current) {
      controller.current.abort();
    }
    
    // Create a new abort controller for this request
    controller.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        ...optionsRef.current,
        headers: {
          'Content-Type': 'application/json',
          ...optionsRef.current?.headers,
        },
        signal: controller.current.signal,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
      }
      
      let result;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = await response.text();
      }
      
      // Update cache with timestamp
      cache.current[cacheKey] = {
        data: result,
        timestamp: Date.now(),
      };
      
      setData(result);
      
      // Set up next revalidation timer if needed
      if (revalidateInterval > 0) {
        if (revalidateTimerRef.current) {
          clearTimeout(revalidateTimerRef.current);
        }
        
        revalidateTimerRef.current = setTimeout(() => {
          fetchData(true);
        }, revalidateInterval);
      }
    } catch (err) {
      // Don't set error state if it was an abort error
      if (err.name !== 'AbortError') {
        setError(err.message || 'An error occurred');
      }
    } finally {
      // Clear the pending request tracker
      delete pendingRef.current[cacheKey];
      setLoading(false);
    }
  }, [url, fetchOptions, skipCache, skipFetch, getCacheKey, dedupingInterval, revalidateInterval]);

  // Fetch data on mount or when dependencies change
  useEffect(() => {
    fetchData(skipCache);
    
    // Cleanup function
    return () => {
      if (controller.current) {
        controller.current.abort();
      }
      
      if (revalidateTimerRef.current) {
        clearTimeout(revalidateTimerRef.current);
      }
    };
  }, [fetchData, skipCache]);

  // Refetch function for manual refetching
  const refetch = useCallback((options = {}) => {
    return fetchData(options.skipCache ?? true);
  }, [fetchData]);

  // Clear cache for this URL
  const clearCache = useCallback(() => {
    const cacheKey = getCacheKey();
    delete cache.current[cacheKey];
  }, [getCacheKey]);

  // Mutate cache function
  const mutate = useCallback((newData, shouldRevalidate = false) => {
    const cacheKey = getCacheKey();
    
    // If function is provided, use current data to compute new data
    if (typeof newData === 'function') {
      const currentData = cache.current[cacheKey]?.data || data;
      const updatedData = newData(currentData);
      
      // Update cache
      cache.current[cacheKey] = {
        data: updatedData,
        timestamp: Date.now(),
      };
      
      // Update state
      setData(updatedData);
    } else {
      // Otherwise just set the new data directly
      cache.current[cacheKey] = {
        data: newData,
        timestamp: Date.now(),
      };
      
      // Update state
      setData(newData);
    }
    
    // Optionally revalidate after mutation
    if (shouldRevalidate) {
      // Small delay to ensure UI updates first
      setTimeout(() => refetch(), 50);
    }
  }, [data, getCacheKey, refetch]);

  return { 
    data, 
    error, 
    loading, 
    refetch, 
    mutate,
    clearCache
  };
}

export default useFetch;