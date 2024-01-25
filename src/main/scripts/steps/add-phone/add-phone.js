
import { API_SMS_POOL } from '../../constants';
import { getProfileData } from '../services/backend';

/**
 *
 * @param {Page} page
 * @param {Account} account
 * @param {AddPhoneOptions} featOptions
 */
export default async (page, account, featOptions) => {
    console.log('addPhone_start')
    let retryCount = 0;
    let sms_data;
    let profileData = await getProfileData(account.profileId, {})
    while (retryCount < 5) {
        sms_data = await getSmsPool(featOptions.smsPoolToken);
        // const orderId = sms_data["order_id"];
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
        await page.type('input[name="password"]', profileData.password, { delay: 100 });

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
        await randomDelay()
        
        const isToastPresent = await page.$('div[data-testid="toast"]') !== null;
        if (isToastPresent) {
            retryCount++;
            continue; 
        } else {


            break; 
        }
    }

    if (retryCount >= 5) {
        throw new Error("Failed to add phone number after 5 attempts");
    }

    await page.waitForNetworkIdle({ idleTime: 3000 });
    const sms_code = await checkSmsCode(sms_data["order_id"], featOptions.smsPoolToken);
    await page.waitForSelector('[name="verfication_code"]');
    await page.type('[name="verfication_code"]', sms_code.toString(), { delay: 100 });
    console.log(sms_code);
    await randomDelay()
    await page.waitForSelector('[data-testid="ocfPhoneVerificationNextLink"]');

    await page.evaluate(() => {
        const ele = document.querySelectorAll('[data-testid="ocfPhoneVerificationNextLink"]')[0];
        ele.click();
    });



}

const getSmsPool = async (api_key) => {
    const sms_pool_endpoint = API_SMS_POOL;
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
  const checkSmsCode = async (orderId, api_key) => {
    const sms_check_endpoint = 'https://api.smspool.net/sms/check';
  
    while (true) {
      let form = new FormData();
      form.append('orderid', orderId);
      form.append('key', api_key);
  
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
  