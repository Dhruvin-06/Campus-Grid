export interface User {
  _id: string;
  name: string;
  email: string;
  rollNumber: string;
  role: 'student' | 'faculty' | 'admin' | 'placement_cell';
  branch: string;
  year?: number;
  avatar?: string;
  bio?: string;
  phone?: string;
  skills?: string[];
  interests?: string[];
  isVerified: boolean;
  isActive: boolean;
  connections?: User[];
  connectionRequests?: string[];
  linkedin?: string;
  github?: string;
  portfolio?: string;
  createdAt?: string;
}

export interface Resource {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  branch: string;
  year?: number;
  type: 'notes' | 'pyq' | 'assignment' | 'reference' | 'lab_manual' | 'other';
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  tags?: string[];
  uploadedBy: User | string;
  downloads: number;
  views: number;
  approved: boolean;
  likes?: string[];
  createdAt: string;
}

export interface Job {
  _id: string;
  title: string;
  company: string;
  type: 'placement' | 'internship' | 'hackathon' | 'competition' | 'scholarship';
  description: string;
  eligibility?: {
    branches?: string[];
    minCGPA?: number;
    yearOfPassing?: number[];
    backlogs?: number;
    otherCriteria?: string;
  };
  package?: string;
  stipend?: string;
  location?: string;
  deadline?: string;
  applyLink?: string;
  companyLogo?: string;
  postedBy: User | string;
  views: number;
  bookmarks?: string[];
  isActive: boolean;
  tags?: string[];
  createdAt: string;
}

export interface Message {
  _id: string;
  sender: User;
  receiver: User;
  content: string;
  type: 'text' | 'file' | 'image';
  read: boolean;
  createdAt: string;
}

export interface LostFoundItem {
  _id: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  location: string;
  imageUrl?: string;
  contactInfo?: string;
  postedBy: User;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'event' | 'holiday' | 'exam';
  targetAudience: string;
  postedBy: User;
  isPinned: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface Blog {
  _id: string;
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  author: User;
  tags?: string[];
  status: 'draft' | 'pending_approval' | 'published' | 'rejected';
  likes?: string[];
  comments?: Array<{ user: User; content: string; createdAt: string }>;
  views: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}
