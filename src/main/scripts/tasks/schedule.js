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
  await processTaskQueue(task)
}, concurrencyLimit) // 1 is the concurrency limit
let openBrowser = []

const fetchAndProcessTask = async () => {
  while (true) {
    try {
      if (taskQueue.length() < 10) {
        const response = await get(`/mission_schedule/`)
        if (response && response.schedule && response.schedule.length > 0) {
          // Add tasks to queue
          response.schedule.forEach((task) => {
            taskQueue.push(task)
          })
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 5000))
      // await cpuMonitoring()
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
  if (openBrowser.includes(profileIdGiver)) {
    return
  }

  openBrowser.push(profileIdGiver)
  try {
    await randomDelay()
    const tasks = queueData.tasks
    let profileIdReceiver = queueData.profile_id_receiver
    let profileData = await getProfileData(queueData.profile_id, {})

    if (!profileIdReceiver) {
      profileIdReceiver = profileIdGiver
    }

    const debuggerPort = profileData.debugger_port
    await checkPort(debuggerPort).then((isPortInUse) => {
      if (isPortInUse) {
        logger.info(`Port ${debuggerPort} is in use.`)
        return
        // Add your Puppeteer code here if the port is in use
      } else {
        // logger.info(`Port ${debuggerPort} is free.`)
        // Handle the case when the port is not in use
      }
    })

    let [page, browser] = await openProfileBrowser(profileIdGiver)

    if (browser) {
      page.on('error', async () => {
        // throw err; // catch don't work (issue: 6330, 5928, 1454, 6277, 3709)
        await browser.close()
      })
      browser.on('targetcreated', handleNewPage)
      browser.on('disconnected', async () => {
        if (browser.process() != null) {
          logger.info(`KILL APPLICATION ${browser.process()}`)
          // await killPID(browser.process())
          browser.process().kill('SIGINT')
          // logger.info(`KILL APPLICATION ${browser.process()} OK`)
        }
      })

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
  openBrowser = openBrowser.filter((id) => id !== queueData.profile_id)
}

const processTask = async (profileIdGiver, profileIdReceiver, taskName, tasksJson, page) => {
  try {
    switch (taskName) {
      // case TASK_NAME_CONFIG.Login:
      //   await startSignIn(profileIdGiver, page)
      //   break
      // case TASK_NAME_CONFIG.GetCookie:
      //   await getCookies(profileIdGiver, page)
      //   break
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
      default:
        return
    }
    await getCookies(profileIdGiver, page)
    // logger.info(`Create event logs: ${taskName} ${profileIdGiver}`)
    // await createEventLogs({
    //   event_type: taskName,
    //   profile_id: profileIdReceiver,
    //   profile_id_interact: profileIdGiver,
    //   issue: 'OK'
    // })
  } catch (error) {
    // await createEventLogs({
    //   event_type: taskName,
    //   profile_id: profileIdReceiver,
    //   profile_id_interact: profileIdGiver,
    //   issue: `processTaskWorker_error ${error}`
    // })
    logger.error('processTaskWorker_error', {
      error: mapErrorConstructor(error)
    })
  }
}
