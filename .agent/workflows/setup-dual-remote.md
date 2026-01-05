---
description: Gitea/GitHub Dual Remote環境のセットアップ
---
# Dual Remote セットアップワークフロー

1つのリポジトリに2つのリモート（Gitea + GitHub）を設定します。

## 前提条件

- Git初期化済みであること
- GiteaとGitHubのリポジトリURLを用意していること

## 手順

1. ユーザーにGiteaのリポジトリURLを確認
2. ユーザーにGitHubのリポジトリURLを確認
// turbo
3. `git remote add origin <GiteaのURL>` でGiteaをoriginとして追加
// turbo
4. `git remote add public <GitHubのURL>` でGitHubをpublicとして追加
// turbo
5. `git remote -v` でリモート設定を確認
6. 設定完了を報告

## 運用ルール

| リモート名 | 用途 | プッシュタイミング |
|-----------|------|-------------------|
| `origin` (Gitea) | バックアップ・WIP | 作業の区切りごと |
| `public` (GitHub) | 公開・AIレビュー | スクッシュマージ後 |
