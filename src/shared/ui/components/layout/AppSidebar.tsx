"use client";

import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { STATUS_LABELS } from "@/features/municipality/constants";

const SIDEBAR_NAV_ITEMS = [
  { label: "ホーム", description: "ダッシュボード", href: "/" },
  {
    label: "自治体一覧",
    description: "検索・フィルター",
    href: "/municipalities",
  },
  {
    label: "都道府県一覧",
    description: "進捗ステータス",
    href: "/prefectures",
  },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [municipalitySearch, setMunicipalitySearch] = useState(
    searchParams?.get("search") ?? ""
  );
  const [status, setStatus] = useState(searchParams?.get("status") ?? "");

  useEffect(() => {
    setMunicipalitySearch(searchParams?.get("search") ?? "");
    setStatus(searchParams?.get("status") ?? "");
  }, [searchParams]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (municipalitySearch.trim()) {
      params.set("search", municipalitySearch.trim());
    }
    if (status) {
      params.set("status", status);
    }

    const query = params.toString();
    router.push(query ? `/municipalities?${query}` : "/municipalities");
    onNavigate?.();
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatus(event.target.value);
  };

  return (
    <Stack spacing={4} sx={{ width: "100%" }}>
      <Box component="section">
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          クイックナビゲーション
        </Typography>
        <List disablePadding>
          {SIDEBAR_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={isActive}
                onClick={onNavigate}
              >
                <ListItemText
                  primary={item.label}
                  secondary={item.description}
                  primaryTypographyProps={{ fontWeight: 600 }}
                  secondaryTypographyProps={{
                    variant: "caption",
                    color: "text.secondary",
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Divider flexItem />

      <Box component="section">
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          自治体クイック検索
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="自治体名で検索"
            placeholder="例: 横浜市"
            size="small"
            value={municipalitySearch}
            onChange={(event) => setMunicipalitySearch(event.target.value)}
            name="search"
            type="search"
          />
          <FormControl size="small">
            <InputLabel id="sidebar-status-filter">ステータス</InputLabel>
            <Select
              labelId="sidebar-status-filter"
              label="ステータス"
              value={status}
              onChange={handleStatusChange}
              name="status"
            >
              <MenuItem value="">
                <em>すべて</em>
              </MenuItem>
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained" fullWidth>
              検索
            </Button>
            <Button
              type="button"
              variant="outlined"
              fullWidth
              onClick={() => {
                setMunicipalitySearch("");
                setStatus("");
                router.push("/municipalities");
                onNavigate?.();
              }}
            >
              リセット
            </Button>
          </Stack>
        </Box>
      </Box>

      <Divider flexItem />

      <Box component="section">
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          リソース
        </Typography>
        <Stack spacing={1.5}>
          <Button
            component={Link}
            href="https://team-mirai-volunteer.github.io/polister/"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            fullWidth
          >
            開発ドキュメント
          </Button>
          <Button
            component={Link}
            href="https://github.com/team-mirai-volunteer/polister"
            target="_blank"
            rel="noopener noreferrer"
            variant="text"
            fullWidth
          >
            GitHub リポジトリ
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
