import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import * as strings from './strings';

interface SearchInputProps {
  query: string;
  loading: boolean;
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ query, loading, onChange, onKeyPress }) => {
  return (
    <TextField
      fullWidth
      multiline
      maxRows={3}
      placeholder={strings.searchPlaceholder}
      value={query}
      onChange={(e) => onChange(e.target.value)}
      onKeyPress={onKeyPress}
      disabled={loading}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="action" />
          </InputAdornment>
        ),
      }}
      sx={{ mb: 2 }}
    />
  );
};

export default SearchInput;
