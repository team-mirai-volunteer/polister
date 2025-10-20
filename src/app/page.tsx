import { Box, Container } from "@mui/material";

import { getSystemMetricsAction } from "@/features/statistics/application/actions/getSystemMetricsAction";

import { HomePageContent } from "./_components/HomePageContent";

export default async function Home() {
  const metrics = await getSystemMetricsAction();

  return (
    <Box component="div">
      <Container maxWidth="lg">
        <HomePageContent metrics={metrics} />
      </Container>
    </Box>
  );
}
