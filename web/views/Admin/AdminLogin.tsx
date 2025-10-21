import { useState } from 'preact/hooks'
import { useLanguage } from '../../helpers/i18n'
import { alpha, styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import LockIcon from '@mui/icons-material/Lock'
import Fade from '@mui/material/Fade'
import { Layout, LayoutProps } from '../../components'

const LoginCard = styled(Card)(() => ({
  background: alpha('#ffffff', 0.1),
  backdropFilter: 'blur(20px) saturate(180%)',
  border: `1px solid ${alpha('#ffffff', 0.2)}`,
  borderRadius: 32,
  boxShadow: '0 25px 45px rgba(0, 0, 0, 0.1), 0 15px 35px rgba(0, 0, 0, 0.05)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  position: 'relative',
  maxWidth: 400,
  width: '100%',
  margin: '0 auto',
  '@media (max-width: 768px)': {
    borderRadius: 24,
    maxWidth: '100%',
    margin: '0 16px',
  },
  '@media (max-width: 480px)': {
    borderRadius: 20,
    margin: '0 8px',
  },
}))

const LoginButton = styled(Button)(() => ({
  borderRadius: 20,
  padding: '16px 32px',
  background:
    'linear-gradient(135deg, rgb(24, 33, 57) 0%, rgb(18, 25, 43) 100%)',
  backgroundSize: '200% 200%',
  boxShadow: '0 8px 32px rgba(24, 33, 57, 0.25)',
  border: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  '@media (max-width: 768px)': {
    padding: '14px 28px',
    fontSize: '0.95rem',
    borderRadius: 16,
  },
  '@media (max-width: 480px)': {
    padding: '12px 24px',
    fontSize: '0.9rem',
    borderRadius: 14,
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(24, 33, 57, 0.35)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}))

interface AdminLoginProps extends LayoutProps {
  onLogin: (token: string) => void
}

export function AdminLogin(props: AdminLoginProps) {
  const { onLogin } = props
  const { t } = useLanguage()
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (!token.trim()) {
      setError(t('admin.login.tokenRequired'))
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Test the token by making a request to the admin API
      const response = await fetch('/api/admin/info', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        onLogin(token)
      } else {
        setError(t('admin.login.invalidToken'))
      }
    } catch (_err) {
      setError(t('admin.login.connectionError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleTokenChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    setToken(target.value)
    setError('')
  }

  return (
    <Layout>
      <Fade in timeout={800}>
        <Container
          maxWidth="sm"
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 3,
            '@media (max-width: 768px)': {
              padding: 2,
            },
            '@media (max-width: 480px)': {
              padding: 1,
            },
          }}
        >
          <LoginCard>
            <CardContent
              sx={{
                p: 4,
                '@media (max-width: 768px)': {
                  p: 3,
                },
                '@media (max-width: 480px)': {
                  p: 2,
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                {/* Header */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '50%',
                      background: alpha('#ffffff', 0.1),
                      border: `1px solid ${alpha('#ffffff', 0.2)}`,
                    }}
                  >
                    <LockIcon
                      sx={{
                        fontSize: 32,
                        color: alpha('#ffffff', 0.8),
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{
                      color: alpha('#ffffff', 0.9),
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    {t('admin.login.title')}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: alpha('#ffffff', 0.7),
                      textAlign: 'center',
                    }}
                  >
                    {t('admin.login.subtitle')}
                  </Typography>
                </Box>

                {/* Login Form */}
                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <TextField
                    fullWidth
                    type="password"
                    value={token}
                    onChange={handleTokenChange}
                    placeholder={t('admin.login.tokenPlaceholder')}
                    error={!!error}
                    helperText={error}
                    disabled={isLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        background: alpha('#ffffff', 0.1),
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${alpha('#ffffff', 0.2)}`,
                        '& fieldset': {
                          border: 'none',
                        },
                        '&.Mui-focused': {
                          background: alpha('#ffffff', 0.2),
                          boxShadow: '0 8px 25px rgba(24, 33, 57, 0.15)',
                        },
                        '&.Mui-error': {
                          borderColor: '#ef4444',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: alpha('#ffffff', 0.9),
                        fontSize: '1rem',
                        '&::placeholder': {
                          color: alpha('#ffffff', 0.5),
                        },
                      },
                      '& .MuiFormHelperText-root': {
                        color: '#ef4444',
                        marginLeft: 0,
                        marginTop: 1,
                      },
                    }}
                  />

                  <LoginButton
                    type="submit"
                    variant="contained"
                    disabled={isLoading || !token.trim()}
                    sx={{
                      opacity: isLoading || !token.trim() ? 0.6 : 1,
                    }}
                  >
                    {isLoading
                      ? t('admin.login.signingIn')
                      : t('admin.login.signIn')}
                  </LoginButton>
                </Box>
              </Box>
            </CardContent>
          </LoginCard>
        </Container>
      </Fade>
    </Layout>
  )
}
