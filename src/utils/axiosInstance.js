import axios from 'axios';

const axiosInstance = axios.create({
  //baseURL: 'http://127.0.0.1:8000/api/',
  baseURL: 'https://backend-g1zl.onrender.com/api/',
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export default axiosInstance;