# 部署流程

## 正式位置（2026-09-26）

- 維護 repo：`https://github.com/po-kwong/shine-photo-gallery.git`
- 網站：`https://po-kwong.github.io/shine-photo-gallery/`
- 發布分支：`main`；`.github/workflows/static.yml` 經 GitHub Actions 發布。
- 原 personal Pages `https://jasonwongkwanho.github.io/shine-photo-gallery/` 保留為獨立轉址入口，將原 query 及 hash 原樣帶到公司網站。

本機既有 clone 應更新 origin：

```powershell
git remote set-url origin https://github.com/po-kwong/shine-photo-gallery.git
git fetch origin
```

原 repo 已轉移並保留 Git 歷史。為維持舊 Pages 書籤而重建的個人 repo 只有轉址檔案，因此舊 Git remote 不再導向公司原始碼；不可繼續向舊 remote 推送本專案。

這次只遷移 GitHub 前台。Google Apps Script 的 read-only API、Sheet、Drive、公開相簿條件、分享權限及 `config.js` 均沿用，不需因更換 Pages 主機而重新部署 Apps Script。網店正式導覽網址由原設定表的 `GALLERY_URL` 維護。

## GitHub Pages 部署

本專案以前台靜態網站方式部署至 GitHub Pages。

### 前台更新流程

當修改以下檔案時，GitHub Pages 會自動重新部署：

- `index.html`
- `config.js`
- `assets/styles.css`
- `assets/app.js`
- `README.md`
- `docs/*`

一般流程：

```text
修改 GitHub 檔案
        ↓
commit 到 main branch
        ↓
GitHub Actions / Pages 自動部署
        ↓
等待 1 至 3 分鐘
        ↓
重新整理網站
```

如瀏覽器仍看到舊版，請使用：

```text
Ctrl + F5
```

或使用無痕模式測試。

## Apps Script 部署

`apps-script/Code.gs` 只是 GitHub 中保存的參考版本。修改後需要手動貼到 Google Apps Script 專案。

### Apps Script 更新流程

```text
GitHub → apps-script/Code.gs
        ↓
複製全部內容
        ↓
貼到 Google Apps Script 的 Code.gs
        ↓
Save
        ↓
Run authorizeSetup（第一次會要求授權 Google Sheets 及 Google Drive 讀取權限）
        ↓
Deploy → Manage deployments → Edit
        ↓
Web app 設定 Execute as: Me / 執行身分：我
        ↓
Version 選 New version
        ↓
Deploy
```

## 保持 Apps Script URL 不變

如不想更改 GitHub `config.js` 的 API URL，請使用：

```text
Deploy → Manage deployments → Edit existing deployment → New version → Deploy
```

不要使用 `New deployment`，因為新部署通常會產生新的 `/exec` URL。

## 如果 Apps Script URL 改變

如果新的部署產生了新的 `/exec` URL，必須更新：

```text
config.js → apiBaseUrl
```

例如：

```javascript
apiBaseUrl: "https://script.google.com/macros/s/NEW_DEPLOYMENT_ID/exec"
```

## 測試網址

### 測試相簿清單

```text
<Apps Script URL>?action=albums
```

### 測試 JSONP

```text
<Apps Script URL>?action=albums&callback=testCallback
```

成功時應見到：

```javascript
testCallback({ ok: true, albums: [...] });
```

## 常見錯誤

| 錯誤 | 原因 | 處理 |
|---|---|---|
| `Missing ALBUM_SHEET_ID` | Apps Script Properties 未設定 | 加入 `ALBUM_SHEET_ID` |
| `Cannot find sheet` | 工作頁名稱不正確 | 檢查 `ALBUM_SHEET_NAME` 是否為 `Albums` |
| `Missing column` | Sheet 欄名與 Code.gs 不一致 | 檢查中文欄名 |
| `DriveApp.getFolderById` 權限不足 | Apps Script 尚未授權 Google Drive 讀取權限、未部署已授權版本，或 Web App 不是以擁有者身份執行 | 在 Apps Script editor 執行 `authorizeSetup` 並完成授權，確認 Web App `Execute as` 為 `Me`，再用現有 Web App 建立 New version 後 Deploy |
| GitHub Pages 顯示舊版 | cache 未更新 | Ctrl + F5 / 無痕模式 |
| Apps Script JSONP 載入失敗 | Apps Script 未部署 JSONP 版本 | 重新部署現有 Web App |
