const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { mongo, default: mongoose } = require("mongoose");



exports.createRating = async(req,res)=>{

    //get user id
    try{
        const userId = req.user.id;


        const {rating, review, courseId} = req.body;

        //check if user is enrolled or not
        const courseDetails = await Course.findOne(
            {
                _id:courseId,
                studentsEnrolled:{$elemMatch:{$eq:userId}}
            }
        )

        if(!courseDetails){
            return res.status(404).json({
                success:false,
                message:"Student is not enrolled in the course"
            })
        }

        //check if user has already reviewed the course or not
        const alreadyReviewed = await RatingAndReview.findOne({
            user:userId,
            course:courseId
        })

        if(alreadyReviewed){
            return res.status(403).json({
                success:false,
                message:"Course is already reviewed by the user"
            })
        }

        //create rating and review
        const ratingReview = await RatingAndReview.create({
            rating, review, course:courseId, user:userId
        })

        //update course with this rating and review
        const updatedCourseDetails = await Course.findByIdAndUpdate(courseId,
            {
                $push:{
                    ratingAndReviews:ratingReview._id
                }
            },
            {new:true}
        )

        console.log(updatedCourseDetails);

        return res.status(200).json({
            success:true,
            message:"Rating and review created successfully",
            ratingReview
        })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"Failed to create rating and review",
            error:err.message
        })
    
    }
}

//get Average rating

exports.getAverageRating = async(req, res)=>{
    try{
        const courseId = req.body.courseId;

        const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course:new mongoose.Types.ObjectId(courseId)
                }
            },
            {
                $group:{
                    _id:null,
                    averageRating:{$avg:"$rating"}
                }
            }
        ])

        if(result.length>0){
            return res.status(200).json({
                success:true,
                averageRating:result[0].averageRating
            })
        }
        
        //if no results exists
        return res.status(200).json({
            success:true,
            message:"Average rating is 0, no ratings till now",
            averageRating:0
        })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"Failed to get average rating",
            error:err.message
        })
    }
}

//get All Rating and Reviews

exports.getAllRating = async(req, res)=>{
    try{
        const allReviews = await RatingAndReview.find({})
                                                .sort({rating:"desc"})
                                                .populate({
                                                    path:"user",
                                                    select:"firstName lastName email image"
                                                })
                                                .populate({
                                                    path:"course",
                                                    select:"courseName"
                                                })
                                                .exec();

        return res.status(200).json({
            success:true,
            message:"All reviews fetched successfully",
            data:allReviews
        })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"Failed to get all reviews",
            error:err.message
        })
    }
}

