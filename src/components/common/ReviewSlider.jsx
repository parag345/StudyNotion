import React, { useEffect, useState } from 'react'
import {Swiper, SwiperSlide} from "swiper/react"
import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/pagination"
import { Autoplay, FreeMode, Pagination } from 'swiper'
import ReactStars from "react-rating-stars-component"
import { apiConnector } from '../../services/apiconnector'
import { ratingsEndpoints } from '../../services/apis'
import { FaStar } from 'react-icons/fa'

const ReviewSlider = () => {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const controller = new AbortController()
        
        const fetchAllReviews = async() => {
            try {
                setLoading(true)
                const {data} = await apiConnector(
                    "GET", 
                    ratingsEndpoints.REVIEWS_DETAILS_API,
                    null,
                    null,
                    { signal: controller.signal }
                )
                
                if(data?.success) {
                    // Ensure no duplicates by checking IDs
                    const uniqueReviews = data.data.filter(
                        (review, index, self) => 
                            index === self.findIndex((r) => (
                                r._id === review._id
                            ))
                    )
                    setReviews(uniqueReviews)
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("Could not fetch reviews:", error)
                }
            } finally {
                setLoading(false)
            }
        }

        fetchAllReviews()
        
        return () => {
            controller.abort()
        }
    }, [])

    if (loading) {
        return <div className="text-white text-center">Loading reviews...</div>
    }

    if (reviews.length === 0) {
        return <div className="text-white text-center">No reviews found</div>
    }

    return (
        <div className='text-white'>
            <div className='h-[190px] max-w-maxContent'>
                <Swiper
                    slidesPerView={4}
                    spaceBetween={24}
                    loop={true}
                    freeMode={true}
                    autoplay={{
                        delay: 2500,
                        disableOnInteraction: false,
                    }}
                    modules={[FreeMode, Pagination, Autoplay]}
                    className='w-full'
                >
                    {reviews.map((review) => (
                        <SwiperSlide key={review._id}>
                            <div className="flex flex-col gap-3 p-4 bg-richblack-800 rounded-lg h-[180px]">
                                <div className="flex items-center gap-2">
                                    <img
                                        src={review?.user?.image || 
                                            `https://api.dicebear.com/5.x/initials/svg?seed=${review.user.firstName} ${review.user.lastName}`}
                                        alt='Profile'
                                        className='h-9 w-9 object-cover rounded-full'
                                    />
                                    <div>
                                        <p className="font-semibold">
                                            {review.user.firstName} {review.user.lastName}
                                        </p>
                                        <p className="text-xs text-richblack-200">
                                            {review.course.courseName}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-richblack-50 text-sm">
                                    {review.review.length > 100 
                                        ? `${review.review.substring(0, 100)}...` 
                                        : review.review}
                                </p>
                                <div className="flex items-center gap-2">
                                    <p className="text-yellow-100 font-bold">
                                        {review.rating.toFixed(1)}
                                    </p>
                                    <ReactStars 
                                        count={5}
                                        value={review.rating}
                                        size={20}
                                        edit={false}
                                        activeColor="#ffd700"
                                        emptyIcon={<FaStar />}
                                        fullIcon={<FaStar />}
                                    />
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    )
}

export default ReviewSlider