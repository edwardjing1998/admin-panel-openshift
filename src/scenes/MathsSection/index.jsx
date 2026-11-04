import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./MathsSection.css";

const GRADES = [1, 2, 3, 4, 5, 6];
const TABS = [
  ["overview", "⌂", "Overview"],
  ["textbooks", "▤", "Textbooks"],
  ["videos", "▷", "Videos"],
  ["exercises", "✎", "Exercises"],
  ["mywork", "▧", "Saved Exercises"],
  ["progress", "◷", "Progress"],
];
const SUBJECTS = {
  1: ["Counting & place value", "Addition within 20", "Shapes & patterns"],
  2: ["Addition & subtraction", "Time & money", "Equal groups"],
  3: ["Multiplication strategies", "Rectangle area", "Fractions & measurement"],
  4: ["Multi-digit multiplication", "Division", "Fractions & geometry"],
  5: ["Decimals", "Fractions", "Volume & measurement"],
  6: ["Ratios & rates", "Expressions", "Statistics & geometry"],
};
const GRADE_QUESTIONS = {
  1: [{ q: "8 + 5", a: 13, h: "Start with 8, then count five more." }, { q: "15 − 7", a: 8, h: "Count backwards from 15." }, { q: "6 + 6", a: 12, h: "Use the doubles strategy." }],
  2: [{ q: "24 + 18", a: 42, h: "Add tens and ones separately." }, { q: "50 − 17", a: 33, h: "Subtract 10 and then 7." }, { q: "5 × 2", a: 10, h: "Count five groups of two." }],
  3: [{ q: "4 × 3", a: 12, h: "Think of four groups of three." }, { q: "6 × 4", a: 24, h: "Try skip counting by four." }, { q: "5 × 6", a: 30, h: "Five rows of six." }],
  4: [{ q: "24 × 3", a: 72, h: "Break 24 into 20 and 4." }, { q: "96 ÷ 4", a: 24, h: "Find four equal groups." }, { q: "12 × 8", a: 96, h: "Use 10 × 8 plus 2 × 8." }],
  5: [{ q: "1.5 + 2.5", a: 4, h: "Align the decimal points." }, { q: "12 × 15", a: 180, h: "Split 15 into 10 and 5." }, { q: "144 ÷ 12", a: 12, h: "What times 12 equals 144?" }],
  6: [{ q: "3 × (8 + 4)", a: 36, h: "Evaluate inside the parentheses first." }, { q: "25% of 80", a: 20, h: "25% is one quarter." }, { q: "7 × 12", a: 84, h: "Distribute 7 × (10 + 2)." }],
};
const STORAGE_KEY = "maths-section-demo-v1";
const readSaved = () => {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter(x => x && typeof x.grade === "number" && typeof x.answer === "string").slice(-100) : [];
  } catch (_) { return []; }
};
const CARD_DATA = (grade) => [
  { id: `book-${grade}`, type: "textbooks", icon: "📚", tint: "blue", title: `Grade ${grade} Maths Textbook`, desc: "Concepts, worked examples and chapter review", tag: "Textbook", status: "Catalog preview" },
  { id: `book-work-${grade}`, type: "textbooks", icon: "📖", tint: "violet", title: "Practice Workbook", desc: "Guided practice arranged by topic and difficulty", tag: "Workbook", status: "Catalog preview" },
  { id: `video-${grade}`, type: "videos", icon: "🎬", tint: "coral", title: `Learn ${SUBJECTS[grade][0]}`, desc: "Animated concept explanations and step-by-step demonstrations", tag: "Video lesson", status: "Video API needed" },
  { id: `video-review-${grade}`, type: "videos", icon: "▶", tint: "blue", title: "Practice Walkthrough", desc: "See how an example problem is solved", tag: "Video lesson", status: "Video API needed" },
  { id: `exercise-${grade}`, type: "exercises", icon: "✏️", tint: "green", title: "Quick Maths Challenge", desc: "Solve three questions, receive hints and save your work", tag: "Interactive", status: "Try now" },
  { id: `interactive-${grade}`, type: "exercises", icon: "🧩", tint: "violet", title: grade === 3 ? "Multiplication Explorations" : "Visual Maths Studio", desc: grade === 3 ? "Equal groups, arrays, skip counting and repeated addition" : "Hands-on, visual exercises organized by grade", tag: "Interactive", status: "Lesson API needed" },
];

