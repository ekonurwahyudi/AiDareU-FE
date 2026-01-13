'use client'

// React Imports
import { useRef, useState, useEffect } from 'react'
import type { MouseEvent } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

// Third-party Imports

// Type Imports

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Util Imports

// Styled component for badge content
const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})

const UserDropdown = () => {
  // States
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [coinBalance, setCoinBalance] = useState<number>(0)
  const [platformpreneur, setPlatformpreneur] = useState<{
    username: string
    judul: string
    perusahaan: string
    logo: string | null
    logo_footer: string | null
  } | null>(null)

  // Refs
  const anchorRef = useRef<HTMLDivElement>(null)

  // Hooks
  const router = useRouter()
  const { settings } = useSettings()

  useEffect(() => {
    // Fetch coin balance and user profile from backend
    fetchCoinBalance()
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

      if (!authToken) return

      const response = await fetch(`${backendUrl}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.user) {
          // Update user state with backend data
          setUser(result.user)
          // Update localStorage with fresh data
          localStorage.setItem('user_data', JSON.stringify(result.user))
          
          // Set platformpreneur data if available
          if (result.user.platformpreneur) {
            setPlatformpreneur(result.user.platformpreneur)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchCoinBalance = async () => {
    try {
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

      if (!authToken) return

      const response = await fetch(`${backendUrl}/api/coins/summary`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setCoinBalance(result.data.coin_saat_ini)
        }
      }
    } catch (error) {
      console.error('Error fetching coin balance:', error)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const handleDropdownOpen = () => {
    !open ? setOpen(true) : setOpen(false)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent), url?: string) => {
    if (url) {
      router.push(url)
    }

    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  const handleUserLogout = async () => {
    try {
      // Clear localStorage and redirect immediately for better UX
      const authToken = localStorage.getItem('auth_token')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('unverified_user')
      
      // Redirect first for immediate response
      router.push('/')
      
      // Backend API logout to clear Laravel session/token (non-blocking)
      if (authToken) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
        fetch(`${backendUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { 
            'Accept': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          credentials: 'include'
        }).catch(error => {
          console.log('Backend logout error (non-critical):', error)
        })
      }
      
    } catch (error) {
      console.error('Logout error:', error)
      
      // Even if there's an error, clear localStorage and redirect
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('unverified_user')
      router.push('/')
    }
  }

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <Avatar
          ref={anchorRef}
          alt={user?.name || ''}
          src={user?.image || '/images/avatars/1.png'}
          onClick={handleDropdownOpen}
          className='cursor-pointer bs-[38px] is-[38px]'
        />
      </Badge>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-3 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={e => handleDropdownClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <div className='flex items-center plb-2 pli-6 gap-2' tabIndex={-1}>
                    <Avatar alt={user?.name || ''} src={user?.image || '/images/avatars/1.png'} />
                    <div className='flex items-start flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {user?.name || ''}
                      </Typography>
                      <Typography variant='caption'>{user?.email || ''}</Typography>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  <MenuItem className='mli-2 gap-3' onClick={e => handleDropdownClose(e, '/apps/user/coin')}>
                    <i className='tabler-coin' />
                    <div className='flex items-center justify-between flex-grow'>
                      <Typography color='text.primary'>Coin</Typography>
                      <Chip
                        label={`🪙 ${formatNumber(coinBalance)} Pts`}
                        size='small'
                        color='warning'
                        variant='tonal'
                        sx={{ ml: 2, height: '20px', fontSize: '0.75rem' }}
                      />
                    </div>
                  </MenuItem>
                  <MenuItem className='mli-2 gap-3' onClick={e => handleDropdownClose(e, '/apps/settings')}>
                    <i className='tabler-user' />
                    <Typography color='text.primary'>My Profile</Typography>
                  </MenuItem>
                  
                  <MenuItem className='mli-2 gap-3' onClick={e => handleDropdownClose(e, '/apps/settings')}>
                    <i className='tabler-settings' />
                    <Typography color='text.primary'>Settings</Typography>
                  </MenuItem>
                  <MenuItem className='mli-2 gap-3' onClick={e => handleDropdownClose(e, '/apps/settings')}>
                    <i className='tabler-package' />
                    <div className='flex items-center justify-between flex-grow'>
                      <Typography color='text.primary'>Paket</Typography>
                      {platformpreneur?.logo ? (
                        <Box
                          component='img'
                          src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/storage/${platformpreneur.logo}`}
                          alt={platformpreneur.perusahaan || 'Partner'}
                          sx={{
                            ml: 2,
                            height: '24px',
                            maxWidth: '80px',
                            objectFit: 'contain'
                          }}
                          onError={(e: any) => {
                            // Hide broken image and show fallback chip
                            e.target.style.display = 'none'
                            const fallback = e.target.nextSibling
                            if (fallback) fallback.style.display = 'inline-flex'
                          }}
                        />
                      ) : null}
                      <Chip
                        label={user?.paket || 'Free'}
                        size='small'
                        color='success'
                        variant='tonal'
                        sx={{ 
                          ml: 2, 
                          height: '20px', 
                          fontSize: '0.75rem',
                          display: platformpreneur?.logo ? 'none' : 'inline-flex'
                        }}
                      />
                    </div>
                  </MenuItem>
                  {/* <MenuItem className='mli-2 gap-3' onClick={e => handleDropdownClose(e, '/pages/pricing')}>
                    <i className='tabler-currency-dollar' />
                    <Typography color='text.primary'>Pricing</Typography>
                  </MenuItem>
                  <MenuItem className='mli-2 gap-3' onClick={e => handleDropdownClose(e, '/pages/faq')}>
                    <i className='tabler-help-circle' />
                    <Typography color='text.primary'>FAQ</Typography>
                  </MenuItem> */}
                  <div className='flex items-center plb-2 pli-3'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      endIcon={<i className='tabler-logout' />}
                      onClick={handleUserLogout}
                      sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}
                    >
                      Logout
                    </Button>
                  </div>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default UserDropdown
