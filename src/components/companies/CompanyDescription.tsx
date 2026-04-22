"use client";

import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useSupabase } from "@/hooks/useSupabase";
import { trackCompanyEngage } from "@/services/companies.service";

const TRUNCATE_AT = 500;

interface CompanyDescriptionProps {
  description: string;
  companyId: string;
}

export function CompanyDescription({
  description,
  companyId,
}: CompanyDescriptionProps) {
  const supabase = useSupabase();
  const [expanded, setExpanded] = useState(false);

  const needsTruncation = description.length > TRUNCATE_AT;
  const displayed = needsTruncation && !expanded
    ? description.slice(0, TRUNCATE_AT).trimEnd()
    : description;

  const handleExpand = () => {
    setExpanded(true);
    trackCompanyEngage(supabase, companyId).catch(() => {});
  };

  return (
    <Box>
      <Typography color="text.secondary" sx={{ lineHeight: 1.85, fontSize: "1rem" }}>
        {displayed}
        {needsTruncation && !expanded && "…"}
      </Typography>

      {needsTruncation && (
        <Button
          size="small"
          variant="text"
          onClick={expanded ? () => setExpanded(false) : handleExpand}
          endIcon={expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          sx={{
            mt: 1,
            px: 0,
            fontWeight: 600,
            color: "primary.main",
            "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
          }}
          disableRipple
        >
          {expanded ? "Restrânge" : "Citește mai mult"}
        </Button>
      )}
    </Box>
  );
};