function ResourceCard({ item, onOpen }) {
  return <article className="maths-resource">
    <div className={`maths-resource-art ${item.tint}`}><span aria-hidden="true">{item.icon}</span><small>{item.tag}</small></div>
    <div className="maths-resource-content"><strong>{item.title}</strong><p>{item.desc}</p>
      <div className="maths-resource-bottom"><span className="maths-status">{item.status}</span><button onClick={() => onOpen(item)}>{item.status === "Try now" ? "Start exercise" : "View details"} <span aria-hidden="true">↗</span></button></div>
    </div>
  </article>;
}

export default function MathsSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab = TABS.some(([id]) => id === requestedTab) ? requestedTab : "overview";
  const [grade, setGrade] = useState(3);
  const [tab, setTab] = useState(initialTab);
  const [saved, setSaved] = useState(readSaved);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");
  const current = GRADE_QUESTIONS[grade][questionIndex];
  const attempts = useMemo(() => saved.filter(x => x.grade === grade), [saved, grade]);
  const accuracy = attempts.length ? Math.round(attempts.filter(x => x.correct).length / attempts.length * 100) : 0;
  const resources = CARD_DATA(grade);
  const filtered = resources.filter(x => (tab === "overview" || x.type === tab) && `${x.title} ${x.desc}`.toLowerCase().includes(search.toLowerCase()));
  useEffect(() => { setQuestionIndex(0); setAnswer(""); setHint(false); setFeedback(null); setSelectedRecord(null); setDetail(null); }, [grade]);
  useEffect(() => { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch (_) {} }, [saved]);
  useEffect(() => {
    const requested = searchParams.get("tab");
    if (TABS.some(([id]) => id === requested)) {
      setTab(requested);
    } else if (!requested) {
      setTab("overview");
    }
  }, [searchParams]);
  const moveTo = next => {
    setTab(next);
    setDetail(null);
    setFeedback(null);
    setSearchParams(next === "overview" ? {} : { tab: next });
  };
  const openCard = item => {
    if (item.id === `exercise-${grade}`) { setTab("practice"); setFeedback(null); setHint(false); setAnswer(""); }
    else setDetail(item);
  };
  const submit = event => {
    event.preventDefault();
    if (answer.trim() === "" || !Number.isFinite(Number(answer))) { setFeedback({ ok: false, message: "Enter a number to check your answer." }); return; }
    const ok = Number(answer) === current.a;
    const record = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, grade, question: current.q, expected: current.a, answer: answer.trim(), correct: ok, usedHint: hint, createdAt: new Date().toISOString() };
    setSaved(prev => [...prev, record].slice(-100));
    setFeedback({ ok, message: ok ? "Great work! Your answer has been saved in Saved Exercises on this browser." : `Not quite. ${current.h} Your attempt has been saved.` });
  };
  const nextQuestion = () => { setQuestionIndex(i => (i + 1) % GRADE_QUESTIONS[grade].length); setAnswer(""); setFeedback(null); setHint(false); };
  return <div className="maths-section">
    <header className="maths-heading">
      <div><span className="maths-eyebrow">STUDENT LEARNING SPACE / MATHEMATICS</span><h1>Maths Section <span aria-hidden="true">✦</span></h1><p>One place for learning, practicing, saving work and growing your maths confidence.</p></div>
      <div className="maths-heading-right"><span className="maths-preview-pill">● Portal preview</span><button className="maths-outline-btn" onClick={() => moveTo("mywork")}>▧ Saved Exercises</button></div>
    </header>
    <section className="maths-hero">
      <div className="maths-hero-copy"><span className="maths-hero-label">YOUR LEARNING JOURNEY</span><h2>Big ideas start with <em>small discoveries.</em></h2><p>Explore textbooks, watch lessons, solve challenges, and keep a record of what you've learned.</p><button className="maths-primary-btn" onClick={() => moveTo("practice")}>Start practising <span>→</span></button></div>
      <div className="maths-hero-visual" aria-hidden="true"><span className="maths-orbit one">✦</span><span className="maths-orbit two">÷</span><span className="maths-equation">4 × 3 <b>= 12</b></span><div className="maths-blocks"><span>● ● ●</span><span>● ● ●</span><span>● ● ●</span><span>● ● ●</span></div><span className="maths-orbit three">✧</span></div>
    </section>
    <section className="maths-grade-panel" aria-label="Choose maths grade"><div><strong>Choose your grade</strong><p>Content and practice change with your grade.</p></div><div className="maths-grade-options">{GRADES.map(g => <button className={grade === g ? "active" : ""} key={g} onClick={() => setGrade(g)} aria-pressed={grade === g}>Grade {g}</button>)}</div></section>
    <nav className="maths-tabs" aria-label="Maths sections">{TABS.map(([id, icon, label]) => <button key={id} className={tab === id ? "active" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => moveTo(id)}><span aria-hidden="true">{icon}</span> {label}</button>)}</nav>
    {(tab === "overview" || tab === "textbooks" || tab === "videos" || tab === "exercises") && <>
      <div className="maths-section-title"><div><span className="maths-eyebrow">GRADE {grade} LIBRARY</span><h2>{tab === "overview" ? "Explore your learning library" : tab === "textbooks" ? "Textbooks & workbooks" : tab === "videos" ? "Video lessons" : "Interactive exercises"}</h2><p>{tab === "overview" ? "Everything you need, organized by learning format." : `Browse available ${tab} for Grade ${grade}.`}</p></div><label className="maths-search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search learning resources" aria-label="Search maths resources" /></label></div>
      <div className="maths-resource-grid">{filtered.map(item => <ResourceCard key={item.id} item={item} onOpen={openCard} />)}</div>
      {!filtered.length && <p className="maths-empty">No learning resources match that search.</p>}
      {tab === "overview" && <section className="maths-next"><div><span className="maths-eyebrow">TOPICS TO EXPLORE</span><h3>What will you learn in Grade {grade}?</h3><p>Select an exercise to put these ideas into practice.</p></div><div className="maths-topic-pills">{SUBJECTS[grade].map((topic, idx) => <button key={topic} onClick={() => moveTo("exercises")}><span>0{idx + 1}</span>{topic} ↗</button>)}</div></section>}
    </>}
    {tab === "practice" && <section className="maths-practice"><div className="maths-practice-head"><div><span className="maths-eyebrow">GRADE {grade} / INTERACTIVE EXERCISE</span><h2>Quick Maths Challenge</h2><p>Question {questionIndex + 1} of {GRADE_QUESTIONS[grade].length} · Each submission is saved locally.</p></div><button className="maths-outline-btn" onClick={() => moveTo("exercises")}>← Back to exercises</button></div><div className="maths-practice-body"><div className="maths-question"><span>SOLVE THE PROBLEM</span><strong>{current.q} = ?</strong><div className="maths-visual-dots" aria-hidden="true">✦ &nbsp; ✧ &nbsp; ✦</div></div><form className="maths-answer-form" onSubmit={submit}><label htmlFor="maths-answer">Your answer</label><input id="maths-answer" type="number" step="any" value={answer} onChange={event => { setAnswer(event.target.value); setFeedback(null); }} placeholder="Type your answer" /><div className="maths-actions"><button type="submit" className="maths-primary-btn">Check & save</button><button type="button" className="maths-outline-btn" onClick={() => setHint(true)}>💡 Show hint</button></div>{hint && <p className="maths-hint">{current.h}</p>}{feedback && <p role="status" className={`maths-feedback ${feedback.ok ? "success" : "try"}`}>{feedback.message}</p>}{feedback && <button type="button" className="maths-next-question" onClick={nextQuestion}>Next question →</button>}</form></div></section>}
    {tab === "mywork" && <section className="maths-work"><div className="maths-section-title"><div><span className="maths-eyebrow">YOUR PERSONAL PRACTICE</span><h2>Saved exercises</h2><p>Review answers, hints and a simple replay storyboard.</p></div><button className="maths-outline-btn" onClick={() => moveTo("practice")}>+ New exercise</button></div>{attempts.length ? <div className="maths-work-list">{[...attempts].reverse().map(record => <button key={record.id} className={`maths-work-item ${selectedRecord?.id === record.id ? "selected" : ""}`} onClick={() => setSelectedRecord(record)}><span className="maths-work-icon">{record.correct ? "✓" : "↻"}</span><span><strong>{record.question} = {record.answer}</strong><small>{new Date(record.createdAt).toLocaleString()} · {record.correct ? "Correct" : "Try again"}{record.usedHint ? " · Used hint" : ""}</small></span><span aria-hidden="true">View replay →</span></button>)}</div> : <div className="maths-empty-card"><span>📝</span><h3>Your saved exercises start here</h3><p>Complete a Quick Maths Challenge to save your first exercise.</p><button className="maths-primary-btn" onClick={() => moveTo("practice")}>Try an exercise →</button></div>}{selectedRecord && <div className="maths-replay"><h3>Exercise replay storyboard</h3><p>Based on saved exercise data—not a recorded video.</p><div className="maths-replay-steps"><div><b>1</b><strong>Question</strong><span>{selectedRecord.question}</span></div><div><b>2</b><strong>Student answer</strong><span>{selectedRecord.answer}{selectedRecord.usedHint ? " · Hint used" : ""}</span></div><div><b>3</b><strong>Result</strong><span>{selectedRecord.correct ? "Correct" : `The expected answer was ${selectedRecord.expected}`}</span></div></div><div className="maths-replay-note">🎬 Personalized MP4 creation requires connecting your existing Education video-generation service.</div></div>}</section>}
    {tab === "progress" && <section className="maths-progress"><div className="maths-section-title"><div><span className="maths-eyebrow">YOUR LEARNING INSIGHTS</span><h2>Grade {grade} progress</h2><p>Based only on the Quick Maths Challenge attempts saved in this browser.</p></div></div><div className="maths-progress-grid"><article><h3>Accuracy</h3><div className="maths-progress-track"><div style={{ width: `${accuracy}%` }} /></div><strong>{attempts.length ? `${accuracy}%` : "No attempts yet"}</strong></article><article><h3>Learning topics</h3>{SUBJECTS[grade].map((topic,i) => <p key={topic}><span className="maths-topic-number">0{i+1}</span> {topic}</p>)}</article></div><p className="maths-note">This is a local prototype. Teacher reports, mastery assessment, cross-device student accounts and adaptive recommendations need backend integration.</p></section>}
    {detail && <div className="maths-modal-backdrop" onClick={() => setDetail(null)}><section className="maths-modal" role="dialog" aria-modal="true" aria-label={detail.title} onClick={event => event.stopPropagation()}><button className="maths-modal-close" aria-label="Close" onClick={() => setDetail(null)}>✕</button><div className={`maths-resource-art ${detail.tint}`}><span>{detail.icon}</span><small>{detail.tag}</small></div><h2>{detail.title}</h2><p>{detail.desc}</p><div className="maths-modal-notice"><strong>Integration planned</strong><p>This is a grade-based catalog placeholder. Connect your published textbook, lesson, or video endpoints before enabling student access.</p></div><button className="maths-outline-btn" onClick={() => setDetail(null)}>Close</button></section></div>}
    <footer className="maths-disclaimer">Prototype · Grade catalog items are examples, not published resources · Practice attempts are stored on this browser only (not linked to a student account) · Do not use shared devices for private student work. <button onClick={() => { if(window.confirm("Clear all locally saved Maths Section demo attempts on this browser?")){setSaved([]);setSelectedRecord(null);} }}>Clear local demo data</button></footer>
  </div>;
}
