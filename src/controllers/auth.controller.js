const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require('../services/email.service')
const tokenBlacklistModel = require("../models/blackList.model")

/*
 * user register controller
 * Post /api/auth/register
 */
async function userRegisterController(req, res) {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email address, and password are required."
        });
    }

    const isExists = await userModel.findOne({ email });

    if (isExists) {
        return res.status(409).json({
            message: "An account with this email address already exists.",
            status: "failed"
        });
    }

    const user = await userModel.create({
        email,
        password,
        name
    });

    const token = jwt.sign(
        { userId: user._id },

        process.env.JWT_SECRET,
        { expiresIn: "3d" }
    );

    res.cookie("token", token);

await emailService.sendRegistrationEmail(user.email, user.name);

return res.status(201).json({
    user: {
        _id: user._id,
        email: user.email,
        name: user.name
    },
    token
});
   
}

/**
 * -user login controller
 * - post/api/auth/login
 * */
async function userLoginController(req, res) {
    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password +systemUser")



    if (!user) {
        return res.status(401).json({
            message: "email or password is INVALID"

        })
    }
    const isValidPassword = await user.comparePassword(password)

      if (!isValidPassword) {
        return res.status(401).json({
            message: "email or password is invalid"
        })
    }

    const token = jwt.sign(
        { userId: user._id },

        process.env.JWT_SECRET,
        { expiresIn: "3d" }
    );

    res.cookie("token", token);

    return res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            systemUser: user.systemUser || false
        },
        token
    });

}
/**
 * -user logout controller
 * -post/api/auth/logout
 */
async function userLogoutController(req,res){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if(!token){
        return res.status(200).json({
            message : "user logged out successfully!"
        })
    }

   
    await tokenBlacklistModel.create({
        token:token
    })
     res.cookie("token","")
    res.status(200).json({
        message:"user logged out successfully"
    })

}

/**
 * - get logged in user details
 * - get/api/auth/me
 */
async function getMeController(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "unauthorized" });
    }
    return res.status(200).json({
        user: {
            _id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            systemUser: req.user.systemUser || false
        }
    });
}

module.exports = {
    userRegisterController, userLoginController, userLogoutController, getMeController
};