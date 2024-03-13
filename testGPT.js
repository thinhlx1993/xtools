const OpenAI = require('openai')

const OPEN_AI_MODEL = 'gpt-3.5-turbo'

const getCompletion = async (
  apiKey,
  content,
  askingQuestion = 'How can I reply to the post below? Keep it under 20 words'
) => {
  try {
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
    // if (completion.data[0].text.includes("I'm sorry")) {
    //   return ''
    // }

    // const response = completion.data[0].text
    console.log(completion)
  } catch (error) {
    console.error('Error:', error)
  }
}

// Replace 'your-api-key' with your actual OpenAI API key
const apiKey = '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'
getCompletion(apiKey, 'hello')
