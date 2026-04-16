import api, { route } from '@forge/api';
import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('getText', (req) => {
  console.log(req);
  return 'Hello, world!';
});

resolver.define('echo', ({ payload }) => {
  const message = payload?.message;
  if (typeof message !== 'string') {
    return 'Send a message to echo.';
  }

  const trimmed = message.trim().slice(0, 200);
  return `You typed: ${trimmed || '(empty)'}`;
});

resolver.define('getServerTime', () => {
  return new Date().toISOString();
});

resolver.define('listIssues', async ({ payload }) => {
  const projectKey = payload?.projectKey;
  if (typeof projectKey !== 'string' || projectKey.trim().length === 0) {
    return { issues: [], error: 'Missing project key.' };
  }

  const safeProjectKey = projectKey.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_]{1,20}$/.test(safeProjectKey)) {
    return { issues: [], error: 'Project key format looks invalid.' };
  }

  const jql = `project = ${safeProjectKey} ORDER BY created DESC`;
  const res = await api.asApp().requestJira(route`/rest/api/3/search/jql`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jql,
      maxResults: 20,
      fields: ['summary', 'status'],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      issues: [],
      error: `Jira API error (${res.status}): ${text.slice(0, 500)}`,
    };
  }

  const data = await res.json();
  const issues = (data.issues || []).map((i) => ({
    key: i.key,
    summary: i.fields?.summary ?? '',
    status: i.fields?.status?.name ?? '',
  }));

  return { issues, error: null };
});

resolver.define('addComment', async ({ payload }) => {
  const issueKey = payload?.issueKey;
  const comment = payload?.comment;

  if (typeof issueKey !== 'string' || issueKey.trim().length === 0) {
    return { ok: false, error: 'Missing issue key.' };
  }
  if (typeof comment !== 'string') {
    return { ok: false, error: 'Missing comment.' };
  }

  const safeIssueKey = issueKey.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_]{1,20}-\d{1,10}$/.test(safeIssueKey)) {
    return { ok: false, error: 'Issue key format looks invalid.' };
  }

  const trimmed = comment.trim().slice(0, 2000);
  if (trimmed.length === 0) {
    return { ok: false, error: 'Comment is empty.' };
  }

  const body = {
    body: {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: trimmed }],
        },
      ],
    },
  };

  const res = await api
    .asApp()
    .requestJira(route`/rest/api/3/issue/${safeIssueKey}/comment`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `Jira API error (${res.status}): ${text.slice(0, 500)}` };
  }

  return { ok: true, error: null };
});

export const handler = resolver.getDefinitions();
