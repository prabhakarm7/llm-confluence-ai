// src/pages/CreateDocument.tsx
import { useState } from 'react';
import { Box, Grid, Tab, Tabs, Typography, Paper } from '@mui/material';
import ConfluenceLoaderForm from '../components/Loaders/ConfluenceLoaderForm';
import PDFLoaderForm from '../components/Loaders/PDFLoaderForm';
import TeamsLoaderForm from '../components/Loaders/TeamsLoaderForm';
import EmailLoaderForm from '../components/Loaders/EmailLoaderForm';
import MetadataDisplay from '../components/MetadataDisplay';

const loaderTabs = ["Confluence", "PDF", "Teams", "Email"];

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
          {loaderTabs.map((label, index) => (
            <Tab label={label} key={index} />
          ))}
        </Tabs>
      </Grid>

      <Grid item xs={10} p={3}>
        <Typography variant="h6" gutterBottom>
          {loaderTabs[tabIndex]} Loader
        </Typography>
        <Paper elevation={1} sx={{ p: 2, mb: 4 }}>{renderLoader()}</Paper>
        <MetadataDisplay data={metadata} />
      </Grid>
    </Grid>
  );
}


// src/components/Loaders/ConfluenceLoaderForm.tsx
import { useState } from 'react';
import { Button, TextField, Stack } from '@mui/material';

interface Props {
  onLoaded: (metadata: any) => void;
}

const ConfluenceLoaderForm = ({ onLoaded }: Props) => {
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    // Simulate metadata fetch after loading
    onLoaded({
      title: "Confluence Page Title",
      author: "Jane Doe",
      created_at: "2024-05-01",
      tags: ["confluence", "internal"],
    });
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Confluence Page URL"
        fullWidth
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Button variant="contained" onClick={handleSubmit}>
        Load Confluence Page
      </Button>
    </Stack>
  );
};

export default ConfluenceLoaderForm;


// src/components/MetadataDisplay.tsx
import { Box, Chip, Stack, Typography } from '@mui/material';

interface Props {
  data: any;
}

const MetadataDisplay = ({ data }: Props) => {
  if (!data) return null;

  return (
    <Box>
      <Typography variant="subtitle1">Metadata</Typography>
      <Stack spacing={1} mt={1}>
        {data.title && <Typography>Title: {data.title}</Typography>}
        {data.author && <Typography>Author: {data.author}</Typography>}
        {data.created_at && <Typography>Created At: {data.created_at}</Typography>}
        {data.tags && (
          <Stack direction="row" spacing={1}>
            {data.tags.map((tag: string, idx: number) => (
              <Chip key={idx} label={tag} />
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default MetadataDisplay;
