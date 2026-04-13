# Cloudflare Workers Production Guard

Cloudflare Workers の本番環境（production）へのアクセス時に警告・自動戻りを行う Chrome 拡張です。
利用は自己責任で！あくまでも最後の砦であり、機能する事を保証しません。

## 概要

本拡張は、Cloudflare Dashboard 上で誤って本番環境を操作してしまう事故を防ぐためのツールです。

以下の URL にアクセスした際に動作します：

```
https://dash.cloudflare.com/*/＜プロジェクト名＞/production*
```

## 主な機能

* 本番環境アクセス時に毎回警告ダイアログを表示
* 設定により自動で「戻る（history.back）」を実行
* プロジェクト名を複数登録可能
* SPA（Single Page Application）遷移にも対応
* 拡張アイコンから設定画面を直接開く

## インストール方法

1. このリポジトリをダウンロードまたはクローン
2. Chrome で以下を開く

   ```
   chrome://extensions
   ```
3. 右上の「デベロッパーモード」を ON
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. 本フォルダを選択

## 使い方

### 1. プロジェクト名の登録

* 拡張アイコンをクリック
* 設定画面（Options）が開く
* 本番判定したいプロジェクト名を入力

例：

```
sephiroth-giftedstyle
```

### 2. 自動戻りの設定

* 「本番環境にアクセスすると自動で戻る」を ON

ON の場合：

* 本番 URL にアクセスすると即座に前のページへ戻ります

OFF の場合：

* 警告ダイアログのみ表示されます

## 判定ロジック

現在の URL が以下条件に一致した場合に発動します：

```
https://dash.cloudflare.com/*/<プロジェクト名>/production*
```

* `*` は任意のアカウントID等
* `/production` 配下すべて対象

## ファイル構成

```
.
├── manifest.json
├── content.js
├── service_worker.js
├── options.html
├── options.js
├── icon16.png
├── icon48.png
└── icon128.png
```

## 注意事項

* Cloudflare の UI 変更により動作が影響を受ける可能性があります
* history が存在しない場合、自動戻りは動作しません
* SPA のため、URL変化監視で検知しています

## 今後の拡張案

* アカウントID単位での制御
* production 以外（staging等）の対応
* モーダルUIへの変更
* 強制ブロックモード（即リダイレクト）

## ライセンス

MIT License
