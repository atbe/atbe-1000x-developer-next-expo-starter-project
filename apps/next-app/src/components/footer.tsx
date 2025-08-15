import { Code2 } from 'lucide-react';
import { ThemeSelector } from '~/components/theme-selector';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Code2 className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              © {currentYear} Starter Project. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Theme:</span>
              <ThemeSelector />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
