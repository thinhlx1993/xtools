import axios from 'axios'
import fs from 'fs'
import puppeteer from 'puppeteer-core'
import { defaultPuppeteerOptions } from '../../constants'
import { splitProxy } from '../../helpers'
import hideMyAcc from '../../integration/hidemyacc'
import { getAppPath } from '../../utils'
import { DOMAIN_COOKIE } from '../constants'
import { loginPathSelector } from '../path-selector'
import { getProfileData, updateProfileData } from '../services/backend'
import { cacheCookies } from './cookies'
import { getOtp, randomDelay } from './utils'
const FormData = require('form-data');

const ExcelJS = require('exceljs');

const excelFilePath = 'file.xlsx';
async function createExcelFile(filePath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Profiles');
  // Add headers here if necessary
  worksheet.columns = [
    { header: 'Username', key: 'username', width: 10 },
    { header: 'Password', key: 'password', width: 10 },
    { header: 'Facode', key: 'facode', width: 10 },
    { header: 'Cookies', key: 'cookies', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 }
  ];
  await workbook.xlsx.writeFile(filePath);
}
async function readExcelFile(filePath) {
  if (!fs.existsSync(filePath)) {
    await createExcelFile(filePath);
  }
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    let data = [];
    worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
      data.push(row.values.slice(1));
    });
    return data;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}




