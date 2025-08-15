export interface TeamMember {
  name: string;
  photoUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
}

export interface ContentItem {
  title: string;
  description: string;
  imageUrl: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'error';
  content: string;
}
