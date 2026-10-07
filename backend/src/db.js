import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance'

export const dbInfo = {
  connected: false,
  isEmbedded: false,
  uri: ''
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance'
  const isCloudUri = uri.startsWith('mongodb+srv://') || !uri.includes('localhost')
  const timeoutMs = isCloudUri ? 10000 : 1500

  try {
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@')
    console.log(`Connecting to MongoDB at ${maskedUri}...`)
    await mongoose.connect(uri, { serverSelectionTimeoutMS: timeoutMs })
    dbInfo.connected = true
    dbInfo.isEmbedded = false
    dbInfo.uri = uri
    console.log(`Successfully connected to MongoDB!`)
  } catch (err) {
    console.log(`MongoDB connection failed: ${err.message}. Starting embedded MongoDB fallback...`)
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

