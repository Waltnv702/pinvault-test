import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://qgnfcznqcahasuclwqlm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbmZjem5xY2FoYXN1Y2x3cWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzg4OTEsImV4cCI6MjA4ODgxNDg5MX0.iLTybAcv1zLQ_gWS123PfjRjE6eJUpoMWm8t_m3Gr_o'
)
