import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { userSchema } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

export async function POST(req: Request) {
  logger.info('🔥 Clerk webhook received');

  const payload = await req.text();
  const headerList = headers();

  const svixHeaders = {
    'svix-id': (await headerList).get('svix-id')!,
    'svix-timestamp': (await headerList).get('svix-timestamp')!,
    'svix-signature': (await headerList).get('svix-signature')!,
  };

  if (
    !svixHeaders['svix-id']
    || !svixHeaders['svix-timestamp']
    || !svixHeaders['svix-signature']
  ) {
    return NextResponse.json(
      { error: 'Missing Svix headers' },
      { status: 400 },
    );
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let evt: any;

  try {
    evt = wh.verify(payload, svixHeaders as Record<string, string>);
  } catch (err) {
    console.error('❌ Invalid webhook signature', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { type, data } = evt;

  try {
    // ambil email utama Clerk
    const email = data.email_addresses?.[0]?.email_address;

    switch (type) {
      case 'user.created':
        await db.insert(userSchema).values({
          clerk_user_id: data.id,
          email,
        });
        break;

      case 'user.updated':
        await db
          .update(userSchema)
          .set({
            email,
            updatedAt: new Date(),
          })
          .where(eq(userSchema.clerk_user_id, data.id));
        break;

      case 'user.deleted':
        await db
          .delete(userSchema)
          .where(eq(userSchema.clerk_user_id, data.id));
        break;

      default:
        logger.info('Unhandled Clerk event:', type);
    }
  } catch (err) {
    logger.error('❌ DB error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
