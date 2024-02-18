import { contextBridge, ipcRenderer } from 'electron'

// Exposed protected methods in the render process
contextBridge.exposeInMainWorld(
  // Allowed 'ipcRenderer' methods
  'ipcRender',
  {
    replyGetKeyActivation: (values) => ipcRenderer.on('replyGetKeyActivation', values),
    getKeyActivation: () => ipcRenderer.send('getKeyActivation'),
    replyGetAppSettings: (values) => ipcRenderer.on('replyGetAppSettings', values),
    getAppSettings: () => ipcRenderer.send('getAppSettings'),
    updateAppSettings: (values) => ipcRenderer.send('updateAppSettings', values),
    replyGetHashTagList: (values) => ipcRenderer.on('replyGetHashTagList', values),
    getHashTagList: () => ipcRenderer.send('getHashTagList'),
    updateHashTagList: (values) => ipcRenderer.send('updateHashTagList', values),
    replyCrawlHashTagTrending: (values) => ipcRenderer.on('replyCrawlHashTagTrending', values),
    crawlHashTagTrending: (values) => ipcRenderer.send('crawlHashTagTrending', values),
    replyGetAccounts: (values) => ipcRenderer.on('replyGetAccounts', values),
    getAccounts: () => ipcRenderer.send('getAccounts'),
    replyGetDetailedAccount: (value) => ipcRenderer.on('replyGetDetailedAccount', value),
    getDetailedAccount: (id) => ipcRenderer.send('getDetailedAccount', id),
    replyAddAccountResult: (value) => ipcRenderer.on('replyAddAccountResult', value),
    addAccount: (values) => ipcRenderer.send('addAccount', values),
    replyAddAccounts: (value) => ipcRenderer.on('replyAddAccounts', value),
    addAccounts: (values) => ipcRenderer.send('addAccounts', values),
    replyDeleteAccountsResult: (value) => ipcRenderer.on('replyDeleteAccountsResult', value),
    deleteAccounts: (ids) => ipcRenderer.send('deleteAccounts', ids),
    replyUpdateAccountResult: (value) => ipcRenderer.on('replyUpdateAccountResult', value),
    updateAccount: (value) => ipcRenderer.send('updateAccount', value),
    replyUpdateAccountsResult: (value) => ipcRenderer.on('replyUpdateAccountsResult', value),
    updateAccounts: (value) => ipcRenderer.send('updateAccounts', value),
    replyAccountsScriptsStatus: (values) => ipcRenderer.on('replyAccountsScriptsStatus', values),
    playScripts: (ids) => ipcRenderer.send('playScripts', ids),
    stopScripts: (ids) => ipcRenderer.send('stopScripts', ids),
    fetchMachineId: () => ipcRenderer.send('fetchMachineId'),
    replyGetMachineId: (values) => ipcRenderer.on('replyGetMachineId', values),
    startOpenProfile: (profile) => ipcRenderer.send('startOpenProfile', profile),
    setAccessToken: (accessToken) => ipcRenderer.send('setAccessToken', accessToken),
    performScheduledTasks: () => ipcRenderer.send('performScheduledTasks'),
    getDetailedAccountById: (profileId) => ipcRenderer.send('getDetailedAccountById', profileId),
    replyGetDetailedAccountById: (value) => ipcRenderer.on('replyGetDetailedAccountById', value),
    downloadCSV: (csvData) => ipcRenderer.send('downloadCSV', csvData)
  }
)
