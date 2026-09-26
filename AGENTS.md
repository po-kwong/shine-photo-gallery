# AGENTS.md

## 2026-09-26 公司託管與網店風格

- 正式原始碼：[po-kwong/shine-photo-gallery](https://github.com/po-kwong/shine-photo-gallery)，保持 public 並保留原 Git 歷史。
- 正式網站：https://po-kwong.github.io/shine-photo-gallery/
- 網店「光影足跡 ↗」預設連到 `?category=焦點活動`，以新分頁開啟；相片集可返回 [網尚店](https://po-kwong.github.io/shine-online-shop-site/)。
- 與網店共用奶白底、紫黃配色、字體及圓角按鈕；網站名稱「尚片集」保留。
- 舊個人 Pages 由獨立的轉址入口保留查詢字串及 hash，涵蓋 category、album、from 舊書籤。舊個人 repo 只作轉址；往後原始碼一律推送公司 repo。
- `config.js`、Apps Script API、Albums、Drive 相片來源和分享權限不因遷移而變更。不要另建後台或修改正式相簿資料。
- 詳見 [部署流程](docs/deployment.md) 及 [本次更新記錄](docs/company-migration-2026-09-26.md)。

## 專案名稱

尚回憶．尚片集（School Photo Gallery）

## 專案定位

本專案是一個以 GitHub Pages 發佈的公開學校活動相簿網站，用作展示「尚計劃」相關活動相片集。網站前台由純 HTML、CSS、JavaScript 組成，後台資料由 Google Apps Script 以公開 read-only API 方式提供，資料來源為 Google Sheet 及 Google Drive。

本專案目前不是 Web App 後台系統，也不再使用 Netlify。

## 目前正式架構

```text
GitHub Pages
  index.html / config.js / assets/styles.css / assets/app.js
        ↓ JSONP
Google Apps Script Web App
        ↓
Google Sheet：尚計劃活動相簿資料庫 / Albums
        ↓
Google Drive：每個活動相簿對應一個資料夾
```

## 重要原則

1. 不使用 Netlify。
2. 不使用 Netlify Functions。
3. 不在前台保存 API_SECRET、密碼、token 或任何私人金鑰。
4. 前台只可讀取公開 read-only API。
5. 所有相片必須來自已審核、適合公開展示的 Google Drive 資料夾。
6. 網頁設計方向應為專業攝影相簿 / portfolio 風格，而不是後台 dashboard 或一般 Web App 風格。
7. 一般修改版面、顏色、卡片設計、互動篩選器時，只修改 GitHub 的 `index.html` / `config.js` / `assets/styles.css` / `assets/app.js`。
8. 修改 Google Sheet 欄名、欄位邏輯、讀取 Drive 方法時，才修改 `apps-script/Code.gs`，並提醒 Jason 需要重新部署 Apps Script。

## 主要檔案

| 檔案 | 用途 |
|---|---|
| `index.html` | GitHub Pages 前台 HTML 結構及靜態資源載入 |
| `config.js` | 網站設定、學校名稱、分類、Apps Script API URL |
| `assets/styles.css` | 前台視覺設計、版面、responsive 樣式 |
| `assets/app.js` | JSONP 讀取、相簿顯示邏輯、分類篩選、搜尋、排序 |
| `apps-script/Code.gs` | Apps Script 後台 read-only API 程式碼 |
| `README.md` | 專案簡介 |
| `docs/architecture.md` | 系統架構說明 |
| `docs/data-model.md` | Google Sheet 欄位說明 |
| `docs/deployment.md` | 部署流程 |
| `docs/maintenance.md` | 日常維護及新增相簿流程 |
| `docs/privacy-and-safety.md` | 私隱及安全守則 |

## GitHub Pages 前台要求

- 必須保持純靜態網站，可直接由 GitHub Pages 發佈。
- 不應引入 build step、React、Vite、Next.js 或複雜框架，除非 Jason 明確要求。
- 頁面應保持專業、乾淨、有設計感、適合公開展示學生活動成果。
- 不要使用大量 emoji 作為主要 UI 元素。
- 相簿詳情頁不要顯示每一張相片的檔名及日期，只需以相片牆形式展示。
- 日期顯示以 `YYYY-MM-DD` 為標準。
- 前台以 Google Sheet 欄 D `分類` 作唯一分流。
- `分類 = 焦點活動` 的公開相簿顯示在首頁焦點區；第一個作 headline feature，其餘作 focus card。
- `分類 = 活動回顧` 的公開相簿顯示在活動回顧頁，並顯示搜尋及排序工具。
- 舊有 `精選活動` 欄不再用作前台顯示判斷。

## Google Sheet 規則

工作頁：`Albums`

現時中文欄名：

```text
相簿代號
相簿名稱
資料夾ID
分類
活動日期
相簿簡介
封面圖片ID
公開顯示
內部備註
```

欄位規則：

- `相簿代號`：唯一 ID，例如 `BPK-01`。
- `相簿名稱`：網站顯示標題。
- `資料夾ID`：Google Drive folder ID，不是 Windows 本機路徑。
- `分類`：只填 `焦點活動` 或 `活動回顧`，並必須與 `config.js` 的 `categories` 配合。
- `活動日期`：建議用 `YYYY-MM-DD`。
- `相簿簡介`：首頁卡片簡介。
- `封面圖片ID`：可留空，留空時使用該 Drive folder 第一張圖。
- `公開顯示`：checkbox，TRUE 才顯示。
- `精選活動`：舊欄位，前台不再使用；如仍存在於 Sheet，只作相容資料。
- `內部備註`：只供管理，不應在前台顯示。

## Apps Script 規則

- `apps-script/Code.gs` 是參考碼，需要手動貼到 Google Apps Script 專案。
- Apps Script 更新後必須在現有 Web App deployment 中新增版本並部署。
- 若沿用同一個 deployment，GitHub `config.js` 不需要改 API URL。
- 若新增部署產生新 `/exec` URL，必須更新 `config.js` 的 `apiBaseUrl`。

## 禁止事項

- 不要新增 Netlify 設定或 Netlify Functions。
- 不要重新加入 `netlify.toml`。
- 不要在 repo 中放大量相片原檔。
- 不要在 `config.js` 放任何 secret。
- 不要把未審核學生相片資料夾設為公開資料來源。
- 不要將 Apps Script 改成可公開寫入 Google Sheet 或 Drive。

## 修改後測試清單

1. GitHub Pages 首頁可正常載入。
2. 分類篩選器可運作。
3. 搜尋相簿可運作。
4. 排序器可按最新活動、最舊活動、相片最多運作。
5. `分類 = 焦點活動` 且 `公開顯示 = TRUE` 的相簿顯示在首頁焦點區，第一個作 headline feature。
6. `分類 = 活動回顧` 且 `公開顯示 = TRUE` 的相簿顯示在活動回顧頁。
7. 點擊相簿後可進入 `?album=<相簿代號>`。
8. 相簿詳情頁可顯示相片牆，且不顯示每張相片的檔名及日期。
9. 手機版正常。
10. Apps Script 測試 URL 可回傳 `ok: true`。
