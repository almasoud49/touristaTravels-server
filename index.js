const express = require('express')
const app = express()
const port = 5000

app.get('/', (req, res) => {
  res.send('Welcome to TouristaTravels!')
})

app.listen(port, () => {
  console.log(`TouristaTravels app listening on port ${port}`)
})