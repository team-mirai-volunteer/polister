"use client";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { BoardCandidateDTO } from "../../application/actions/getBoardCandidatesAction";

interface BoardCandidateListProps {
  candidates: BoardCandidateDTO[];
  onLinkPublic: (boardId: string) => void;
  onLinkPrivate: (boardId: string) => void;
}

export function BoardCandidateList({
  candidates,
  onLinkPublic,
  onLinkPrivate,
}: BoardCandidateListProps) {
  if (candidates.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            候補掲示場が見つかりませんでした
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getRankColor = (
    rank: string
  ): "success" | "warning" | "default" | "error" => {
    switch (rank) {
      case "HIGH":
        return "success";
      case "MEDIUM":
        return "warning";
      case "LOW":
        return "default";
      default:
        return "error";
    }
  };

  const getFactorLabel = (factor: string): string => {
    switch (factor) {
      case "location":
        return "位置情報";
      case "municipality":
        return "市区町村";
      case "boardNumber":
        return "掲示場番号";
      default:
        return factor;
    }
  };

  return (
    <Stack spacing={1}>
      {candidates.map((candidate, index) => (
        <Card key={candidate.boardId} variant="outlined">
          <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
            <Stack spacing={1}>
              {/* ヘッダー行 */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2" fontWeight="bold">
                    #{index + 1}
                  </Typography>
                  <Typography variant="body2">
                    {candidate.boardNumber || "番号なし"}
                  </Typography>
                  <IconButton
                    component={Link}
                    href={`/boards/${candidate.boardId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    aria-label="掲示場詳細を新しいタブで開く"
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                  <Chip
                    label={`${candidate.matchRank} ${candidate.matchScore}点`}
                    color={getRankColor(candidate.matchRank)}
                    size="small"
                    sx={{ height: 20, fontSize: "0.7rem" }}
                  />
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => onLinkPublic(candidate.boardId)}
                    disabled={candidate.matchRank === "NONE"}
                  >
                    公開
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onLinkPrivate(candidate.boardId)}
                    disabled={candidate.matchRank === "NONE"}
                  >
                    非公開
                  </Button>
                </Stack>
              </Stack>

              {/* 住所・距離 */}
              <Box>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {candidate.address}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  距離: {candidate.distance.toFixed(0)}m
                </Typography>
              </Box>

              {/* スコア詳細（折りたたみ） */}
              <Accordion
                sx={{ boxShadow: "none", "&:before": { display: "none" } }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    minHeight: 0,
                    "& .MuiAccordionSummary-content": { my: 0.5 },
                  }}
                >
                  <Typography variant="caption">スコア詳細</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Stack spacing={0.5}>
                    {candidate.scoreDetails.map((detail) => (
                      <Box key={detail.factor}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption">
                            {getFactorLabel(detail.factor)}
                          </Typography>
                          <Typography variant="caption" fontWeight="bold">
                            {detail.score}/{detail.maxScore}
                          </Typography>
                        </Stack>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {detail.detail}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(detail.score / detail.maxScore) * 100}
                          sx={{ height: 4, mt: 0.25 }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
