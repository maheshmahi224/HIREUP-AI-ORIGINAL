import { app } from './app.js'; import { env } from './config/env.js'; import { database } from './db/mongo.js';
void database().then(()=>app.listen(env.PORT,()=>console.log(`HireUp API listening on ${env.PORT}`))).catch(error=>{console.error('MongoDB connection failed',error);process.exit(1);});
