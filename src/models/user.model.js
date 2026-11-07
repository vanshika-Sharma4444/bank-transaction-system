const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "email is required for creating a user"],
      trim: true,
      lowercase: true,

      // Regular expression used to validate email format
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "invalid email address"
      ],

      // Every user must have a unique email address
      unique: [true, "email already exist"]
    },

    name: {
      type: String,
      required: [true, "name is required for creating an account"]
    },

    password: {
      type: String,
      required: [true, "password is required for creating an account"],
      minlength: [
        6,
        "password should be contain more than 6 character"
      ],

      // Password will not be returned in normal MongoDB queries
      // We explicitly use .select("+password") when we need it.
      select: false
    },

    systemUser: {
      /*
       * This field identifies whether the user is a system user.
       *
       * systemUser = true:
       * The user can perform privileged operations,
       * such as creating initial/system transactions.
       *
       * systemUser = false:
       * Normal user with no system-level privileges.
       */

      type: Boolean,

      // New users are normal users by default
      default: false,

      // Once assigned during creation, this value should not
      // normally be changed through normal application updates.
    //   immutable: true,

      // Hide this field from normal queries for security.
      // We explicitly request it using:
      // .select("+systemUser")
      select: false
    }
  },
  {
    timestamps: true
  }
);


// Hash the password before saving it to MongoDB
// Hash password before saving the user
// We use async/await, so we do NOT use next()
userSchema.pre("save", async function () {

  // If password has not been changed,
  // there is nothing to hash again.
  if (!this.isModified("password")) {
    return;
  }

  // Hash the plain-text password using bcrypt
  const hash = await bcrypt.hash(this.password, 10);

  // Replace the plain password with the hashed password
  this.password = hash;
});


// Compare the password entered during login
// with the hashed password stored in MongoDB
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};


const userModel = mongoose.model("user", userSchema);

module.exports = userModel;