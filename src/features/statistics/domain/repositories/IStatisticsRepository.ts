/**
 * Statistics Repository インターフェース
 */

import type { SystemMetrics } from "../entities/SystemMetrics";

export interface IStatisticsRepository {
  /**
   * システム全体の統計情報を取得
   */
  getSystemMetrics(): Promise<SystemMetrics>;
}
