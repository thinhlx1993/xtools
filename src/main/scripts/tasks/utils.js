import axios from 'axios'
import { authenticator } from 'otplib'

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
