import axios from 'axios'
import { authenticator } from 'otplib'
import logger from '../../logger'
import { exec } from 'child_process'
import { createConnection } from 'net'
import { regTwDomain, regXDomain } from '../regex'

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
    console.log(`click next button ${i}`)
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

export const calculateClicks = async (xValue) => {
  if (xValue > 200) {
    if (xValue <= 400) return 1
    if (xValue <= 600) return 2
    if (xValue <= 800) return 3
    if (xValue < 1000) return 4
    return 5 // For xValue >= 1000
  }
  return 0 // No clicks if xValue <= 200
}

// Cap guru request
export const sendCapGuruRequest = async (payload) => {
  try {
    const captchaResponse = await axios.post('http://api.cap.guru/in.php', payload)
    // If the request is successful, the result is in captchaResponse
    console.log(captchaResponse.data)
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

export const killChrome = async () => {
  // This command depends on the operating system
  let command

  if (process.platform === 'win32') {
    // Windows command to kill all instances of Chrome
    command = 'taskkill /F /IM chrome.exe /T'
  } else if (process.platform === 'darwin') {
    // macOS command to kill all instances of Chrome
    command = 'pkill -f "Google Chrome"'
  } else if (process.platform === 'linux') {
    // Linux command to kill all instances of Chrome
    command = 'pkill chrome'
  } else {
    console.log('Unsupported platform')
    return
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`)
      return
    }
    console.log('Chrome killed successfully')
  })
}

export const checkPort = async (port) => {
  return new Promise((resolve) => {
    const client = createConnection({ port }, () => {
      client.end()
      resolve(true)
    })

    client.on('error', () => {
      resolve(false)
    })
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
    if (pageUrl === 'about:blank') {
      await newPage.close()
      return
    }
    if (isTwUrl(pageUrl)) {
      return
    }
    try {
      await newPage.waitForNavigation({ waitUntil: 'networkidle0' })
    } catch (error) {
      // logger.error(`handleNewPage_ERROR ${error}`)
    }
    try {
      const pageUrlSecond = newPage.url()
      console.log('pageUrlSecond', pageUrlSecond)
      await randomDelay()
      if (isTwUrl(pageUrlSecond)) {
        return
      }
    } catch (error) {
      console.log('targetcreated__closed')
      return
    }
    await newPage.close()
  } catch (error) {
    // logger.error(`handleNewPage_ERROR ${error}`)
  }
}
