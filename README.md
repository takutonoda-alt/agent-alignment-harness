# agent-alignment-harness

Human × AI エージェント実装で起きる「意図のズレ」「実装失敗」「運用前提漏れ」を構造化ログとして蓄積し、再発防止ルールに昇格させるハーネス。

## Goal

- 失敗を再現可能な形で残す
- 失敗パターンを定量で可視化する
- 閾値を超えたパターンをルール化し、CIで予防する

## Structure

- `schema/`: 失敗ログJSONスキーマ
- `templates/`: 記録テンプレート
- `logs/`: 実ログ（時系列）
- `rules/`: 再発防止ルール
- `scripts/`: 検証/集計/ルール昇格
- `.github/workflows/`: 自動検証と週次サマリー

## Quick Start

```bash
npm install
npm run validate
npm run summarize
npm run promote-rule
```

## Logging Policy

1失敗 = 1 JSONファイル。

必須項目:

- `id`, `date`, `repo`, `commit`
- `intent`
- `mismatch_type`
- `symptom`
- `root_cause`
- `detection`
- `fix`
- `preventive_rule`
- `severity` (`S1`..`S4`)
- `cost` (`minutes`, `impact`)

## Rule Promotion

同一 `mismatch_type + root_cause` が3件以上で `rules/generated/` に昇格候補を出力。
