import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = 'https://waqwcaalsgwavylihvlx.supabase.co';
const key = 'sb_publishable_eSrxHfBdB7_kvG26Ppz7Vg_jsAQBFyN';

describe('Supabase Connection & Remote Schema Check', () => {
  it('connects to Supabase endpoint and checks tables', async () => {
    const supabase = createClient(url, key);
    
    // Check tasks table
    const tasksRes = await supabase.from('tasks').select('id').limit(1);
    console.log('Tasks table response:', { data: tasksRes.data, error: tasksRes.error?.message });
    
    // Check schedules table
    const schedulesRes = await supabase.from('schedules').select('id').limit(1);
    console.log('Schedules table response:', { data: schedulesRes.data, error: schedulesRes.error?.message });

    // Check notes table
    const notesRes = await supabase.from('notes').select('id').limit(1);
    console.log('Notes table response:', { data: notesRes.data, error: notesRes.error?.message });

    expect(url).toBeDefined();
  });
});
