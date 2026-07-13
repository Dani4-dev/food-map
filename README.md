# FoodMap - 世界の料理地図

## 日本語

### 概要

FoodMapは、インタラクティブな世界地図を使って、各国・地域の代表的な料理を探索するWebアプリケーションです。

地図上の国をクリックするだけで、その地域の料理がリアルタイムで表示されます。Wikidataから正確な料理情報を取得し、料理名、説明、画像を表示します。

### 特徴

- **インタラクティブな地図**: Leafletを使用した直感的な世界地図
- **Wikidataベースのデータ**: 信頼できる構造化されたデータソース
- **多言語対応**: 日本語と英語でUIと料理情報を表示
- **高速キャッシング**: ローカルストレージを使用した連続検索の最適化
- **レスポンシブデザイン**: モバイルデバイスにも対応

### 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **ビルドツール**: Vite
- **地図**: Leaflet + react-leaflet
- **データ取得**: axios + Wikidata SPARQL API
- **ローカライズ**: react-i18next
- **キャッシング**: localStorage

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/your-repo/foodmap.git
cd foodmap

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev

# 本番ビルド
npm run build

# ビルド結果をプレビュー
npm run preview
```

### 使い方

1. ウェブアプリを開く
2. 地図上の国をクリック
3. 右側のパネルに該当国の料理リストが表示される
4. 言語ボタンで日本語/英語を切り替え可能

### キャッシング仕様

- 検索結果は7日間ローカルストレージに保存
- 同じ国を再度選択した場合、キャッシュからデータを取得
- インメモリキャッシュにより、同時リクエストを1つに統合

### プロジェクト構成

```
src/
├── components/
│   ├── WorldMap.tsx        # 地図コンポーネント
│   ├── FoodPanel.tsx       # 料理パネル
│   └── DishCard.tsx        # 料理カードコンポーネント
├── services/
│   ├── dishSearchService.ts # Wikidata検索ロジック
│   └── cacheService.ts      # キャッシング管理
├── types/
│   └── food.ts              # 型定義
├── i18n/
│   ├── config.ts            # i18n設定
│   ├── locales/
│   │   ├── en.json          # 英語翻訳
│   │   └── ja.json          # 日本語翻訳
│   └── regionNames.ts       # 地域名の翻訳
├── App.tsx                  # メインアプリケーション
└── main.tsx                 # エントリポイント
```

### 検索アルゴリズム

1. 選択された国をWikidata内で検索
2. SPARQL クエリで以下の条件を満たす料理を抽出:
   - P495 (発祥国) が選択国と一致
   - P31 (分類) が食べ物/料理のサブクラス
3. 取得結果を検証 (有効なラベル、説明、画像)
4. 結果を最大8件まで返す

---

---

# FoodMap - World Food Map

## English

### Overview

FoodMap is a web application that lets you explore representative dishes from countries and regions around the world using an interactive map.

Simply click on a country on the map to instantly see the regional cuisine. It retrieves accurate food information from Wikidata and displays dish names, descriptions, and images.

### Features

- **Interactive Map**: Intuitive world map powered by Leaflet
- **Wikidata-based Data**: Reliable, structured data source
- **Multilingual Support**: UI and dish information in Japanese and English
- **Fast Caching**: Optimized repeated searches using localStorage
- **Responsive Design**: Works on mobile devices

### Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Map**: Leaflet + react-leaflet
- **Data Fetching**: axios + Wikidata SPARQL API
- **Localization**: react-i18next
- **Caching**: localStorage

### Setup

```bash
# Clone the repository
git clone https://github.com/your-repo/foodmap.git
cd foodmap

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage

1. Open the web app
2. Click on a country on the map
3. The food list for that country appears in the right panel
4. Toggle between Japanese and English using the language button

### Caching Specification

- Search results are stored in localStorage for 7 days
- When selecting the same country again, data is retrieved from cache
- In-memory caching consolidates simultaneous requests into one

### Project Structure

```
src/
├── components/
│   ├── WorldMap.tsx        # Map component
│   ├── FoodPanel.tsx       # Food panel
│   └── DishCard.tsx        # Dish card component
├── services/
│   ├── dishSearchService.ts # Wikidata search logic
│   └── cacheService.ts      # Cache management
├── types/
│   └── food.ts              # Type definitions
├── i18n/
│   ├── config.ts            # i18n configuration
│   ├── locales/
│   │   ├── en.json          # English translations
│   │   └── ja.json          # Japanese translations
│   └── regionNames.ts       # Region name translations
├── App.tsx                  # Main application
└── main.tsx                 # Entry point
```

### Search Algorithm

1. Search for the selected country in Wikidata
2. Extract dishes using SPARQL queries with these criteria:
   - P495 (country of origin) matches the selected country
   - P31 (instance of) is a subclass of food/dish
3. Validate results (valid labels, descriptions, images)
4. Return up to 8 results

