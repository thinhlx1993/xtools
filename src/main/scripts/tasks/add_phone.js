import axios from 'axios'
import { loginPathSelector } from '../path-selector'
import { getProfileData, updateProfileData } from '../services/backend'
import { openProfileBrowser } from './profile'
import { randomDelay } from './utils'

export const addPhone = async (profiles) => {
  console.log('addPhone_start')

  const processBatch = async (batch) => {
    const promises = batch.map(async (profile) => {
      try {
        const browser = await openProfileBrowser(profile)
        let profileData = await getProfileData(profile, {})
        const page = await browser.newPage()
        const result = await addPhoneService(page, profileData)
        if (result.success) {
          console.log('add phone success')
          await updateProfileData(profileData.id, { phoneNumber: result.phoneNumber })
        }
      } catch (e) {
        console.error(e) // It's better to use console.error for errors
      }
    })
    await Promise.all(promises)
  }

  for (let i = 0; i < profiles.length; i += 5) {
    const batch = profiles.slice(i, i + 5)
    await processBatch(batch)
  }
}

const addPhoneService = async (page, profile) => {
  let retryCount = 0
  let sms_data
  let phoneNumber = ''
  let order_id = ''
  let country_code = ''
  let country_code_x = ''
  let isFailure = false

  while (retryCount < 5) {
    try {
      await page.goto('https://twitter.com/settings/phone')
      await page.waitForNetworkIdle({ idleTime: 2000 })
      await randomDelay()
      const buttonExists = await page.$(loginPathSelector.layerBottomBarUseCookieBtn)

      if (buttonExists) {
        // If the selector exists, then find all matching elements
        const buttons = await page.$$(loginPathSelector.layerBottomBarUseCookieBtn)
        if (buttons.length === 2) {
          return await buttons[0].click()
        }
        // Add any additional logic needed for when the buttons are found
      }
      const phoneExists = await page.$("input[name='current_phone']")

      if (phoneExists) {
        phoneNumber = await page.$eval("input[name='current_phone']", (el) => el.value)
        console.log(`phone number ${phoneNumber} `)
        break
      }

      await page.waitForSelector('a[href="/i/flow/add_phone"]')
      await page.evaluate(() => {
        const ele = document.querySelectorAll('a[href="/i/flow/add_phone"]')[0]
        ele.click()
      })
      sms_data = await getSmsPool('pR9LC3kj9WmS4fcb8g8xKcqqK2GGYqsZ')

      country_code = sms_data['country_code']
      country_code_x = sms_data['cc']
      order_id = sms_data['order_id']

      await page.waitForSelector('[name="password"]')
      await page.type('input[name="password"]', profile.pass, { delay: 100 })

      await page.keyboard.press('Enter')

      await page.waitForSelector('#SELECTOR_1')
      let optionElements = await page.$$('#SELECTOR_1 > option')
      let optionTexts = []

      for (const optionElement of optionElements) {
        const text = await page.evaluate((option) => {
          return { value: option.value, text: option.textContent }
        }, optionElement)
        optionTexts.push(text)
      }
      let value_code = ''
      for (const v of optionTexts) {
        if (v.value.includes(country_code)) {
          value_code = v.value
          break
        }
      }

      await page.select('#SELECTOR_1', value_code)
      await page.waitForSelector('[autocomplete="tel"]')
      await page.type('[autocomplete="tel"]', sms_data['phonenumber'].toString(), { delay: 100 })

      await page.waitForSelector('[data-testid="ocfEnterPhoneNextLink"]')

      await page.evaluate(() => {
        const ele = document.querySelectorAll('[data-testid="ocfEnterPhoneNextLink"]')[0]
        ele.click()
      })
      await page.waitForSelector('[data-testid="confirmationSheetConfirm"]')

      await page.evaluate(() => {
        const ele = document.querySelectorAll('[data-testid="confirmationSheetConfirm"]')[0]
        ele.click()
      })

      await randomDelay()
      // Check if the toast message appeared
      const isToastPresent = (await page.$('div[data-testid="toast"]')) !== null
      if (isToastPresent) {
        retryCount++
        continue // Restart the loop
      } else {
        break // Exit loop if toast message did not appear
      }
    } catch (e) {
      console.log(e)
      isFailure = true
      break
    }
  }
  if (isFailure) {
    return { success: false, error: '' }
  }

  if (retryCount >= 5) {
    throw new Error('Failed to add phone number after 5 attempts')
  }
  if (order_id != '') {
    await page.waitForNetworkIdle({ idleTime: 3000 })
    const sms_code = await checkSmsCode(order_id, 'pR9LC3kj9WmS4fcb8g8xKcqqK2GGYqsZ')
    await page.waitForSelector('[name="verfication_code"]')
    await page.type('[name="verfication_code"]', sms_code.toString(), { delay: 100 })

    await randomDelay()
    await page.waitForSelector('[data-testid="ocfPhoneVerificationNextLink"]')

    await page.evaluate(() => {
      const ele = document.querySelectorAll('[data-testid="ocfPhoneVerificationNextLink"]')[0]
      ele.click()
    })
    phoneNumber = `+${country_code_x}${sms_data['phonenumber'].toString()}`
  }
  return { success: true, phoneNumber: phoneNumber }
}

