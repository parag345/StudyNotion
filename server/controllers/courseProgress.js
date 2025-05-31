const mongoose = require("mongoose")
const Section = require("../models/Section")
const SubSection = require("../models/SubSection")
const CourseProgress = require("../models/CourseProgress")
const Course = require("../models/Course")

exports.updateCourseProgress = async (req, res) => {
  const { courseId, subsectionId } = req.body
  const userId = req.user.id

  try {
    // Check if the subsection is valid
    const subsection = await SubSection.findById(subsectionId)
    if (!subsection) {
      return res.status(404).json({ 
        success: false,
        error: "Invalid subsection" 
      })
    }

    // Verify that the course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ 
        success: false,
        error: "Invalid course" 
      })
    }

    // Find the course progress document for the user and course
    let courseProgress = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    })

    if (!courseProgress) {
      // If course progress doesn't exist, create a new one
      courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [subsectionId], // Add the current subsection
      })
      
      return res.status(200).json({ 
        success: true,
        message: "Course progress created and updated successfully",
        data: courseProgress
      })
    } else {
      // If course progress exists, check if the subsection is already completed
      if (courseProgress.completedVideos.includes(subsectionId)) {
        return res.status(200).json({ 
          success: true,
          message: "Subsection already completed" 
        })
      }

      // Push the subsection into the completedVideos array
      courseProgress.completedVideos.push(subsectionId)
      
      // Save the updated course progress
      await courseProgress.save()
      
      return res.status(200).json({ 
        success: true,
        message: "Course progress updated successfully",
        data: courseProgress
      })
    }
  } catch (error) {
    console.error("Error in updateCourseProgress:", error)
    return res.status(500).json({ 
      success: false,
      error: "Internal server error",
      message: error.message
    })
  }
}

exports.getCourseProgress = async (req, res) => {
  const { courseId } = req.body
  const userId = req.user.id

  try {
    const courseProgress = await CourseProgress.findOne({
      courseId: courseId,  
      userId: userId,
    })

    if (!courseProgress) {
      return res.status(200).json({
        success: true,
        message: "No progress found",
        data: { completedVideos: [] }
      })
    }

    return res.status(200).json({
      success: true,
      message: "Course progress fetched successfully",
      data: courseProgress
    })
  } catch (error) {
    console.error("Error in getCourseProgress:", error)
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    })
  }
}