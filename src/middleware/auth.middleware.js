const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blackList.model");

async function authMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "unauthorized access, token is missing"
    });
  }

  const isBlackListed = await tokenBlackListModel.findOne({ token });

  if (isBlackListed) {
    return res.status(401).json({
      message: "unauthorized access, token is invalid"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId).select("+systemUser");

    if (!user) {
      return res.status(401).json({
        message: "unauthorized access, user not found"
      });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({
      message: "unauthorized access, token is invalid"
    });
  }
}
async function authSystemUserMiddleware(req, res, next) {
  const token =
    req.cookies?.token ||
    req.headers.authorization?.split(" ")[1];


  if (!token) {
    return res.status(401).json({
      message: "unauthorized access, token is missing"
    });
  }

  const isBlackListed = await tokenBlackListModel.findOne({ token });

  if (isBlackListed) {
    return res.status(401).json({
      message: "unauthorized access, token is invalid"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel
      .findById(decoded.userId)
      .select("+systemUser");

    if (!user) {
      return res.status(401).json({
        message: "unauthorized access, user not found"
      });
    }

    if (user.systemUser !== true) {
      return res.status(403).json({
        message: "forbidden access, only system users can perform this action"
      });
    }

    req.user = user;
    return next();

  } catch (err) {
    return res.status(401).json({
      message: "unauthorized access, token is invalid"
    });
  }
}
module.exports = {
  authMiddleware,
  authSystemUserMiddleware
};