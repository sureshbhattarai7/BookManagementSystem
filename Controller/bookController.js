const AppError = require("../Utils/appError");
const BookData = require("./../Model/bookModel");
const APIFeatures = require("./../Utils/apiFeatures");
const catchAsyncError = require("../Utils/catchAsync");

exports.createBook = catchAsyncError(async (req, res, next) => {
  const book = await BookData.create(req.body);
  res.status(200).json({
    status: "success",
    data: {
      book,
    },
  });
});

exports.getBooks = catchAsyncError(async (req, res, next) => {
  const features = new APIFeatures(BookData.find(), req.query)
    .filter()
    .sort()
    .limit()
    .pagination();

  const books = await features.query;
  if (!books) {
    return next(new AppError(`Can not find the data with that ID!`, 404));
  }
  res.status(200).json({
    status: "success",
    total: books.length,
    data: {
      books,
    },
  });
});

exports.getBook = catchAsyncError(async (req, res, next) => {
  const book = await BookData.findById(req.params.id);
  if (!book) {
    return next(new AppError(`Can not find the data with that ID!`, 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      book,
    },
  });
});

exports.updateBook = catchAsyncError(async (req, res, next) => {
  const book = await BookData.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!book) {
    return next(new AppError(`Can not find the data with that ID!`, 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      book,
    },
  });
});

exports.deleteBook = catchAsyncError(async (req, res, next) => {
  const book = await BookData.findByIdAndDelete(req.params.id);
  if (!book) {
    return next(new AppError(`Can not find the data with that ID!`, 404));
  }
  res.status(200).json({
    status: "success",
    data: null,
  });
});

exports.getBookStats = catchAsyncError(async (req, res, next) => {
  const stats = await BookData.aggregate([
    {
      $match: { price: { $gte: 400 } },
    },
    {
      $group: {
        _id: "$bookName",
        numBooks: { $sum: 1 },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        avgRating: { $avg: "$rating" },
        minRating: { $min: "$rating" },
        maxRating: { $max: "$rating" },
      },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

//unwind deconstruct the array fields from input document into one document to each element of an array

