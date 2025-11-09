"use client";

import LogoutIcon from "@mui/icons-material/LogoutRounded";
import ManageAccountsIcon from "@mui/icons-material/ManageAccountsRounded";
import PersonIcon from "@mui/icons-material/PersonRounded";
import {
  Avatar,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import type { UserRole } from "@prisma/client";
import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";

interface UserInfo {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
}

interface UserMenuProps {
  user: UserInfo;
}

const getInitials = (name?: string | null, email?: string | null): string => {
  if (!name && email) {
    return email.slice(0, 2).toUpperCase();
  }

  const safeName = name ?? "";
  const parts = safeName.trim().split(/\s+/);
  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]?.[0]?.toUpperCase() ?? "U";
  }

  const [first, last] = [parts[0], parts[parts.length - 1]];
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
};

export function UserMenu({ user }: UserMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const initials = useMemo(
    () => getInitials(user.name, user.email),
    [user.email, user.name]
  );
  const displayName = user.name ?? user.email ?? "ログインユーザー";

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title="ユーザーメニュー">
        <IconButton
          onClick={handleOpen}
          size="small"
          sx={{ ml: 0.5 }}
          aria-label="ユーザーメニュー"
          aria-haspopup="true"
          aria-controls={open ? "user-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
        >
          <Avatar
            src={user.image ?? undefined}
            sx={{
              width: 32,
              height: 32,
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {initials}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            sx: { minWidth: 220, mt: 1, borderRadius: 2, py: 1 },
          },
        }}
      >
        <MenuItem disabled>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <div>
            <Typography variant="body2" fontWeight={600}>
              {displayName}
            </Typography>
            {user.email && (
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
            )}
            {user.role && (
              <Typography variant="caption" color="text.secondary">
                ロール: {user.role}
              </Typography>
            )}
          </div>
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem disabled>
          <ListItemIcon>
            <ManageAccountsIcon fontSize="small" />
          </ListItemIcon>
          プロフィール設定（準備中）
        </MenuItem>
        <MenuItem
          onClick={() => {
            void signOut({ callbackUrl: "/" });
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          サインアウト
        </MenuItem>
      </Menu>
    </>
  );
}
