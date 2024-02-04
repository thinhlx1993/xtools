import { get, createEventLogs, updateProfileData, getProfileData } from '../services/backend'
import {
  openProfileBrowser,
  startSignIn,
  getCookies,
  resolveCaptcha,
  checkProfiles
} from './profile'
import { TASK_NAME_CONFIG } from '../../constants'
import logger from '../../logger'
import async from 'async'
import newsFeedStep from '../steps/newsfeed'
import profileAdsStep from '../steps/profile-ads/index'
import fairInteractStep from '../steps/fair-interact'
import { killChrome, checkPort, handleNewPage, randomDelay } from './utils'
import { mapErrorConstructor } from '../../helpers'
import { cpuMonitoring, killPID } from './utils'

let isStarted = false
const concurrencyLimit = 15
let taskQueue = async.queue(async (task) => {
  try {
    await processTaskQueue(task)
  } catch (error) {
    logger.error(`processTaskQueue ERROR ${error}`)
  }
}, concurrencyLimit) // 1 is the concurrency limit

const fetchAndProcessTask = async () => {
  while (true) {
    try {
      // if we dont have any task in queue, kill all chrome

      await randomDelay()

      if (taskQueue.length() < concurrencyLimit) {
        const response = await get(`/mission_schedule/`)
        if (response && response.schedule && response.schedule.length > 0) {
          // Add tasks to queue
          response.schedule.forEach((task) => {
            taskQueue.push(task)
          })
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 5000))
      if (taskQueue.length() === 0) {
        await cpuMonitoring()
      }
    } catch (error) {
      logger.error(`fetchAndProcessTask Error: ${error}`)
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait before retrying in case of error
    }
  }
}

export const fetchScheduledTasks = async () => {
  if (!isStarted) {
    logger.info('Starting task fetching and processing')
    isStarted = true
    await killChrome()
    fetchAndProcessTask() // Start task fetching and processing
  }
}

const processTaskQueue = async (queueData) => {
  const profileIdGiver = queueData?.profile_id
  let processPID = null
  try {
    await randomDelay()
    const tasks = queueData.tasks
    let profileIdReceiver = queueData.profile_id_receiver

    if (!profileIdReceiver) {
      profileIdReceiver = profileIdGiver
    }

    let [page, browser] = await openProfileBrowser(profileIdGiver)

    if (browser) {
      page.setDefaultNavigationTimeout(0)
      processPID = browser.process().pid
      browser.on('targetcreated', handleNewPage)
      for (let task of tasks) {
        // logger.info(`Task: ${JSON.stringify(task)}`)
        const taskName = task.tasks.tasks_name
        await updateProfileData(profileIdGiver, { status: `Task: ${taskName}` })
        const tasksJson = task.tasks.tasks_json
        const startDate = new Date()
        logger.info(`${startDate} ${profileIdGiver} Worker start ${taskName}`)
        await processTask(profileIdGiver, profileIdReceiver, taskName, tasksJson, page)
        const endDate = new Date()
        logger.info(`${endDate} ${profileIdGiver} Worker finished ${taskName}`)
      }
      await updateProfileData(profileIdGiver, { status: `ok` })
      await browser.close()
    }
  } catch (error) {
    logger.error('processTaskQueue_error', {
      error: mapErrorConstructor(error)
    })
  }
  await killPID(processPID)
}

const processTask = async (profileIdGiver, profileIdReceiver, taskName, tasksJson, page) => {
  try {
    switch (taskName) {
      case TASK_NAME_CONFIG.Login:
        await startSignIn(profileIdGiver, page)
        break
      case TASK_NAME_CONFIG.GetCookie:
        await getCookies(profileIdGiver, page)
        break
      case TASK_NAME_CONFIG.Captcha:
        await resolveCaptcha(profileIdGiver, page)
        break
      case TASK_NAME_CONFIG.CheckProfile:
        await checkProfiles(profileIdGiver, page)
        break
      case TASK_NAME_CONFIG.Newsfeed:
        await newsFeedStep.init(page, profileIdGiver, tasksJson)
        break
      case TASK_NAME_CONFIG.ClickAds:
        await profileAdsStep.init(page, profileIdGiver, profileIdReceiver, tasksJson)
        break
      case TASK_NAME_CONFIG.fairInteract:
        await fairInteractStep.init(page, profileIdGiver, profileIdReceiver, tasksJson)
        break
      // auto comment: future feature
      // case TASK_NAME_CONFIG.fairInteract:
      // crawlPostStep.init(browser, account, reUpPostOptions)
      // reUpStep.init(browser, account, reUpPostOptions)
      default:
        return
    }
    await getCookies(profileIdGiver, page)
  } catch (error) {
    await createEventLogs({
      event_type: taskName,
      profile_id: profileIdReceiver,
      profile_id_interact: profileIdGiver,
      issue: `processTaskWorker_error ${error}`
    })
    logger.error('processTaskWorker_error', {
      error: mapErrorConstructor(error)
    })
  }
}
