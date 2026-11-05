import React, { useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { OpenInNewOutlined, RefreshOutlined } from "@mui/icons-material";

const MATH_API_BASE =
  "https://elementary-math-practice-v2-edward-jing-dev.apps.rm1.0a51.p1.openshiftapps.com";
const LESSON_ID_PATTERN = /^[a-f0-9-]{36}$/i;

export default function InteractiveLesson({ lessonId }) {
  const [reloadCount, setReloadCount] = useState(0);
  const validLessonId = LESSON_ID_PATTERN.test(lessonId || "");
  const lessonUrl = validLessonId
    ? `${MATH_API_BASE}/api/v1/lessons/${encodeURIComponent(lessonId)}/html`
    : "";

  return (
    <Box mt={3} p={3} border={1} borderColor="divider" borderRadius={2}>
      <Typography variant="h5" fontWeight={600}>
        Interactive Mathematics Lesson
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={1}>
        Practice the published lesson in an isolated browser frame.
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
        Lesson ID: {lessonId}
      </Typography>
      {!validLessonId ? (
        <Alert severity="error" sx={{ mt: 2 }}>Invalid lesson ID.</Alert>
      ) : (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={2} mb={2}>
            <Button variant="outlined" startIcon={<RefreshOutlined />}
              onClick={() => setReloadCount((count) => count + 1)}>
              Reload Lesson
            </Button>
            <Button variant="outlined" startIcon={<OpenInNewOutlined />}
              href={lessonUrl} target="_blank" rel="noopener noreferrer">
              Open Lesson in New Tab
            </Button>
          </Stack>
          <Alert severity="info" sx={{ mb: 2 }}>
            If the lesson appears blank, the source server may prevent iframe embedding
            or the activity may need additional sandbox permissions. Try opening it in
            a new tab. Reloading starts a fresh lesson session.
          </Alert>
          <Box
            component="iframe"
            key={`${lessonId}-${reloadCount}`}
            title="Interactive Mathematics Lesson"
            src={lessonUrl}
            sandbox="allow-scripts allow-forms allow-pointer-lock"
            referrerPolicy="no-referrer"
            sx={{ display: "block", width: "100%", height: { xs: 560, md: 760 },
              border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "white" }}
          />
        </>
      )}
    </Box>
  );
}
