import { config } from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  config();
}

import { app } from './api.js';

const port = process.env.PORT || 3333;

app.listen(port, () =>
  console.log(`API available on https://kuznetsov-backend-production.up.railway.app//:${port}`)
);
