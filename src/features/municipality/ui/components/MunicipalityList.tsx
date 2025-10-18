/**
 * 自治体一覧コンポーネント（Server Component）
 */

import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { MunicipalityPagination } from "./MunicipalityPagination";

interface MunicipalityDTO {
  id: string;
  name: string;
  code: string;
  prefecture: string;
  status: string;
  boardCount: number | null;
  fullName: string;
  isDataCollected: boolean;
}

interface MunicipalityListData {
  municipalities: MunicipalityDTO[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

interface MunicipalityListProps {
  data: MunicipalityListData;
}

// ステータスの日本語ラベル
const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "未着手",
  IN_PROGRESS: "作業中",
  CONTACTING: "問い合わせ中",
  DIGITIZING: "デジタル化中",
  PDF_COMPLETED: "PDF完了",
  CSV_COMPLETED: "CSV完了",
  COMPLETED: "完了",
  QUALITY_CHECK: "品質確認中",
  URL_FOUND: "URL発見",
  OTHER: "その他",
  OUT_OF_SCOPE: "対象外",
};

// ステータスの色
const STATUS_COLORS: Record<
  string,
  "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
> = {
  NOT_STARTED: "default",
  IN_PROGRESS: "info",
  CONTACTING: "info",
  DIGITIZING: "info",
  PDF_COMPLETED: "primary",
  CSV_COMPLETED: "primary",
  COMPLETED: "success",
  QUALITY_CHECK: "warning",
  URL_FOUND: "info",
  OTHER: "default",
  OUT_OF_SCOPE: "error",
};

export function MunicipalityList({ data }: MunicipalityListProps) {
  const { municipalities, total, page, totalPages } = data;

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {total} 件中 {municipalities.length} 件を表示
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>コード</TableCell>
              <TableCell>都道府県</TableCell>
              <TableCell>市区町村名</TableCell>
              <TableCell align="right">掲示場数</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {municipalities.map((municipality) => (
              <TableRow
                key={municipality.id}
                hover
                sx={{ "&:hover": { cursor: "pointer" } }}
              >
                <TableCell>{municipality.code}</TableCell>
                <TableCell>{municipality.prefecture}</TableCell>
                <TableCell>{municipality.name}</TableCell>
                <TableCell align="right">
                  {municipality.boardCount !== null
                    ? municipality.boardCount.toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      STATUS_LABELS[municipality.status] || municipality.status
                    }
                    color={STATUS_COLORS[municipality.status] || "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/municipalities/${municipality.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    詳細
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <MunicipalityPagination totalPages={totalPages} currentPage={page} />
    </Box>
  );
}
