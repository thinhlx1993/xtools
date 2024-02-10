const axios = require('axios')

const checkPort = (port) => {
  axios
    .get(`http://127.0.0.1:${port}/json/version`, { timeout: 2000 })
    .then((response) => {
      const webSocketDebuggerUrl = response.data.webSocketDebuggerUrl
      if (webSocketDebuggerUrl) {
        console.log(`Found webSocketDebuggerUrl: ${webSocketDebuggerUrl}`)
        return webSocketDebuggerUrl
      }
      return false
    })
    .catch((error) => {
      console.log(error)
      return false
    })
}

checkPort(55448)
