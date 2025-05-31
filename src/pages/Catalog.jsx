import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Footer from "../components/common/Footer";
import Course_Card from "../components/core/Catalog/Course_Card";
import Course_Slider from "../components/core/Catalog/CourseSlider";
import { apiConnector } from "../services/apiconnector";
import { categories } from "../services/apis";
import { getCatalogaPageData } from "../services/operations/pageAndComponentData";
import Error from "./Error";

function Catalog() {
  const { loading } = useSelector((state) => state.profile);
  const { catalogName } = useParams();
  const [active, setActive] = useState(1);
  const [catalogPageData, setCatalogPageData] = useState(null);
  const [categoryId, setCategoryId] = useState("");

  // Fetch All Categories
  useEffect(() => {
    const getCategories = async () => {
      try {
        const res = await apiConnector("GET", categories.CATEGORIES_API);
        const category = res?.data?.data?.find(
          (ct) => ct.name.toLowerCase().replace(/\s+/g, "-") === catalogName.toLowerCase()
        );
        if (category) {
          setCategoryId(category._id);
        } else {
          setCatalogPageData({ success: false });
        }
      } catch (error) {
        console.log("Could not fetch Categories.", error);
        setCatalogPageData({ success: false });
      }
    };
    getCategories();
  }, [catalogName]);

  useEffect(() => {
    const getCatalogData = async () => {
      if (categoryId) {
        try {
          const res = await getCatalogaPageData(categoryId);
          setCatalogPageData(res);
        } catch (error) {
          console.log(error);
          setCatalogPageData({ success: false });
        }
      }
    };
    getCatalogData();
  }, [categoryId]);

  if (loading || (!catalogPageData && categoryId)) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!loading && !catalogPageData?.success) {
    return <Error />;
  }

  // Get courses from API response
const allCourses = [
  ...(catalogPageData?.data?.selectedCategory?.courses || []),
  ...(catalogPageData?.data?.differentCategory?.courses || []),
  ...(catalogPageData?.data?.mostSellingCourses || [])
];

const uniqueCourseIds = new Set();
const dedupedCourses = [];

allCourses.forEach(course => {
  if (!uniqueCourseIds.has(course._id)) {
    uniqueCourseIds.add(course._id);
    dedupedCourses.push(course);
  }
});

// Then filter back into their categories
const selectedCategoryCourses = dedupedCourses.filter(course => 
  catalogPageData?.data?.selectedCategory?.courses?.some(c => c._id === course._id)
);

const differentCategoryCourses = dedupedCourses.filter(course => 
  catalogPageData?.data?.differentCategory?.courses?.some(c => c._id === course._id)
);

const mostSellingCourses = dedupedCourses.filter(course => 
  catalogPageData?.data?.mostSellingCourses?.some(c => c._id === course._id)
);

  // Create a set of course IDs from selected and different categories
  const excludedCourseIds = new Set([
    ...selectedCategoryCourses.map(c => c._id),
    ...differentCategoryCourses.map(c => c._id)
  ]);

  // Filter most selling courses to exclude duplicates
  const uniqueMostSelling = mostSellingCourses.filter(
    course => !excludedCourseIds.has(course._id)
  );

  return (
    <>
      {/* Hero Section */}
      <div className="box-content bg-richblack-800 px-4">
        <div className="mx-auto flex min-h-[260px] max-w-maxContentTab flex-col justify-center gap-4 lg:max-w-maxContent">
          <p className="text-sm text-richblack-300">
            {`Home / Catalog / `}
            <span className="text-yellow-25">
              {catalogPageData?.data?.selectedCategory?.name}
            </span>
          </p>
          <p className="text-3xl text-richblack-5">
            {catalogPageData?.data?.selectedCategory?.name}
          </p>
          <p className="max-w-[870px] text-richblack-200">
            {catalogPageData?.data?.selectedCategory?.description}
          </p>
        </div>
      </div>

      {/* Section 1 - Selected Category Courses */}
      <div className="mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
        <div className="section_heading">Courses to get you started</div>
        <div className="my-4 flex border-b border-b-richblack-600 text-sm">
          <button
            className={`px-4 py-2 ${
              active === 1
                ? "border-b border-b-yellow-25 text-yellow-25"
                : "text-richblack-50"
            } cursor-pointer`}
            onClick={() => setActive(1)}
          >
            Most Popular
          </button>
          <button
            className={`px-4 py-2 ${
              active === 2
                ? "border-b border-b-yellow-25 text-yellow-25"
                : "text-richblack-50"
            } cursor-pointer`}
            onClick={() => setActive(2)}
          >
            New
          </button>
        </div>
        <div>
          <Course_Slider
            Courses={selectedCategoryCourses}
            active={active}
          />
        </div>
      </div>

      {/* Section 2 - Different Category Courses */}
      {differentCategoryCourses.length > 0 && (
        <div className="mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
          <div className="section_heading">
            Top courses in {catalogPageData?.data?.differentCategory?.name}
          </div>
          <div className="py-8">
            <Course_Slider
              Courses={differentCategoryCourses}
            />
          </div>
        </div>
      )}

      {/* Section 3 - Most Selling Courses */}
      {uniqueMostSelling.length > 0 && (
        <div className="mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
          <div className="section_heading">Frequently Bought</div>
          <div className="py-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {uniqueMostSelling.slice(0, 4).map((course, i) => (
                <Course_Card 
                  course={course} 
                  key={course._id || i} 
                  Height={"h-[400px]"} 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default Catalog;