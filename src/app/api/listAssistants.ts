// // pages/api/listAssistants.ts

// // Purpose of this was to check all the assistants I have an make sure I'm running off the right api key
// import type { NextApiRequest, NextApiResponse } from 'next'
// import OpenAI from 'openai'

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// })

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   try {
//     const assistants = await openai.beta.assistants.list()
//     return res.status(200).json(assistants)
//   } catch (error: any) {
//     console.error('Error listing assistants:', error)
//     return res.status(500).json({ error: error.message })
//   }
// }
