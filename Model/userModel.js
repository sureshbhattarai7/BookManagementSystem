const crypto = require('crypto');
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
// const { reset } = require('nodemon');

const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "Please enter a first name"],
    },
    lastName: {
        type: String,
        required: [true, "Please enter a last name"],
    },
    level: {
        type: Number,
        default: 3,
    },
    username: {
        type: String,
        unique: true,
        required: [true, "Please enter a username"],
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Please enter an email address"],
        lowercase: true,
        validate: [validator.isEmail, "Please enter a valid email"],
    },
    address: {
        type: String,
        required: [true, "Please enter an address"],
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    roles: {
        type: String,
        enum: ['user', 'contributer', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, "Please enter a password"],
        minLength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, "Please confirm your password"],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: "Password must be the same!",
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre("save", async function (next) {
    //Only run this function if the password is created or modified
    if (!this.isModified("password")) return next();

    //Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    //Delete the passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre(/^find/, async function (next) {
    this.find({ active: { $ne: false } });
})

userSchema.pre("save", function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

//Instance method - it is gonna available on all document of a certain collection
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimeStamp;
    }
    //FALSE MEANS NOT CHANGED
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    //Create Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 1000;
    return resetToken;
}

const UserData = mongoose.model("User", userSchema);

module.exports = UserData;
