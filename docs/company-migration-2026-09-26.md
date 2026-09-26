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

遷移前新版已通過 320／390／768／1024／1440 px 合成資料測試，涵蓋分類、公開篩選、搜尋、三種排序、空白及錯誤狀態、相簿與返回流程。公司 Pages 發布後須再核對實際檔案、公開相簿、相片牆、三種畫面寬度及舊址轉向；不以本機測試代替公開站驗證。

## 回復

如需回復前台，針對相關 commit 作 revert、正常推送並驗證 Pages，不 force push。託管位置無須為視覺回復而反覆轉移；網址問題先修正公司 Pages 與轉址入口。Google 相簿資料及分享不參與 Git 回復。網店如需回復導覽，只修改同一 `GALLERY_URL` 設定，不回復整張 Sheet。
