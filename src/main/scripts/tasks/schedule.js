import { get, createEventLogs } from '../services/backend'
import { openProfileBrowser, getCookies, resolveCaptcha, checkProfiles } from './profile'
import { TASK_NAME_CONFIG } from '../../constants'
import logger from '../../logger'
import async from 'async'
import newsFeedStep from '../steps/newsfeed'
import profileAdsStep from '../steps/profile-ads/index'
import fairInteractStep from '../steps/fair-interact'
import crawlPostStep from '../steps/crawl-post'
import reUpStep from '../steps/reup-post'
import { killChrome, handleNewPage } from './utils'
import { mapErrorConstructor } from '../../helpers'
import { killPID } from './utils'
import { CronJob } from 'cron'

let isStarted = false
const concurrencyLimit = 25
let listOpenBrowser = []
let taskQueue = async.queue(async (task) => {
  try {
    await processTaskQueue(task)
  } catch (error) {
    logger.error(`processTaskQueue ERROR ${error}`)
  }
}, concurrencyLimit) // 1 is the concurrency limit

// kill marco.exe every hours
CronJob.from({
  cronTime: '0 */12 * * *',
  onTick: function () {
    killChrome()
  },
  start: true,
  timeZone: 'America/Los_Angeles'
})

const fetchAndProcessTask = async () => {
  while (true) {
    try {
      if (taskQueue.length() < concurrencyLimit) {
        const response = await get(`/mission_schedule/`)
        if (response && response.schedule && response.schedule.length > 0) {
          // Add tasks to queue
          // response.schedule.forEach((task) => {
          //   taskQueue.push(task)
          // })
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 20000))
    } catch (error) {
      logger.error(`fetchAndProcessTask Error: ${error}`)
      await new Promise((resolve) => setTimeout(resolve, 60000)) // Wait before retrying in case of error
    }
  }
}

export const fetchScheduledTasks = async () => {
  if (!isStarted) {
    logger.info('Starting task fetching and processing')
    isStarted = true
    killChrome()
    fetchAndProcessTask() // Start task fetching and processing
  }
}

const processTaskQueue = async (queueData) => {
  const profileIdGiver = queueData?.profile_id
  let processPID = null
  // let browserWSEndpoint = null
  if (listOpenBrowser.includes(profileIdGiver)) {
    logger.info(`The user ${profileIdGiver} is running`)
    return
  }

  try {
    const mission_tasks = queueData.tasks
    let profileIdReceiver = queueData.profile_id_receiver

    if (!profileIdReceiver) {
      profileIdReceiver = profileIdGiver
    }

    listOpenBrowser.push(profileIdGiver)
    const [page, browser] = await openProfileBrowser(profileIdGiver)

    if (browser) {
      // page.setDefaultNavigationTimeout(0)
      processPID = browser.process().pid
      browser.on('targetcreated', handleNewPage)

      for (let task of mission_tasks) {
        // logger.info(`Task: ${JSON.stringify(task)}`)
        const taskName = task.tasks.tasks_name
        // await updateProfileData(profileIdGiver, { status: `Task: ${taskName}` })
        const tasksJson = task.tasks.tasks_json
        try {
          const configProfiles = task?.config?.profiles
          if (tasksJson && configProfiles) {
            tasksJson.profiles = configProfiles
          }
        } catch (error) {
          logger.error(`set task profiles error ${error}`)
        }
        const startDate = new Date()
        logger.info(`${startDate} ${profileIdGiver} Worker start ${taskName}`)
        await processTask(profileIdGiver, profileIdReceiver, taskName, tasksJson, page)
        const endDate = new Date()
        logger.info(`${endDate} ${profileIdGiver} Worker finished ${taskName}`)
      }
      await browser.close()
    }
  } catch (error) {
    logger.error(`processTaskQueue_error ${error}`)
  }
  listOpenBrowser = listOpenBrowser.filter((item) => item !== profileIdGiver)
  logger.info(`listOpenBrowser ${JSON.stringify(listOpenBrowser)}`)
  await killPID(processPID)
}

const processTask = async (profileIdGiver, profileIdReceiver, taskName, tasksJson, page) => {
  try {
    await resolveCaptcha(profileIdGiver, page)
    switch (taskName) {
      case TASK_NAME_CONFIG.CheckProfile:
        await checkProfiles(profileIdGiver, page)
        break
      case TASK_NAME_CONFIG.Newsfeed:
        await newsFeedStep.init(page, profileIdGiver, tasksJson)
        break
      case TASK_NAME_CONFIG.ClickAds:
        if (Math.random() < 0.1) {
          await newsFeedStep.init(page, profileIdGiver, tasksJson)
        }
        if (Math.random() < 0.03) {
          await checkProfiles(profileIdGiver, page)
        }
        await profileAdsStep.init(page, profileIdGiver, profileIdReceiver, tasksJson)
        break
      case TASK_NAME_CONFIG.fairInteract:
        await fairInteractStep.init(page, profileIdGiver, profileIdReceiver, tasksJson)
        break
      case TASK_NAME_CONFIG.reUpPost:
        await crawlPostStep.init(page, profileIdGiver, tasksJson)
        await reUpStep.init(page, profileIdGiver, tasksJson)
        break
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

// Closing the browser with a timeout
const closeBrowserWithTimeout = async (browser) => {
  const closePromise = browser.close()
  const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 10000))

  try {
    // Wait for either the close operation to complete or the timeout to occur
    await Promise.race([closePromise, timeoutPromise])
  } catch (error) {
    // Handle any errors
    console.error('Error while closing browser:', error)
  }
}
