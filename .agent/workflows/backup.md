---
description: Giteaにバックアップをプッシュする
---
# Giteaバックアップワークフロー

現在の作業状態をGiteaにバックアップとしてプッシュします。

## 手順

// turbo
1. `git status` で現在の状態を確認
2. 未コミットの変更がある場合、ユーザーにコミットメッセージを確認
// turbo
3. `git add -A && git commit -m "<メッセージ>"` で変更をコミット
// turbo
4. `git push origin` でGiteaへプッシュ
5. 完了を報告
