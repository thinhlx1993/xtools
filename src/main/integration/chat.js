import OpenAI from 'openai'
const OPEN_AI_MODEL = 'gpt-3.5-turbo'

/**
 *
 * @param {string} apiKey
 * @param {string} content
 * @return {Promise<string>}
 */
const getCompletion = async (apiKey, content) => {
  const openai = new OpenAI({ apiKey })
  const completion = await openai.chat.completions.create({
    model: OPEN_AI_MODEL,
    messages: [
      {
        role: 'system',
        content: 'How can I reply to the post below? Keep it under 20 words'
      },
      {
        role: 'user',
        content
      }
    ]
  })
  return completion.choices[0].message.content
}

export default {
  getCompletion
}
