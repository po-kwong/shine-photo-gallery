# 尚回憶．尚片集

這是一個以 **GitHub Pages** 發佈的公開學校活動相簿網站，用作展示「尚計劃」相關活動、工作體驗、校園服務及學生成果相片。

網站採用純靜態前台，並透過 **Google Apps Script read-only API** 讀取 Google Sheet 相簿資料及 Google Drive 相片資料夾。

## 正式入口

- [光影足跡・尚片集](https://po-kwong.github.io/shine-photo-gallery/?category=%E7%84%A6%E9%BB%9E%E6%B4%BB%E5%8B%95)
- [公司原始碼](https://github.com/po-kwong/shine-photo-gallery)
- [返回網尚店](https://po-kwong.github.io/shine-online-shop-site/)

2026-09-26 已統一網店的奶白、紫黃配色及導覽風格，並將原公開 repo 轉入 `po-kwong`，保留 Git 歷史。舊個人 Pages 為轉址入口，保留相簿／分類書籤。相片及相簿仍讀取原有 Google 資料，不需搬移相片或重新部署 Apps Script。詳見 [遷移記錄](docs/company-migration-2026-09-26.md)。

## 目前架構

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

## 主要檔案

| 檔案 | 用途 |
|---|---|
| `index.html` | 前台 HTML 結構及靜態資源載入 |
| `config.js` | 學校名稱、分類、Apps Script API URL 等設定 |
| `assets/styles.css` | 前台視覺設計、版面、responsive 樣式 |
| `assets/app.js` | JSONP 讀取、相簿顯示、分類篩選、搜尋、排序及相片牆 |
| `apps-script/Code.gs` | Apps Script 後台 read-only API 參考碼 |
| `AGENTS.md` | AI / Codex 協作指引 |
| `docs/architecture.md` | 系統架構說明 |
| `docs/data-model.md` | Google Sheet 欄位說明 |
| `docs/deployment.md` | 部署及更新流程 |
| `docs/maintenance.md` | 新增相簿及日常維護流程 |
| `docs/privacy-and-safety.md` | 私隱及安全守則 |

## 網站資料來源

Google Sheet 工作頁：`Albums`

欄位採用中文欄名：

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

前台目前以欄 D `分類` 作唯一分流：

- `焦點活動`：顯示於首頁焦點區，第一個相簿以大型 headline card 顯示，其餘以 focus card 顯示。
- `活動回顧`：顯示於活動回顧頁，並提供搜尋及排序。

舊有 `精選活動` 欄不再用作前台顯示判斷；如仍保留在 Sheet，Apps Script 也只會把它當作相容欄位讀取。

## 日常新增相簿流程

1. 在 Google Drive 建立一個活動相片資料夾。
2. 將已審核、適合公開展示的相片放入該資料夾。
3. 複製該 Google Drive folder ID。
4. 在 Google Sheet `Albums` 新增一行。
5. 填寫相簿名稱、分類、活動日期、相簿簡介、資料夾 ID。
6. `分類` 只填 `焦點活動` 或 `活動回顧`。
7. 勾選 `公開顯示`。
8. 重新整理 GitHub Pages 網站。

## 注意事項

- 本專案目前不使用 Netlify。
- 不應在前台放置任何 API secret、password 或 token。
- 相片應存放在 Google Drive，不應大量放入 GitHub repo。
- 如更新 Apps Script 程式碼，必須在 Apps Script 內手動貼上並重新部署現有 Web App。
