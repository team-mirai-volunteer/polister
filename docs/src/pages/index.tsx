import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

import type { ReactNode } from "react";

import styles from "./index.module.css";

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={`${siteConfig.title}`} description="Polister documentation">
      <header className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>DOCUMENTATION</span>
            <h1 className={styles.heroTitle}>
              掲示場管理プラットフォームのナレッジベース
            </h1>
            <p className={styles.heroSubtitle}>
              Polister
              のアーキテクチャ、運用ガイド、データ構造を1か所で参照できます。
              チームメンバー間で共通のスタイルとドメイン知識を共有するためのドキュメントです。
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} to="/intro">
                クイックスタート
              </Link>
              <Link
                className={styles.secondaryAction}
                to="/architecture/overview"
              >
                アーキテクチャ概要
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.mainSection}>
        <div className="container">
          <section className={styles.gridSection}>
            <div className={styles.sectionHeader}>
              <h2>ドキュメント構成</h2>
              <p>
                Polister
                を構成するコンポーネントとドメイン知識をカテゴリごとに整理しました。
                参照ページから直接詳細セクションへ遷移できます。
              </p>
            </div>
            <div className={styles.cardGrid}>
              <article className={styles.cardItem}>
                <div className={styles.cardIcon} aria-hidden>
                  <span>🏛️</span>
                </div>
                <h3>アーキテクチャ</h3>
                <p>
                  Clean Architecture と DDD
                  に基づくレイヤー構成、依存関係、技術選定の背景をまとめています。
                </p>
                <Link className={styles.cardLink} to="/architecture/overview">
                  アーキテクチャを見る →
                </Link>
              </article>
              <article className={styles.cardItem}>
                <div className={styles.cardIcon} aria-hidden>
                  <span>🗺️</span>
                </div>
                <h3>データモデル</h3>
                <p>
                  掲示場・自治体・検証履歴など、主要ドメインのスキーマとユースケースを説明します。
                </p>
                <Link className={styles.cardLink} to="/data-model/overview">
                  データモデルを見る →
                </Link>
              </article>
              <article className={styles.cardItem}>
                <div className={styles.cardIcon} aria-hidden>
                  <span>🛠️</span>
                </div>
                <h3>開発ガイド</h3>
                <p>
                  開発環境構築、Lint/TypeCheck/Format の実行方法、PR
                  フローなどプロセス面をガイドします。
                </p>
                <Link className={styles.cardLink} to="/guides/development">
                  開発ガイドを見る →
                </Link>
              </article>
              <article className={styles.cardItem}>
                <div className={styles.cardIcon} aria-hidden>
                  <span>🧭</span>
                </div>
                <h3>運用・モニタリング</h3>
                <p>
                  データ更新のワークフローや監視項目、運用体制に関するベストプラクティスをまとめています。
                </p>
                <Link className={styles.cardLink} to="/operations/monitoring">
                  運用ドキュメントを見る →
                </Link>
              </article>
            </div>
          </section>

          <section className={styles.secondarySection}>
            <div className={styles.secondaryCard}>
              <div>
                <h2>Issue &amp; PR テンプレート</h2>
                <p>
                  GitHub Issue / Pull Request
                  のテンプレート、レビュー方針、チェックリストをまとめています。
                </p>
              </div>
              <Link
                className={styles.secondaryLink}
                to="https://github.com/team-mirai-volunteer/polister"
              >
                GitHub リポジトリ →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}
