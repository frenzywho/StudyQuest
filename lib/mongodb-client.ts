import { MongoClient, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/gamified-learning";
const options: MongoClientOptions = {
  connectTimeoutMS: 10000, // Timeout after 10s
  socketTimeoutMS: 45000,  // Close sockets after 45s of inactivity
};

// Connection status for debugging
let isConnected = false;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Global variable to track connection status
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoIsConnected: boolean | undefined;
}

// Check if we're in a development environment
if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR
  if (!global._mongoClientPromise) {
    console.log("Creating new MongoDB client connection in development");
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect()
      .then((connectedClient) => {
        console.log("MongoDB successfully connected in development");
        global._mongoIsConnected = true;
        isConnected = true;
        return connectedClient;
      })
      .catch(err => {
        console.error("MongoDB connection error in development:", err);
        global._mongoIsConnected = false;
        isConnected = false;
        throw err;
      });
  } else {
    console.log("Reusing existing MongoDB connection in development");
    isConnected = global._mongoIsConnected || false;
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, it's best to not use a global variable
  console.log("Creating new MongoDB client connection in production");
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then((connectedClient) => {
      console.log("MongoDB successfully connected in production");
      isConnected = true;
      return connectedClient;
    })
    .catch(err => {
      console.error("MongoDB connection error in production:", err);
      isConnected = false;
      throw err;
    });
}

// Export helper functions for connection status
export const getConnectionStatus = () => isConnected;

// Export a module-scoped MongoClient promise
export default clientPromise;