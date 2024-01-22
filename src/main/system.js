import os from 'os'
import crypto from 'crypto'
import { execSync } from 'child_process'
import store from './store'
import { STORE_KEYS } from './constants'

const getSecretKey = () => {
  const listText = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789']
  let Device = store.get(STORE_KEYS.SECRET_KEY_RANDOM) || ''
  if (!Device) {
    for (let x = 0; x < 1000; x++) {
      Device += listText[Math.floor(Math.random() * listText.length)]
    }
    store.set(STORE_KEYS.SECRET_KEY_RANDOM, Device)
  }
  return Device
}

const generateKey = (values) => {
  const username = os.userInfo().username
  const platformInfo = os.platform() + os.arch()
  const secretKey = getSecretKey()
  const combinedData = [...values, username, platformInfo, secretKey].join('')
  return crypto.createHash('md5').update(combinedData, 'utf-8-sig').digest('hex')
}

const getWinID = () => {
  const key1 = execSync('wmic csproduct get uuid')
    .toString()
    .split('\n')[1]
    .split('  ')[0]
    .replace(/-/g, '')
  const key2 = execSync('wmic computersystem get model,name')
    .toString()
    .split('\r\r\n')[1]
    .split('  ')
    .join('')
  return generateKey([key1, key2])
}

const getMacId = () => {
  const key1 = execSync('system_profiler SPHardwareDataType | grep Serial', {
    encoding: 'utf8'
  })
    .trim()
    .replace(/Serial Number \(system\): /, '')
  const key2 = execSync('sysctl -n hw.model', { encoding: 'utf8' }).trim()
  return generateKey([key1, key2])
}
export default {
  getWinID,
  getMacId,
}
