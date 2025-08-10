export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 h-12 flex items-center justify-between text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} GIS Analyzer</p>
        <p>
          Tiles © OpenStreetMap contributors, ESRI World Imagery. Use responsibly.
        </p>
      </div>
    </footer>
  )
}
