import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  AdminPanelSettingsOutlined,
  LockOpenOutlined,
  OpenInNewOutlined,
  PlayCircleOutline,
  SecurityOutlined,
} from "@mui/icons-material";
import { tokens } from "../theme";
import { mockDataTeam } from "../data/mockData";
import Header from "../components/Header";

const VIDEO_API_BASE =
  process.env.REACT_APP_MATH_VIDEO_API_BASE ||
  "https://elementary-math-practice-v2-edward-jing-dev.apps.rm1.0a51.p1.openshiftapps.com";
const INITIAL_JOB_ID = "c1bb7c47b28b4694887dad8e81c6cbe8";
const JOB_ID_PATTERN = /^[a-f0-9]{32}$/i;

function VideoPreview() {
  const [jobId, setJobId] = useState(INITIAL_JOB_ID);
  const [azureUrlInput, setAzureUrlInput] = useState("");
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [playerError, setPlayerError] = useState(false);
  const validJobId = JOB_ID_PATTERN.test(jobId.trim());

  // The existing public /file endpoint is a download fallback. It avoids
  // exposing the editor API key in a client-side application.
  const fileUrl = useMemo(
    () =>
      validJobId
        ? `${VIDEO_API_BASE.replace(/\/$/, "")}/api/v1/videos/${jobId.trim()}/file`
        : "",
    [jobId, validJobId]
  );

  const useAzureUrl = () => {
    const candidate = azureUrlInput.trim();
    let parsed;
    try {
      parsed = new URL(candidate);
    } catch {
      setPlayerError(true);
      return;
    }
    // Only accept HTTPS Azure Blob URLs; do not accept credentials in a URL.
    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname.endsWith(".blob.core.windows.net") ||
      !parsed.searchParams.has("sig")
    ) {
      setPlayerError(true);
      return;
    }
    setPlayerError(false);
    setPlaybackUrl(candidate);
  };

  const useApiFile = () => {
    if (!validJobId) return;
    setPlayerError(false);
    setPlaybackUrl(fileUrl);
  };

  return (
    <Box mt={3} p={3} border={1} borderColor="divider" borderRadius={2}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <PlayCircleOutline color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Learning Video Preview
            </Typography>
            <Chip label="Pilot" size="small" variant="outlined" />
          </Stack>
          <Typography color="text.secondary" variant="body2" mt={1}>
            Preview the generated multiplication video. Assignments to team members,
            textbooks, and exercises can be added in a later phase.
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={3} alignItems="start">
        <TextField
          label="Video job ID"
          size="small"
          value={jobId}
          onChange={(event) => {
            setJobId(event.target.value);
            setPlaybackUrl("");
            setPlayerError(false);
          }}
          error={jobId.length > 0 && !validJobId}
          helperText={jobId.length > 0 && !validJobId ? "Enter a 32-character video job ID" : ""}
          sx={{ width: { xs: "100%", sm: 370 }, maxWidth: "100%" }}
          inputProps={{ "aria-label": "Video job ID" }}
        />
        <Button variant="contained" onClick={useApiFile} disabled={!validJobId}>
          Preview via Video API
        </Button>
        {validJobId && (
          <Button
            component="a"
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<OpenInNewOutlined />}
          >
            Open / Download
          </Button>
        )}
      </Stack>

      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1" fontWeight={600}>
        Direct Azure playback (temporary SAS URL)
      </Typography>
      <Typography color="text.secondary" variant="body2" mb={2}>
        For this pilot, paste a fresh read-only URL from your trusted backend or Azure CLI.
        The URL is used only in this page and is not saved or assigned to a team member.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="start">
        <TextField
          label="Temporary Azure video URL"
          type="url"
          size="small"
          value={azureUrlInput}
          onChange={(event) => setAzureUrlInput(event.target.value)}
          fullWidth
          placeholder="https://...blob.core.windows.net/.../video.mp4?sv=...&sig=..."
          inputProps={{ "aria-label": "Temporary Azure video URL", autoComplete: "off" }}
        />
        <Button variant="outlined" onClick={useAzureUrl} disabled={!azureUrlInput.trim()}>
          Play from Azure
        </Button>
      </Stack>
      <Alert severity="info" sx={{ mt: 2 }}>
        The playback-url REST endpoint requires a server-side editor key. Never put that
        key in React environment variables or browser requests. A trusted authenticated
        backend is needed for automatic SAS retrieval and future per-member access.
      </Alert>
      {playerError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Could not load this video. Check the job ID, link expiration, and whether the
          URL is a signed HTTPS Azure Blob URL. The video API may serve downloads
          instead of inline playback.
        </Alert>
      )}
      {playbackUrl && (
        <Box mt={3} maxWidth={900}>
          <Box
            component="video"
            key={playbackUrl}
            controls
            preload="metadata"
            playsInline
            src={playbackUrl}
            onError={() => setPlayerError(true)}
            sx={{ display: "block", width: "100%", maxHeight: 520, bgcolor: "black", borderRadius: 1 }}
          >
            Your browser does not support HTML5 video.
          </Box>
          <Typography color="text.secondary" variant="caption" display="block" mt={1}>
            Azure SAS links expire. If playback stops, obtain a fresh URL.
          </Typography>
          {playbackUrl === fileUrl && (
            <Typography variant="caption" display="block" mt={1}>
              If the API serves this file as an attachment, use the{" "}
              <Link href={fileUrl} target="_blank" rel="noopener noreferrer">
                Open / Download
              </Link>{" "}
              action or choose direct Azure playback above.
            </Typography>
          )}
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
