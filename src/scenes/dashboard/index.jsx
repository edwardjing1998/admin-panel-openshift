import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import OndemandVideoOutlinedIcon from "@mui/icons-material/OndemandVideoOutlined";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import Header from "../../components/Header";
import "./LearningPortal.css";

// This key is defined by the existing MathsSection page. Do not change it
// without migrating saved demo attempts from that page as well.
const MATHS_ATTEMPTS_STORAGE_KEY = "maths-section-demo-v1";
const GRADE = 3;

const QUICK_LINKS = [
  { label: "Textbooks", detail: "Browse Grade 3 learning materials", icon: MenuBookOutlinedIcon, to: "/maths?tab=textbooks" },
  { label: "Training videos", detail: "Find guided lesson videos", icon: OndemandVideoOutlinedIcon, to: "/maths?tab=videos" },
  { label: "Exercises", detail: "Practice multiplication and more", icon: HistoryEduOutlinedIcon, to: "/maths?tab=exercises" },
  { label: "Saved work", detail: "Review your practice attempts", icon: AutoStoriesOutlinedIcon, to: "/maths?tab=mywork" },
];

const UPCOMING_COURSES = [
  { name: "English", icon: TranslateOutlinedIcon },
  { name: "Physics", icon: SchoolOutlinedIcon },
  { name: "Chemistry", icon: ScienceOutlinedIcon },
];

function readGradeThreeAttempts() {
  try {
    const raw = window.localStorage.getItem(MATHS_ATTEMPTS_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) =>
      item && item.grade === GRADE && typeof item.answer === "string" &&
      typeof item.question === "string" && typeof item.createdAt === "string"
    );
  } catch (_error) {
    return [];
  }
}

function PortalLink({ item }) {
  const Icon = item.icon;
  return (
    <Button
      component={RouterLink}
      to={item.to}
      className="portal-quick-card"
      variant="outlined"
      sx={{ justifyContent: "flex-start", alignItems: "flex-start", textTransform: "none", textAlign: "left" }}
    >
      <Box className="portal-quick-icon"><Icon fontSize="medium" /></Box>
      <Box>
        <Typography className="portal-card-title" fontWeight={700}>{item.label}</Typography>
        <Typography variant="body2" color="text.secondary">{item.detail}</Typography>
      </Box>
      <ArrowForwardRoundedIcon className="portal-quick-arrow" fontSize="small" />
    </Button>
  );
}

