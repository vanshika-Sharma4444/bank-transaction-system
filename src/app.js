const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

/**
 *- Routes require
 * */

const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes");


const app = express();

app.use(cors({
    origin(origin, callback) {
        const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://finora-banking-system.netlify.app"
];
        let isViteDevelopmentOrigin = false;
        if (origin) {
            try {
                const url = new URL(origin);
                const port = Number(url.port);
                // Vite may move off 5173 when that port is already occupied.
                isViteDevelopmentOrigin =
                    url.protocol === "http:" &&
                    (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
                    port >= 5173 &&
                    port <= 5199;
            } catch {
                isViteDevelopmentOrigin = false;
            }
        }

        callback(null, !origin || allowedOrigins.includes(origin) || isViteDevelopmentOrigin);
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

/**
 *- use Routes
 * */
app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/transaction", transactionRoutes);

app.get("/", (req, res) => {
    res.send("Server is working!");
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err?.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Request body must contain valid JSON." });
    }

    if (err?.type === "entity.too.large") {
        return res.status(413).json({ message: "Request body is too large." });
    }

    if (err?.code === 11000) {
        return res.status(409).json({
            message: "An account with this email address already exists."
        });
    }

    if (err?.name === "ValidationError") {
        const messages = Object.values(err.errors || {}).map((validationError) =>
            validationError.name === "CastError"
                ? `${validationError.path} has an invalid value.`
                : validationError.message
        );

        return res.status(400).json({
            message: messages.length
                ? `Please check the submitted details: ${messages.join("; ")}`
                : "Please check the submitted details."
        });
    }

    console.error("Unhandled request error:", err);
    return res.status(500).json({
        message: "An unexpected server error occurred. Please try again later."
    });
});

module.exports = app;