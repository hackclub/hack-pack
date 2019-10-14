import { request } from '@octokit/request'
import express from 'express'
import 'regenerator-runtime'

const env = process.env.NODE_ENV || 'development'
if (env === 'development') {
  require('dotenv').config()
}

const PORT = process.env.PORT || 1234

const app = express()

app.get('/', async (req, res) => {
  try {
    const code = req.query.code
    const ghResponse = await request(
      'POST https://github.com/login/oauth/access_token',
      {
        headers: { Accept: 'application/json' },
        data: {
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          code,
        },
      }
    )

    const accessToken = ghResponse.data.access_token

    const ghUser = await request('GET /user', {
      headers: { Authorization: `token ${accessToken}` },
    })

    res.redirect(
      302,
      `https://airtable.com/shrNMxeoANyxtVY8U?prefill_GitHub%20Username=${ghUser.data.login}`
    )
  } catch (e) {
    console.error(e)
  }
})

app.listen(PORT, () => {
  console.log(`Up and running on port ${PORT}`)
})
