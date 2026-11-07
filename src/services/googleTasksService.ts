/**
 * Google Tasks Service
 * Handles interaction with the official Google Tasks API:
 * https://developers.google.com/tasks/reference/rest
 * 
 * Rules:
 * 1. Checks OAuth authentication state.
 * 2. Only performs operations if valid token exists.
 * 3. Never claims a task was added if disconnected or if the API call failed.
 * 4. Provides direct links and clear navigation instructions across Google Workspace.
 */

export interface GoogleTaskItem {
  id?: string;
  title: string;
  notes?: string;
  due?: string; // RFC 3339 timestamp
  status?: 'needsAction' | 'completed';
}

export interface GoogleTasksResult {
  success: boolean;
  isConnected: boolean;
  task?: GoogleTaskItem;
  list?: string;
  error?: string;
  message?: string;
}

const STORAGE_KEY_TOKEN = 'google_tasks_access_token';

/**
 * Retrieve current Google Tasks OAuth access token from localStorage, sessionStorage,
 * or active Supabase provider token if available.
 */
export function getGoogleTasksToken(): string | null {
  try {
    const local = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (local && local.trim()) return local.trim();

    const session = sessionStorage.getItem(STORAGE_KEY_TOKEN);
    if (session && session.trim()) return session.trim();

    // Check supabase auth token if stored in localStorage
    const sbKey = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (sbKey) {
      const sbData = JSON.parse(localStorage.getItem(sbKey) || '{}');
      if (sbData?.provider_token) {
        return sbData.provider_token;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Check if Google Tasks integration is currently connected with an active OAuth token
 */
export function isGoogleTasksConnected(): boolean {
  return Boolean(getGoogleTasksToken());
}

/**
 * Save an external Google Tasks access token (for user configuration)
 */
export function setGoogleTasksToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_TOKEN, token.trim());
  } catch {
    // ignore
  }
}

/**
 * Disconnect Google Tasks integration
 */
export function disconnectGoogleTasks(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
  } catch {
    // ignore
  }
}

/**
 * Create a task in Google Tasks via the official REST API
 */
export async function createGoogleTask(params: {
  title: string;
  notes?: string;
  due?: string; // YYYY-MM-DD or ISO
  tasklistId?: string;
}): Promise<GoogleTasksResult> {
  const token = getGoogleTasksToken();

  if (!token) {
    return {
      success: false,
      isConnected: false,
      error: 'Google Tasks is not connected. An active Google OAuth connection with Tasks permission (https://www.googleapis.com/auth/tasks) is required.',
      message: 'Google Tasks connection required. You can manage tasks directly at https://tasks.google.com or in Google Calendar.',
    };
  }

  const listId = params.tasklistId || '@default';
  const endpoint = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`;

  try {
    let rfc3339Due: string | undefined;
    if (params.due) {
      const d = new Date(params.due);
      if (!isNaN(d.getTime())) {
        rfc3339Due = d.toISOString();
      }
    }

    const payload: Record<string, unknown> = {
      title: params.title.trim(),
      ...(params.notes ? { notes: params.notes.trim() } : {}),
      ...(rfc3339Due ? { due: rfc3339Due } : {}),
      status: 'needsAction',
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      return {
        success: true,
        isConnected: true,
        task: {
          id: data.id,
          title: data.title,
          notes: data.notes,
          due: data.due,
          status: data.status,
        },
        list: listId === '@default' ? 'My Tasks' : listId,
        message: `Task "${data.title}" successfully created in Google Tasks (${listId === '@default' ? 'My Tasks' : listId}).`,
      };
    } else {
      const errData = (await res.json().catch(() => ({}))) as any;
      const errMsg = errData?.error?.message || `Google Tasks API returned HTTP ${res.status}`;
      return {
        success: false,
        isConnected: true,
        error: errMsg,
        message: `Failed to create task in Google Tasks: ${errMsg}`,
      };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      isConnected: true,
      error: msg,
      message: `Network failure contacting Google Tasks API: ${msg}`,
    };
  }
}

/**
 * Returns complete navigation instructions for Google Tasks across all Google Workspace interfaces
 */
export function getGoogleTasksNavigationMarkdown(): string {
  return `### 📍 Where to See Your Google Tasks

You can view and manage your Google Tasks across any connected Google Workspace surface:

1. **Direct Web App:** [Google Tasks (tasks.google.com)](https://tasks.google.com)
2. **Google Calendar:** Open [Google Calendar](https://calendar.google.com) and click the **Tasks icon (blue checkmark)** in the right-hand side panel, or check the "Tasks" box under *My calendars*.
3. **Gmail:** Open [Gmail](https://mail.google.com) and click the **Tasks icon** on the vertical panel on the far right.
4. **Google Tasks Mobile App:** Open the official Google Tasks app on Android or iOS signed in with your Google account.`;
}

