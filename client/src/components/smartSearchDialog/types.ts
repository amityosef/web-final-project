import { Post } from '../../types';

export interface SmartSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export interface SearchResult {
  answer?: string;
  posts?: Post[];
  processingTime: number;
  noResults?: boolean;
}
