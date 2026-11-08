
const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    });
