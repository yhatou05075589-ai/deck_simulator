# デッキシミュレーター

カードゲームの確率計算を行うFlaskアプリケーション。

## ディレクトリ構成

```
.
├── app.py                      # Flaskアプリ本体（ルーティング / 計算・アドバイス関数）
├── requirements.txt            # 依存パッケージ
├── templates/
│   └── index.html              # メイン画面テンプレート
└── static/
    ├── deck_simulator.css      # スタイルシート
    └── deck_simulator.js       # フロントエンドの挙動（カード登録・優先順位・API呼び出し）
```

### 主なエンドポイント

| メソッド | パス             | 内容                                   |
|----------|------------------|----------------------------------------|
| GET      | `/`              | メイン画面（`index.html`）を表示        |
| POST     | `/api/calculate` | 確率計算（`calculate_probability()`、現状TODO） |
| POST     | `/api/advice`    | AIアドバイス生成（`generate_advice()`、現状TODO） |

## 動作確認方法

1. 仮想環境を作成して有効化する

   ```
   python -m venv .venv
   source .venv/Scripts/Activate
   ```

2. 依存パッケージをインストールする

   ```
   pip install -r requirements.txt
   ```

3. アプリを起動する

   ```
   python app.py
   ```

4. ブラウザで [http://127.0.0.1:5000/](http://127.0.0.1:5000/) を開き、画面が表示されることを確認する。

5. 「計算」「AIアドバイス」ボタンを押下し、それぞれ`/api/calculate`・`/api/advice`にリクエストが送られ、レスポンスが表示されることを確認する（計算処理自体はTODOのため、現時点では未実装メッセージが表示される）。
