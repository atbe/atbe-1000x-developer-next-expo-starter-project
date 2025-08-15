import { ThemeSelector } from '~/components/theme-selector';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export default function ThemeDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Theme Selector Demo</h1>
          <p className="text-muted-foreground mb-6">
            Switch between Light, Dark, and System themes using the selector
            below
          </p>
          <div className="flex justify-center">
            <ThemeSelector />
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Features</CardTitle>
              <CardDescription>
                The theme selector provides three options:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">Light:</span>
                  <span className="text-muted-foreground">
                    A clean, bright theme perfect for daytime use
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">Dark:</span>
                  <span className="text-muted-foreground">
                    A dark theme that's easy on the eyes in low-light conditions
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">System:</span>
                  <span className="text-muted-foreground">
                    Automatically matches your operating system's theme
                    preference
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Component Examples</CardTitle>
              <CardDescription>
                See how different components look with the selected theme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo-input">Input Field</Label>
                <Input id="demo-input" placeholder="Type something here..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nested Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This is a nested card component
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Another Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Colors adapt to the theme
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
