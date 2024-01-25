import addPhone from './add-phone';

const dataMemories = {}
/**
 * @param {Browser} browser the Puppeteer Browser
 * @param {Account} account The Account
 * @param {AddPhoneOptions} featOptions The featOptions object
 */
const init = async( browser, account, featOptions )=> {
  console.log("start add phone ");
  dataMemories[account.id] = {}
  const page = await browser.newPage()
  await authenticateProxy(page, account.proxy)
  try{
    await addPhone(page, account , featOptions);
    

  }catch(e) {
    logger.error('ADD_PHONE_ERROR', {
      error: mapErrorConstructor(error),
      accountId: account.id
    })
  } finally {
    await page.close()
  }


}

const stop = (accountId) => {
    delete dataMemories[accountId]
  }
  
  export default {
    init,
    stop,
  }