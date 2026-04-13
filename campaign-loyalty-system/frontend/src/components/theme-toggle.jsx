import { Lightbulb, LightbulbOff } from "lucide-react"
import { Button } from "./ui/button"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light')
    else setTheme('dark')
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="relative w-12 h-12 rounded-none" aria-label="Toggle theme">
      <Lightbulb className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute text-primary" />
      <LightbulbOff className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-muted-foreground" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
