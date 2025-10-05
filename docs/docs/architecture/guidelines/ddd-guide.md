# DDD導入ガイド

> Domain-Driven Design (DDD) を前提に Polister の設計・実装を進めるための指針をまとめたドキュメントです。既存の[クリーンアーキテクチャ実装ガイド](./clean-architecture-guide.md)を補完し、ドメインモデル設計のベストプラクティスを提示します。

## 目的

- プロダクト全体で共通のユビキタス言語を整備し、機能実装やレビュー時の判断基準を揃える。
- ドメイン層のモデルを中心に据えた設計手順を明文化し、技術的関心事と分離したコード構造を維持する。
- 既存の機能モジュール（`features/`）にDDDの各要素（集約、値オブジェクト、ドメインサービス等）をどのように配置するか明確にする。
- ドメインモデルの寿命を意識したテストとドキュメントの整備プロセスを提供する。

## 基本原則

### ユビキタス言語

- Issue、PR、コード、ドキュメントで同じ語彙を用いる。命名はドメイン専門家（運営メンバー）との会話から得られた語を優先する。
- 用語定義は `docs/docs/requirements/` など要件ドキュメントに集約し、変更時はドメイン全体へ影響を波及させる。
- TypeScript の型名、ファイル名、テスト名にもユビキタス言語を反映する。

### バウンデッドコンテキスト

- `features/<feature>` ディレクトリは、基本的に1つのバウンデッドコンテキストと見なす。
- 複数コンテキスト間を横断するユースケース（例: 掲示板と検証の連携）は、アプリケーション層で調停し、ドメイン層の直接参照を避ける。
- コンテキスト間の契約はDTOやドメインイベントで定義し、依存方向が明示されるようにする。

### ドメイン層の独立性

- `features/<feature>/domain` 以下では、外部ライブラリ（`date-fns` 等の純粋なユーティリティを除く）への依存を避ける。
- 永続化・API・UIといった技術的要素はアプリケーション層またはインフラ層に閉じ込め、`domain` から参照しない。
- ドメインロジックは常に同期的かつ副作用なしでテスト可能に保つ。

## Polisterにおける文脈

### featuresディレクトリとの対応

| ディレクトリ            | バウンデッドコンテキストの例 | 主な責務                           |
| ----------------------- | ---------------------------- | ---------------------------------- |
| `features/board`        | 掲示板管理コンテキスト       | 掲示板番号、位置、掲示状態の管理   |
| `features/verification` | 検証コンテキスト             | 掲示板データの検証依頼、承認フロー |
| `features/import`       | インポートコンテキスト       | CSV / KML 等の外部データ取り込み   |
| `features/municipality` | 地方自治体コンテキスト       | 市区町村情報・行政境界の参照       |

- 各コンテキストには自身のドメインモデルを持たせ、他コンテキストのモデルを直接再利用しない。必要に応じて値オブジェクトを再定義する。
- コンテキスト間の整合性はアプリケーション層で担保し、コンテキスト固有の不変条件は各集約が内包する。

### 主要ユビキタス言語と責務

`docs/docs/requirements/project-overview.md` の用語集と整合を取り、以下の語彙を中心に設計・レビューで利用する。

| 用語                                | 定義                                                     | 所属コンテキスト / 役割                                    | ワークフローへの影響                                           |
| ----------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| 検証依頼（Verification Request）    | サポーターへ掲示板の現地確認を依頼するドキュメント。     | `features/verification` のユースケースで生成・受付。       | 承認ステータスの遷移条件となり、未対応の場合は公開停止を判断。 |
| 信頼度レベル（Trust Level）         | データ品質を示す評価指標（公式データ・現地確認済み等）。 | ドメインサービスで算出し、`features/board` の集約に保持。  | 公開可否や通知優先度を決め、検証依頼の再発行条件に利用。       |
| インポートジョブ（Import Job）      | 外部データを取り込む処理単位（CSV / KML 等）。           | `features/import` の集約として状態遷移とエラーログを管理。 | エラー時のリトライや差分反映フローを開始するトリガー。         |
| 地域コーディネーター（Coordinator） | 特定地域の承認とサポーター管理を担うロール。             | `features/municipality` と認可サービスで権限を判定。       | 検証依頼の配信、信頼度承認、例外対応の決裁を行う。             |

