
import { Course } from '../../types';
import { courseData as powerBiCourse } from './power-bi';
import { courseData as htmlCourse } from './course-html';
import { courseData as licCourse } from './lic-ext';
import { courseData as cssCourse } from './course_css';
import { influencerMilionarioCourse as ytbCourse } from './course_ytb';

export const courses: Course[] = [
    ytbCourse,
    powerBiCourse,
    cssCourse,
    licCourse,
    htmlCourse,
];

export const getCourseBySlug = (slug: string): Course | undefined => {
    return courses.find(course => course.slug === slug);
};