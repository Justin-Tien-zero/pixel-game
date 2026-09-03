import { useState, useEffect } from 'react';

// 環境變數
const GAS_URL = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL || '';
const PASS_THRESHOLD = parseInt(import.meta.env.VITE_PASS_THRESHOLD || '3', 10);
const QUESTION_COUNT = parseInt(import.meta.env.VITE_QUESTION_COUNT || '5', 10);

type GameState = 'START' | 'LOADING' | 'PLAYING' | 'RESULT';

interface Question {
    id: string;
    q: string;
    options: { A: string; B: string; C: string; D: string; };
}

interface AnswerRecord {
    id: string;
    myAnswer: string;
}

interface ReviewRecord {
    id: string;
    q: string;
    myAnswer: string;
    correctAnswer: string;
    correctAnswerText?: string; // 加入這行
    isCorrect: boolean;
}

export default function App() {
    const [gameState, setGameState] = useState<GameState>('START');
    const [userId, setUserId] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswerRecord[]>([]);
    const [errorMsg, setErrorMsg] = useState('');

    // Game results from backend
    const [score, setScore] = useState(0);
    const [passed, setPassed] = useState(false);
    const [reviewData, setReviewData] = useState<ReviewRecord[]>([]);
    const [showReview, setShowReview] = useState(false);

    // DiceBear Seeds for Bosses
    const [bossSeeds, setBossSeeds] = useState<string[]>([]);

    // Feedback (Correct/Wrong visually)
    const [feedback, setFeedback] = useState<string | null>(null);

    // Preload Boss Images
    useEffect(() => {
        // Generate 100 random seeds for Bosses
        const seeds = Array.from({ length: 100 }, () => Math.random().toString(36).substring(2, 8));
        setBossSeeds(seeds);

        // Preload first few images
        seeds.slice(0, Math.max(QUESTION_COUNT, 5)).forEach(seed => {
            const img = new Image();
            img.src = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${seed}`;
        });
    }, []);

    const startGame = async () => {
        if (!userId.trim()) {
            setErrorMsg('請輸入您的 ID！');
            return;
        }
        if (!GAS_URL) {
            setErrorMsg('請設定 GOOGLE_APP_SCRIPT_URL 環境變數！');
            return;
        }

        setErrorMsg('');
        setGameState('LOADING');

        try {
            // Fetch questions
            const res = await fetch(`${GAS_URL}?count=${QUESTION_COUNT}`);
            const result = await res.json();

            if (result.success && result.data.length > 0) {
                setQuestions(result.data);
                setCurrentQIndex(0);
                setAnswers([]);
                setGameState('PLAYING');
            } else {
                setErrorMsg('無法載入題目，請稍後再試。');
                setGameState('START');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('網路連線錯誤，請檢查 GAS_URL。');
            setGameState('START');
        }
    };

    const handleAnswer = (optionKey: string) => {
        if (feedback !== null) return; // Prevent multiple clicks

        const currentQ = questions[currentQIndex];
        const newAnswers = [...answers, { id: currentQ.id, myAnswer: optionKey }];
        setAnswers(newAnswers);

        // Provide a small visual feedback delay before next question
        // Actually, since we don't know the correct answer (it's in backend),
        // we can just show "已紀錄!" or proceed immediately.
        // The spec says: "答錯回饋" - wait, the answers aren't in frontend!
        // Since answers aren't fetched, we CANNOT know if it's correct instantly unless we call GAS per question.
        // Instead, we will just proceed to the next question.

        setFeedback('OK!');
        setTimeout(() => {
            setFeedback(null);
            if (currentQIndex + 1 < questions.length) {
                setCurrentQIndex(currentQIndex + 1);
            } else {
                submitGame(newAnswers);
            }
        }, 300);
    };

    const submitGame = async (finalAnswers: AnswerRecord[]) => {
        setGameState('LOADING');
        try {
            const res = await fetch(GAS_URL, {
                method: 'POST',
                // Use text/plain to avoid CORS preflight, wait till GAS parses it
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    userId,
                    threshold: PASS_THRESHOLD,
                    answers: finalAnswers
                })
            });

            const result = await res.json();

            if (result.success) {
                setScore(result.score);
                setPassed(result.passed);
                setReviewData(result.reviewData || []);
                setShowReview(false);
                setGameState('RESULT');
            } else {
                setErrorMsg('成績上傳失敗：' + result.error);
                setGameState('START');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('上傳成績時發生錯誤。');
            setGameState('START');
        }
    };

    const resetGame = () => {
        setGameState('START');
        setUserId('');
        setScore(0);
        setPassed(false);
        setAnswers([]);
        setReviewData([]);
        setShowReview(false);
        setCurrentQIndex(0);
        setErrorMsg('');
    };

    return (
        <div>
            {gameState === 'START' && (
                <div className="pixel-panel">
                    <h1>像素闖關問答</h1>
                    <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                        進入迷宮前，請留下你的名字
                    </p>
                    <input
                        type="text"
                        className="pixel-input"
                        placeholder="輸入 ID"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && startGame()}
                    />
                    {errorMsg && <div className="feedback">{errorMsg}</div>}
                    <button className="pixel-btn" style={{ textAlign: 'center' }} onClick={startGame}>Start Game</button>
                </div>
            )}

            {gameState === 'LOADING' && (
                <div className="pixel-panel">
                    <div className="loader">連線中... LOADING...</div>
                </div>
            )}

            {gameState === 'PLAYING' && questions.length > 0 && (
                <div className="pixel-panel">
                    <div className="status-bar">
                        <span>ID: {userId}</span>
                        <span>關卡: {currentQIndex + 1} / {questions.length}</span>
                    </div>

                    <div className="boss-container">
                        <img
                            className="boss-img"
                            src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${bossSeeds[currentQIndex % bossSeeds.length]}`}
                            alt="Boss"
                        />
                        <h3 style={{ margin: '10px 0 0 0', color: '#fff' }}>關主 #{currentQIndex + 1}</h3>
                    </div>

                    <h2 style={{ fontSize: '1.2rem', textAlign: 'left', lineHeight: '1.5' }}>{questions[currentQIndex].q}</h2>

                    {feedback && <div className="feedback" style={{ color: '#4caf50' }}>{feedback}</div>}

                    <div style={{ marginTop: '20px' }}>
                        {Object.entries(questions[currentQIndex].options).map(([key, val]) => (
                            val ? (
                                <button
                                    key={key}
                                    className="pixel-btn"
                                    disabled={feedback !== null}
                                    onClick={() => handleAnswer(key)}
                                >
                                    {key}. {val}
                                </button>
                            ) : null
                        ))}
                    </div>
                </div>
            )}

            {gameState === 'RESULT' && (
                <div className="pixel-panel" style={{ textAlign: 'center' }}>
                    {!showReview ? (
                        <>
                            <h1>{passed ? 'MISSION CLEARED!' : 'GAME OVER'}</h1>
                            <div className="boss-container" style={{ borderColor: passed ? 'var(--btn-bg)' : 'var(--danger)' }}>
                                <img
                                    className="boss-img"
                                    src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${passed ? 'win' : 'lose'}-${Math.random()}`}
                                    alt="Result Boss"
                                />
                            </div>
                            <h2 style={{ color: '#fff' }}>你的分數：{score} / {questions.length}</h2>
                            <p style={{ fontSize: '1.2rem', color: passed ? 'var(--btn-bg)' : 'var(--danger)' }}>
                                {passed ? '恭喜通關！' : `需要 ${PASS_THRESHOLD} 分才能通關，再試一次吧！`}
                            </p>
                            {reviewData.length > 0 && (
                                <button className="pixel-btn" style={{ textAlign: 'center', marginTop: '20px', backgroundColor: '#555', borderColor: '#888' }} onClick={() => setShowReview(true)}>檢視答題結果 (REVIEW)</button>
                            )}
                            <button className="pixel-btn" style={{ textAlign: 'center', marginTop: '10px' }} onClick={resetGame}>再玩一次</button>
                        </>
                    ) : (
                        <>
                            <h1>REVIEW</h1>
                            <div className="review-list">
                                {reviewData.map((item, idx) => (
                                    <div key={idx} className="review-item">
                                        <div className="review-q">Q{idx + 1}: {item.q}</div>
                                        <div className="review-ans">
                                            你的答案：<span className={item.isCorrect ? 'correct-text' : 'wrong-text'}>{item.myAnswer}</span>
                                            {item.isCorrect ? ' ✔' : ' ✘'}
                                        </div>
                                        {!item.isCorrect && (
                                            <div className="review-ans">
                                                正確答案：<span className="correct-text">{item.correctAnswer}{item.correctAnswerText ? `(${item.correctAnswerText})` : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button className="pixel-btn" style={{ textAlign: 'center', marginTop: '20px' }} onClick={() => setShowReview(false)}>返回結算</button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
