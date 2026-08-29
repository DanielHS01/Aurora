import { NextResponse } from 'next/server'
import { runDailyReservationsDigest } from '@/lib/cron/dailyReservationsDigest'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const result = await runDailyReservationsDigest()
  return NextResponse.json({ ok: true, ...result })
}