import { BrowserWindow, ipcMain } from 'electron'
import { machineIdSync } from 'node-machine-id'
import hideMyAcc from './integration/hidemyacc'
import store from './store'
import { STORE_KEYS, SCRIPT_STATUS, BROWSER_TYPE } from './constants'
import scripts from './scripts'
import repository from './database/repository'
import logger from './logger'
import trends24Integration from './integration/trends24'
import { delay } from './scripts/utils'
import { openProfileBrowser } from './scripts/tasks/profile'
import { fetchScheduledTasks } from './scripts/tasks/schedule'
import { startSignIn } from './scripts/tasks/profile'
import { getProfileData } from './scripts/services/backend'

const dataMemories = {}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on('getKeyActivation', (event) => {
  event.reply('replyGetKeyActivation', {
    key: store.get(STORE_KEYS.KEY_ACTIVATION),
    status: store.get(STORE_KEYS.KEY_ACTIVATION_STATUS)
  })
})
ipcMain.on('updateAppSettings', (event, stringValues) => {
  const values = JSON.parse(stringValues)
  if (values.browserExecutablePath) {
    store.set(STORE_KEYS.BROWSER_EXEC_PATH, values.browserExecutablePath)
  }
  store.set(STORE_KEYS.BROWSER_OPTION, values.browser)
})
ipcMain.on('getAppSettings', (event) => {
  const values = {
    browserExecutablePath: store.get(STORE_KEYS.BROWSER_EXEC_PATH),
    browser: store.get(STORE_KEYS.BROWSER_OPTION) || {
      browserOption: BROWSER_TYPE.chrome,
      hideMyAcc: {}
    }
  }
  event.reply('replyGetAppSettings', JSON.stringify(values))
})
ipcMain.on('getAccounts', async (event) => {
  const records = await repository.findManyAccount()
  event.reply('replyGetAccounts', records)
})
ipcMain.on('getDetailedAccount', async (event, accountId) => {
  const [account, features] = await Promise.all([
    repository.findOneAccount(accountId),
    repository.findFeaturesOptions(accountId)
  ])
  event.reply('replyGetDetailedAccount', { account, features })
})
ipcMain.on('addAccount', async (event, { features, ...newAccount }) => {
  try {
    const existAccount = await repository.findAccountByProfileId(newAccount.profileId)
    if (!existAccount) {
      logger.debug(`Create new account: ${newAccount}`)
      const newRecord = await repository.saveAccount(newAccount)
      const featureList = Object.keys(features).reduce((result, featureType) => {
        result.push({
          ...features[featureType],
          type: featureType,
          accountId: newRecord.id
        })
        return result
      }, [])
      await repository.saveFeatures(featureList)
    } else {
      // Update exist account
      logger.debug(`Update exist account: ${existAccount}`)
      newAccount.deletedAt = null
      const id = existAccount.id
      repository.updateAccount(id, newAccount)
    }
  } catch (error) {
    logger.error('ADD_NEW_ACCOUNT_ERROR', error)
  }
  event.reply('replyAddAccountResult')
})
ipcMain.on('addAccounts', async (event, { accounts, feature }) => {
  const newAccounts = await repository.saveAccount(accounts)
  const featureList = Object.keys(feature).reduce((result, featureType) => {
    result.push({
      ...feature[featureType],
      type: featureType
    })
    return result
  }, [])
  const features = newAccounts
    .map((account) => {
      return [...featureList].map((item) => ({
        ...item,
        accountId: account.id
      }))
    })
    .flat()
  await repository.saveFeatures(features)
  event.reply('replyAddAccounts')
})
ipcMain.on('deleteAccounts', async (event, ids) => {
  await Promise.all(ids.map(stopScripts))
  const accounts = await repository.getAccounts(ids)
  const optionBrowser = store.get(STORE_KEYS.BROWSER_OPTION)
  const hmaUsername = optionBrowser?.hideMyAcc?.username
  if (hmaUsername) {
    const token = await hideMyAcc.getToken(optionBrowser.hideMyAcc)
    if (token) {
      await Promise.all(
        accounts.map((account) => {
          if (account.hideMyAccUsername === hmaUsername && account.hideMyAccProfileId) {
            return hideMyAcc
              .deleteProfile(token, account.hideMyAccProfileId)
              .then(() => {
                logger.log('DELETED_HMA_ACCOUNT', {
                  username: hmaUsername,
                  profileId: account.hideMyAccProfileId
                })
              })
              .catch((error) => {
                logger.error('DELETE_HMA_ACCOUNT_ERROR', {
                  error: error?.data
                })
              })
          }
        })
      )
    }
  }
  await Promise.all([repository.deleteAccounts(ids), repository.deleteFeatures(ids)])
  event.reply('replyDeleteAccountsResult', {})
})
ipcMain.on('updateAccount', async (event, { id, features, ...dataAccountUpdate }) => {
  const accountDataUpdate = Object.keys(dataAccountUpdate).reduce((result, key) => {
    const value = dataAccountUpdate[key]
    result[key] = value
    return result
  }, {})
  console.log('accountDataUpdate', accountDataUpdate)
  await Promise.all([
    Object.keys(accountDataUpdate).length && repository.updateAccount(id, accountDataUpdate),
    ...Object.keys(features).reduce((result, featType) => {
      result.push(
        repository
          .findAndUpdateFeatureOptions(
            {
              accountId: id,
              type: featType
            },
            features[featType]
          )
          .then((updateResult) => {
            if (updateResult.affected) {
              return
            }
            return repository.saveFeatures([
              {
                accountId: id,
                type: featType,
                ...features[featType]
              }
            ])
          })
      )
      return result
    }, [])
  ])
  event.reply('replyUpdateAccountResult')
})
ipcMain.on('updateAccounts', async (event, { accountIds, features }) => {
  const featureFounds = await repository.findFeaturesOptionsByAccountIds(accountIds)
  const newFeatures = accountIds.reduce((result, accountId) => {
    Object.keys(features).forEach((featType) => {
      const featureFound = featureFounds.find(
        (featOtp) => featOtp.accountId === accountId && featOtp.type === featType
      )
      result.push({
        accountId,
        type: featType,
        ...(featureFound || {}),
        ...features[featType]
      })
    })
    return result
  }, [])
  await repository.saveFeatures(newFeatures)
  event.reply('replyUpdateAccountsResult')
})

