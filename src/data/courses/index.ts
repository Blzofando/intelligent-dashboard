
import { Course } from '../../types';
import { courseData as powerBiCourse } from './power-bi';
import { courseData as htmlCourse } from './course-html';
import { courseData as licCourse } from './lic-ext';
import { courseData as cssCourse } from './course_css';

export const courses: Course[] = [
    powerBiCourse,
    cssCourse,
    licCourse,
    htmlCourse,
];

export const getCourseBySlug = (slug: string): Course | undefined => {
    return courses.find(course => course.slug === slug);
};