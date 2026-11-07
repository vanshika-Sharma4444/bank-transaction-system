const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = require("./app");
const connectDB = require("./config/db");

connectDB()
    .then(() => {
        app.listen(3000, () => {
            console.log("server is running on port 3000");
        });
    })
    .catch(() => {
        process.exitCode = 1;
    });