### 層構造と責務の整理

- **ドメイン層**: エンティティ、値オブジェクト、ドメインサービス、ドメインイベント。
- **アプリケーション層**: ユースケース（`usecases/`）、アプリケーションサービス（`services/`）、ファサード役のインターフェース。
- **インフラ層**: リポジトリ実装、マッパー、外部APIクライアント。
- **UI/Presentation層**: Next.js ページ・API Route・Reactコンポーネント。

## モデリングプロセス

1. **用語整理**: ユビキタス言語の候補をリスト化し、関係者と確認する。`docs/docs/requirements/` に用語集を追記する。
2. **ドメインシナリオ分析**: 実際の業務フロー（例: 掲示板設置→検証→公開）を時系列で整理し、イベント単位でストーリーを作る。
3. **集約の抽出**: 不変条件を満たすために一括更新すべきデータのまとまりを抽出し、集約ルートを仮決定する。
4. **値オブジェクト化**: 単純な型では不十分な概念（例: 緯度経度、掲示板番号形式）を値オブジェクトとして定義する。
5. **ドメインサービス検討**: 集約だけでは表現しにくいルールをドメインサービスとして切り出す。
6. **ユースケース設計**: アプリケーション層で集約・サービスをどう連携させるかフローを描き、テスト戦略を決める。
7. **テストファースト実装**: ドメイン層のユニットテストを先に書き、不変条件・エラーパスを確認する。

## エンティティと集約

- エンティティは識別子を持ち、ライフサイクル管理（生成、状態遷移、削除）を担当する。
- 集約ルートは不変条件を内包し、外部からの変更は集約ルートのメソッド経由のみ許可する。
- 集約内部のエンティティは外部公開しない。DTOやリードモデルには変換層（マッパー）を用意する。

### 集約ルートの判断基準

- ビジネス的に同一トランザクションで扱う必要があるか。
- 参照頻度と更新頻度のバランス（リード主体であれば分割を検討）。
- 他集約との関係が双方向になっていないか（依存方向を一方通行にする）。

### 一貫性と不変条件

- 不変条件（例: 掲示板番号は自治体内でユニーク）は集約ルート内で検証し、アプリケーション層に委ねない。
- 値オブジェクトを利用して入力値を検証し、ドメイン層で例外（`DomainError` 等）を投げる。
- 複数集約にまたがる整合性はドメインイベントまたはアプリケーションサービスで調停する。

### リポジトリとの連携

- インターフェースは `features/<feature>/domain/repositories` などドメイン層に配置し、アプリケーション層はインターフェース経由で永続化にアクセスする。
- 実装は `features/<feature>/infrastructure/repositories` に配置し、マッパーで集約 ↔ 永続化モデル間の変換を行う。
- トランザクション境界はアプリケーション層で管理し、集約単位でリポジトリを介して保存する。

## 値オブジェクト

- データと不変条件を1つの型として表現し、イミュータブルに保つ。
- `equals` / `toString` 相当の振る舞いを実装し、テストしやすくする。
- 値検証をコンストラクタ（または `create` ファクトリ）で行い、無効な値の生成を防ぐ。
- ドメイン固有の例外クラスを併せて定義し、ガード条件で意図を明確にする。

```typescript title="例: BoardLocation値オブジェクト"
export class BoardDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BoardDomainError";
  }
}

export class BoardLocation {
  private constructor(
    public readonly latitude: number,
    public readonly longitude: number
  ) {}

  public static create(lat: number, lng: number): BoardLocation {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BoardDomainError("座標が数値ではありません");
    }
    // 日本国内の座標範囲（概算値）を超えていないか検証する
    if (lat < 20 || lat > 46 || lng < 122 || lng > 154) {
      throw new BoardDomainError("日本国内の座標範囲を超えています");
    }
    return new BoardLocation(lat, lng);
  }
}
```

## ドメインサービス

- 複数集約にまたがるロジックや、エンティティの状態と無関係な計算処理を担当する。
- ステートレスに保ち、副作用は返却値に含めるか、ドメインイベントを発行して扱う。
- インターフェースをドメイン層に置き、実装をインフラ層／アプリケーション層で切り替えられるようにする（例: 地理座標計算、外部API連携が必要なバリデーションなど）。

