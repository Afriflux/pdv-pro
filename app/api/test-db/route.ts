import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = createAdminClient()
  const dummyId = '11111111-2222-3333-4444-555555555555'

  const { data, error } = await admin.from('User').insert({
    id: dummyId,
    name: 'Test Bug',
    phone: '00000000',
    role: 'vendeur'
  })

  if (error) {
    return NextResponse.json({ ok: false, error })
  }

  await admin.from('User').delete().eq('id', dummyId)
  return NextResponse.json({ ok: true, data })
}
