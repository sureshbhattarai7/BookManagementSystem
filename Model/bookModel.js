const mongoose = require('mongoose');
const slugify = require('slugify'); //slugify removes white spaces and replace them with '-' in the URL

const bookSchema = mongoose.Schema({
    bookName: {
        type: String,
        required: [true, 'Book name must be defined']
    },
    slug: String,
    author: {
        type: String,
        default: "Anonymous"
    },
    publishedDate: {
        type: Date,
        default: Date.now()
    },
    publication: {
        type: String,
        required: [true, 'Please enter a publication name']
    },
    price: {
        type: Number,
        required: [true, 'A price must be set']
    },
    ISBN: {
        type: Number,
        required: true,
        unique: true
    },
    rating: {
        type: Number,
        default: 4.5
    },
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

//Virtual don't keeps the elements in the database
bookSchema.virtual('discount').get(function () {
    return this.price * 0.10;
});

//Middleware helps to define functions before or after a ceratin events
//DOCUMENT MIDDLEWARE/HOOK: runs before .save() and .create()

bookSchema.pre('save', function (next) {
    this.slug = slugify(this.bookName, {
        lower: true,
        replacement: '_'
    });
    next();
});

//Post method is used after .save() and .create()
// bookSchema.post('save', function (document, next) {
//     console.log(document);
//     next();
// })

const bookData = mongoose.model("Book", bookSchema);
module.exports = bookData;