// Function to write/update Excel file
async function writeExcelFile(filePath, data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Profiles');
  data.forEach((row) => {
    worksheet.addRow(row);
  });
  await workbook.xlsx.writeFile(filePath);
}
export const openProfileBrowser = async (profile, username, pass, facode) => {
  try {
    let proxyList = fs.readFileSync('proxy.txt', 'utf8').split('\n');
    let proxyProtected = false
    let args = []
    console.log(profile)
    // let profileData = await getProfileData(profile, {})
    //profile cho bang uuid ngau nhien - gen tai day roi truyen vao profileData object
    let profileData = {
      username, pass, facode
    }
    async function getRandomProxy() {
      let proxy;
      // do {
      //   proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
      // } while (!(await isProxyAlive(proxy)));
      proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
      return proxy;
    }
    profileData.proxy = await getRandomProxy();

    // if (profileData.settings.browserType === 'hideMyAcc') {
    //   console.info(`get data from proxy ${profileData.proxy}`)
    //   const [tz] = await Promise.all([hideMyAcc.network(splitProxy(profileData.proxy))])
    //   console.info(`get data from tz ${tz}`)
    //   profileData = await getProfileData(profile, tz)
    // }
    if (true) {
      console.info(`get data from proxy ${profileData.proxy}`)
      const [tz] = await Promise.all([hideMyAcc.network(splitProxy(profileData.proxy))])
      console.info(`get data from tz ${tz}`)
      // profileData = await getProfileData(profile, tz)
    }



    if (profileData.proxy) {
      const proxyParts = profileData.proxy.split(':')
      if (proxyParts.length === 4) {
        proxyProtected = true
      }
      args.push(`--proxy-server=${proxyParts[0]}:${proxyParts[1]}`)
    }

    // let hideMyAccProfileDir = getAppPath(`\\profiles\\${profile}`)
    // if (profileData.settings.folderPath) {
    //   hideMyAccProfileDir = `${profileData.settings.folderPath}\\${profile}`
    // }
    // if (!fs.existsSync(hideMyAccProfileDir)) {
    //   fs.cpSync(getAppPath(`\\HMAZeroProfile`), hideMyAccProfileDir, {
    //     recursive: true
    //   })
    // }
    const { v4: uuidv4 } = require('uuid');

    // Generate a random UUID
    const randomProfile = uuidv4();
    console.log(randomProfile);
    let hideMyAccProfileDir = getAppPath(`\\profiles\\${randomProfile}`)
    if (true) {
      fs.cpSync(getAppPath(`\\HMAZeroProfile`), hideMyAccProfileDir, {
        recursive: true
      })
    }

    args.push(`--user-data-dir=${hideMyAccProfileDir}`)
    if (profileData.browser_data) {
      args.push(`--hidemyacc-data=${profileData.browser_data}`)
    }

    try {
      // loading 2captcha plugin
      const pathToExtension = getAppPath(`\\captcha-solve`)
      if (fs.existsSync(pathToExtension)) {
        console.log(`Found extention: ${pathToExtension}`)
        // puppeteer.use(StealthPlugin())
        args.push(`--disable-extensions-except=${pathToExtension}`)
        args.push(`--load-extension=${pathToExtension}`)
        // args.push(`--disable-site-isolation-trials --remote-debugging-port=9090`)
      }
    } catch (error) {
      console.log(error)
    }
    const newBrowserOptions = {
      ...defaultPuppeteerOptions,
      executablePath: `${hideMyAccProfileDir}\\chrome.exe`,
      args: [...defaultPuppeteerOptions.args, ...args]
    }
    console.log(newBrowserOptions.args)
    const browser = await puppeteer.launch(newBrowserOptions)
    const page = await browser.newPage()

    // enter proxy username password
    if (profileData.proxy && proxyProtected) {
      const proxyParts = profileData.proxy.split(':')
      // Set up authentication for the proxy
      await page.authenticate({
        username: proxyParts[2], // Replace with your proxy username
        password: proxyParts[3] // Replace with your proxy password
      })
    }
    await page.goto('https://ipfighter.com/')
    console.info('Open the browser successfully')


    const excelData = await readExcelFile(excelFilePath);
    console.log(excelData.length)

    if (excelData.length > 0) {
      let existingUser = excelData.find(row => row[0] === username);
      console.log(existingUser)
      if (existingUser) {
        console.log(existingUser[3])
        let cookies = existingUser[3]; // Assuming cookies are in the 5th column
        profileData.cookies = cookies;
        await setCookies(page, profileData);
        const addPhoneResult = await addPhone(profileData, page);
        if (addPhoneResult.success) {
          const phoneNumber = addPhoneResult.phoneNumber;
          // Update the Excel file with the new phone number

          let excelData = await readExcelFile(excelFilePath);
          let userRow = excelData.find(row => row[0] === profileData.username);
          if (userRow) {
            userRow[4] = phoneNumber;
            await writeExcelFile(excelFilePath, excelData);
          }
        }
      } else {
        try {
          console.log("gogogogo")
          await startSignIn01({ username, pass, facode }, browser);
          await page.goto('https://twitter.com');
          await randomDelay()

          const buttonExists = await page.$(loginPathSelector.layerBottomBarUseCookieBtn);

          if (buttonExists) {
            // If the selector exists, then find all matching elements
            const buttons = await page.$$(loginPathSelector.layerBottomBarUseCookieBtn);
            if (buttons.length === 2) {
              return await buttons[0].click();
            }
            // Add any additional logic needed for when the buttons are found
          } else {
            // The selector does not exist, so skip this part
            // Add any logic needed for when the selector is not found
          }
          const cookies = await page.cookies()
          console.log(cookies)
          const cookieString = cookies.reduce((result, cookie) => {
            if (['.twitter.com', 'twitter.com'].includes(cookie.domain)) {
              result += `${cookie.name}=${cookie.value};`
            }
            return result
          }, '')
          console.log(cookieString)
          await randomDelay()
          profileData.cookies = cookieString
          let newRow = [username, pass, facode, cookieString]; // Add other details as needed
          console.log(newRow)
          excelData.push(newRow);
          console.log(excelData)

          await writeExcelFile(excelFilePath, excelData);

          // await setCookies(page, profileData)

          const addPhoneResult = await addPhone(profileData, page);

          if (addPhoneResult.success) {
            const phoneNumber = addPhoneResult.phoneNumber;
            // Update the Excel file with the new phone number
            let excelData = await readExcelFile(excelFilePath);
            let userRow = excelData.find(row => row[0] === profileData.username);
            if (userRow) {
              userRow[5] = phoneNumber;
              await writeExcelFile(excelFilePath, excelData);
            }
          }
        } catch (e) {
          console.log(e)
        } finally {
          browser.close()
        }

      }
    }
    // await updateProfileData(profile, { status: signinStatus })
    // await _testCaptcha(page)
    // if (profileData.cookies) {
    //   await setCookies(page, profileData)
    // }







    return browser
  } catch (error) {
    if (error.message.includes('net::ERR_TUNNEL_CONNECTION_FAILED')) {
      console.error('Tunnel connection failed. Check your proxy configuration.')
      // Handle specific error (e.g., retry logic, alternate action)
      await updateProfileData(profile, { status: 'proxy failed' })
    } else {
      console.log(error)
      console.error('Error occurred:', error.message)
      // Handle other types of errors
    }
  }
}

