# 像素風闖關問答遊戲 (Pixel Art Quiz Game)

這是一款使用 React + Vite 開發，並結合 Google Apps Script (GAS) 與 Google Sheets 作為輕量級後端資料庫的 2000 年代復古街機像素風問答遊戲。

本專案支援自動從 Google Sheets 隨機讀取題目，並於玩家通關後將成績結算寫回試算表，適合用於活動闖關、教育訓練測驗等情境

---

## 遊戲特色
- 👾 **復古像素風格**：使用 CRT 掃描線特效、粗框按鈕以及 `DotGothic16` 中文點陣字體。
- 🤖 **動態關主生成**：串接 `DiceBear API`，讓每一關都自動產生獨一無二的像素風關主頭像。
- 📊 **無伺服器架構**：完全以 Google Sheets 作為題庫與填答紀錄的資料庫，零後端維護成本。
- 📝 **作答檢視 (Review)**：結算畫面提供詳細的逐題檢視清單，精準標示玩家作答與正確解答。

---

## 🛠 系統需求與開發環境
- Node.js (建議 v18以上)
- 具備 Google 帳號 (用於設定 Google Sheets 與 Google Apps Script)

---

## 🚀 完整部署與安裝教學

整個專案部署分為三個主要部分：**Google Sheets 配置**、**Google Apps Script (GAS) 部署** 與 **前端專案安裝**。

### 第一部分：Google Sheets 配置 (資料庫)
這份試算表將作為遊戲的題庫來源與成績儲存地。

1. **建立新的 Google 試算表 (Google Sheets)**。
2. **建立「題目」工作表**：
   - 更改左下角的第一個工作表名稱為 `題目` (必須完全一致，不可有空白)。
   - 在第一列建立標題列（格式如下）：
     - A欄：`題號`
     - B欄：`題目`
     - C欄：`A` (選項A)
     - D欄：`B` (選項B)
     - E欄：`C` (選項C)
     - F欄：`D` (選項D)
     - G欄：`解答` (請填入選項代號，如：`A`)
   - 從第二列開始填寫您的題目與實際選項內容。
3. **建立「回答」工作表**：
   - 點擊左下角「+」新增一個工作表，並命名為 `回答`。
   - 系統會在玩家通關後，自動依照玩家的輸入 ID 更新闖關次數、總分、是否通過等欄位。（可選填標題，系統會自動將資料寫下）

### 第二部分：Google Apps Script (GAS) 部署
GAS 將作為前端與 Google Sheets 之間的 API 橋樑。

1. 在剛才配置好的 Google 試算表中，點擊上方選單的 **「擴充功能」 -> 「Apps Script」**。
2. 將開啟的編輯器中預設的 `程式碼.gs` 的內容清空。
3. 複製本專案資料夾內 `gas/Code.gs` 的所有程式碼，貼上至編輯器中並**儲存 (Ctrl+S)**。
4. **部署為網頁應用程式**：
   - 點擊右上角的 **「部署」 -> 「新增部署作業」**。
   - 點擊左側齒輪圖示 ⚙ 並選取「**網頁應用程式**」。
   - **設定選項**：
     - 說明：自行填寫 (例如：`Pixel Game API v1`)
     - 執行身分：**我 (您的 Email)**
     - 誰可以存取：**所有人** (非常重要！必須設定為所有人，否則前端無法呼叫 API)
   - 點選 **「部署」**。
   - 部署過程中可能需要授權，請點擊「授予存取權」-> 選擇您的帳號 -> 點擊「進階」-> 點擊「前往『專案名稱』(不安全)」-> 點擊「允許」。
5. **取得網址**：
   - 部署完成後，複製畫面上顯示的 **「網頁應用程式網址 (Web App URL)」**。

> [!IMPORTANT]
> **更新 GAS 程式碼注意事項**：
> 日後若有修改 `gas/Code.gs` 的內容，請在點擊「管理部署作業」後，點擊「編輯 (鉛筆圖示)」，並 **【務必在版本下拉選單選擇「建立新版本 (New version)」】** 後再進行部署，否則對外提供的 API 會一直停留在舊版程式碼。

### 第三部分：前端專案安裝與設定
將前端專案連接到您的 GAS API 並啟動伺服器。

1. **複製專案並安裝套件**：
   在終端機 (Terminal) 中切換至專案根目錄（包含 `package.json` 的地方），執行：
   ```bash
   npm install
   ```

2. **設定環境變數 (.env)**：
   在專案根目錄找到 `.env` 檔案，如果沒有請建立一個，並依照以下格式填寫：
   ```env
   # 替換為你在第二部分取得的 GAS 網頁應用程式網址
   VITE_GOOGLE_APP_SCRIPT_URL=https://script.google.com/macros/s/你的_API_ID/exec

   # 過關門檻 (需要答對幾題才算通關)
   VITE_PASS_THRESHOLD=3

   # 每次遊戲隨機抽取的題目數量
   VITE_QUESTION_COUNT=5
   ```

3. **啟動本機開發伺服器**：
   ```bash
   npm run dev
   ```
4. **開始遊玩**：
   打開終端機提示的網址（預設通常為 `http://localhost:5173/`），即可開始享受像素風的闖關問答遊戲！

### 第四部分：自動部署到 GitHub Pages (線上公開遊玩)
若您想將此遊戲發布到網路上讓所有人都可以玩，本專案已內建全自動的 GitHub Actions 部署腳本。

1. **上傳專案至 GitHub**：
   將此專案推送 (Push) 到您自己的 GitHub 儲存庫 (Repository)。
2. **設定環境變數 (Repository Secrets)**：
   因為部署時無法讀取本機的 `.env`，我們需要將變數存入 GitHub 的安全庫中。
   - 進入您的 GitHub 專案頁面，點擊上方的 **「Settings」 -> 左側選單的「Secrets and variables」 -> 「Actions」**。
   - 點擊綠色按鈕 **「New repository secret」**。
   - 依序建立以下三個 Secret，內容與您 `.env` 中的值相同：
     - `VITE_GOOGLE_APP_SCRIPT_URL`：您從 GAS 取得的 API 網址。
     - `VITE_PASS_THRESHOLD`：例如 `3`。
     - `VITE_QUESTION_COUNT`：例如 `5`。
3. **開啟 GitHub Pages 權限設定**：
   - 到專案的 **「Settings」 -> 左側選單的「Pages」**。
   - 在 **Build and deployment** 下方的 **Source**，請從下拉選單選擇 **「GitHub Actions」**。
4. **觸發自動部署**：
   只要您設定好上述步驟，未來每次推送到 `main` 或 `master` 分支，GitHub Actions 就會自動幫您打包並發布新版本！您也可以到專案的 **「Actions」** 頁籤中手動點擊「Deploy to GitHub Pages」進行發布。

---

## 結構說明
- `vile.config.ts`: Vite 打包與開發伺服器設定。
- `src/App.tsx`: 遊戲主要邏輯、狀態管理與串接 API 實作。
- `src/index.css`: 全站像素風格 (Pixel Art Retro Style) 的樣式。
- `gas/Code.gs`: 部署於 Google Apps Script 的後端伺服器原始碼，負責處理 `doGet` (獲取題目) 與 `doPost` (紀錄成績) 的邏輯。

## 授權與宣告
本專案的關主頭像採用開源的 [DiceBear Pixel Art API](https://www.dicebear.com/) 即時生成。