const checkSmsCode = async (orderId, api_key) => {
  const sms_check_endpoint = 'https://api.smspool.net/sms/check'

  // Set a start time
  const startTime = Date.now()
  // Define the maximum duration in milliseconds (30 seconds)
  const maxDuration = 30000

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let form = new FormData()
    form.append('orderid', orderId)
    form.append('key', api_key)

    const formHeaders = form.getHeaders()

    try {
      const response = await axios.post(sms_check_endpoint, form, {
        headers: {
          ...formHeaders
        }
      })

      const data = response.data

      if (data['status'] === 3) {
        console.log('Success:', data['sms'])
        return data['sms']
      } else if (data['status'] === 6) {
        console.log('Order refunded:', data['message'])
        break
      } else if (data['status'] === 1) {
        console.log('Order pending, checking again in 1 second')

        // Wait for 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Check if 30 seconds have passed
        if (Date.now() - startTime > maxDuration) {
          console.log('Timeout reached, stopping checks')
          break
        }
      }
    } catch (error) {
      console.error('Error:', error.message)
      break
    }
  }
  throw new Error('Maximum retries exceeded')
}

const getSmsPool = async (api_key) => {
  const sms_pool_endpoint = 'https://api.smspool.net'
  const maxRetries = 5 // Set a maximum number of retries to avoid infinite loops
  let retries = 0

  while (retries < maxRetries) {
    let form = new FormData()
    const countries_code = ['US', 'GB']

    const randomIndex = Math.floor(Math.random() * countries_code.length)
    const randomCountry = countries_code[randomIndex]

    const body = {
      key: api_key,
      country: randomCountry,
      service: 948,
      pool: 0,
      pricing_option: 1
    }

    for (const key in body) {
      form.append(key, body[key])
    }

    const formHeaders = form.getHeaders()
    try {
      const response = await axios.post(`${sms_pool_endpoint}/purchase/sms`, form, {
        headers: {
          ...formHeaders
        }
      })

      if (response.status === 200 && response.data['success']) {
        console.log('Success:', response.data)
        response.data['country_code'] = randomCountry
        return response.data
      }
    } catch (error) {
      console.error('Error:', error.message)
      if (error.response && error.response.status < 400) {
        // Handle non-retryable errors (e.g., 4XX client errors except for 408)
        throw error
      }
      // For retryable errors, continue the loop
    }

    retries++
    console.log(`Retry ${retries}/${maxRetries}`)
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second before retrying
  }

  throw new Error('Maximum retries exceeded')
}
