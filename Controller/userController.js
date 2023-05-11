const catchAsyncError = require("../Utils/catchAsync");
const UserData = require("./../Model/userModel");
const AppError = require("./../Utils/appError");

const filterObject = (obj, ...allowedFields) => {
    const newObject = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObject[el] = obj[el];
    });
    return newObject;
}

exports.getUsers = catchAsyncError(async (req, res) => {
    const getUsers = await UserData.find();
    res.status(200).json({
        status: "success",
        totalData: getUsers.length,
        data: {
            getUsers,
        },
    });
});

exports.getUser = catchAsyncError(async (req, res) => {
    const getUser = await UserData.findById(req.params.id);
    res.status(200).json({
        status: "success",
        data: {
            getUser,
        },
    });

});

exports.updateCurrentData = catchAsyncError(async (req, res, next) => {
    //Create error if user posts current data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError(`Password can not be updated in this route! Please goto '/updatePassword' route.`, 400));
    };
    
    //Filter out unwanted fields that are not allowed to update
    const filteredBody = filterObject(req.body, 'firstName', 'lastName', 'username', 'email', 'address', 'level');

    //Update the user document
    const updatedUser = await UserData.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});


exports.deleteCurrentData = catchAsyncError(async (req, res, next) => {
    await UserData.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.getUserStats = catchAsyncError(async (req, res) => {
    const userStats = await UserData.aggregate([
        {
            $match: { level: { $gte: 3 } },
        },
        {
            $group: {
                _id: "$username",
                numLevel: { $sum: 1 },
                avgLevel: { $avg: "$level" },
                minLevel: { $min: "$level" },
                maxLevel: { $max: "$level" },
            },
        },
    ]);
    res.status(200).json({
        status: "success",
        data: {
            userStats,
        },
    });

});

