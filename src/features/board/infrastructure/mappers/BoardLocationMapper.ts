/**
 * BoardLocationMapper
 */

import type { BoardLocationDTO } from "../../application/usecases/GetBoardLocationsUseCase";
import type { BoardLocation as DomainBoardLocation } from "../../domain/entities/BoardLocation";

export class BoardLocationMapper {
  static toDTO(board: DomainBoardLocation): BoardLocationDTO {
    return {
      id: board.id,
      boardNumber: board.boardNumber,
      name: board.name,
      address: board.address,
      longitude: board.longitude,
      latitude: board.latitude,
      status: board.status,
      trustLevel: board.trustLevel,
    };
  }
}
