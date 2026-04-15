import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

export const getUserId = () => {
  let id = localStorage.getItem('wp_user_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('wp_user_id', id)
  }
  return id
}