import { supabase } from '@/lib/db/supabase'

export async function getAllocatedTokens(slotId: string) {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('slot_id', slotId)
    .eq('status', 'ALLOCATED')
    .order('priority_score', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}
export async function insertToken(payload) {
  const { data, error } = await supabase
    .from('tokens')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTopWaitlist(slotId: string) {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('slot_id', slotId)
    .eq('status', 'WAITLIST')
    .order('priority_score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}