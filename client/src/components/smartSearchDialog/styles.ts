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
        backgroundColor: 'action.hover'
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
