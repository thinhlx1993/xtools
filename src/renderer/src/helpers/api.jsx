let _ipcMainConsumer = {}

export const ipcMainConsumer = _ipcMainConsumer

export const initIpcMainConsumer = () => {
  _ipcMainConsumer['emit'] = (funcName, data) => window.ipcRender[funcName](data)
  _ipcMainConsumer['on'] = (funcName, callback) => window.ipcRender[funcName](callback)
}
