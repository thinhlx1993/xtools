/**
 *
 * @param {ErrorConstructor} error
 * @returns {string}
 */
export const mapErrorConstructor = (error) => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack
  }

  return JSON.stringify(errorInfo)
}

/**
 * @param {string} proxy
 * @returns {{
 *   protocol: 'http' | 'https';
 *   host: string;
 *   port: number;
 *   auth: {
 *     username: string;
 *     password: string;
 *   }
 * }}
 */
export const splitProxy = (proxy) => {
  if (!proxy) {
    return
  }
  const proxyParts = proxy.split(':')
  const splitted = {
    protocol: 'http'
  }
  if (proxyParts.includes('http')) {
    splitted.protocol = proxyParts[0]
    splitted.host = proxyParts[1]
    splitted.port = proxyParts[2]
    if (proxyParts.length > 4) {
      splitted.auth = {
        username: proxyParts[3],
        password: proxyParts[4]
      }
    }
  } else {
    splitted.host = proxyParts[0]
    splitted.port = proxyParts[1]
    if (proxyParts.length > 3) {
      splitted.auth = {
        username: proxyParts[2],
        password: proxyParts[3]
      }
    }
  }
  return splitted
}