/**
 * @param {puppeteer.Page} page Puppeteer page
 * @param {{
 *   screenName: string;
 *   cookie: string;
 *   proxy: string;
 * }} account Account
 */
export const setCookies = async (page, profileData) => {
  const cookieObj = profileData.cookies
    .split(';')
    .filter(Boolean)
    .reduce((result, cookieParam) => {
      const cookieParamParts = cookieParam.split(/=(.*)/s)
      if (cookieParamParts.length > 1) {
        result.push({
          name: cookieParamParts[0].trim(),
          value: cookieParamParts[1],
          domain: DOMAIN_COOKIE
        })
      }
      return result
    }, [])
  await page.setCookie(...cookieObj)
}

const _testCaptcha = async (page) => {
  // переходим по указанному адресу
  await page.goto('https://2captcha.com/demo/recaptcha-v2')

  // ждем пока появится элемент с CSS селектором ".captcha-solver"
  await page.waitForSelector('.captcha-solver')
  // кликаем по элементу с указанным селектором
  await page.click('.captcha-solver')

  // По умолчанию waitForSelector ожидает в течении 30 секунд, так как этого времени зачастую не достаточно, то указываем значение timeout вручную вторым параметром.
  // Значение timeout указывается в "ms".
  await page.waitForSelector(`.captcha-solver[data-state="solved"]`, { timeout: 150000 })

  // После решения капчи выполняем необходимые действия, в нашем случае нажимаем на кнопку  "check".
  await page.click("button[type='submit']")
}

export const startSignIn = async (profileId, browser) => {
  try {
    let profileData = await getProfileData(profileId, {})
    // Start Puppeteer
    await updateProfileData(profileId, { status: 'logging in' })
    const page = await browser.newPage()

    await page.goto('https://twitter.com')
    await randomDelay()
    await page.waitForSelector('a[href="/login"][data-testid="loginButton"]')
    await page.click('a[href="/login"][data-testid="loginButton"]')
    await randomDelay()
    await page.waitForSelector('div[dir="ltr"] > input[autocomplete="username"]')
    // Replace sendDelays with typing with delay
    await page.type('div[dir="ltr"] > input[autocomplete="username"]', profileData.username, {
      delay: 100
    })
    await randomDelay()
    await page.waitForSelector('div[role="button"] > div[dir="ltr"] > span > span')
    const nextButtonXPath =
      "//div[@role='button']/div[@dir='ltr']/span/span[contains(text(), 'Next')]"
    await page.waitForXPath(nextButtonXPath)
    const nextButtons = await page.$x(nextButtonXPath)
    if (nextButtons.length === 0) {
      throw new Error('Login error, Next button not found exception')
    }
    await nextButtons[0].click()
    await randomDelay()
    await page.waitForSelector('div[dir="ltr"] > input[autocomplete="current-password"]')
    await page.type(
      'div[dir="ltr"] > input[autocomplete="current-password"]',
      profileData.password,
      {
        delay: 100
      }
    )
    await randomDelay()
    await page.waitForSelector('div[role="button"][data-testid="LoginForm_Login_Button"]')
    await page.click('div[role="button"][data-testid="LoginForm_Login_Button"]')
    await randomDelay()
    await page.waitForSelector('input[data-testid="ocfEnterTextTextInput"]')

    const currentOtp = getOtp(profileData.fa)
    console.log(profileData.fa)
    await randomDelay()
    await page.type('input[data-testid="ocfEnterTextTextInput"]', currentOtp, { delay: 100 })
    await randomDelay()
    await page.waitForSelector('div[role="button"][data-testid="ocfEnterTextNextButton"]')
    await page.click('div[role="button"][data-testid="ocfEnterTextNextButton"]')
    await randomDelay()
    // Close Puppeteer
    await browser.close()
    await updateProfileData(profileId, { status: 'logged' })
  } catch (error) {
    await updateProfileData(profileId, { status: 'login failed' })
  }
}

