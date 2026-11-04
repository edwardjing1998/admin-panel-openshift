import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import BiotechOutlinedIcon from "@mui/icons-material/BiotechOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import Header from "../../components/Header";
import { COURSE_CATALOG } from "../../config/courseCatalog";
import "./Explore.css";

const COURSE_ICONS = {
  math: CalculateOutlinedIcon,
  english: TranslateOutlinedIcon,
  physics: ScienceOutlinedIcon,
  chemistry: BiotechOutlinedIcon,
};

export default function Explore() {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [preview, setPreview] = useState(null);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return COURSE_CATALOG.filter((course) => {
      if (grade !== "all" && !course.grades.includes(Number(grade))) return false;
      if (availability !== "all" && course.status !== availability) return false;
      return !term || [course.name, course.description, ...course.topics]
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [query, grade, availability]);

  return (
    <Box className="explore-courses-page">
      <Header title="Explore Courses" subtitle="Discover courses and learning activities across subjects" />

      <Box component="section" className="explore-courses-hero">
        <ExploreOutlinedIcon sx={{ fontSize: 36 }} aria-hidden="true" />
        <Box>
          <Typography variant="h4" component="h2" fontWeight={700}>
            What would you like to learn?
          </Typography>
          <Typography variant="body1">
            Search the course catalog and preview learning topics. Only published courses can be opened.
          </Typography>
        </Box>
      </Box>

      <Box component="section" aria-label="Course search filters" className="explore-courses-filters">
        <TextField
          className="explore-courses-search"
          label="Search courses or topics"
          placeholder="Try multiplication, reading, motion..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          InputProps={{ startAdornment: <SearchOutlinedIcon sx={{ mr: 1 }} aria-hidden="true" /> }}
        />
        <FormControl className="explore-courses-filter">
          <InputLabel id="explore-grade-label">Grade</InputLabel>
          <Select labelId="explore-grade-label" label="Grade" value={grade} onChange={(event) => setGrade(event.target.value)}>
            <MenuItem value="all">All grades</MenuItem>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((number) => (
              <MenuItem key={number} value={String(number)}>Grade {number}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl className="explore-courses-filter">
          <InputLabel id="explore-status-label">Availability</InputLabel>
          <Select labelId="explore-status-label" label="Availability" value={availability} onChange={(event) => setAvailability(event.target.value)}>
            <MenuItem value="all">All courses</MenuItem>
            <MenuItem value="available">Available now</MenuItem>
            <MenuItem value="planned">Planned</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box component="section" aria-label="Course catalog">
        <Box className="explore-courses-heading">
          <Typography variant="h4" component="h2" fontWeight={700}>Discover Courses</Typography>
          <Typography variant="body2" color="text.secondary">
            {results.length} {results.length === 1 ? "course" : "courses"}
          </Typography>
        </Box>
        {results.length > 0 ? (
          <Box className="explore-courses-grid">
            {results.map((course) => {
              const Icon = COURSE_ICONS[course.icon] || ExploreOutlinedIcon;
              return (
                <Card className="explore-course-card" variant="outlined" key={course.id}>
                  <CardContent className="explore-course-body">
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box className={`explore-course-icon explore-course-icon-${course.icon}`}>
                        <Icon fontSize="large" aria-hidden="true" />
                      </Box>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={course.status === "available" ? "success" : "default"}
                        label={course.status === "available" ? "Available" : "Planned"}
                      />
                    </Stack>
                    <Typography variant="h5" component="h3" fontWeight={700} sx={{ mt: 2 }}>{course.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{course.description}</Typography>
                    <Typography variant="caption" sx={{ display: "block", mt: 2 }} color="text.secondary">
                      Grades {course.grades[0]}–{course.grades[course.grades.length - 1]}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
                      {course.topics.slice(0, 3).map((topic) => <Chip key={topic} label={topic} size="small" variant="outlined" />)}
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button variant="outlined" onClick={() => setPreview(course)}>Preview Course</Button>
                    {course.status === "available" && course.route && (
                      <Button component={RouterLink} to={course.route} endIcon={<ArrowForwardOutlinedIcon />}>
                        Open Course
                      </Button>
                    )}
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        ) : (
          <Box className="explore-courses-empty">
            <Typography variant="h6">No courses match your search.</Typography>
            <Typography color="text.secondary" variant="body2">Try another keyword or grade.</Typography>
            <Button variant="outlined" onClick={() => { setQuery(""); setGrade("all"); setAvailability("all"); }}>
              Clear filters
            </Button>
          </Box>
        )}
      </Box>

      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} fullWidth maxWidth="sm" aria-labelledby="explore-preview-title">
        {preview && (
          <>
            <DialogTitle id="explore-preview-title">{preview.name} — Course Preview</DialogTitle>
            <DialogContent dividers>
              <Typography>{preview.description}</Typography>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }} fontWeight={700}>Topics</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {preview.topics.map((topic) => <Chip key={topic} label={topic} variant="outlined" />)}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{preview.preview}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                The course catalog is a local UI configuration. Textbooks, lessons and availability are not fetched from a backend yet.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreview(null)}>Close</Button>
              {preview.status === "available" && preview.route && (
                <Button variant="contained" component={RouterLink} to={preview.route} onClick={() => setPreview(null)}>
                  Open {preview.name}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
