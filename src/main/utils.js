import { app } from 'electron'
import path from 'path'

export const getAppPath = (subPath) => path.join(app.getPath('userData'), subPath)

export default {
  getAppPath
}
