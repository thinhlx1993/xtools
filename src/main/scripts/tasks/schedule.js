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
import crawlPostStep from '../steps/crawl-post'
import reUpStep from '../steps/reup-post'
import { killChrome, handleNewPage, randomDelay } from './utils'
import { mapErrorConstructor } from '../../helpers'
import { cpuMonitoring, killPID } from './utils'
import { CronJob } from 'cron'

let isStarted = false
const concurrencyLimit = 5
let listOpenBrowser = []
let taskQueue = async.queue(async (task) => {
  try {
    await processTaskQueue(task)
  } catch (error) {
    logger.error(`processTaskQueue ERROR ${error}`)
  }
}, concurrencyLimit) // 1 is the concurrency limit

// kill marco.exe every hours
const job = CronJob.from({
  cronTime: '0 * * * *',
  onTick: function () {
    killChrome()
  },
  start: true,
  timeZone: 'America/Los_Angeles'
})

const fetchAndProcessTask = async () => {
  while (true) {
    try {
      // if we dont have any task in queue, kill all chrome
      if (taskQueue.length() < concurrencyLimit) {
        const response = await get(`/mission_schedule/`)
        if (response && response.schedule && response.schedule.length > 0) {
          // Add tasks to queue
          response.schedule.forEach((task) => {
            taskQueue.push(task)
          })
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // if (taskQueue.length() === 0) {
      //   await cpuMonitoring()
      // }
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
    fetchAndProcessTask() // Start task fetching and processing
  }
}

const processTaskQueue = async (queueData) => {
  const profileIdGiver = queueData?.profile_id
  // let processPID = null
  // let browserWSEndpoint = null

  try {
    const mission_tasks = queueData.tasks
    let profileIdReceiver = queueData.profile_id_receiver

    if (!profileIdReceiver) {
      profileIdReceiver = profileIdGiver
    }

    const [page, browser] = await openProfileBrowser(profileIdGiver)

    if (browser) {
      listOpenBrowser.push(profileIdGiver)
      browser.on('disconnected', async () => {
        console.log('BROWSER disconnected')
      })

      browser.on('targetdestroyed', async (target) => {
        // fix listen disconnected on MacOS
        const pages = await browser.pages()
        if (!pages.length || pages.length > 5) {
          await browser.close()
        }
      })

      // page.setDefaultNavigationTimeout(0)
      // processPID = browser.process().pid
      browser.on('targetcreated', handleNewPage)

      for (let task of mission_tasks) {
        // logger.info(`Task: ${JSON.stringify(task)}`)
        const taskName = task.tasks.tasks_name
        await updateProfileData(profileIdGiver, { status: `Task: ${taskName}` })
        const tasksJson = task.tasks.tasks_json
        try {
          const configProfiles = task?.config?.profiles
          if (configProfiles) {
            tasksJson.profiles = configProfiles
          }
        } catch (error) {}

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
  listOpenBrowser = array.filter(item => item !== profileIdGiver);
}

const processTask = async (profileIdGiver, profileIdReceiver, taskName, tasksJson, page) => {
  try {
    // await startSignIn(profileIdGiver, page)
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
      case TASK_NAME_CONFIG.reUpPost:
        await crawlPostStep.init(page, profileIdGiver, tasksJson)
        await reUpStep.init(page, profileIdGiver, tasksJson)
        break
      default:
        return
    }
    await createEventLogs({
      event_type: taskName,
      profile_id: profileIdReceiver,
      profile_id_interact: profileIdGiver,
      issue: 'OK'
    })
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
