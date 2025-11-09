"use server";

import { resolve } from "@/shared/lib/di";
import { TOKENS } from "@/shared/lib/di/tokens";
import type { GetBoardCandidatesUseCase } from "../usecases/GetBoardCandidatesUseCase";

export interface BoardCandidateDTO {
  boardId: string;
  boardNumber: string | null;
  address: string;
  municipalityName: string;
  prefecture: string;
  latitude: number;
  longitude: number;
  distance: number;
  matchScore: number;
  matchRank: string;
  scoreDetails: Array<{
    factor: string;
    score: number;
    maxScore: number;
    detail: string;
  }>;
}

export async function getBoardCandidatesAction(
  imageId: string
): Promise<BoardCandidateDTO[]> {
  const useCase = resolve(
    TOKENS.GetBoardCandidatesUseCase
  ) as GetBoardCandidatesUseCase;

  return await useCase.execute(imageId);
}
