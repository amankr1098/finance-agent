export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Finance Agent</span>
        <span>All rights reserved.</span>
      </div>
    </footer>
  );
}
