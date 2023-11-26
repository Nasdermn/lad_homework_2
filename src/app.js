const express = require('express');
require('dotenv').config();
const router = require('./routes/index');
const PORT = process.env.PORT || 8000;

const app = express();

app.use(express.json()); //для парсинга JSON
app.use(router);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
