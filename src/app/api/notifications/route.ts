import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { MongoClient } from 'mongodb';

// GET /api/notifications - Fetch current user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    try {
      if ((prisma as any).notification) {
        const notifications = await (prisma as any).notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
        return NextResponse.json({ success: true, data: notifications });
      }
      throw new Error('Notification model unavailable');
    } catch {
      // Mongo fallback
      const client = new MongoClient(process.env.DATABASE_URL!);
      await client.connect();
      const url = new URL(process.env.DATABASE_URL!);
      const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
      const db = client.db(dbName);
      const notifsCol = db.collection('Notification');
      const notifications = await notifsCol.find({ userId: user.id }).sort({ createdAt: -1 }).toArray();
      await client.close();
      return NextResponse.json({ success: true, data: notifications.map((n: any) => ({ ...n, id: String(n._id) })) });
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const { notificationIds } = body as { notificationIds?: string[] };
    try {
      if ((prisma as any).notification) {
        if (notificationIds && notificationIds.length > 0) {
          await (prisma as any).notification.updateMany({ where: { id: { in: notificationIds }, userId: user.id }, data: { read: true } });
        } else {
          await (prisma as any).notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
        }
        return NextResponse.json({ success: true, message: 'Notifications marked as read' });
      }
      throw new Error('Notification model unavailable');
    } catch {
      // Mongo fallback
      const client = new MongoClient(process.env.DATABASE_URL!);
      await client.connect();
      const url = new URL(process.env.DATABASE_URL!);
      const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
      const db = client.db(dbName);
      const notifsCol = db.collection('Notification');
      if (notificationIds && notificationIds.length > 0) {
        await notifsCol.updateMany({ _id: { $in: notificationIds } as any, userId: user.id }, { $set: { read: true } });
      } else {
        await notifsCol.updateMany({ userId: user.id, read: { $ne: true } }, { $set: { read: true } });
      }
      await client.close();
      return NextResponse.json({ success: true, message: 'Notifications marked as read' });
    }
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


