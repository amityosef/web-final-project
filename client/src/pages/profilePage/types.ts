import { User, Post } from '../../types';

export interface ProfilePageState {
  profile: User | null;
  posts: Post[];
  tabValue: number;
  isLoading: boolean;
  postsLoading: boolean;
  error: string | null;
  editDialogOpen: boolean;
}

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
