// src/pages/CreateDocument.tsx
import { useState } from 'react';
import { Box, Grid, Tab, Tabs, Typography, Paper } from '@mui/material';
import { Description, PictureAsPdf, Group, Email } from '@mui/icons-material';
import ConfluenceLoaderForm from '../components/Loaders/ConfluenceLoaderForm';
import PDFLoaderForm from '../components/Loaders/PDFLoaderForm';
import TeamsLoaderForm from '../components/Loaders/TeamsLoaderForm';
import EmailLoaderForm from '../components/Loaders/EmailLoaderForm';
import MetadataDisplay from '../components/MetadataDisplay';

const loaderTabs = [
  { label: "Confluence", icon: <Description fontSize="small" /> },
  { label: "PDF", icon: <PictureAsPdf fontSize="small" /> },
  { label: "Teams", icon: <Group fontSize="small" /> },
  { label: "Email", icon: <Email fontSize="small" /> },
];

export default function CreateDocument() {
  const [tabIndex, setTabIndex] = useState(0);
  const [metadata, setMetadata] = useState<any>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleMetadataUpdate = (data: any) => {
    setMetadata(data);
  };

  const renderLoader = () => {
    switch (tabIndex) {
      case 0:
        return <ConfluenceLoaderForm onLoaded={handleMetadataUpdate} />;
      case 1:
        return <PDFLoaderForm onLoaded={handleMetadataUpdate} />;
      case 2:
        return <TeamsLoaderForm onLoaded={handleMetadataUpdate} />;
      case 3:
        return <EmailLoaderForm onLoaded={handleMetadataUpdate} />;
      default:
        return null;
    }
  };

  return (
    <Grid container height="100%">
      <Grid item xs={2} sx={{ borderRight: 1, borderColor: 'divider' }}>
        <Tabs
          orientation="vertical"
          value={tabIndex}
          onChange={handleTabChange}
          sx={{ borderRight: 1, borderColor: 'divider', height: '100%' }}
        >
          {loaderTabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              iconPosition="start"
              label={tab.label}
            />
          ))}
        </Tabs>
      </Grid>

      <Grid item xs={10} p={3}>
        <Typography variant="h6" gutterBottom>
          {loaderTabs[tabIndex].label} Loader
        </Typography>
        <Paper elevation={1} sx={{ p: 2, mb: 4 }}>{renderLoader()}</Paper>
        <MetadataDisplay data={metadata} />
      </Grid>
    </Grid>
  );
}
