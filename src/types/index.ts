export type UserRole = 'student' | 'instructor' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  year?: number;
  bio?: string;
  enrolledCourses: string[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  instructor: Instructor;
  credits: number;
  semester: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  coverImage?: string;
  color: string;
  modules: Module[];
  announcements: Announcement[];
}

export interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  officeHours?: string;
  officeLocation?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  isCompleted: boolean;
  materials: Material[];
  duration: string;
}

export interface Material {
  id: string;
  title: string;
  type: 'video' | 'document' | 'link' | 'quiz';
  url?: string;
  duration?: string;
  isCompleted: boolean;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'not-started' | 'in-progress' | 'submitted' | 'graded';
  grade?: number;
  maxPoints: number;
  submissionType: 'file' | 'link' | 'text';
  submittedAt?: Date;
  feedback?: string;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
}

export interface Announcement {
  id: string;
  courseId: string;
  title: string;
  content: string;
  author: Instructor;
  createdAt: Date;
  isPinned: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  courseId: string;
  courseName: string;
  members: User[];
  maxMembers: number;
  meetingTime?: string;
  meetingLocation?: string;
  isJoined: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'assignment' | 'class' | 'study' | 'exam' | 'personal';
  courseId?: string;
  courseName?: string;
  location?: string;
  isAllDay: boolean;
}

export interface Notification {
  id: string;
  type: 'assignment' | 'message' | 'announcement' | 'grade' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  link?: string;
}

export interface ProgressStats {
  totalCourses: number;
  completedAssignments: number;
  pendingAssignments: number;
  averageGrade: number;
  studyHours: number;
  streakDays: number;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  department: string;
  quote: string;
  avatar?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  cta: string;
}