const callbackFuncUpdateScriptsStatus = (id, status) => {
  console.log('new status', status)
  if (!dataMemories[id]) {
    return
  }
  dataMemories[id].status = status
  switch (status) {
    case SCRIPT_STATUS.initFail:
    case SCRIPT_STATUS.loginFail:
    case SCRIPT_STATUS.getAccountInfoInfoError:
    case SCRIPT_STATUS.startError:
    case SCRIPT_STATUS.forceStop:
      stopScripts(id)
      break

    case SCRIPT_STATUS.stopped:
      delete dataMemories[id]
      break
    default:
      break
  }
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('replyAccountsScriptsStatus', dataMemories)
  })
}

ipcMain.on('playScripts', async (event, ids) => {
  const commonOptions = {
    browser: {
      ...(store.get(STORE_KEYS.BROWSER_OPTION) || {
        browserOption: BROWSER_TYPE.chrome,
        hideMyAcc: {}
      }),
      chrome: {
        browserExecutablePath: store.get(STORE_KEYS.BROWSER_EXEC_PATH)
      }
    }
  }
  if (!commonOptions.browser.browserOption) {
    return
  }
  for (let index = 0; index < ids.length; index++) {
    const id = ids[index]
    if (dataMemories[id]) {
      return
    }
    dataMemories[id] = {
      status: SCRIPT_STATUS.init
    }
    if (commonOptions.browser.browserOption === BROWSER_TYPE.hideMyAcc) {
      await delay(3000)
    }
    logger.debug(commonOptions)
    scripts.init(commonOptions, (status) => callbackFuncUpdateScriptsStatus(id, status), id)
  }
})

const stopScripts = (id) => {
  if (!dataMemories[id]) {
    return
  }
  return scripts.stop((status) => callbackFuncUpdateScriptsStatus(id, status), id)
}

ipcMain.on('stopScripts', (event, ids) => {
  ids.forEach(stopScripts)
})

ipcMain.on('crawlHashTagTrending', async (event, value) => {
  const result = await trends24Integration.getNewestTrends(
    store.get(STORE_KEYS.BROWSER_EXEC_PATH),
    value.region,
    value.total
  )
  event.reply('replyCrawlHashTagTrending', result)
})

ipcMain.on('getHashTagList', (event) => {
  event.reply('replyGetHashTagList', JSON.parse(store.get(STORE_KEYS.TRENDING_HASH_TAG) || '[]'))
})

ipcMain.on('updateHashTagList', (event, values) => {
  store.set(STORE_KEYS.TRENDING_HASH_TAG, JSON.stringify(values))
})

// Settings Page consumer
ipcMain.on('fetchMachineId', async (event) => {
  let deviceId = await machineIdSync({ original: true })
  event.reply('replyGetMachineId', deviceId)
})

// open profile
ipcMain.on('startOpenProfile', async (event, profile) => {
  const [page, browser] = await openProfileBrowser(profile)
})

// save access token
ipcMain.on('setAccessToken', (event, accessToken) => {
  store.set(STORE_KEYS.ACCESS_TOKEN, accessToken)
})

// performScheduledTasks
ipcMain.on('performScheduledTasks', async () => {
  // open profile
  fetchScheduledTasks()
})

ipcMain.on('getDetailedAccountById', async (event, profileId) => {
  const [account] = await Promise.all([repository.findAccountByProfileId(profileId)])
  event.reply('replyGetDetailedAccountById', { account })
})
