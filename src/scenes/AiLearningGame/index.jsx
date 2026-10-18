import React, { useEffect, useRef, useState } from "react";
import { streamTutorText } from "../../services/educationAiService";
import "./AiLearningGame.css";

const QUESTIONS = [
  { expression: "7 + 8", answer: 15, hint: "Try making ten: 7 + 3 + 5!" },
  { expression: "9 + 6", answer: 15, hint: "Make ten with 9 + 1 first." },
  { expression: "12 - 5", answer: 7, hint: "Count backward five steps." },
  { expression: "4 × 3", answer: 12, hint: "Think of four groups of three." },
];
const STORY = [
  { text: "Luna", highlight: true }, { text: " the fox found a " },
  { text: "glowing", highlight: true }, { text: " star in the forest. She was " },
  { text: "curious", highlight: true }, { text: " and followed its light home." },
];
const NAV = [ ["math", "🧮", "Math"], ["english", "📖", "English"], ["backpack", "🎒", "Backpack"], ["quests", "🏆", "Quests"] ];
function MathActivity({ question, answer, setAnswer, submit, hint }) {
  return <section className="lg-panel lg-math" aria-label="Math activity">
    <div className="lg-chip">➕ ARITHMETIC CHALLENGE</div>
    <h2>{question.expression} = ?</h2>
    <div className="lg-answer" aria-live="polite">{answer || "?"}</div>
    <div className="lg-keypad">{[1,2,3,4,5,6,7,8,9,"⌫",0,"✓"].map(key =>
      <button key={key} className={key === "✓" ? "lg-key lg-submit" : "lg-key"} onClick={() => {
        if(key === "✓") submit(); else if(key === "⌫") setAnswer(v => v.slice(0,-1)); else setAnswer(v => (v.length < 4 ? v + String(key) : v));
      }} aria-label={key === "⌫" ? "Backspace" : key === "✓" ? "Submit answer" : String(key)}>{key}</button>)}</div>
    <button className="lg-small-button" onClick={hint}>💡 Hint</button>
  </section>;
}
function EnglishActivity({ isRecording, toggleRecording, completeReading }) {
  return <section className="lg-panel lg-english" aria-label="English reading activity">
    <div className="lg-chip">📚 ENGLISH ADVENTURE</div>
    <h2>The Glowing Star</h2><p className="lg-story">{STORY.map((part,i) => part.highlight ? <mark key={i}>{part.text}</mark> : <React.Fragment key={i}>{part.text}</React.Fragment>)}</p>
    <p className="lg-instruction">Read the story out loud. The highlighted words are your vocabulary!</p>
    <div className={'lg-wave' + (isRecording ? ' active' : '')} aria-hidden="true">{Array.from({length:13},(_,i)=><span key={i} style={{animationDelay:`${i*0.07}s`}} />)}</div>
    <button className="lg-record" onClick={toggleRecording} aria-pressed={isRecording}>{isRecording ? '⏹ Stop practice' : '🎙 Start speaking'}</button>
    <button className="lg-small-button" onClick={completeReading}>⭐ Complete reading</button>
    <p className="lg-disclaimer">Prototype: waveform and recording status are simulated. No audio is captured or assessed.</p>
  </section>;
}
export default function AiLearningGame() {
  const [subject,setSubject] = useState('math');
  const [coins,setCoins] = useState(120);
  const [gems] = useState(15);
  const [xp,setXp] = useState(65);
  const [questionNumber,setQuestionNumber] = useState(0);
  const [answer,setAnswer] = useState('');
  const [tutor,setTutor] = useState('Hi, superstar! Ready for a challenge? 🌟');
  const [streaming,setStreaming] = useState(false);
  const [recording,setRecording] = useState(false);
  const [completed,setCompleted] = useState(0);
  const controller = useRef(null);
  const question = QUESTIONS[questionNumber % QUESTIONS.length];
  useEffect(() => () => controller.current?.abort(), []);
  const talk = async message => {
    controller.current?.abort();
    const ac = new AbortController(); controller.current = ac;
    setTutor(''); setStreaming(true);
    try { await streamTutorText({ message, signal: ac.signal, onChunk: chunk => setTutor(text => text + chunk) }); }
    catch (error) { if(error.name !== 'AbortError') setTutor('Tutor connection unavailable. Try again!'); }
    finally { if(controller.current === ac) setStreaming(false); }
  };
  const reward = message => { setCoins(c=>c+5); setXp(x=>x+10); setCompleted(c=>c+1); talk(message + ' +5 Coins and +10 XP! 🪙'); };
  const submit = () => {
    if(!answer.trim()) { talk('Enter your answer using the keypad!'); return; }
    if(Number(answer) === question.answer) { reward('Awesome job! You got it right!'); setQuestionNumber(q=>q+1); setAnswer(''); }
    else { talk(`Good try! ${question.hint}`); setAnswer(''); }
  };
  const switchTab = next => { controller.current?.abort(); setSubject(next); setRecording(false); setAnswer('');
    const greetings={math:'Math quest activated! Let’s solve some problems! 🧮',english:'English quest activated! Let’s read together! 📚',backpack:'Here are your collected learning rewards! 🎒',quests:'Finish activities to complete your quests! 🏆'};
    talk(greetings[next]);
  };
  return <div className={'learning-game theme-' + subject}>
    <header className="lg-hud"><div className="lg-profile"><div className="lg-avatar" aria-label="Student avatar">🧑‍🚀</div><div className="lg-profile-info"><strong>⭐ Level {Math.floor(xp/100)+5} Explorer</strong><div className="lg-progress" role="progressbar" aria-valuenow={xp%100} aria-valuemin={0} aria-valuemax={100}><div style={{width:`${xp%100}%`}} /></div><small>XP: {xp%100} / 100</small></div></div><div className="lg-wallet"><span>🪙 Coins: <b key={coins} className="lg-coin-pop">{coins}</b></span><span>💎 Gems: {gems}</span></div></header>
    <div className="lg-stage"><aside className="lg-tutor"><div className="lg-mascot" role="img" aria-label="Friendly robot tutor">🤖</div><div className="lg-bubble" aria-live="polite"><strong>AI TUTOR</strong><p>{tutor}{streaming ? <span className="lg-caret">▍</span> : null}</p></div></aside>
      <div className="lg-canvas">{subject==='math' ? <MathActivity question={question} answer={answer} setAnswer={setAnswer} submit={submit} hint={()=>talk(question.hint)} /> : subject==='english' ? <EnglishActivity isRecording={recording} toggleRecording={()=>{setRecording(r=>!r); talk(recording ? 'Great speaking practice! Tap Complete reading to earn your reward.' : 'Try reading slowly and clearly. You can do it! 🎤');}} completeReading={()=>{setRecording(false);reward('Wonderful reading practice!');}} /> : subject==='backpack' ? <section className="lg-panel lg-simple"><h2>🎒 Your Backpack</h2><p>⭐ Learning Star</p><p>🪙 {coins} Coins</p><p>💎 {gems} Gems</p><p>Earn more by completing learning games!</p></section> : <section className="lg-panel lg-simple"><h2>🏆 Quests</h2><p>Complete 3 activities: {Math.min(completed,3)} / 3</p><div className="lg-progress"><div style={{width:`${Math.min(completed,3)/3*100}%`}} /></div><p>{completed >= 3 ? '🎉 Quest complete!' : 'Answer math questions or finish a reading challenge!'}</p></section>}</div></div>
    <nav className="lg-nav" aria-label="Game navigation">{NAV.map(([id,emoji,label])=><button key={id} className={subject===id?'selected':''} aria-current={subject===id?'page':undefined} onClick={()=>switchTab(id)}><span>{emoji}</span><b>{label}</b></button>)}</nav>
    <footer className="lg-footer">Demo mode · Coins and XP reset when the page refreshes · No real purchases or microphone recording</footer>
  </div>;
}
