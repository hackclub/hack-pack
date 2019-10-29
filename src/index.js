import { request } from '@octokit/request'
import express from 'express'
import 'regenerator-runtime'
import Airtable from 'airtable'

const env = process.env.NODE_ENV || 'development'
if (env === 'development') {
  require('dotenv').config()
}

const PORT = process.env.PORT || 1234

const app = express()

const createRecord = (baseName, record) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(
    process.env.AIRTABLE_SDP_BASE
  )

  base(baseName).create(record, (err, records) => {
    if (err) {
      console.error(err)
    } else {
      console.log('Created OAuth record', records.id)
    }
  })
}

const toParam = obj =>
  '?' + Object.keys(obj)
    .filter(key => obj[key] && obj[key] != 'null')
    .map(key => (
    `${key}=${obj[key]}`
  )).join('&')

app.get('/', async (req, res) => {
  const formUrl = 'https://airtable.com/shrNMxeoANyxtVY8U'

  try {
    const code = req.query.code

    if (!code) {
      // If there isn't any code the user might be coming to us directly instead of redirecting from GitHub's OAuth
      // Let's send this wayward traveler back to the right path

      console.log(
        'Got request without a code! Redirecting them to hack.af/pack.'
      )
      res.redirect(302, 'https://hack.af/pack')
      return
    }

    console.log(`Got request with code '${code}'.`)

    const ghResponse = await request(
      'POST https://github.com/login/oauth/access_token',
      {
        headers: { Accept: 'application/json' },
        data: {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
      }
    )

    const accessToken = ghResponse.data.access_token

    const ghUser = await request('GET /user', {
      headers: { Authorization: `token ${accessToken}` },
    })

    const username = ghUser.data && ghUser.data.login
    const email = ghUser.data && ghUser.data.email
    const params = toParam({
      'prefill_GitHub%20Username': username,
      'prefill_GitHub%20Email': email
    })

    if (username) {
      createRecord('GitHub OAuth', {
        Username: username,
        Email: email,
        Code: code,
      })
      console.log(
        `GitHub tells me that this user is 'https://github.com/${username}'. I'll redirect them to the Airtable.`
      )
      res.redirect(
        302,
        formUrl + params
      )
    } else {
      console.log(
        "GitHub doesn't recognize this user. I'll just send them to the Airtable with nothing prefilled."
      )
      res.redirect(302, formUrl)
    }
  } catch (e) {
    console.error(e)
    console.log("Something broke, so I'll just redirect straight to Airtable")
    res.redirect(302, formUrl)
  }
})

app.listen(PORT, () => {
  console.log(`Up and running on port ${PORT}`)
})
