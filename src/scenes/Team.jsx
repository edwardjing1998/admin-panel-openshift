import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  AdminPanelSettingsOutlined,
  LockOpenOutlined,
  PlayCircleOutline,
  SecurityOutlined,
} from "@mui/icons-material";
import { tokens } from "../theme";
import { mockDataTeam } from "../data/mockData";
import Header from "../components/Header";

const INITIAL_JOB_ID = "c1bb7c47b28b4694887dad8e81c6cbe8";
const JOB_ID_PATTERN = /^[a-f0-9]{32}$/i;

function VideoPreview() {
  const [jobId, setJobId] = useState(INITIAL_JOB_ID);
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const validJobId = JOB_ID_PATTERN.test(jobId.trim());

  const loadVideo = async () => {
    if (!validJobId) return;
    setError("");
    setPlaybackUrl("");
    setIsLoading(true);
    try {
      // No browser-side editor key or shared preview credentials.
      // Server restricts requests to the configured pilot video job IDs.
      const response = await fetch(
        `/api/team/videos/${jobId.trim()}/playback-url`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error(
          `Could not load video preview (HTTP ${response.status}).`
        );
      }
      const data = await response.json();
      if (!data.playback_url) throw new Error("No video URL was returned.");
      setPlaybackUrl(data.playback_url);
    } catch (err) {
      setError(err.message || "Unable to load video.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box mt={3} p={3} border={1} borderColor="divider" borderRadius={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <PlayCircleOutline color="primary" />
        <Typography variant="h5" fontWeight={600}>Learning Video Preview</Typography>
        <Chip label="Admin pilot" size="small" variant="outlined" />
      </Stack>
      <Typography color="text.secondary" variant="body2" mt={1}>
        Preview a published mathematics video using server-side OpenShift credentials.
        Team-member learning assignments will be added in a later phase.
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mt={3} alignItems="start">
        <TextField
          label="Video job ID"
          value={jobId}
          size="small"
          onChange={(event) => {setJobId(event.target.value); setPlaybackUrl("");}}
          error={Boolean(jobId) && !validJobId}
          sx={{ width: { xs: "100%", md: 360 } }}
        />
        <Button variant="contained" onClick={loadVideo} disabled={
          isLoading || !validJobId
        }>
          {isLoading ? "Loading..." : "Preview via Video API"}
        </Button>
      </Stack>
      <Alert severity="info" sx={{ mt: 2 }}>
        No separate preview username or password is needed. The editor key stays
        in an OpenShift Secret. This pilot can preview only the video job IDs
        approved by the server; configure authenticated access before assigning
        videos to individual members.
      </Alert>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {playbackUrl && (
        <Box mt={3} maxWidth={900}>
          <Box component="video" key={playbackUrl} controls preload="metadata"
            playsInline src={playbackUrl}
            onError={() => setError("Video playback failed. The URL may have expired.")}
            sx={{ display: "block", width: "100%", maxHeight: 520,
              bgcolor: "black", borderRadius: 1 }} />
          <Typography color="text.secondary" variant="caption" display="block" mt={1}>
            Signed URLs expire automatically. Click Preview again to load a fresh video URL.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function Team() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const columns = [
    { field: "id", headerName: "ID" },
    { field: "name", headerName: "Name", flex: 1, cellClassName: "name-column--cell" },
    { field: "age", headerName: "Age", type: "number", align: "left", headerAlign: "left" },
    { field: "phone", headerName: "Phone Number", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "access",
      headerName: "Access Level",
      flex: 1,
      renderCell: ({ row: { access } }) => (
        <Box
          width="60%"
          m="0 auto"
          p="0.2rem"
          display="flex"
          justifyContent="center"
          backgroundColor={
            access === "Admin" ? colors.greenAccent[600] : colors.greenAccent[700]
          }
          borderRadius="5px"
        >
          {access === "admin" && <AdminPanelSettingsOutlined />}
          {access === "manager" && <SecurityOutlined />}
          {access === "user" && <LockOpenOutlined />}
          <Typography color={colors.grey[100]} sx={{ ml: "0.2rem" }}>
            {access}
          </Typography>
        </Box>
      ),
    },
  ];

  return (
    <Box m="0.5rem 1rem">
      <Header title="TEAM" subtitle="Managing the team members" />
      <VideoPreview />
      <Box
        m="2rem 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .name-column--cell": { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
        }}
      >
        <DataGrid rows={mockDataTeam} columns={columns} />
      </Box>
    </Box>
  );
}

export default Team;
