import React from "react";
import { Box, Chip, Link, Paper, Typography } from "@mui/material";

// Only render browser-safe URLs provided by the trusted backend.
function safeImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch (_error) {
    return null;
  }
}

function EducationSearchResults({ results = [] }) {
  if (!Array.isArray(results) || results.length === 0) return null;

  return (
    <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1.25 }}>
      {results.map((item, index) => (
        <Paper
          key={item.search_id || index}
          variant="outlined"
          sx={{ p: 1.5, bgcolor: "transparent", minWidth: 0 }}
        >
          <Typography fontWeight={700} variant="subtitle1" sx={{ overflowWrap: "anywhere" }}>
            {item.title || "Educational resource"}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, my: 0.8 }}>
            {item.content_type && <Chip size="small" label={item.content_type} />}
            {item.match_type && <Chip size="small" label={item.match_type} />}
            {typeof item.answer_supported === "boolean" && (
              <Chip
                size="small"
                color={item.answer_supported ? "success" : "default"}
                label={item.answer_supported ? "Answer supported" : "Related resource"}
              />
            )}
          </Box>
          {item.evidence && (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {item.evidence}
            </Typography>
          )}
          {item.reason && (
            <Typography variant="caption" sx={{ display: "block", mt: 0.75, overflowWrap: "anywhere" }}>
              {item.reason}
            </Typography>
          )}
          {Array.isArray(item.images) && item.images.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
              {item.images.map((img, imgIndex) => {
                const url = safeImageUrl(typeof img === "string" ? img : img?.url);
                if (!url) return null;
                const alt = typeof img === "object" ? img.alt_text || "Educational figure" : "Educational figure";
                return (
                  <Link key={`${item.search_id || index}-${imgIndex}`} href={url} target="_blank" rel="noopener noreferrer" sx={{ display: "inline-block" }}>
                    <Box component="img" src={url} alt={alt} loading="lazy" sx={{ maxWidth: "100%", maxHeight: 230, borderRadius: 1, objectFit: "contain" }} />
                  </Link>
                );
              })}
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  );
}

export default EducationSearchResults;
