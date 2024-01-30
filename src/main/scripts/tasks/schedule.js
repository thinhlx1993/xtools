import { get, createEventLogs, updateProfileData } from '../services/backend'
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
let isStarted = false
const concurrencyLimit = 15

let taskQueue = async.queue(async (task, done) => {
  await processTaskQueue(task)
  done()
}, 15) // 1 is the concurrency limit

const fetchAndProcessTask = async () => {
  while (true) {
    try {
      if (taskQueue.length() < 15) {
        const response = await get('/mission_schedule/')
        if (response && response.schedule && response.schedule.length > 0) {
          // Add tasks to queue
          response.schedule.forEach((task) => {
            taskQueue.push(task)
          })
        } else {
          logger.info(`No tasks found. Waiting for new tasks.`)
          await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait before checking for new tasks
        }
      } else {
        logger.info(`Waiting for tasks in queue.`)
        await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait before checking the queue again
      }
    } catch (error) {
      logger.error(`Error: ${error}`)
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait before retrying in case of error
    }
  }
}

export const fetchScheduledTasks = async () => {
  if (!isStarted) {
    logger.info('Starting task fetching and processing')
    isStarted = true

    for (let i = 0; i < concurrencyLimit; i++) {
      fetchAndProcessTask() // Start task fetching and processing
    }
  }
}

const processTaskQueue = async (queueData, workerId) => {
  try {
    const tasks = queueData.tasks
    const profileIdGiver = queueData.profile_id
    const profileIdReceiver = queueData.profile_id_receiver
    let [page, browser] = await openProfileBrowser(profileIdGiver)
    if (browser) {
      for (let task of tasks) {
        logger.info(`Task: ${JSON.stringify(task)}`)
        const taskName = task.tasks.tasks_name
        await updateProfileData(profileIdGiver, { status: `Task: ${taskName}` })
        const tasksJson = task.tasks.tasks_json
        const startDate = new Date()
        logger.info(`${startDate} ${profileIdGiver} Worker ${workerId} start ${taskName}`)
        await processTask(profileIdGiver, profileIdReceiver, taskName, tasksJson, page)
        const endDate = new Date()
        logger.info(`${endDate} ${profileIdGiver} Worker ${workerId} finished ${taskName}`)
      }
      await updateProfileData(profileIdGiver, { status: `ok` })
      await browser.close()
    }
  } catch (error) {
    logger.error(error)
  }
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
        logger.info(`Found clicks ads`)
        await profileAdsStep.init(page, profileIdGiver, profileIdReceiver, tasksJson)
        break
      case TASK_NAME_CONFIG.fairInteract:
        await newsFeedStep.init(page, profileIdGiver, tasksJson)
        await fairInteractStep.init(page, profileIdGiver, profileIdReceiver, tasksJson)
        break
      default:
        return
    }
    logger.info(`Create event logs: ${taskName} ${profileIdGiver}`)
    if (profileIdReceiver) {
      // profile_id is the reciver
      // profile_id_interact is the user giver
      await createEventLogs({
        event_type: taskName,
        profile_id: profileIdReceiver,
        profile_id_interact: profileIdGiver,
        issue: 'OK'
      })
    } else {
      await createEventLogs({
        event_type: taskName,
        profile_id_interact: profileIdGiver,
        issue: 'OK'
      })
    }
  } catch (error) {
    await createEventLogs({
      event_type: taskName,
      profile_id_interact: profileIdGiver,
      issue: `${error}`
    })
    logger.error(`Error in process Task worker ${error}`)
  }
}
