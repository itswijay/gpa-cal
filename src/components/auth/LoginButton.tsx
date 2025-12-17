import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'

interface LoginButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function LoginButton({
  variant = 'outline',
  size = 'default',
  className = '',
}: LoginButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/login')
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      <span className="flex items-center gap-2">
        Sign In
      </span>
    </Button>
  )
}
