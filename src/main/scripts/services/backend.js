import axios from 'axios'
import store from '../../store'
import { STORE_KEYS, BACKEND_BASE_URL } from '../../constants'

export const getProfileData = async (profileId, tz) => {
  const profileData = post(`/profiles/${profileId}/browserdata`, tz)
  return profileData
}

export const updateProfileData = async (profileId, updateData) => {
  const profileData = put(`/profiles/${profileId}`, updateData)
  return profileData
}

export const updatePostData = async (profileId, updateData) => {
  const profileData = post(`/posts/`, updateData)
  return profileData
}

export const getScheduleData = async () => {
  const scheduleData = get(`/mission_schedule/`)
  return scheduleData
}

const axiosInstance = axios.create({
  baseURL: BACKEND_BASE_URL // Replace with your API's base URL
})

const getAuthToken = () => {
  // Replace this with your method of retrieving the stored JWT token
  const accessToken = store.get(STORE_KEYS.ACCESS_TOKEN)
  return accessToken
}

const handleResponse = (response) => {
  if (response.data) {
    return response.data
  }
  return response
}

const catchError = (error) => {
  // Handle the error as needed (e.g., logging, displaying messages)
  console.error('API call error:', error.response ? error.response.data : error.message)
  throw error
}

export const get = async (url) => {
  try {
    const token = getAuthToken()
    if (token) {
      const response = await axiosInstance.get(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        }
      })
      return handleResponse(response)
    }
    return null
  } catch (error) {
    catchError(error)
  }
}

export const post = async (url, data) => {
  try {
    const response = await axiosInstance.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`
      }
    })
    return handleResponse(response)
  } catch (error) {
    catchError(error)
  }
}

export const put = async (url, data) => {
  try {
    const response = await axiosInstance.put(url, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`
      }
    })
    return handleResponse(response)
  } catch (error) {
    catchError(error)
  }
}

export const del = async (url) => {
  try {
    const response = await axiosInstance.delete(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`
      }
    })
    return handleResponse(response)
  } catch (error) {
    catchError(error)
  }
}
