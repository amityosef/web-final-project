import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  InputBase,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  Home as HomeIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { uploadService } from '../../services/uploadService';
import * as styles from './styles';
import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';
import CreatePostDialog from '../createPostDialog';
import SmartSearchDialog from '../smartSearchDialog';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [smartSearchOpen, setSmartSearchOpen] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
  };

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={styles.logoText}
            onClick={() => navigate('/')}
          >
            {strings.appTitle}
          </Typography>

          <Box sx={styles.searchContainer}>
            <Box sx={styles.searchIconWrapper}>
              <SearchIcon />
            </Box>
            <InputBase
              placeholder={strings.searchPlaceholder}
              inputProps={{ 'aria-label': consts.searchAriaLabel }}
              onClick={() => setSmartSearchOpen(true)}
              readOnly
              sx={styles.searchInput}
            />
          </Box>

          <Box sx={styles.flexGrow} />

          <Box sx={styles.actionsContainer}>
            <Tooltip title={strings.homeTooltip}>
              <IconButton color="inherit" onClick={() => navigate('/')}>
                <HomeIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={strings.smartSearchTooltip}>
              <IconButton color="inherit" onClick={() => setSmartSearchOpen(true)}>
                <Badge color="secondary" variant="dot">
                  <AIIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title={strings.createPostTooltip}>
              <IconButton color="inherit" onClick={() => setCreatePostOpen(true)}>
                <AddIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={strings.accountTooltip}>
              <IconButton onClick={handleMenu} sx={styles.avatarButton}>
                <Avatar
                  alt={utils.getAvatarAlt(user?.name)}
                  src={uploadService.getImageUrl(user?.profileImage || '')}
                  sx={styles.avatar}
                >
                  {utils.getInitials(user?.name)}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              id={consts.menuId}
              anchorEl={anchorEl}
              anchorOrigin={consts.anchorOrigin}
              keepMounted
              transformOrigin={consts.transformOrigin}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleProfile}>
                <PersonIcon sx={styles.menuIcon} /> {strings.profileMenuLabel}
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={styles.menuIcon} /> {strings.logoutMenuLabel}
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <CreatePostDialog open={createPostOpen} onClose={() => setCreatePostOpen(false)} />

      <SmartSearchDialog open={smartSearchOpen} onClose={() => setSmartSearchOpen(false)} />
    </>
  );
};

export default Navbar;
