# T's time - 値札印刷アプリ

エプソン TM-M30 プリンター用の値札印刷Webアプリケーション

## ⚠️ 超重要：Windows Bluetooth接続の制限

**ePOS-Print SDKは、Webブラウザから直接Bluetooth接続をサポートしていません。**

エラー例：`ERROR_TIMEOUT`, `ERR_UNSAFE_PORT`, `ERR_NAME_NOT_RESOLVED`

### 🔧 解決方法（3つの選択肢）

#### 方法1：EPSON ePOS-Print Serviceを使用（推奨）

1. **EPSON ePOS-Print Serviceをインストール**
   - [EPSONダウンロードページ](https://download.epson-biz.com/)からダウンロード
   - Windows用のePOS-Print Serviceをインストール
   
2. **プリンターをサービスに登録**
   - ePOS-Print Service設定ツールを起動
   - Bluetoothプリンター「T's time TM-M30_005462」を追加
   - BD_ADDR: `00:01:90:C7:7A:B2`
   
3. **アプリから接続**
   - サービスがローカルサーバー（localhost）として動作
   - `http://localhost:8008` 経由で印刷可能

#### 方法2：Wi-Fi接続に変更（最も簡単）

TM-M30をWi-Fiネットワークに接続：

1. プリンター設定でWi-Fi設定
2. IPアドレスを取得
3. アプリで「接続方法: Wi-Fi/ネットワーク」を選択
4. IPアドレスを入力

#### 方法3：iPad/iPhone/Androidタブレットを使用

iOS/AndroidデバイスではBluetooth接続が正式サポートされています：

1. iPad/iPhoneでLive ServerのURLにアクセス
   - `http://{PCのIPアドレス}:5500`
2. 「接続方法: Bluetooth」を選択
3. そのまま印刷可能

## 使い方

### 1. プリンター接続設定

上記の推奨方法でWi-Fi接続に変更してください。

### 2. アプリケーションの起動

VS Codeで `C:\price-tag-app` フォルダを開き、Live Serverで起動：

```
右クリック → Open with Live Server
```

### 3. 印刷手順

1. **連番**：自動的に1から開始（印刷後に自動インクリメント）
2. **型番**を入力（最大35文字、自動改行）
3. **購入価格**を入力（必須）
4. **電池代**を入力（任意）
5. **ベルト代**を入力（任意）
6. **希望金額**を入力（必須）
7. プレビューで確認
8. **印刷ボタン**をクリック

## 印刷フォーマット

```
T's time     00001
--------------------------------
型番: ABC-123

購入価格　¥5,000-
電池代　¥300-
ベルト代　¥500-

希望金額　¥8,000-

2026年01月12日 15:30 45秒

[バーコード]
2026011200001
```

## トラブルシューティング

### Bluetooth接続エラーが出る

→ **Wi-Fi接続に変更してください**（上記参照）

### プリンターに接続できない（Wi-Fi接続時）

1. プリンターの電源が入っているか確認
2. プリンターとPCが同じネットワークに接続されているか確認
3. IPアドレスが正しいか確認
4. ファイアウォールでポート8008が許可されているか確認

### ePOS-Print SDKが読み込めない

`epos-2.27.0.js` が `C:\price-tag-app\` フォルダに存在することを確認してください。

## ファイル構成

```
C:\price-tag-app\
├── index.html           # メインHTML
├── style.css            # スタイルシート
├── app.js               # JavaScript（印刷ロジック）
├── epos-2.27.0.js       # ePOS-Print SDK
├── README.md            # このファイル
├── .vscode/             # VS Code設定
└── ePOS_SDK_Sample_JavaScript/  # 公式サンプル
```

## サポート

問題が解決しない場合は、[EPSONサポート](https://www.epson.jp/support/)をご確認ください。
