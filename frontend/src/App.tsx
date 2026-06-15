import { Button } from "@/components/ui/button"

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="text-3xl font-semibold tracking-tight">Finance Agent</h1>
      <p className="text-muted-foreground">
        Vite + React + Tailwind CSS + shadcn/ui is ready.
      </p>
      <Button>Click me</Button>
    </div>
  )
}

export default App
