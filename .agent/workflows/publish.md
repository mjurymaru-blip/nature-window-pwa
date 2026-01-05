---
description: GitHubへクリーンなコミットを公開する
---
# GitHub公開ワークフロー

開発ブランチの変更をスクッシュマージしてGitHubへ公開します。

## 手順

1. 現在のブランチ名と変更差分を確認する
// turbo
2. `git checkout main` でmainブランチに切り替える
3. `git merge --squash <開発ブランチ名>` でスクッシュマージを実行
4. ユーザーにコミットメッセージの内容を確認する
5. `git commit -m "<コミットメッセージ>"` でコミットを作成
// turbo
6. `git push public main` でGitHubへプッシュ
7. 完了を報告する
