import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance'

export const dbInfo = {
  connected: false,
  isEmbedded: false,
  uri: ''
}

export async function connectDB() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 })
    dbInfo.connected = true
    dbInfo.isEmbedded = false
    dbInfo.uri = uri
    console.log(`Connected to MongoDB at ${uri}`)
  } catch {
    console.log('Local MongoDB not running. Starting embedded MongoDB fallback...')
    const { MongoMemoryServer } = await import('mongodb-memory-server')
    const mongod = await MongoMemoryServer.create()
    const memoryUri = mongod.getUri()
    await mongoose.connect(memoryUri)
    dbInfo.connected = true
    dbInfo.isEmbedded = true
    dbInfo.uri = memoryUri
    console.log(`Connected to embedded MongoDB at ${memoryUri}`)
  }
}