export default function Dashboard() {
  const theme = useTheme();
  const [attempts, setAttempts] = useState(readGradeThreeAttempts);

  // Reload on focus/visibility so attempts added on the Maths page appear
  // when a student comes back to the homepage. No student API is assumed.
  const refreshAttempts = useCallback(() => setAttempts(readGradeThreeAttempts()), []);
  useEffect(() => {
    window.addEventListener("focus", refreshAttempts);
    window.addEventListener("storage", refreshAttempts);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshAttempts();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refreshAttempts);
      window.removeEventListener("storage", refreshAttempts);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshAttempts]);

  const latest = useMemo(() => [...attempts]
    .filter((item) => !Number.isNaN(Date.parse(item.createdAt)))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 3), [attempts]);

  return (
    <Box className="learning-portal" sx={{ color: theme.palette.text.primary }}>
      <Header title="AI Learning Portal" subtitle="Welcome to your AI Learning Portal" />

      <section className="portal-welcome" aria-labelledby="portal-welcome-title">
        <Box className="portal-welcome-copy">
          <Typography className="portal-eyebrow">YOUR LEARNING HOME</Typography>
          <Typography id="portal-welcome-title" component="h2" variant="h3" fontWeight={800}>
            Ready for your next discovery?
          </Typography>
          <Typography className="portal-welcome-description">
            Continue a maths lesson, try interactive exercises, or explore your saved work—all in one place.
          </Typography>
          <Box className="portal-button-row">
            <Button component={RouterLink} to="/maths?tab=exercises" variant="contained" endIcon={<ArrowForwardRoundedIcon />}>
              Continue Learning
            </Button>
            <Button component={RouterLink} to="/maths" variant="outlined" color="inherit">
              Explore Mathematics
            </Button>
          </Box>
        </Box>
        <Box className="portal-welcome-illustration" aria-hidden="true">
          <div className="portal-math-icon">✦</div>
          <div className="portal-equation">4 × 3 = 12</div>
          <div className="portal-dots"><span>● ● ●</span><span>● ● ●</span><span>● ● ●</span><span>● ● ●</span></div>
        </Box>
      </section>

      <section className="portal-section" aria-labelledby="portal-resume-heading">
        <Box className="portal-section-heading">
          <Box>
            <Typography id="portal-resume-heading" component="h2" variant="h4" fontWeight={700}>Continue Learning</Typography>
            <Typography variant="body2" color="text.secondary">Pick up with Grade 3 Mathematics.</Typography>
          </Box>
          <Chip label="Grade 3" variant="outlined" size="small" />
        </Box>
        <Box className="portal-feature-card">
          <Box className="portal-feature-mark"><CalculateOutlinedIcon sx={{ fontSize: 34 }} /></Box>
          <Box className="portal-feature-copy">
            <Typography className="portal-eyebrow">MATHEMATICS · GRADE 3</Typography>
            <Typography component="h3" variant="h5" fontWeight={700}>Multiplication Strategies</Typography>
            <Typography variant="body2" color="text.secondary">
              Explore equal groups, arrays, skip counting, and repeated addition.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {attempts.length > 0
                ? `${attempts.length} practice attempt${attempts.length === 1 ? "" : "s"} saved in this browser.`
                : "Start a Quick Maths Challenge to record your first practice attempt."}
            </Typography>
          </Box>
          <Button component={RouterLink} to="/maths?tab=exercises" variant="contained" endIcon={<PlayCircleOutlineRoundedIcon />}>
            {attempts.length ? "Keep Practising" : "Start Practising"}
          </Button>
        </Box>
      </section>

      <section className="portal-section" aria-labelledby="portal-courses-heading">
        <Box className="portal-section-heading">
          <Box>
            <Typography id="portal-courses-heading" component="h2" variant="h4" fontWeight={700}>Courses</Typography>
            <Typography variant="body2" color="text.secondary">Explore available subjects.</Typography>
          </Box>
        </Box>
        <Box className="portal-course-grid">
          <Box component={RouterLink} to="/maths" className="portal-course-card portal-course-active">
            <CalculateOutlinedIcon sx={{ fontSize: 30 }} />
            <Typography component="h3" fontWeight={700}>Mathematics</Typography>
            <Typography variant="body2">Grades 1–6 · Interactive practice</Typography>
            <span className="portal-course-foot">Open course <ArrowForwardRoundedIcon fontSize="small" /></span>
          </Box>
          {UPCOMING_COURSES.map((course) => {
            const Icon = course.icon;
            return (
              <Box className="portal-course-card portal-course-soon" key={course.name}>
                <Icon sx={{ fontSize: 30 }} />
                <Typography component="h3" fontWeight={700}>{course.name}</Typography>
                <Typography variant="body2">Course configuration planned</Typography>
                <span className="portal-course-foot">Coming soon</span>
              </Box>
            );
          })}
        </Box>
      </section>

      <section className="portal-section" aria-labelledby="portal-access-heading">
        <Box className="portal-section-heading">
          <Box>
            <Typography id="portal-access-heading" component="h2" variant="h4" fontWeight={700}>Quick Access</Typography>
            <Typography variant="body2" color="text.secondary">Choose how you want to learn.</Typography>
          </Box>
        </Box>
        <Box className="portal-quick-grid">
          {QUICK_LINKS.map((item) => <PortalLink item={item} key={item.label} />)}
        </Box>
      </section>

      <section className="portal-section portal-last-section" aria-labelledby="portal-work-heading">
        <Box className="portal-section-heading">
          <Box>
            <Typography id="portal-work-heading" component="h2" variant="h4" fontWeight={700}>Recent Practice</Typography>
            <Typography variant="body2" color="text.secondary">Grade 3 attempts saved by the Maths Section on this browser.</Typography>
          </Box>
          <Button component={RouterLink} to="/maths?tab=mywork" endIcon={<ArrowForwardRoundedIcon />}>View Saved Work</Button>
        </Box>
        {latest.length ? (
          <Box className="portal-attempt-list">
            {latest.map((item, i) => (
              <Box className="portal-attempt" key={item.id || `${item.createdAt}-${i}`}>
                <CheckCircleOutlineRoundedIcon color={item.correct ? "success" : "disabled"} />
                <Box flex={1}>
                  <Typography fontWeight={700}>{item.question} = {item.answer}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.createdAt).toLocaleString()} · {item.correct ? "Correct" : "Try again"}{item.usedHint ? " · Hint used" : ""}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box className="portal-empty-state">
            <AutoStoriesOutlinedIcon fontSize="large" color="action" />
            <Typography fontWeight={700}>Your learning journey starts here.</Typography>
            <Typography variant="body2" color="text.secondary">Solve a Quick Maths Challenge to see your saved work.</Typography>
            <Button component={RouterLink} to="/maths?tab=exercises" size="small">Open Exercises <ArrowForwardRoundedIcon fontSize="small" /></Button>
          </Box>
        )}
        <Typography className="portal-local-note" variant="caption" color="text.secondary">
          This homepage uses the existing Maths Section prototype. Saved attempts stay in this browser; student accounts, published course resources, video playback and AI recommendations require backend integration. Avoid saving private student information on shared devices.
        </Typography>
      </section>
    </Box>
  );
}
