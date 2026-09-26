# 公司相片集與網店整合（2026-09-26）

Jason 批准將 `shine-photo-gallery` 轉入 `po-kwong`，維持公開並同步更新本專案資料。先前提及 `shine-online-shop-specific-products-pages` 為口誤，款式頁專案不在本次變更範圍。

## 變更

- 原 repo ID `1242635897` 及完整 Git 歷史保留，公司 repo 為 `po-kwong/shine-photo-gallery`。
- 正式網站改為 `https://po-kwong.github.io/shine-photo-gallery/`，焦點活動網址保留原 `category` 參數。
- 原前台設計更新 commit `3ece3886bdbe169b85095f5aa5a5293b8655f302` 沿用；奶白、紫黃、圓角及導覽與網店一致。
- 本機 origin、README、AGENTS、複製／部署指引同步到公司位置。
- 舊個人 Pages 由獨立公開轉址 repo 保留舊連結，query／hash 原樣帶往公司網址。由於重建舊 repo，舊 Git remote 將指向轉址 repo；維護原始碼必須用公司 remote。
- 網店「光影足跡 ↗」使用公司相片集網址，由原 Google Sheet `WS_網站設定` 的 `GALLERY_URL` 管理。

## 保留與驗證邊界

`config.js`、Apps Script 參考碼、API URL、Albums、Drive 及分享權限未變。沒有搬移學生相片、修改相簿資料或另建 Google 後台。

遷移前新版已通過 320／390／768／1024／1440 px 合成資料測試，涵蓋分類、公開篩選、搜尋、三種排序、空白及錯誤狀態、相簿與返回流程。公司 Pages 發布後已另作正式站驗證，結果如下。

## 回復

如需回復前台，針對相關 commit 作 revert、正常推送並驗證 Pages，不 force push。託管位置無須為視覺回復而反覆轉移；網址問題先修正公司 Pages 與轉址入口。Google 相簿資料及分享不參與 Git 回復。網店如需回復導覽，只修改同一 `GALLERY_URL` 設定，不回復整張 Sheet。

## 正式站驗證結果

- 公司 repo ID 與遷移前相同；`config.js`、Apps Script 參考碼及三個前台檔案未因遷移改動。公開 HTML、CSS、JS、config 與 Git blob 逐一相同（本機部分檔案只存在 CRLF 換行差別）。
- 公司 [Pages 工作流程](https://github.com/po-kwong/shine-photo-gallery/actions/runs/36218239170) 成功；全新匿名 Chrome 於 1440／768／390 px 正常，沒有橫向溢出或 pageerror。真實 API 顯示 1 個焦點相簿、11 張相片；活動回顧目前 0 個，非空搜尋／排序已由前述合成案例驗證。
- 舊址 [Pages 工作流程](https://github.com/jasonwongkwanho/shine-photo-gallery/actions/runs/36218293511) 成功。舊首頁、焦點分類及 `album=BPK-01` 書籤實測皆到達公司頁面，`from` 與 `#photos` 保留並成功載入內容。轉址 repo 只有 `index.html`、`404.html`、`.nojekyll`、`README.md`。
- 網店原設定表 `WS_網站設定!B33` 已由個人網址改為公司網址，文字格式及背景保留。正式第 57 版三處光影足跡連結及手機新分頁流程通過；相片集能從網店開啟。
- 網店仍使用原 Google 部署第 57 版，提交保持開放。正式 HEAD 與不可變第 57 版一致，臨時管理碼已移除；本次連結變更沒有重新部署 Google。網店本機預設值及生成產物已同步，留待日後正常 source 發布。
- GitHub 專案說明已更新為 GitHub Pages + read-only Apps Script，移除舊 Netlify 描述。

沒有提交正式測試訂單或發通知。iPhone Safari 實機未測；自動化證據及截圖保留於網店專案 gitignore 的 `tests/results/gallery-transfer-20260926/`。
