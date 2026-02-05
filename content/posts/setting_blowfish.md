---
title: "blowfishの設定で詰まったら"
date: 2026-02-05T23:26:01+09:00
toc: true
draft: false
---

## favicon
`/static`に新しいアイコンの画像をおいても変わらいない時があると思う．そんなときは以下の方法で変わるかも．

### 1) まずローカルホストのブラウザで以下のurlを確認
- `http://localhost:1313/favicon.ico?v=1`  
  → 古い画像になっているかも
- `http://localhost:1313/favicon.ico?v=2`  
  → 新しい画像になっているかも

`v=1`で古い画像になっている場合，次のステップへ．

### 2) DevToolsでキャッシュを無効
1. `http://localhost:1313/`を開く
1. `F12`をクリックし，DevToolsのNetworkタブへ
1. Disable cache にチェック

恐らく，これでv=2が新しい画像になっているならfaviconもかわるかも

## 日付表示
ホームページの記事のプレビューの日付や，記事内の日付が
```
5 2月 2026
```
のように表示されていることがある．これを
```
2026/02/05
```
のように表示したいときはどうするか．

### ホームの記事のプレビュー
`/config/_default/params.toml`内の`[article]`に
```
# /config/_default/params.toml
・
・
・
[article]
showDate = true
dateFormat = "2006/01/02"
・
・
・
```
を追加するとホームの記事のプレビューの日付が変わる．どうやら`2006/01/02`という日付が大事らしいから，絶対にこの日付にするように．  

### 記事内
記事内の日付を変えたいときは，`/config/_default/language.[あなたの言語].toml`内の`[params]`の`dateFormat`を
```
# /config/_default/language.[あなたの言語].toml
・
・
・
[params]
  displayName = "EN"
  isoCode = "en"
  rtl = false
  dateFormat = "2006/01/02"
・
・
・
```
のように変えよう
