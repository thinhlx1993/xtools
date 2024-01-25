import axios from 'axios'
import { BACKEND_BASE_URL, STORE_KEYS } from '../../constants'
import store from '../../store'

export const getProfileData = async (profileId, tz) => {
  const profileData = post(`/profiles/${profileId}/browserdata`, tz)
  return profileData
}

export const updateProfileData = async (profileId, updateData) => {
  const profileData = put(`/profiles/${profileId}`, updateData)
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
  return store.get(STORE_KEYS.ACCESS_TOKEN)
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
    const response = await axiosInstance.get(url, {
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

export const post = async (url, data) => {
  console.log(post);
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
