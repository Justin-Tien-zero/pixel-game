const QUESTIONS_SHEET = "題目";
const ANSWERS_SHEET = "回答";

function doGet(e) {
  const count = parseInt(e.parameter?.count || 5);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(QUESTIONS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  // Exclude header (row 1)
  const questions = data.slice(1);
  
  // Shuffle and pick N
  const shuffled = questions.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);
  
  // Map to objects without answer
  const result = selected.map(row => ({
    id: row[0],
    q: row[1],
    options: { A: row[2], B: row[3], C: row[4], D: row[5] }
  }));
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const { userId, threshold } = params;
    const answers = params.answers || [];
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const qSheet = ss.getSheetByName(QUESTIONS_SHEET);
    const qData = qSheet.getDataRange().getValues();
    
    // 把選項內容也存進 Map，方便後續抓取
    const answerMap = {};
    for (let i = 1; i < qData.length; i++) {
        answerMap[String(qData[i][0])] = {
            ans: String(qData[i][6]), // 解答 (A/B/C/D)
            A: String(qData[i][2]),
            B: String(qData[i][3]),
            C: String(qData[i][4]),
            D: String(qData[i][5])
        };
    }
    
    let calculatedScore = 0;
    const reviewData = []; 
    answers.forEach(ans => {
        const qInfo = answerMap[String(ans.id)] || { ans: '', A:'', B:'', C:'', D:'' };
        const correctAns = qInfo.ans;
        const correctAnsText = qInfo[correctAns] || ""; // 抓取正確答案的實際文字
        const isCorrect = correctAns === String(ans.myAnswer);
        
        if (isCorrect) {
            calculatedScore++;
        }
        
        // 找題目名稱
        const qRow = qData.find(row => String(row[0]) === String(ans.id));
        const qText = qRow ? qRow[1] : "未知題目";
        reviewData.push({
            id: ans.id,
            q: qText,
            myAnswer: ans.myAnswer,
            correctAnswer: correctAns,
            correctAnswerText: correctAnsText, // 新增這行傳給前端
            isCorrect: isCorrect
        });
    });
    
    const isPassed = calculatedScore >= threshold;
    const aSheet = ss.getSheetByName(ANSWERS_SHEET);
    const now = new Date();
    
    // 【修改 1】：不管 ID 是否存在，一律當作新測驗新增一行 (Append)
    // 建議去 Google Sheets 把「回答」工作表的標題改為：ID | 本次得分 | 是否通過 | 測驗時間
    aSheet.appendRow([
        userId, 
        calculatedScore,
        isPassed ? "通過" : "未通過",
        now
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        score: calculatedScore, 
        passed: isPassed,
        reviewData: reviewData
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