const checkSmsCode = async (orderId, api_key) => {
  const sms_check_endpoint = 'https://api.smspool.net/sms/check';

  while (true) {
    let form = new FormData();
    form.append('orderid', orderId);
    form.append('key', "pR9LC3kj9WmS4fcb8g8xKcqqK2GGYqsZ");

    const formHeaders = form.getHeaders();

    try {
      const response = await axios.post(sms_check_endpoint, form, {
        headers: {
          ...formHeaders,
        },
      });

      const data = response.data;

      if (data["status"] === 3) {
        console.log('Success:', data["sms"]);
        return data["sms"];
      } else if (data["status"] === 6) {
        console.log('Order refunded:', data["message"]);
        break;
      } else if (data["status"] === 1) {
        console.log('Order pending, checking again in 1 second');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error:', error.message);
      break;
    }
  }
};

const getSmsPool = async () => {
  const api_key = "pR9LC3kj9WmS4fcb8g8xKcqqK2GGYqsZ";
  const sms_pool_endpoint = "https://api.smspool.net";
  const maxRetries = 5; // Set a maximum number of retries to avoid infinite loops
  let retries = 0;

  while (retries < maxRetries) {
    let form = new FormData();
    const countries_code = ["US", "GB", "FR"];
    const phoneCodes = { "US": "+01", "GB": "+44", "FR": "+33" };

    const randomIndex = Math.floor(Math.random() * countries_code.length);
    const randomCountry = countries_code[randomIndex];
    const countryPhoneCode = phoneCodes[randomCountry];
    const body = {
      "key": api_key,
      "country": randomCountry,
      "service": 948,
      "pool": 0,
      "pricing_option": 0
    };

    for (const key in body) {
      form.append(key, body[key]);
    }

    const formHeaders = form.getHeaders();
    try {
      const response = await axios.post(`${sms_pool_endpoint}/purchase/sms`, form, {
        headers: {
          ...formHeaders,
        },
      });

      if (response.status === 200 && response.data["success"]) {
        console.log('Success:', response.data);
        response.data["country_code"] = randomCountry;
        return response.data;
      }
    } catch (error) {
      console.error('Error:', error.message);
      if (error.response && error.response.status < 400) {
        // Handle non-retryable errors (e.g., 4XX client errors except for 408)
        throw error;
      }
      // For retryable errors, continue the loop
    }

    retries++;
    console.log(`Retry ${retries}/${maxRetries}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
  }

  throw new Error("Maximum retries exceeded");


};
export const addPhone = async (profile, page) => {
  try {
    let retryCount = 0;
    let sms_data;

    while (retryCount < 5) {
      sms_data = await getSmsPool();
      const orderId = sms_data["order_id"];
      const country_code = sms_data["country_code"];
      await page.goto("https://twitter.com/settings/phone");
      await page.waitForNetworkIdle({ idleTime: 2000 });
      await randomDelay()
      const buttonExists = await page.$(loginPathSelector.layerBottomBarUseCookieBtn);

      if (buttonExists) {
        // If the selector exists, then find all matching elements
        const buttons = await page.$$(loginPathSelector.layerBottomBarUseCookieBtn);
        if (buttons.length === 2) {
          return await buttons[0].click();
        }
        // Add any additional logic needed for when the buttons are found
      }
      await page.waitForSelector('a[href="/i/flow/add_phone"]');
      await page.evaluate(() => {

        const ele = document.querySelectorAll('a[href="/i/flow/add_phone"]')[0];
        ele.click();
      });


      await page.waitForSelector('[name="password"]');
      await page.type('input[name="password"]', profile.pass, { delay: 100 });

      await page.keyboard.press('Enter');


      await page.waitForSelector('#SELECTOR_1');
      let optionElements = await page.$$('#SELECTOR_1 > option');
      let optionTexts = [];

      for (const optionElement of optionElements) {
        const text = await page.evaluate(option => {
          return { "value": option.value, "text": option.textContent };
        }, optionElement);
        optionTexts.push(text);
      }
      let value_code = '';
      for (const v of optionTexts) {
        if (v.value.includes(country_code)) {
          value_code = v.value;
          break;
        }
      }

      await page.select('#SELECTOR_1', value_code);
      await page.waitForSelector('[autocomplete="tel"]');
      await page.type('[autocomplete="tel"]', sms_data["phonenumber"].toString(), { delay: 100 });


      await page.waitForSelector('[data-testid="ocfEnterPhoneNextLink"]');

      await page.evaluate(() => {
        const ele = document.querySelectorAll('[data-testid="ocfEnterPhoneNextLink"]')[0];
        ele.click();
      });
      await page.waitForSelector('[data-testid="confirmationSheetConfirm"]');

      await page.evaluate(() => {
        const ele = document.querySelectorAll('[data-testid="confirmationSheetConfirm"]')[0];
        ele.click();
      });



      // await page.waitForFunction(() => {
      //   return document.querySelector('div[data-testid="toast"]') !== null ||
      //     new Promise(resolve => setTimeout(resolve, 500000));
      // });
      await randomDelay()
      // Check if the toast message appeared
      const isToastPresent = await page.$('div[data-testid="toast"]') !== null;
      if (isToastPresent) {
        retryCount++;
        continue; // Restart the loop
      } else {


        break; // Exit loop if toast message did not appear
      }
    }

    if (retryCount >= 5) {
      throw new Error("Failed to add phone number after 5 attempts");
    }

    await page.waitForNetworkIdle({ idleTime: 3000 });
    const sms_code = await checkSmsCode(sms_data["order_id"], sms_data["key"]);
    await page.waitForSelector('[name="verfication_code"]');
    await page.type('[name="verfication_code"]', sms_code.toString(), { delay: 100 });
    console.log(sms_code);
    await randomDelay()
    await page.waitForSelector('[data-testid="ocfPhoneVerificationNextLink"]');

    await page.evaluate(() => {
      const ele = document.querySelectorAll('[data-testid="ocfPhoneVerificationNextLink"]')[0];
      ele.click();
    });

    return { success: true, phoneNumber: sms_data["phonenumber"].toString() };
  }
  catch (e) {
    console.log(e);
    return { success: false, error: e.message };
  }
}


export const startSignIn01 = async (profile, browser) => {
  try {
    const { username, pass, facode } = profile;
    // Start Puppeteer
    // await updateProfileData(profileId, { status: 'logging in' })
    const page = await browser.newPage()

    await page.goto('https://twitter.com')
    await randomDelay()
    const buttonExists = await page.$(loginPathSelector.layerBottomBarUseCookieBtn);

    if (buttonExists) {
      // If the selector exists, then find all matching elements
      const buttons = await page.$$(loginPathSelector.layerBottomBarUseCookieBtn);
      if (buttons.length === 2) {
        return await buttons[0].click();
      }
      // Add any additional logic needed for when the buttons are found
    }
    await page.waitForSelector('a[href="/login"][data-testid="loginButton"]')
    await page.click('a[href="/login"][data-testid="loginButton"]')
    await randomDelay()
    await page.waitForSelector('div[dir="ltr"] > input[autocomplete="username"]')
    // Replace sendDelays with typing with delay
    await page.type('div[dir="ltr"] > input[autocomplete="username"]', profile.username, {
      delay: 100
    })
    await randomDelay()
    await page.waitForSelector('div[role="button"] > div[dir="ltr"] > span > span')
    const nextButtonXPath =
      "//div[@role='button']/div[@dir='ltr']/span/span[contains(text(), 'Next')]"
    await page.waitForXPath(nextButtonXPath)
    const nextButtons = await page.$x(nextButtonXPath)
    if (nextButtons.length === 0) {
      throw new Error('Login error, Next button not found exception')
    }
    await nextButtons[0].click()
    await randomDelay()
    await page.waitForSelector('div[dir="ltr"] > input[autocomplete="current-password"]')
    await page.type(
      'div[dir="ltr"] > input[autocomplete="current-password"]',
      profile.pass,
      {
        delay: 100
      }
    )
    await randomDelay()
    await page.waitForSelector('div[role="button"][data-testid="LoginForm_Login_Button"]')
    await page.click('div[role="button"][data-testid="LoginForm_Login_Button"]')
    await randomDelay()
    await page.waitForSelector('input[data-testid="ocfEnterTextTextInput"]')

    const currentOtp = getOtp(profile.facode)
    // console.log(profile.facode)
    await randomDelay()
    await page.type('input[data-testid="ocfEnterTextTextInput"]', currentOtp, { delay: 100 })
    await randomDelay()
    await page.waitForSelector('div[role="button"][data-testid="ocfEnterTextNextButton"]')
    await page.click('div[role="button"][data-testid="ocfEnterTextNextButton"]')
    await randomDelay()
    // Close Puppeteer
    // await browser.close()
    // await updateProfileData(profileId, { status: 'logged' })

  } catch (error) {
    console.log(error)
    await browser.close()
    // await updateProfileData(profileId, { status: 'login failed' })
  }
}

export const getCookies = async (profileId, browser) => {
  await randomDelay()
  await cacheCookies(browser, profileId)
  await randomDelay()
}
