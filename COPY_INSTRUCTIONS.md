# 尚片集：目前維護方式

正式專案已移至 [po-kwong/shine-photo-gallery](https://github.com/po-kwong/shine-photo-gallery)。請在這個公司 repo 更新；舊個人 repo 只提供轉址。

## 前台修改

1. 先閱讀 `AGENTS.md`，檢查工作分支及未提交修改。
2. 按需要修改 `index.html`、`assets/styles.css` 或 `assets/app.js`。沿用奶白底、紫黃配色與網店導覽；保留「尚片集」及「光影足跡」。
3. `config.js` 保存現有 API 及分類設定；只改版面時不用替換它。
4. 測試焦點活動、活動回顧、搜尋、三種排序、相簿相片牆、返回網店、鍵盤及手機版。
5. 確認 Git remote 為公司 repo，提交已驗證的指定檔案並推送 `main`，等待 Pages 成功。
6. 在 [公司正式網站](https://po-kwong.github.io/shine-photo-gallery/) 核對內容及實際公開相簿。

新增相簿請按 [日常維護](docs/maintenance.md) 更新原有 `Albums`，不是把相片原檔加入 GitHub。

## 保留的資料規則

- `分類` 只填「焦點活動」或「活動回顧」，為唯一分流欄。
- `公開顯示` 為 TRUE 才展示。
- 焦點活動第一個相簿作主打，其餘作卡片；活動回顧提供搜尋及排序。
- 舊 `精選活動` 欄不再參與前台判斷；不要為這次前台更新刪改 Sheet 欄位。
- 相片牆不顯示每張相片的檔名及日期。
- 版面或 GitHub 託管變更不需要重新部署 Google Apps Script。若日後確需修改 API，先按 [部署流程](docs/deployment.md) 處理。

舊 V2／V3 複製說明已由此流程取代，歷史內容仍可在 Git 記錄查閱。
