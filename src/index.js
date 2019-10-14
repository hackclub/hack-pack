const env = process.env.NODE_ENV || 'development'
if (env === 'development') {
  require('dotenv').config()
}

const PORT = process.env.PORT || 1234

import express from 'express'

const app = express()

app.get('/', (req, res) => {
  res.send('Hello, world!')
})

app.listen(PORT, () => {
  console.log(`Up and running on port ${PORT}`)
})
