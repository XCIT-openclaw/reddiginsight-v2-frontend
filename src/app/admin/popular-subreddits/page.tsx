'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Info, Database } from 'lucide-react';

interface SubredditInfo {
  name: string;
  description: string;
  subscribers: number;
}

interface ParsedResult {
  names: SubredditInfo[];
  total: number;
}

function parseRedditJson(raw: string): { names: SubredditInfo[]; total: number } | { error: string } {
  if (!raw.trim()) return { error: 'Please paste JSON data first.' };

  const seen = new Set<string>();
  const subreddits: SubredditInfo[] = [];

  const childPattern = /"kind"\s*:\s*"t5"\s*,\s*"data"\s*:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*?)\}/g;
  let match;

  while ((match = childPattern.exec(raw)) !== null) {
    try {
      const block = match[1];
      const nameMatch = block.match(/"display_name"\s*:\s*"([^"]+)"/);
      const descMatch = block.match(/"public_description"\s*:\s*"([^"]*)"/);
      const titleMatch = block.match(/"title"\s*:\s*"([^"]*)"/);
      const subsMatch = block.match(/"subscribers"\s*:\s*(\d+)/);
      const fullDescMatch = block.match(/"description"\s*:\s*"([^"]*)"/);

      const name = nameMatch ? nameMatch[1] : null;
      if (!name || seen.has(name)) continue;
      seen.add(name);

      let description = '';
      if (descMatch && descMatch[1].trim()) {
        description = descMatch[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').trim();
      } else if (fullDescMatch && fullDescMatch[1].trim()) {
        const raw = fullDescMatch[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').trim();
        description = raw.split(/[.!?]\s/)[0] || raw.substring(0, 200);
      } else if (titleMatch && titleMatch[1] !== name) {
        description = titleMatch[1];
      }

      const subscribers = subsMatch ? parseInt(subsMatch[1]) : 0;

      subreddits.push({ name, description, subscribers });
    } catch {
      // Skip malformed blocks
    }
  }

  if (subreddits.length === 0) {
    const nameRegex = /"display_name"\s*:\s*"([^"]+)"/g;
    while ((match = nameRegex.exec(raw)) !== null) {
      const name = match[1];
      if (name && !seen.has(name)) {
        seen.add(name);
        subreddits.push({ name, description: '', subscribers: 0 });
      }
    }
  }

  if (subreddits.length === 0) {
    return { error: 'No subreddits found. Paste Reddit popular.json content.' };
  }

  return { names: subreddits, total: subreddits.length };
}

export default function AdminPopularSubredditsPage() {
  const { isAdmin, loading: authLoading, profileLoading } = useAuth();
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedResult | { error: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleParse = () => {
    setSaveStatus(null);
    const result = parseRedditJson(jsonInput);
    setParsed(result);
  };

  const handleSave = async () => {
    if (!jsonInput.trim()) return;
    setLoading(true);
    setSaveStatus(null);

    const result = parsed || parseRedditJson(jsonInput);
    if ('error' in result) {
      setParsed(result);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/popular-subreddits', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ subreddits: result.names }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus({ type: 'success', message: 'Saved ' + data.count + ' popular subreddits to database.' });
      } else {
        setSaveStatus({ type: 'error', message: data.error || 'Unknown error.' });
      }
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: 'Network error: ' + (err.message || 'Failed') });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin: Popular Subreddits</h1>
          <p className="text-muted-foreground mt-2">
            Manually update the popular subreddits cache. Supports concatenated multi-page JSON.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Paste Popular Subreddits JSON
            </CardTitle>
            <CardDescription>
              Copy JSON from{' '}
              <a href="https://www.reddit.com/subreddits/popular.json?limit=100" target="_blank" rel="noopener noreferrer" className="underline">
                reddit.com/subreddits/popular.json
              </a>
              . You can paste multiple pages concatenated together.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full h-64 p-4 border rounded-lg font-mono text-xs bg-muted/50"
              placeholder="Paste Reddit popular.json content here (supports multiple concatenated pages)..."
              value={jsonInput}
              onChange={(e) => { setJsonInput(e.target.value); setParsed(null); setSaveStatus(null); }}
              spellCheck={false}
            />

            {jsonInput.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {jsonInput.length.toLocaleString()} characters pasted
              </p>
            )}

            {parsed && 'error' in parsed && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{parsed.error}</AlertDescription>
              </Alert>
            )}

            {parsed && !('error' in parsed) && (
              <Alert className="mt-4">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Found <strong>{parsed.total}</strong> subreddits.
                </AlertDescription>
              </Alert>
            )}

            {saveStatus && (
              <Alert variant={saveStatus.type === 'success' ? 'default' : 'destructive'} className="mt-4">
                {saveStatus.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertDescription>{saveStatus.message}</AlertDescription>
              </Alert>
            )}

            <div className="mt-4 flex gap-3">
              <Button onClick={handleParse} disabled={!jsonInput.trim()}>
                Parse JSON
              </Button>
              <Button onClick={handleSave} disabled={loading || !jsonInput.trim()} variant="default">
                {loading ? 'Saving...' : 'Save to Database'}
              </Button>
              <Button variant="outline" onClick={() => { setJsonInput(''); setParsed(null); setSaveStatus(null); }}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {parsed && !('error' in parsed) && parsed.names.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Preview ({parsed.names.length} subreddits)
              </CardTitle>
              <CardDescription>These subreddits will be saved on confirmation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                {parsed.names.map((item) => (
                  <Badge key={item.name} variant="secondary" className="text-sm">
                    r/{item.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}




