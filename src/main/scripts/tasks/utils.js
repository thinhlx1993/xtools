import pidusage from 'pidusage'
import axios from 'axios'
import { authenticator } from 'otplib'
import logger from '../../logger'
import { exec } from 'child_process'
import { createConnection } from 'net'
import { regTwDomain, regXDomain } from '../regex'
import { delayRandom } from '../utils'

export const randomDelay = (min = 500, max = 5000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min))
  })
}

export const getOtp = (secret) => {
  return authenticator.generate(secret)
}

export const accessToIframe = async (container, nameOrSelector) => {
  await container.waitForSelector(nameOrSelector)
  const frameHandle = await container.$(nameOrSelector)
  const frame = await frameHandle.contentFrame()
  return frame
}

export const clickIntoNext = async (thirdLevelFrame, clicks) => {
  for (let i = 0; i < clicks; i++) {
    logger.info(`click next button ${i}`)
    // Function to perform the click
    // Replace 'YOUR_BUTTON_SELECTOR' with the actual selector of the button
    await thirdLevelFrame.evaluate(() => {
      // Find the button on the page
      const button = document.querySelector('a[aria-label="Navigate to next image"]')

      // Click the button if found
      if (button) {
        button.click()
      }
    })

    // Optionally add a delay between clicks if needed
    await thirdLevelFrame.waitForTimeout(1000) // Waits for 1 second
    // Optionally, add a delay here if needed
  }
}

export const calculateClicks = (xValue) => {
  if (xValue <= 200) return 0
  return Math.floor((xValue - 201) / 200) + 1
}

// Cap guru request
export const sendCapGuruRequest = async (payload) => {
  try {
    const captchaResponse = await axios.post('http://api.cap.guru/in.php', payload)
    // If the request is successful, the result is in captchaResponse
    logger.info(captchaResponse.data)
    return captchaResponse.data // or return whatever you need from the response
  } catch (error) {
    // Handle the error here. The error object contains details about what went wrong.
    console.error('Error occurred during the request to capguru')
    return null // or handle the error as appropriate for your application
  }
}

export const scrollIntoView = async (page, element) => {
  logger.info('Scroll into view')
  await page.evaluate((element) => {
    element.scrollIntoView({ behavior: 'smooth' })
  }, element)
  await randomDelay()
}

export const killChrome = () => {
  // This command depends on the operating system
  let command

  if (process.platform === 'win32') {
    // Windows command to kill all instances of Chrome
    command = 'taskkill /F /IM macro.exe /T'
  } else if (process.platform === 'darwin') {
    // macOS command to kill all instances of Chrome
    command = 'pkill -f "Marco"'
  } else if (process.platform === 'linux') {
    // Linux command to kill all instances of Chrome
    command = 'pkill marco'
  } else {
    logger.info('Unsupported platform')
    return
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      // console.error(`Error: ${error.message}`)
      return
    }
    if (stderr) {
      // console.error(`Stderr: ${stderr}`)
      return
    }
    logger.info('Chrome killed successfully')
  })
}

export const checkPort = (port) => {
  return axios
    .get(`http://127.0.0.1:${port}/json/version`)
    .then((response) => {
      const webSocketDebuggerUrl = response.data.webSocketDebuggerUrl
      if (webSocketDebuggerUrl) {
        console.log(`Found webSocketDebuggerUrl: ${webSocketDebuggerUrl}`)
        return webSocketDebuggerUrl // This will be returned to the caller of checkPort
      }
      return false
    })
    .catch((error) => {
      // If you want to handle specific errors, you can do so here
      return false
    })
}

export const closeBlankPage = async (browser) => {
  const pages = await browser.pages()
  await Promise.all(
    pages.map(async (page) => {
      if (page.url() === 'about:blank') {
        await page.close()
      }
    })
  )
}

export const closeBlankPages = async (browser) => {
  // browser.on('targetcreated', async (target) => {
  // })
}

export const handleNewPage = async (target) => {
  const isTwUrl = (pageUrl) => regTwDomain.test(pageUrl) || regXDomain.test(pageUrl)
  try {
    console.log('targetcreated')
    const newPage = await target.page()
    if (!newPage) {
      return
    }
    const pageUrl = newPage.url()
    console.log('pageUrl', pageUrl)
    if (isTwUrl(pageUrl)) {
      return
    }
    try {
      await newPage.waitForNavigation({ waitUntil: 'networkidle0' })
    } catch (error) {}
    try {
      const pageUrlSecond = newPage.url()
      console.log('pageUrlSecond', pageUrlSecond)
      if (!pageUrlSecond.includes('about:blank')) {
        await delayRandom([4000, 4250, 4500, 4750, 5000, 5250, 5500, 5750, 6000])
      }

      if (isTwUrl(pageUrlSecond)) {
        return
      }
    } catch (error) {
      console.log('targetcreated__closed')
      return
    }
    await newPage.close()
  } catch (error) {
    logger.error(`HAND_TARGET_CREATED_ERROR ${error}`)
  }
}

export const cpuMonitoring = async () => {
  pidusage(process.pid)
    .then((stats) => {
      // const memoryUsageInGB = stats.memory / 1024 ** 3
      // logger.info(`Memory Usage (GB): ${memoryUsageInGB.toFixed(2)}`)
      if (stats.cpu > 99) {
        logger.info(`High CPU Usage (%): ${stats.cpu}`)
        killChrome()
      }
    })
    .catch((err) => {
      logger.error(`cpuMonitoring Error ${err}`)
    })
}

/**
 * Kills a process given its PID.
 * @param {number} pid - The PID of the process to kill.
 */
export const killPID = async (pid) => {
  if (!pid) {
    // logger.error('No PID provided')
    return
  }

  // Unix-like systems can use process.kill
  try {
    exec(`taskkill /pid ${pid} /f /t`, (error, stdout, stderr) => {
      if (error) {
        // logger.error(`exec error: ${error}`)
        return
      }
      // console.log(`stdout: ${stdout}`)
      // console.error(`stderr: ${stderr}`)
      logger.info(`Process ${pid} killed successfully.`)
    })
  } catch (error) {
    // logger.error(`Error killing process ${pid}: ${error}`)
  }
}
