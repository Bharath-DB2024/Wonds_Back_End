const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db"); // Import the DB connection
const authRoutes = require("./router/auth"); // Import the DB model  login 
const subscribe = require("./router/subscription"); 
const earn = require("./router/earn"); 
const list = require("./router/list"); 
const dash = require("./router/dash"); 
const Settlement = require("./router/settlement"); 
const download = require("./router/download"); 
const SMS =require("./router/sms")
const axios = require('axios');
const app = express();
app.use(express.json());
connectDB(); // Connect to MongoDB
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscribe);
app.use("/api/earn", earn);
app.use("/api/list",list);

app.use("/api/settlement",Settlement);
app.use("/api/dash",dash);
app.use("/api/download",download);
app.use("/api/setelment",SMS);
 

app.use(express.json()); // Middleware to parse JSON

app.listen(5000, () => console.log("Server running on port 5000"));
