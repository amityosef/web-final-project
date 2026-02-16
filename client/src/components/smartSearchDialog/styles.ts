import { SystemStyleObject } from '@mui/system';

export const dialogHeader: SystemStyleObject = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const dialogTitleContent: SystemStyleObject = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

export const searchField: SystemStyleObject = {
  marginBottom: 2,
};

export const aiHint: SystemStyleObject = {
  marginBottom: 2,
};

export const aiHintIcon: SystemStyleObject = {
  verticalAlign: 'middle',
  marginRight: 0.5,
};

export const suggestionsContainer: SystemStyleObject = {
  marginBottom: 3,
};

export const sectionHeader: SystemStyleObject = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  marginBottom: 1,
};

export const chipsContainer: SystemStyleObject = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1,
};

export const errorText: SystemStyleObject = {
  marginBottom: 2,
};

export const resultsTitle: SystemStyleObject = {
  marginBottom: 1,
};

export const resultsList: SystemStyleObject = {
  maxHeight: 400,
  overflow: 'auto',
};

export const resultItem: SystemStyleObject = {
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'action.hover',
  },
};

export const resultSecondary: SystemStyleObject = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

export const resultImage: SystemStyleObject = {
  width: 60,
  height: 60,
  borderRadius: 1,
  objectFit: 'cover',
  marginLeft: 2,
};

export const noResultsContainer: SystemStyleObject = {
  textAlign: 'center',
  paddingTop: 4,
  paddingBottom: 4,
};

export const loadingContainer: SystemStyleObject = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  py: 4,
  gap: 2,
};

export const emptyStateContainer: SystemStyleObject = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  py: 6,
  color: 'text.secondary',
};

export const emptyStateIcon: SystemStyleObject = {
  fontSize: 48,
  opacity: 0.5,
};

export const resultsHeader: SystemStyleObject = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 2,
};

export const resultCard: SystemStyleObject = {
  mb: 1.5,
  '&:last-child': {
    mb: 0,
  },
};

export const cardHeader: SystemStyleObject = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  mb: 1.5,
};

export const cardAvatar: SystemStyleObject = {
  width: 32,
  height: 32,
};

export const cardContent: SystemStyleObject = {
  mb: 1.5,
  wordBreak: 'break-word',
};

export const cardImage: SystemStyleObject = {
  width: '100%',
  maxHeight: 200,
  objectFit: 'cover',
  borderRadius: 1,
  mb: 1.5,
};

export const cardFooter: SystemStyleObject = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  pt: 1,
  borderTop: '1px solid',
  borderColor: 'divider',
};

export const statsItem: SystemStyleObject = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
};
