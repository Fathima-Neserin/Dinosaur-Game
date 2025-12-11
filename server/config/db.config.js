const mongoose = require("mongoose");

const MONGO_CONN_STRING = process.env.MONGO_CONN_STRING;

const dbConnection = async () => {
  try {
    await mongoose.connect(MONGO_CONN_STRING);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

module.exports = dbConnection;