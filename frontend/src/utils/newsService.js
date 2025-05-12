
const API_URL = 'http://localhost:8000';

const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...defaultOptions,
    ...options
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  
  return response.json();
};

export const getAllNews = async () => {
  try {
    return await fetchWithAuth('/news/');
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

export const deleteNews = async (id) => {
  try {
    await fetchWithAuth(`/news/${id}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error(`Error deleting news with ID ${id}:`, error);
    throw error;
  }
}; 