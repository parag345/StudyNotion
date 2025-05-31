const { Mongoose } = require("mongoose");
const Category = require("../models/Category");
const Course = require("../models/Course");

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const CategorysDetails = await Category.create({
      name: name,
      description: description,
    });
    console.log(CategorysDetails);
    return res.status(200).json({
      success: true,
      message: "Category Created Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.showAllCategories = async (req, res) => {
  try {
    const allCategorys = await Category.find({});
    res.status(200).json({
      success: true,
      data: allCategorys,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;

    // Get selected category with published courses
    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: [
          { path: "instructor" },
          { path: "ratingAndReviews" },
          { path: "category" }
        ]
      })
      .exec();

    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // Get all categories except selected
    const categoriesExceptSelected = await Category.find({
      _id: { $ne: categoryId }
    }).exec();

    // Get a different random category
    let differentCategory = null;
    if (categoriesExceptSelected.length > 0) {
      const randomIndex = getRandomInt(categoriesExceptSelected.length);
      differentCategory = await Category.findById(
        categoriesExceptSelected[randomIndex]._id
      )
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: [
            { path: "instructor" },
            { path: "ratingAndReviews" }
          ]
        })
        .exec();
    }

    // Get all published courses from all categories
    const allCategories = await Category.find()
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: [
          { path: "instructor" },
          { path: "ratingAndReviews" }
        ]
      })
      .exec();

    // Flatten all courses and filter out duplicates
    const allCourses = allCategories.flatMap(category => category.courses);
    const selectedCourseIds = new Set(
      selectedCategory.courses.map(course => course._id.toString())
    );
    const differentCourseIds = new Set(
      differentCategory?.courses?.map(course => course._id.toString()) || []
    );

    // Get top-selling courses excluding those already in selected/different categories
    const mostSellingCourses = allCourses
      .filter(course => {
        const courseId = course._id.toString();
        return !selectedCourseIds.has(courseId) && !differentCourseIds.has(courseId);
      })
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategory: differentCategory || { courses: [] },
        mostSellingCourses
      }
    });
  } catch (error) {
    console.error("Error in categoryPageDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};