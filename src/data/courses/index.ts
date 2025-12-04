
import { Course } from '../../types';
import { courseData as powerBiCourse } from './power-bi';
import { courseData as htmlCourse } from './course-html';
import { courseData as licCourse } from './lic-ext';

export const courses: Course[] = [
    powerBiCourse,
    licCourse,
    htmlCourse,
];

export const getCourseBySlug = (slug: string): Course | undefined => {
    return courses.find(course => course.slug === slug);
};