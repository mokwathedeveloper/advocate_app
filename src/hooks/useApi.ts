// Custom API hook for LegalPro v1.0.1
import { useState, useEffect } from 'react';

// Custom hook for API calls with loading and error states
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return { loading, error, setLoading, setError };
};