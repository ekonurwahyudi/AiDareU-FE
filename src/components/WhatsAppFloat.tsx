'use client'

import { useState, useEffect } from 'react'
import { Box, IconButton, Paper, Typography, TextField, Avatar, Fade, Chip } from '@mui/material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'

const WhatsAppFloat = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [userName, setUserName] = useState('User')
  const phoneNumber = '628121555423' // Format internasional tanpa +

  // Get user name from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserName(user.name || user.username || 'User')
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      // Format pesan dan buka WhatsApp
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')

      // Reset form dan tutup popup
      setMessage('')
      setIsOpen(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chat Popup */}
      <Fade in={isOpen}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 24,
            width: 350,
            maxWidth: 'calc(100vw - 48px)',
            borderRadius: 3,
            overflow: 'hidden',
            zIndex: 1300,
            display: isOpen ? 'block' : 'none'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #00a884 0%, #008069 100%)',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Avatar
              src="/images/avatars/1.png"
              sx={{
                width: 50,
                height: 50,
                border: '3px solid rgba(255,255,255,0.3)',
                position: 'relative'
              }}
            >
              CS
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: 'white' }}>
                Customer Support
              </Typography>
              <Chip
                label="Online"
                size="small"
                sx={{
                  bgcolor: '#4ade80',
                  color: 'white',
                  fontWeight: 500,
                  height: 20,
                  fontSize: '0.75rem',
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            </Box>
            <IconButton
              onClick={handleToggle}
              sx={{
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Chat Body */}
          <Box
            sx={{
              p: 3,
              minHeight: 200,
              bgcolor: '#f0f2f5',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="80" height="80" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 0h80v80H0z" fill="%23f0f2f5"/%3E%3Cpath d="M0 0l40 40-40 40zm80 0v80L40 40z" fill="%23e9edef" fill-opacity="0.4"/%3E%3C/svg%3E")',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            {/* Timestamp */}
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.9)',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: '0.75rem',
                  color: '#667781'
                }}
              >
                {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>

            {/* Welcome Message Bubble */}
            <Box
              sx={{
                bgcolor: 'white',
                p: 2,
                borderRadius: 2,
                maxWidth: '85%',
                alignSelf: 'flex-start',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: -8,
                  top: 12,
                  width: 0,
                  height: 0,
                  borderStyle: 'solid',
                  borderWidth: '0 8px 8px 0',
                  borderColor: 'transparent white transparent transparent'
                }
              }}
            >
              <Typography variant="body2" sx={{ mb: 1, fontSize: '0.95rem' }}>
                Hi, {userName} 👋
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
                Ada yang bisa kami bantu? 😊
              </Typography>
            </Box>
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              bgcolor: '#f0f2f5',
              borderTop: '1px solid #e9edef'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'flex-end',
                bgcolor: 'white',
                borderRadius: 3,
                p: 1,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Ketik pertanyaanmu disini..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: '0.95rem',
                    px: 1,
                    '& textarea': {
                      '&::placeholder': {
                        color: '#8696a0',
                        opacity: 1
                      }
                    }
                  }
                }}
              />
              <IconButton
                onClick={handleSendMessage}
                disabled={!message.trim()}
                sx={{
                  bgcolor: '#25d366',
                  color: 'white',
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                  '&:hover': {
                    bgcolor: '#20bd5a'
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#e9edef',
                    color: '#8696a0'
                  }
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* Floating WhatsApp Button */}
      <IconButton
        onClick={handleToggle}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          bgcolor: '#25d366',
          color: 'white',
          boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
          zIndex: 1300,
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: '#20bd5a',
            transform: 'scale(1.1)',
            boxShadow: '0 6px 20px rgba(37, 211, 102, 0.5)'
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            right: -2,
            width: 16,
            height: 16,
            bgcolor: '#ff3b30',
            borderRadius: '50%',
            border: '2px solid white',
            animation: 'pulse-dot 2s ease-in-out infinite',
            '@keyframes pulse-dot': {
              '0%, 100%': {
                transform: 'scale(1)',
                opacity: 1
              },
              '50%': {
                transform: 'scale(1.1)',
                opacity: 0.8
              }
            }
          }
        }}
      >
        <WhatsAppIcon sx={{ fontSize: 32 }} />
      </IconButton>
    </>
  )
}

export default WhatsAppFloat
