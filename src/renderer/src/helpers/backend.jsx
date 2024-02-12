import axios from 'axios'
import AppConfig from '../config/enums'
import { ipcMainConsumer } from './api'
const REFRESH_TOKEN_URL = `${AppConfig.BASE_URL}/user/refresh` // Endpoint for refreshing tokens

const axiosInstance = axios.create({
  baseURL: AppConfig.BASE_URL,
  timeout: 30000, // Set the request timeout
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
})

// Function to get the access token from your storage
const getAccessToken = () => {
  // Implement logic to retrieve your access token
  return localStorage.getItem('access_token')
}

// Function to get the refresh token from your storage
const getRefreshToken = () => {
  // Implement logic to retrieve your refresh token
  return localStorage.getItem('refresh_token')
}

// Function to save access token to your storage
const saveAccessToken = (token) => {
  // Implement logic to save your access token
  localStorage.setItem('access_token', token)
  ipcMainConsumer.emit('setAccessToken', token)
}

// Request interceptor to add the auth token header to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  (error) => {
    Promise.reject(error)
  }
)

// Response interceptor to refresh token on receiving token expired error
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    console.log(error)
    if (error.response.status === 401 && originalRequest.url === REFRESH_TOKEN_URL) {
      // If token refresh also fails, logout or handle accordingly
      // Redirect to login or similar
      return Promise.reject(error)
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = getRefreshToken()
      let config = {
        headers: {
          Authorization: `Bearer ${refreshToken}`
        }
      }

      return axios.post(REFRESH_TOKEN_URL, { refreshToken }, config).then((res) => {
        if (res.status === 200) {
          console.log(`refresh token ${res.data}`)
          saveAccessToken(res.data.access_token)
          axios.defaults.headers.common['Authorization'] = 'Bearer ' + res.data.access_token
          return axios(originalRequest)
        } else {
          //  Logout
        }
      })
    }
    return Promise.reject(error)
  }
)

// Function to make GET request
export const getRequest = (url) => {
  return axiosInstance.get(url)
}

// Function to make POST request
export const postRequest = (url, data) => {
  return axiosInstance.post(url, data)
}

// Function to make PUT request
export const putRequest = (url, data) => {
  return axiosInstance.put(url, data)
}

// Function to make DELETE request
export const deleteRequest = (url) => {
  return axiosInstance.delete(url)
}

// Export axiosInstance for direct usage if needed
export default axiosInstance
