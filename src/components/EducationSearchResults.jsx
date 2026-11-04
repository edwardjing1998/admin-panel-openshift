import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Link,
  Paper,
  Typography,
} from "@mui/material";

// Only render HTTP(S) URLs. Do not turn search IDs into invented URLs.
function safeImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch (_error) {
    return null;
  }
}

function ResourceCard({ item, index, related = false }) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(false);
  const images = Array.isArray(item.images) ? item.images : [];
  const hasDetails = Boolean(item.evidence || item.reason || item.search_id || images.length);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        bgcolor: "transparent",
        minWidth: 0,
        borderColor: selected ? "secondary.main" : undefined,
        borderWidth: selected ? 2 : 1,
      }}
    >
      <Typography fontWeight={700} variant="subtitle1" sx={{ overflowWrap: "anywhere" }}>
        {item.title || "Educational resource"}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, my: 0.8 }}>
        {item.content_type && <Chip size="small" label={item.content_type} />}
        {related ? (
          <Chip size="small" variant="outlined" label="Suggested, not verified" />
        ) : (
          <Chip size="small" color="success" variant="outlined" label="Search match" />
        )}
        {typeof item.answer_supported === "boolean" && (
          <Chip
            size="small"
            color={item.answer_supported ? "success" : "default"}
            label={item.answer_supported ? "Answer supported" : "Answer not verified"}
          />
        )}
      </Box>
      {related && (
        <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
          This resource is related to your question but may not be a lesson or a direct answer.
        </Typography>
      )}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          size="small"
          variant={selected ? "contained" : "outlined"}
          onClick={() => setSelected((value) => !value)}
          aria-pressed={selected}
        >
          {selected ? "Selected" : "Select resource"}
        </Button>
        {hasDetails && (
          <Button size="small" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Hide details" : "View details"}
          </Button>
        )}
      </Box>
      <Collapse in={expanded} unmountOnExit>
        <Box sx={{ mt: 1.25, display: "flex", flexDirection: "column", gap: 0.75 }}>
          {item.search_id != null && (
            <Typography variant="caption" sx={{ overflowWrap: "anywhere" }}>
              Resource ID: {String(item.search_id)}
            </Typography>
          )}
          {item.evidence && (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {item.evidence}
            </Typography>
          )}
          {item.reason && (
            <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
              {item.reason}
            </Typography>
          )}
          {images.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
              {images.map((img, imgIndex) => {
                const url = safeImageUrl(typeof img === "string" ? img : img?.url);
                if (!url) return null;
                const alt = typeof img === "object" ? img.alt_text || "Educational figure" : "Educational figure";
                return (
                  <Link
                    key={`${item.search_id || index}-${imgIndex}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Box
                      component="img"
                      src={url}
                      alt={alt}
                      loading="lazy"
                      sx={{ maxWidth: "100%", maxHeight: 230, borderRadius: 1, objectFit: "contain" }}
                    />
                  </Link>
                );
              })}
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

function EducationSearchResults({ results = [], relatedResults = [] }) {
  const verified = Array.isArray(results) ? results : [];
  const related = Array.isArray(relatedResults) ? relatedResults : [];
  if (!verified.length && !related.length) return null;

  return (
    <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1.25 }}>
      {verified.length > 0 && (
        <>
          <Typography variant="subtitle2" fontWeight={700}>
            Matching learning materials ({verified.length})
          </Typography>
          {verified.map((item, index) => (
            <ResourceCard key={item.search_id || `match-${index}`} item={item} index={index} />
          ))}
        </>
      )}
      {related.length > 0 && (
        <>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mt: verified.length ? 1 : 0 }}>
            Related learning materials ({related.length})
          </Typography>
          <Typography variant="caption">
            Suggestions are not verified answers. Select a resource and review its details.
          </Typography>
          {related.map((item, index) => (
            <ResourceCard
              key={item.search_id || `related-${index}`}
              item={item}
              index={index}
              related
            />
          ))}
        </>
      )}
    </Box>
  );
}

export default EducationSearchResults;
