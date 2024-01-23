import { get } from '../services/backend'
import { openProfileBrowser, startSignIn, getCookies, resolveCaptcha } from './profile'
import { TASK_NAME_CONFIG } from '../../constants'

let taskQueue = []
let isStarted = false

export const fetchScheduledTasks = async () => {
  if (!isStarted) {
    console.log('Start worker')
    isStarted = true
    setInterval(async () => {
      const response = await get('/mission_schedule/')
      // Add tasks to queue
      response.schedule.forEach((task) => {
        taskQueue.push(task)
      })
    }, 5000) // Run every 5 seconds

    // worker swamp
    const response = await get('/settings/')

    let threadsNumber = 2 // default 10 threads
    if (response.settings.settings.Threads) {
      threadsNumber = response.settings.settings.Threads
    }

    for (let i = 0; i < threadsNumber; i++) {
      console.log(`Start worker: ${i}`)
      // Your code here for each iteration
      await processTaskQueue(i)
      setTimeout(() => {}, 1000) // Delay worker swamp 1 seconds
    }
  }
}

const processTaskQueue = async (queueId) => {
  setInterval(async () => {
    if (taskQueue.length > 0) {
      try {
        const queueData = taskQueue.shift()
        const tasks = queueData.tasks

        for (const task of tasks) {
          const taskName = task.tasks.tasks_name
          const profileId = queueData.profile_id
          const startDate = new Date()
          console.log(`${startDate} Worker ${queueId} start ${taskName}`)
          await startTaskWorker(profileId, taskName)
          const endDate = new Date()
          console.log(`${endDate} Worker ${queueId} finished ${taskName}`)
        }
      } catch (error) {
        console.log(error)
      }
    }
  }, 2000) // Check every 2 seconds
}

const startTaskWorker = async (profileId, taskName) => {
  const browser = await openProfileBrowser(profileId)
  if (!browser) {
    return
  }
  try {
    if (taskName === TASK_NAME_CONFIG.Login) {
      await startSignIn(profileId, browser)
    } else if (taskName == TASK_NAME_CONFIG.GetCookie) {
      await getCookies(profileId, browser)
    } else if (taskName == TASK_NAME_CONFIG.Captcha) {
      await resolveCaptcha(profileId, browser)
    }
  } catch (error) {
    console.log('error in Task worker', error)
  }
  await browser.close()
}
