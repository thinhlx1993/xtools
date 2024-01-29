import { get, createEventLogs } from '../services/backend'
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
let isStarted = false
let queue = null

export const fetchScheduledTasks = async () => {
  if (!isStarted) {
    // await killProcessByName('Marco')
    logger.info('Start worker')
    isStarted = true
    setInterval(async () => {
      try {
        const response = await get('/mission_schedule/')
        if (response) {
          // Add tasks to queue
          response.schedule.forEach((task) => {
            queue.push(task)
          })
        }
      } catch (error) {
        logger.info(error)
      }
    }, 5000) // Run every 60 seconds

    // worker swamp

    // let threadsNumber = 2

    // try {
    //   const response = await get('/settings/')
    //   if (response && response.settings) {
    //     threadsNumber = response.settings.settings.Threads
    //   }
    // } catch (error) {
    //   logger.error(error)
    // }
    queue = async.queue(async (task) => {
      // Your task processing function
      await processTaskQueue(task)
    }, 10) // 10 is the concurrency limit
  }
}

const processTaskQueue = async (queueData) => {
  try {
    // {
    //   schedule_id: '8f74ef78-52ec-46ff-b88a-d93bd1ae9ea5',
    //   group_id: null,
    //   profile_id: 'c8a1754f-3769-4816-9c61-f791d7bbddab',
    //   mission_id: '29868e59-538a-48f9-8673-03ffaf8622df',
    //   schedule_json: { cron: '', loop_count: 1 },
    //   start_timestamp: '26-01-2024 08:22',
    //   tasks: [
    //     {
    //       mission_id: '29868e59-538a-48f9-8673-03ffaf8622df',
    //       tasks_id: '7cc3d468-76fa-4167-aab2-2e37702f3846',
    //       tasks: {
    //            mission_id: 'db437f17-f911-40bf-b4e1-db920a5ac787',
    //            tasks_id: '7cc3d468-76fa-4167-aab2-2e37702f3846',
    //            tasks: {
    //                tasks_id: '7cc3d468-76fa-4167-aab2-2e37702f3846',
    //                tasks_name: 'Check follow',
    //                tasks_json: null
    //        }
    //      }
    //     }
    //   ]
    // }
    const tasks = queueData.tasks
    const profileId = queueData.profile_id
    const profileIdReceiver = queueData.profile_id_receiver
    // let [page, browser] = await openProfileBrowser(profileId)
    for (let task of tasks) {
      logger.info(`Task: ${JSON.stringify(task)}`)
      const taskName = task.tasks.tasks_name
      const tasksJson = task.tasks.tasks_json
      // const profileTargets = task.tasks.profile_targets ? task.tasks.profile_targets : []
      const startDate = new Date()
      logger.info(`${startDate} ${profileId} Worker start ${taskName}`)
      // await processTask(profileId, profileTargets, taskName, tasksJson, page)
      await createEventLogs({
        event_type: taskName,
        profile_id: profileId,
        profile_id_interact: profileIdReceiver,
        issue: 'OK'
      })

      const endDate = new Date()
      logger.info(`${endDate} ${profileId} finished ${taskName}`)
    }
    // if (browser) {
    //   await browser.close()
    // }
  } catch (error) {
    logger.error(error)
  }
}

const processTask = async (profileId, profileTargets, taskName, tasksJson, page) => {
  try {
    switch (taskName) {
      case TASK_NAME_CONFIG.Login:
        await startSignIn(profileId, page)
        break
      case TASK_NAME_CONFIG.GetCookie:
        await getCookies(profileId, page)
        break
      case TASK_NAME_CONFIG.Captcha:
        await resolveCaptcha(profileId, page)
        break
      case TASK_NAME_CONFIG.CheckProfile:
        await checkProfiles(profileId, page)
        break
      case TASK_NAME_CONFIG.Newsfeed:
        await newsFeedStep.init(page, profileId, tasksJson)
        break
      default:
        return
    }
    if (profileTargets.length > 0) {
      logger.info(`Create event logs: ${taskName} ${profileId} -> ${profileTargets}`)
      for (let profileTarget of profileTargets) {
        await createEventLogs({
          event_type: taskName,
          profile_id: profileId,
          profile_id_interact: profileTarget,
          issue: 'OK'
        })
      }
    } else {
      logger.info(`Create event logs: ${taskName} ${profileId}`)
      await createEventLogs({
        event_type: taskName,
        profile_id: profileId,
        issue: 'OK'
      })
    }
  } catch (error) {
    await createEventLogs({
      event_type: taskName,
      profile_id: profileId,
      issue: `${error}`
    })
    logger.error(`Error in process Task worker ${error}`)
  }
}
