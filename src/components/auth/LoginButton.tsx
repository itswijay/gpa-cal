import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'

interface LoginButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  onLoginSuccess?: (isNewUser: boolean) => void
}

export function LoginButton({
  variant = 'outline',
  size = 'default',
  className = '',
  onLoginSuccess,
}: LoginButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onLoginSuccess) {
      onLoginSuccess(false)
    }
    navigate('/login')
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      <span className="flex items-center gap-2">Sign In</span>
    </Button>
  )
}
