export interface User {
  _id: string;
  name: string;
  email: string;
  rollNumber: string;
  role: 'student' | 'faculty' | 'placement' | 'admin';
  branch: string;
  year?: number;
  avatar?: string;
  bio?: string;
  phone?: string;
  skills?: string[];
  interests?: string[];
  technicalInterests?: string[];
  projectInterests?: string[];
  collaborationPrefs?: string;
  isVerified: boolean;
  isActive: boolean;
  connections?: User[];
  connectionRequests?: string[];
  linkedIn?: string;
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
  type: 'general' | 'urgent' | 'event' | 'holiday' | 'exam' | 'placement';
  targetAudience: string;
  postedBy: User;
  isPinned: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface CampusPost {
  _id: string;
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  author: User;
  category: 'achievement' | 'event' | 'project' | 'general' | 'placement' | 'academic';
  tags?: string[];
  status: 'draft' | 'pending_approval' | 'published' | 'rejected';
  likes?: string[];
  comments?: Array<{ user: User; content: string; createdAt: string }>;
  views: number;
  createdAt: string;
}

export interface Opportunity {
  _id: string;
  title: string;
  company: string;
  description: string;
  type: 'placement' | 'internship' | 'hackathon';
  skills: string[];
  eligibility?: string;
  branch: string[];
  graduationYear?: number;
  minCGPA?: number;
  location: string;
  packageOrStipend?: string;
  deadline?: string;
  applicationLink?: string;
  postedBy: User;
  isVerified: boolean;
  isPublished: boolean;
  isSaved?: boolean;
  saves?: string[];
  views: number;
  createdAt: string;
}

export interface Notification {
  _id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
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

export interface PeerMatch {
  _id: string;
  name: string;
  avatar?: string;
  rollNumber: string;
  branch: string;
  year?: number;
  skills: string[];
  technicalInterests: string[];
  projectInterests: string[];
  collaborationPrefs?: string;
  bio?: string;
  compatibilityScore: number;
  matchedOn: {
    skills: string[];
    technicalInterests: string[];
    projectInterests: string[];
    interests: string[];
    sameBranch: boolean;
    sameYear: boolean;
  };
  isConnected: boolean;
  hasPendingRequest: boolean;
}
