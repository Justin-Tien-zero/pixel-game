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
    
    // params = { userId: "user123", threshold: 3, answers: [{id: 1, myAnswer: "A"}, ...] }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const qSheet = ss.getSheetByName(QUESTIONS_SHEET);
    const qData = qSheet.getDataRange().getValues();
    
    // Map id to answer
    const answerMap = {};
    for (let i = 1; i < qData.length; i++) {
        answerMap[String(qData[i][0])] = String(qData[i][6]); // id -> 解答
    }
    
    let calculatedScore = 0;
    const reviewData = []; // Store detailed review info

    answers.forEach(ans => {
        const correctAns = answerMap[String(ans.id)];
        const isCorrect = correctAns === String(ans.myAnswer);
        
        if (isCorrect) {
            calculatedScore++;
        }
        
        // Find question text
        const qRow = qData.find(row => String(row[0]) === String(ans.id));
        const qText = qRow ? qRow[1] : "未知題目";

        reviewData.push({
            id: ans.id,
            q: qText,
            myAnswer: ans.myAnswer,
            correctAnswer: correctAns,
            isCorrect: isCorrect
        });
    });
    
    const isPassed = calculatedScore >= threshold;
    
    const aSheet = ss.getSheetByName(ANSWERS_SHEET);
    const aData = aSheet.getDataRange().getValues();
    
    let userRowIdx = -1;
    for (let i = 1; i < aData.length; i++) {
        if (String(aData[i][0]) === String(userId)) {
            userRowIdx = i + 1;
            break;
        }
    }
    
    const now = new Date();
    
    if (userRowIdx > -1) {
        // Update existing ID
        // row schema: ID, 闖關次數, 總分, 最高分, 第一次通關分數, 花了幾次通關, 最近遊玩時間
        const currentDataRow = aData[userRowIdx - 1];
        const playCount = (parseInt(currentDataRow[1]) || 0) + 1;
        const totalScore = (parseInt(currentDataRow[2]) || 0) + calculatedScore;
        const highestScore = Math.max((parseInt(currentDataRow[3]) || 0), calculatedScore);
        
        let firstClearScore = currentDataRow[4];
        let attemptsToClear = currentDataRow[5];
        
        if (isPassed && (!firstClearScore || firstClearScore === "")) {
            firstClearScore = calculatedScore;
            attemptsToClear = playCount;
        }
        
        aSheet.getRange(userRowIdx, 2, 1, 6).setValues([[
            playCount, totalScore, highestScore, firstClearScore, attemptsToClear, now
        ]]);
        
    } else {
        // New ID
        aSheet.appendRow([
            userId, 
            1, // play count
            calculatedScore, // total score
            calculatedScore, // highest score
            isPassed ? calculatedScore : "", // first clear score
            isPassed ? 1 : "", // attempts to clear
            now // last played
        ]);
    }
    
    // Important: for CORS when returning JSONP/JSON to browser
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
