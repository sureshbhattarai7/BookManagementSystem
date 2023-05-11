const crypto = require('crypto');
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const AppError = require("../Utils/appError");
const UserData = require("./../Model/userModel");
const catchAsync = require("../Utils/catchAsync");
const sendMail = require("./../Utils/email");

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwtCookie', token, cookieOptions);
    
    //Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await UserData.create(req.body);
    createAndSendToken(newUser, 201, res);
});

exports.loginUser = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    //Check if email and password exists
    if (!email || !password) {
        return next(new AppError("Please enter email and password!", 400));
    }

    //Check if email exists and password is correct
    const user = await UserData.findOne({ email }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Please enter correct email or password", 401));
    }

    //If everything OK, send token to client
    createAndSendToken(user, 200, res);
});

exports.protect = async (req, res, next) => {
    //Getting token and checking if it is available
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(
            new AppError(
                "You are not logged in! Please get logged in to get access!",
                401
            )
        );
    }

    //Verification Token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //Check if user still exists
    const currentUser = await UserData.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError("The user belonging to this token no longer exists!", 401)
        );
    }

    //Check if user changed the password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError("Password is changed recently! Please log in again!!", 401)
        );
    }

    //GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.roles)) {
            return next(
                new AppError(`You do not have permission to perfom this action`, 403)
            );
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //GET USER BASED ON POSTED EMAIL
    const user = await UserData.findOne({ email: req.body.email });
    if (!user) {
        return next(
            new AppError("User does not exists with this email address!", 404)
        );
    }

    //GENERATE THE RANDOM RESET TOKEN
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //Send it to User's email
    const resetURL = `${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a request with your new Password to ${resetURL}.\n If you did not forgot your password, ignore this message! `;

    try {
        await sendMail({
            email: req.user.email,
            subject: "Your password reset token (valid for 10 minutes)",
            message,
        });

        createAndSendToken(user, 200, res);

    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was error sending this email. Please try again later!', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    //Get User from token
    const user = await UserData.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gte: Date.now() }
    });

    //Set the new password if token has not expired and user exists
    if (!user) {
        return next(new AppError('Token is invalid or expired!', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    //Log the user in, send JWT 
    createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    //Get the user
    const user = await UserData.findById(req.user.id).select('+password');

    //Check if current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Current password is incorrect!', 401));
    };

    //If So, Update Password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    //Log user in, send JWT
    createAndSendToken(user, 200, res);
})
