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
    title: "Căutare inteligentă",
    description:
      "Filtrează după locație, salariu, nivel de experiență și altele. Căutare completă în toate anunțurile.",
  },
  {
    icon: <BusinessIcon sx={{ fontSize: 40 }} />,
    title: "Profiluri de companii",
    description:
      "Explorează firmele de top, citește despre cultura lor și răsfoiește toate posturile disponibile.",
  },
  {
    icon: <NotificationsActiveIcon sx={{ fontSize: 40 }} />,
    title: "Alerte de locuri de muncă",
    description:
      "Salvează filtrele de căutare și fii notificat când apar posturi noi compatibile.",
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
    title: "Creștere în carieră",
    description:
      "De la stagii la roluri senior, găsește oportunități potrivite stadiului carierei tale.",
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
