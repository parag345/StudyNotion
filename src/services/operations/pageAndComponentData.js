import { toast } from "react-hot-toast"
import { apiConnector } from '../apiconnector'
import { catalogData } from '../apis'

export const getCatalogaPageData = async (categoryId) => {
  const toastId = toast.loading("Loading...")
  let result = { success: false, data: null }
  
  try {
    const response = await apiConnector(
      "POST", 
      catalogData.CATALOGPAGEDATA_API,
      { categoryId }
    )

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not Fetch Category page data")
    }

    // Transform data to ensure no duplicates across sections
    const responseData = response.data.data
    

    const allCourses = responseData.selectedCategory?.courses || []
    const differentCategoryCourses = responseData.differentCategory?.courses || []
      .filter(course => !allCourses.some(c => c._id === course._id))
    const mostSellingCourses = responseData.mostSellingCourses || []
      .filter(course => !allCourses.some(c => c._id === course._id) && 
                         !differentCategoryCourses.some(c => c._id === course._id))

    result = {
      success: true,
      data: {
        ...responseData,
        differentCategory: {
          ...responseData.differentCategory,
          courses: differentCategoryCourses
        },
        mostSellingCourses
      }
    }

  } catch (error) {
    console.log("CATALOG PAGE DATA API ERROR....", error)
    toast.error(error.message)
    result.error = error.message
  }
  
  toast.dismiss(toastId)
  return result
}