ドメインサービスは集約の境界では扱いにくい補助的なロジックを切り出す。地理的な距離計算のように外部依存を伴う場合でも、インターフェースを定義しておけばドメイン層は契約にのみ依存できる。

```typescript title="例: 掲示板距離判定のドメインサービス"
export interface IBoardProximityService {
  calculateDistance(origin: BoardLocation, target: BoardLocation): number;
  findNearbyBoards(center: BoardLocation, radiusKm: number): Promise<Board[]>;
}

// 実装はアプリケーション/インフラ層で提供し、副作用を隔離する
export class BoardProximityService implements IBoardProximityService {
  // GeoDistanceCalculator / BoardQueryService はインフラ層のインターフェース
  constructor(
    private readonly distanceCalculator: GeoDistanceCalculator,
    private readonly boardQuery: BoardQueryService
  ) {}

  calculateDistance(origin: BoardLocation, target: BoardLocation): number {
    return this.distanceCalculator.calculateKm(origin, target);
  }

  async findNearbyBoards(
    center: BoardLocation,
    radiusKm: number
  ): Promise<Board[]> {
    return this.boardQuery.findWithinRadius(center, radiusKm);
  }
}
```

## アプリケーション層との協調

- ユースケースは「集約ロード → ドメイン操作 → 集約保存 → ドメインイベント発行 → 2次的処理」の順に整理する。
- ドメイン層で発行されたドメインイベントは、アプリケーション層が購読し、非同期処理（通知、他コンテキスト更新等）を担う。
- トランザクション管理、リトライ、監査ログといった技術的関心事はアプリケーション層で実装し、ドメイン層へ波及させない。

## ドメインイベントと副作用

- ドメインイベントは `features/<feature>/domain/events` に配置し、イベントごとのペイロードを定義する。
- イベントハンドラはアプリケーション層またはインフラ層に実装し、副作用（メール送信、ワークフロー起動等）を処理する。
- イベント発火は集約ルートのメソッド内で行い、アプリケーション層にイベントが渡る仕組み（例: `DomainEventPublisher`）を用意する。

```typescript title="例: Boardドメインのイベント定義と発火"
// features/board/domain/events/BoardVerifiedEvent.ts
export class BoardVerifiedEvent {
  constructor(
    public readonly boardId: string,
    public readonly verifiedBy: string,
    public readonly verifiedAt: Date,
    public readonly trustLevel: TrustLevel
  ) {}
}

export class Board {
  private readonly domainEvents: DomainEvent[] = [];

  verify(verifierId: string, trustLevel: TrustLevel): void {
    // 状態更新ロジック（承認日時や信頼度の更新など）
    this.domainEvents.push(
      new BoardVerifiedEvent(this.id, verifierId, new Date(), trustLevel)
    );
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }
}

// アプリケーション層でイベントを購読し、副作用を担当する
DomainEventPublisher.subscribe(BoardVerifiedEvent, async (event) => {
  await verificationMailer.sendCompletedNotice(event.boardId, event.verifiedBy);
  await auditLogger.recordTrustLevel(event.boardId, event.trustLevel);
});
```

## テスト戦略

- ドメイン層: エンティティ・値オブジェクト・ドメインサービスのユニットテストを最優先で整備する。
- アプリケーション層: ユースケース毎の統合テストで、モック化したリポジトリを使いシナリオ単位で確認する。
- インフラ層: Prisma 等を利用した実際の永続化テストは `jest` の統合テストで実施し、トランザクション境界を確認する。
- テストの詳細指針は[テストガイドライン](./testing-guide.md)を参照し、DDD視点でのカバレッジを追補する。

## 実装時のチェックリスト

- [ ] ユビキタス言語に基づいた命名がされているか。
- [ ] 集約内の不変条件がテストで担保されているか。
- [ ] ドメイン層のコードが外部技術に依存していないか。
- [ ] ドメインイベント発行と副作用処理の責務が分離されているか。
- [ ] コンテキスト間の依存がアプリケーション層を経由するようになっているか。
- [ ] ドキュメント（用語集、シーケンス図等）が更新されているか。

このガイドラインは継続的に更新し、実装レビューやADRで得られた知見を反映していきます。
