import OpenAI from 'openai'
import logger from '../logger'
const OPEN_AI_MODEL = 'gpt-3.5-turbo'

/**
 *
 * @param {string} apiKey
 * @param {string} content
 * @return {Promise<string>}
 */
const getCompletion = async (
  apiKey,
  content,
  askingQuestion = 'How can I reply to the post below? Keep it under 20 words'
) => {
  const openai = new OpenAI({ apiKey })
  const completion = await openai.chat.completions.create({
    model: OPEN_AI_MODEL,
    messages: [
      {
        role: 'system',
        content: askingQuestion
      },
      {
        role: 'user',
        content
      }
    ]
  })
  if (completion.choices[0].message.content.includes("I'm sorry")) {
    return ''
  }
  logger.info(`Found chat GPT completion ${completion.choices[0].message.content}`)
  return completion.choices[0].message.content
}

export default {
  getCompletion
}
