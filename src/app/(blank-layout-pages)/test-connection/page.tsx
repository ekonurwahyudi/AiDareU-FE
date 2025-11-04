'use client'

import { useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

interface TestResult {
  status: 'success' | 'error' | 'loading' | 'idle'
  message?: string
  data?: any
  error?: string
}

const TestConnectionPage = () => {
  const [healthCheck, setHealthCheck] = useState<TestResult>({ status: 'idle' })
  const [dbCheck, setDbCheck] = useState<TestResult>({ status: 'idle' })
  const [corsCheck, setCorsCheck] = useState<TestResult>({ status: 'idle' })
  const [authCheck, setAuthCheck] = useState<TestResult>({ status: 'idle' })

  // Get backend base URL (without /api suffix)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  const testHealthCheck = async () => {
    setHealthCheck({ status: 'loading' })
    try {
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      const data = await response.json()

      if (response.ok) {
        setHealthCheck({
          status: 'success',
          message: data.message,
          data: data
        })
      } else {
        setHealthCheck({
          status: 'error',
          error: data.message || 'Health check failed'
        })
      }
    } catch (error: any) {
      setHealthCheck({
        status: 'error',
        error: error.message || 'Network error'
      })
    }
  }

  const testDatabaseConnection = async () => {
    setDbCheck({ status: 'loading' })
    try {
      const response = await fetch(`${backendUrl}/api/test-db`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      const data = await response.json()

      if (response.ok) {
        setDbCheck({
          status: 'success',
          message: data.message,
          data: data
        })
      } else {
        setDbCheck({
          status: 'error',
          error: data.error || data.message || 'Database check failed'
        })
      }
    } catch (error: any) {
      setDbCheck({
        status: 'error',
        error: error.message || 'Network error'
      })
    }
  }

  const testCORS = async () => {
    setCorsCheck({ status: 'loading' })
    try {
      const response = await fetch(`${backendUrl}/api/test-cors`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (response.ok) {
        setCorsCheck({
          status: 'success',
          message: data.message,
          data: data
        })
      } else {
        setCorsCheck({
          status: 'error',
          error: data.message || 'CORS check failed'
        })
      }
    } catch (error: any) {
      setCorsCheck({
        status: 'error',
        error: error.message || 'CORS error - Check CORS configuration'
      })
    }
  }

  const testAuthEndpoint = async () => {
    setAuthCheck({ status: 'loading' })
    try {
      const token = localStorage.getItem('auth_token')
      const userUuid = JSON.parse(localStorage.getItem('user_data') || '{}').uuid

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      if (userUuid) {
        headers['X-User-UUID'] = userUuid
      }

      const response = await fetch(`${backendUrl}/api/users/me`, {
        method: 'GET',
        credentials: 'include',
        headers
      })

      const data = await response.json()

      if (response.ok) {
        setAuthCheck({
          status: 'success',
          message: 'Authentication working! User data retrieved.',
          data: data
        })
      } else {
        setAuthCheck({
          status: 'error',
          error: data.message || `Auth check failed (${response.status})`
        })
      }
    } catch (error: any) {
      setAuthCheck({
        status: 'error',
        error: error.message || 'Network error'
      })
    }
  }

  const runAllTests = async () => {
    await testHealthCheck()
    await testDatabaseConnection()
    await testCORS()
    await testAuthEndpoint()
  }

  const renderTestResult = (result: TestResult, title: string) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
      {result.status === 'idle' && (
        <Alert severity="info">Not tested yet</Alert>
      )}
      {result.status === 'loading' && (
        <Alert severity="info" icon={<CircularProgress size={20} />}>
          Testing...
        </Alert>
      )}
      {result.status === 'success' && (
        <>
          <Alert severity="success">{result.message}</Alert>
          {result.data && (
            <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </Box>
          )}
        </>
      )}
      {result.status === 'error' && (
        <Alert severity="error">{result.error}</Alert>
      )}
    </Box>
  )

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] p-6'>
      <Card className='flex flex-col sm:is-[800px]'>
        <CardContent className='sm:!p-12'>
          <Typography variant='h4' className='mbe-6'>
            Backend Connection Test
          </Typography>

          <Typography variant='body2' className='mbe-6' color='text.secondary'>
            Backend URL: <strong>{backendUrl}</strong>
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Button
              variant='contained'
              onClick={runAllTests}
              fullWidth
              sx={{ mb: 2 }}
            >
              Run All Tests
            </Button>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant='outlined' onClick={testHealthCheck} size='small'>
                Health Check
              </Button>
              <Button variant='outlined' onClick={testDatabaseConnection} size='small'>
                Database Check
              </Button>
              <Button variant='outlined' onClick={testCORS} size='small'>
                CORS Check
              </Button>
              <Button variant='outlined' onClick={testAuthEndpoint} size='small'>
                Auth Check
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {renderTestResult(healthCheck, '1. Health Check')}
          {renderTestResult(dbCheck, '2. Database Connection')}
          {renderTestResult(corsCheck, '3. CORS Configuration')}
          {renderTestResult(authCheck, '4. Authentication Endpoint')}

          <Divider sx={{ my: 3 }} />

          <Typography variant='body2' color='text.secondary'>
            <strong>Troubleshooting:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>If Health Check fails: Backend is not running or URL is wrong</li>
              <li>If Database Check fails: Database connection issue</li>
              <li>If CORS Check fails: CORS configuration needs update</li>
              <li>If Auth Check fails: Login first or session expired</li>
            </ul>
          </Typography>
        </CardContent>
      </Card>
    </div>
  )
}

export default TestConnectionPage
