const express = require("express")
const authController = require("../controllers/auth.controller")
const { authMiddleware } = require("../middleware/auth.middleware")

const router = express.Router()

/*post/api/auth/register*/

router.post("/register", authController.userRegisterController)


/*post /api/auth/login */
router.post("/login",authController.userLoginController)

/**
 * -post/api/auth/logout
 */
router.post("/logout",authController.userLogoutController)

/**
 * -get/api/auth/me
 */
router.get("/me", authMiddleware, authController.getMeController)


module.exports= router