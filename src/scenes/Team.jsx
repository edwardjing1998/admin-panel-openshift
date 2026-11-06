
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  AdminPanelSettingsOutlined,
  LockOpenOutlined,
  MenuBookOutlined,
  PlayCircleOutline,
  SecurityOutlined,
} from "@mui/icons-material";
import { tokens } from "../theme";
import { mockDataTeam } from "../data/mockData";
import Header from "../components/Header";
import InteractiveLesson from "../components/InteractiveLesson";
import videoPreviewJobs from "../config/videoPreviewJobs.json";

const LEARNING_RESOURCES = [
  {
    id: "lesson-1",
    label: "Existing Mathematics Lesson",
    lessonId: "7b4cd83c-2d75-4fc4-afe5-27e2d43cf419",
    jobId: "c1bb7c47b28b4694887dad8e81c6cbe8",
  },
  {
    id: "lesson-2",
    label: "New Mathematics Lesson",
    lessonId: "069c9199-6733-44a2-bcb0-ae169dc80c2a",
    jobId: "564551bd779b48cb95a0ce2014f396a8",
  },
];

const JOB_ID_PATTERN = /^[a-f0-9]{32}$/i;

function VideoPreview({ active, initialJobId }) {
  const videoRef = useRef(null);
  const defaultParentId = videoPreviewJobs.some((item) => item.id === initialJobId)
    ? initialJobId
    : videoPreviewJobs[0].id;
  const [parentJobId, setParentJobId] = useState(defaultParentId);
  // Empty string means preview the selected parent (full-lesson) video.
  const [tabJobId, setTabJobId] = useState("");
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const parentVideo = videoPreviewJobs.find((item) => item.id === parentJobId);
  const selectedTab = parentVideo?.tabs.find((tab) => tab.jobId === tabJobId);
  const selectedJobId = selectedTab?.jobId || parentJobId;
  const validJobId = JOB_ID_PATTERN.test(selectedJobId);

  useEffect(() => {
    if (!active && videoRef.current) {
      videoRef.current.pause();
    }
  }, [active]);

  const clearPlayback = () => {
    if (videoRef.current) videoRef.current.pause();
    setPlaybackUrl("");
    setError("");
  };

  const loadVideo = async () => {
    if (!validJobId || isLoading) return;

    clearPlayback();
    setIsLoading(true);

    try {
      // Editor credentials stay in the OpenShift proxy, never in the browser.
      const response = await fetch(
        `/api/team/videos/${selectedJobId}/playback-url`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Could not load video preview (HTTP ${response.status}).`);
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
        <Typography variant="h5" fontWeight={600}>
          Learning Video Preview
        </Typography>
        <Chip label="Admin pilot" size="small" variant="outlined" />
      </Stack>

      <Typography color="text.secondary" variant="body2" mt={1}>
        Select a full lesson video or an individual instructional tab.
        The playback credentials remain on the OpenShift server.
      </Typography>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        mt={3}
        alignItems="flex-start"
      >
        <TextField
          select
          label="Video job ID (parent)"
          size="small"
          value={parentJobId}
          onChange={(event) => {
            setParentJobId(event.target.value);
            setTabJobId("");
            clearPlayback();
          }}
          sx={{ width: { xs: "100%", md: 380 } }}
        >
          {videoPreviewJobs.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.label} ({item.id})
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Tab video job ID"
          size="small"
          value={tabJobId}
          onChange={(event) => {
            setTabJobId(event.target.value);
            clearPlayback();
          }}
          disabled={!parentVideo?.tabs.length}
          helperText={parentVideo?.tabs.length ? "Choose a tab, or play the parent video." : "No tab videos for this parent."}
          sx={{ width: { xs: "100%", md: 380 } }}
        >
          <MenuItem value="">Full lesson (parent video)</MenuItem>
          {(parentVideo?.tabs || []).map((tab) => (
            <MenuItem key={tab.jobId} value={tab.jobId}>
              {tab.label} ({tab.jobId})
            </MenuItem>
          ))}
        </TextField>

        <Button
          variant="contained"
          onClick={loadVideo}
          disabled={isLoading || !validJobId}
          sx={{ minHeight: 40, whiteSpace: "nowrap" }}
        >
          {isLoading ? "Loading..." : "Preview via Video API"}
        </Button>
      </Stack>

      <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
        Selected video job: {selectedJobId}
      </Typography>

      <Alert severity="info" sx={{ mt: 2 }}>
        No separate preview password is needed. The editor key stays in an
        OpenShift Secret. Only jobs approved by the server are available for
        preview; configure authenticated access before member-specific rollout.
      </Alert>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {playbackUrl && (
        <Box mt={3} maxWidth={900}>
          <Box
            component="video"
            ref={videoRef}
            key={playbackUrl}
            controls
            preload="metadata"
            playsInline
            src={playbackUrl}
            onError={() => setError("Video playback failed. The URL may have expired.")}
            sx={{ display: "block", width: "100%", maxHeight: 520, bgcolor: "black", borderRadius: 1 }}
          />
          <Typography color="text.secondary" variant="caption" display="block" mt={1}>
            Signed URLs expire automatically. Click Preview again to load a fresh URL.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function LearningResourcePreview() {
  const [tab, setTab] = useState(0);
  const [lessonOpened, setLessonOpened] = useState(false);

  const [selectedResourceId, setSelectedResourceId] =
    useState(LEARNING_RESOURCES[0].id);

  const selectedResource =
    LEARNING_RESOURCES.find(
      (resource) => resource.id === selectedResourceId
    ) ?? LEARNING_RESOURCES[0];

  const changeTab = (_event, nextTab) => {
    setTab(nextTab);

    if (nextTab === 1) {
      setLessonOpened(true);
    }
  };

  return (
    <Box mt={3}>
      <Typography
        variant="h5"
        fontWeight={600}
        mb={1}
      >
        Learning Resource Preview
      </Typography>

      <TextField
        select
        fullWidth
        size="small"
        label="Select Learning Resource"
        value={selectedResourceId}
        onChange={(event) =>
          setSelectedResourceId(event.target.value)
        }
        sx={{
          mt: 2,
          mb: 2,
          maxWidth: 450,
        }}
      >
        {LEARNING_RESOURCES.map((resource) => (
          <MenuItem
            key={resource.id}
            value={resource.id}
          >
            {resource.label}
          </MenuItem>
        ))}
      </TextField>

      <Tabs
        value={tab}
        onChange={changeTab}
        aria-label="Learning resource preview tabs"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab
          icon={<PlayCircleOutline />}
          iconPosition="start"
          label="Video"
          id="resource-tab-0"
          aria-controls="resource-panel-0"
        />

        <Tab
          icon={<MenuBookOutlined />}
          iconPosition="start"
          label="Interactive Lesson"
          id="resource-tab-1"
          aria-controls="resource-panel-1"
        />
      </Tabs>

      <Box
        id="resource-panel-0"
        role="tabpanel"
        aria-labelledby="resource-tab-0"
        hidden={tab !== 0}
      >
        <VideoPreview
          key={selectedResource.id}
          active={tab === 0}
          initialJobId={selectedResource.jobId}
        />
      </Box>

      <Box
        id="resource-panel-1"
        role="tabpanel"
        aria-labelledby="resource-tab-1"
        hidden={tab !== 1}
      >
        {lessonOpened && (
          <InteractiveLesson
            key={selectedResource.lessonId}
            lessonId={selectedResource.lessonId}
          />
        )}
      </Box>
    </Box>
  );
}

function Team() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const columns = [
    {
      field: "id",
      headerName: "ID",
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "age",
      headerName: "Age",
      type: "number",
      align: "left",
      headerAlign: "left",
    },
    {
      field: "phone",
      headerName: "Phone Number",
      flex: 1,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },
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
            access === "Admin"
              ? colors.greenAccent[600]
              : colors.greenAccent[700]
          }
          borderRadius="5px"
        >
          {access === "admin" && (
            <AdminPanelSettingsOutlined />
          )}

          {access === "manager" && (
            <SecurityOutlined />
          )}

          {access === "user" && (
            <LockOpenOutlined />
          )}

          <Typography
            color={colors.grey[100]}
            sx={{ ml: "0.2rem" }}
          >
            {access}
          </Typography>
        </Box>
      ),
    },
  ];

  return (
    <Box m="0.5rem 1rem">
      <Header
        title="TEAM"
        subtitle="Managing the team members"
      />

      <LearningResourcePreview />

      <Box
        m="2rem 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid
          rows={mockDataTeam}
          columns={columns}
        />
      </Box>
    </Box>
  );
}

export default Team;
