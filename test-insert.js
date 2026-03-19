const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  const dummyId = '11111111-2222-3333-4444-555555555555'
  const { data, error } = await supabase.from('User').insert({
    id: dummyId,
    name: 'Test Bug',
    phone: '00000000',
    role: 'vendeur'
  })
  
  if (error) {
    console.error('ERREUR INSERTION:', error)
  } else {
    console.log('SUCCES INSERTION:', data)
    await supabase.from('User').delete().eq('id', dummyId)
  }
}

testInsert()
