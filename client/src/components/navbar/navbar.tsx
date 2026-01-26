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
    alpha,
    styled,
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
import CreatePostDialog from '../createPostDialog';
import SmartSearchDialog from '../smartSearchDialog';

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(3),
        width: 'auto',
    },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: '20ch',
        },
    },
}));

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
                        Social Network
                    </Typography>

                    <Search>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <StyledInputBase
                            placeholder="Search…"
                            inputProps={{ 'aria-label': 'search' }}
                            onClick={() => setSmartSearchOpen(true)}
                            readOnly
                        />
                    </Search>

                    <Box sx={styles.flexGrow} />

                    <Box sx={styles.actionsContainer}>
                        <Tooltip title="Home">
                            <IconButton color="inherit" onClick={() => navigate('/')}>
                                <HomeIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Smart Search (AI)">
                            <IconButton color="inherit" onClick={() => setSmartSearchOpen(true)}>
                                <Badge color="secondary" variant="dot">
                                    <AIIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Create Post">
                            <IconButton color="inherit" onClick={() => setCreatePostOpen(true)}>
                                <AddIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Account">
                            <IconButton onClick={handleMenu} sx={styles.avatarButton}>
                                <Avatar
                                    alt={user?.name || 'User'}
                                    src={uploadService.getImageUrl(user?.profileImage || '')}
                                    sx={styles.avatar}
                                >
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </Avatar>
                            </IconButton>
                        </Tooltip>

                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={handleProfile}>
                                <PersonIcon sx={styles.menuIcon} /> Profile
                            </MenuItem>
                            <MenuItem onClick={handleLogout}>
                                <LogoutIcon sx={styles.menuIcon} /> Logout
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            <CreatePostDialog
                open={createPostOpen}
                onClose={() => setCreatePostOpen(false)}
            />

            <SmartSearchDialog
                open={smartSearchOpen}
                onClose={() => setSmartSearchOpen(false)}
            />
        </>
    );
};

export default Navbar;
