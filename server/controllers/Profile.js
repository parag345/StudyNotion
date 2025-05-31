const Profile = require("../models/Profile")
const CourseProgress = require("../models/CourseProgress")

const Course = require("../models/Course")
const User = require("../models/User")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const mongoose = require("mongoose")
const { convertSecondsToDuration } = require("../utils/secToDuration")
// Method for updating a profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName = "",
      lastName = "",
      dateOfBirth = "",
      about = "",
      contactNumber = "",
      gender = "",
    } = req.body
    const id = req.user.id

    // Find the profile by id
    const userDetails = await User.findById(id)
    const profile = await Profile.findById(userDetails.additionalDetails)

    const user = await User.findByIdAndUpdate(id, {
      firstName,
      lastName,
    })
    await user.save()

    // Update the profile fields
    profile.dateOfBirth = dateOfBirth
    profile.about = about
    profile.contactNumber = contactNumber
    profile.gender = gender

    // Save the updated profile
    await profile.save()

    // Find the updated user details
    const updatedUserDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec()

    return res.json({
      success: true,
      message: "Profile updated successfully",
      updatedUserDetails,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

exports.deleteAccount = async (req, res) => {
  try {
    const id = req.user.id
    console.log(id)
    const user = await User.findById({ _id: id })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }
    // Delete Assosiated Profile with the User
    await Profile.findByIdAndDelete({
      _id: new mongoose.Types.ObjectId(user.additionalDetails),
    })
    for (const courseId of user.courses) {
      await Course.findByIdAndUpdate(
        courseId,
        { $pull: { studentsEnroled: id } },
        { new: true }
      )
    }
    // Now Delete User
    await User.findByIdAndDelete({ _id: id })
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    })
    await CourseProgress.deleteMany({ userId: id })
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ success: false, message: "User Cannot be deleted successfully" })
  }
}

exports.getAllUserDetails = async (req, res) => {
  try {
    const id = req.user.id
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec()
    console.log(userDetails)
    res.status(200).json({
      success: true,
      message: "User Data fetched successfully",
      data: userDetails,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture
    const userId = req.user.id
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    )
    console.log(image)
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    )
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with enrolled courses
    const user = await User.findById(userId)
      .populate({
        path: "courses",
        select: "courseName courseDescription thumbnail courseContent status",
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prepare course data with progress
    const coursesWithProgress = await Promise.all(
      user.courses.map(async (course) => {
        if (course.status === "Draft") return null;

        const courseDetails = await Course.findById(course._id).populate({
          path: "courseContent",
          populate: {
            path: "subSection",
            select: "timeDuration",
          },
        });

        const totalDuration = courseDetails.courseContent.reduce(
          (total, section) =>
            total +
            section.subSection.reduce(
              (sectionTotal, subSec) =>
                sectionTotal + parseInt(subSec.timeDuration || 0),
              0
            ),
          0
        );

        const courseProgress = await CourseProgress.findOne({
          courseID: course._id,
          userId,
        });

        const totalSubsections = courseDetails.courseContent.reduce(
          (total, section) => total + section.subSection.length,
          0
        );

        const progressPercentage =
          totalSubsections > 0
            ? Math.round(
                ((courseProgress?.completedVideos?.length || 0) /
                  totalSubsections) *
                  100
              )
            : 100;

        return {
          ...course,
          totalDuration: convertSecondsToDuration(totalDuration),
          progressPercentage,
        };
      })
    );

    const filteredCourses = coursesWithProgress.filter((course) => course !== null);

    return res.status(200).json({
      success: true,
      data: filteredCourses,
    });
  } catch (error) {
    console.error("Error in getEnrolledCourses:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching enrolled courses",
    });
  }
};

exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id })
      .select("courseName courseDescription studentsEnrolled price thumbnail") // Include thumbnail for frontend
      .populate("studentsEnrolled", "firstName lastName email") 
      .exec();

    const courseData = courseDetails.map((course) => {
  
      const totalStudentsEnrolled = course.studentsEnrolled.length;
      const totalAmountGenerated = totalStudentsEnrolled * (course.price || 0);

      return {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        thumbnail: course.thumbnail, // Include thumbnail for frontend display
        totalStudentsEnrolled,
        totalAmountGenerated,
        price: course.price, 
      };
    });

    res.status(200).json({
      success: true,
      data: courseData,
    });
  } catch (error) {
    console.error("Error in instructorDashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch instructor dashboard data",
      error: error.message,
    });
  }
};
