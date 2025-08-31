import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function ThemeTestPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">NewMatter AI SDK</h1>
          <p className="text-xl text-muted-foreground">Testing our new vibrant blue color scheme</p>
        </div>

        {/* Color Scheme Demo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Primary Components */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Theme</CardTitle>
              <CardDescription>Main color scheme elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">Primary Button</Button>
              <Button variant="secondary" className="w-full">Secondary Button</Button>
              <Input placeholder="Enter some text..." />
            </CardContent>
          </Card>

          {/* Accent & Status */}
          <Card>
            <CardHeader>
              <CardTitle>Accents & Status</CardTitle>
              <CardDescription>Accent colors and status indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Error</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
              <Button variant="outline" className="w-full">Outline Button</Button>
              <Button variant="destructive" className="w-full">Destructive</Button>
            </CardContent>
          </Card>

          {/* Interactive Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Interactive Elements</CardTitle>
              <CardDescription>Hover and focus states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="ghost" className="w-full">Ghost Button</Button>
              <div className="p-4 border rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Muted background area</p>
              </div>
              <div className="p-4 border rounded-lg bg-accent text-accent-foreground">
                <p className="text-sm">Accent background area</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Theme Toggle Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>🎨 New Color Scheme Applied!</CardTitle>
            <CardDescription>Your shadcn/ui components now use a modern blue theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Light Mode Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Vibrant blue primary (oklch(0.55 0.25 260))</li>
                  <li>• Complementary cyan accent (oklch(0.65 0.2 210))</li>
                  <li>• Professional near-white background</li>
                  <li>• Enhanced contrast for accessibility</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Dark Mode Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bright blue primary (oklch(0.7 0.22 250))</li>
                  <li>• Sophisticated dark blue background</li>
                  <li>• Enhanced sidebar styling</li>
                  <li>• Consistent chart colors</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-primary/10 rounded-lg border">
              <p className="text-sm">
                <strong>💡 Pro Tip:</strong> Toggle your system dark mode to see both themes in action! 
                All shadcn/ui components will automatically use these new colors.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center">
          <Button variant="outline" asChild>
            <a href="/">← Back to Main App</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
