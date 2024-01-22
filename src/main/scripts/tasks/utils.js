import { totp, authenticator } from 'otplib'

export const randomDelay = (min = 500, max = 5000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min))
  })
}

export const getOtp = (secret) => {
  return authenticator.generate(secret)
}
