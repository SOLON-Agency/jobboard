"use client";

import React from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BusinessIcon from "@mui/icons-material/Business";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const features = [
  {
    icon: <SearchIcon sx={{ fontSize: 40 }} />,
    title: "Smart Job Search",
    description:
      "Filter by location, salary, experience level, and more. Full-text search across all listings.",
  },
  {
    icon: <BusinessIcon sx={{ fontSize: 40 }} />,
    title: "Company Profiles",
    description:
      "Explore top law firms, read about their culture, and browse all their open positions.",
  },
  {
    icon: <NotificationsActiveIcon sx={{ fontSize: 40 }} />,
    title: "Job Alerts",
    description:
      "Save your search filters and get notified when new matching positions are posted.",
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
    title: "Career Growth",
    description:
      "From internships to senior roles, find opportunities that match your career stage.",
  },
];

export const FeaturesSection: React.FC = () => (
  <Container maxWidth="lg" sx={{ pb: 10 }}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          md: "repeat(4, 1fr)",
        },
        gap: 3,
        mb: 6
      }}
    >
      {features.map((feature) => (
        <Card key={feature.title}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ color: "primary.main", mb: 2 }}>{feature.icon}</Box>
            <Typography variant="h5" sx={{ mb: 1 }}>
              {feature.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {feature.description}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  </Container>
);
