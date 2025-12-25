'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid2'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

// Component Imports
import CustomTabList from '@core/components/mui/TabList'

const AIBrandingSettings = ({ tabContentList }: { tabContentList: { [key: string]: ReactElement } }) => {
  // States
  const [activeTab, setActiveTab] = useState('ai-logo')

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 4, md: 6 }, py: 4 }}>
      <Card sx={{ p: 0, overflow: 'visible', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <TabContext value={activeTab}>
          <Grid container spacing={0}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box
                sx={{
                  p: { xs: 4, md: 6 },
                  height: '100%',
                  bgcolor: '#FAFAFA',
                  borderRight: { md: '1px solid #E5E7EB' }
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant='h5' sx={{ fontWeight: 600, color: '#111827', mb: 1 }}>
                    AI Branding
                  </Typography>
                  <Divider
                    sx={{
                      width: 40,
                      height: 3,
                      bgcolor: 'primary.main',
                      borderRadius: 2,
                      mb: 4
                    }}
                  />
                </Box>

                <CustomTabList
                  orientation='vertical'
                  onChange={handleChange}
                  className='is-full'
                  pill='true'
                  sx={{
                    '& .MuiTabs-indicator': {
                      display: 'none'
                    },
                    '& .MuiTab-root': {
                      mb: 1.5,
                      bgcolor: '#EFEFEF',
                      color: '#6B7280',
                      borderRadius: '10px',
                      minHeight: 48,
                      transition: 'all 0.2s ease-in-out',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      },
                      '&:hover:not(.Mui-selected)': {
                        bgcolor: '#E0E0E0',
                        transform: 'translateX(4px)'
                      },
                      '&.Mui-disabled': {
                        opacity: 0.5,
                        cursor: 'not-allowed'
                      }
                    }
                  }}
                >
                  {/* AI Branding Section */}
                  <Typography variant='caption' sx={{ px: 2, py: 1, color: '#9CA3AF', fontWeight: 600 }}>
                    AI Branding
                  </Typography>

                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <span>AI Logo & Brand Kit</span>
                      </Box>
                    }
                    icon={<i className='tabler-wand' />}
                    iconPosition='start'
                    value='ai-logo'
                    className='flex-row justify-start !min-is-full'
                  />

                  <Tab
                    label='AI Foto Produk'
                    icon={<i className='tabler-package' />}
                    iconPosition='start'
                    value='ai-product-photo'
                    className='flex-row justify-start !min-is-full'
                  />

                  <Tab
                    label='AI Foto Fashion'
                    icon={<i className='tabler-hanger' />}
                    iconPosition='start'
                    value='ai-fashion-photo'
                    className='flex-row justify-start !min-is-full'
                  />

                  <Tab
                    label='AI Gabung Foto & Mockup'
                    icon={<i className='tabler-photo-plus' />}
                    iconPosition='start'
                    value='ai-merge-photo'
                    className='flex-row justify-start !min-is-full'
                  />

                  <Tab
                    label='AI Banner & Ads Creative'
                    icon={<i className='tabler-ad' />}
                    iconPosition='start'
                    value='ai-banner'
                    className='flex-row justify-start !min-is-full'
                    disabled
                  />

                  <Tab
                    label='Foto jadi Video'
                    icon={<i className='tabler-video' />}
                    iconPosition='start'
                    value='ai-photo-to-video'
                    className='flex-row justify-start !min-is-full'
                    disabled
                  />

                  {/* AI Copywriting & Marketing Section */}
                  <Typography variant='caption' sx={{ px: 2, py: 1, mt: 3, color: '#9CA3AF', fontWeight: 600 }}>
                    AI Copywriting & Marketing
                  </Typography>

                  <Tab
                    label='AI Copywriting'
                    icon={<i className='tabler-writing' />}
                    iconPosition='start'
                    value='ai-copywriting'
                    className='flex-row justify-start !min-is-full'
                    disabled
                  />

                  <Tab
                    label='AI Marketing'
                    icon={<i className='tabler-chart-arrows-vertical' />}
                    iconPosition='start'
                    value='ai-marketing'
                    className='flex-row justify-start !min-is-full'
                    disabled
                  />

                  <Tab
                    label='AI Ads Analytics'
                    icon={<i className='tabler-chart-bar' />}
                    iconPosition='start'
                    value='ai-ads-analytics'
                    className='flex-row justify-start !min-is-full'
                    disabled
                  />
                </CustomTabList>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 9 }}>
              <Box sx={{ p: { xs: 4, md: 6 } }}>
                <TabPanel value={activeTab} className='p-0'>
                  {tabContentList[activeTab]}
                </TabPanel>
              </Box>
            </Grid>
          </Grid>
        </TabContext>
      </Card>
    </Box>
  )
}

export default AIBrandingSettings
