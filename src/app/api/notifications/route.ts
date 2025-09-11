import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { MongoClient, ObjectId } from 'mongodb';

// GET /api/notifications - Fetch current user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    let prismaNotifications: any[] = [];
    let mongoNotifications: any[] = [];
    // Try Prisma first
    try {
      if ((prisma as any).notification) {
        prismaNotifications = await (prisma as any).notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
        console.log('Prisma notifications:', prismaNotifications.length);
      }
    } catch (prismaError) {
      console.log('Prisma notification fetch failed:', prismaError);
    }
    // Always check MongoDB as well
    try {
      const client = new MongoClient(process.env.DATABASE_URL!);
      await client.connect();
      const url = new URL(process.env.DATABASE_URL!);
      const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
      const db = client.db(dbName);
      const notifsCol = db.collection('Notification');
      // Support both string and ObjectId for userId field
      let userObjectId: ObjectId | null = null;
      try { userObjectId = new ObjectId(user.id); } catch {}
      const mongoQuery: any = userObjectId
        ? { $or: [ { userId: user.id }, { userId: userObjectId } ] }
        : { userId: user.id };
      mongoNotifications = await notifsCol.find(mongoQuery).sort({ createdAt: -1 }).toArray();
      console.log('MongoDB notifications:', mongoNotifications.length);
      await client.close();
    } catch (mongoError) {
      console.log('MongoDB notification fetch failed:', mongoError);
    }
    // Merge and deduplicate notifications by id
    const notifMap = new Map();
    [...prismaNotifications, ...mongoNotifications.map((n: any) => ({ ...n, id: String(n._id) }))].forEach((notif: any) => {
      notifMap.set(notif.id, notif);
    });
    const mergedNotifications = Array.from(notifMap.values()).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ success: true, data: mergedNotifications });
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
        // Attempt Prisma update
        const result = await (prisma as any).notification.updateMany({
          where: notificationIds && notificationIds.length > 0
            ? { id: { in: notificationIds }, userId: user.id }
            : { userId: user.id, read: false },
          data: { read: true }
        });
        // If Prisma updated at least one record, return success
        if (result?.count && result.count > 0) {
          return NextResponse.json({ success: true, message: 'Notifications marked as read' });
        }
        // Else fall through to Mongo fallback to handle Mongo-only notifications
      }
      // Fall through to Mongo fallback if Prisma unavailable or updated 0 records
      throw new Error('Prisma updated 0 notifications or model unavailable');
    } catch {
      // Mongo fallback
      const client = new MongoClient(process.env.DATABASE_URL!);
      await client.connect();
      const url = new URL(process.env.DATABASE_URL!);
      const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
      const db = client.db(dbName);
      const notifsCol = db.collection('Notification');

      if (notificationIds && notificationIds.length > 0) {
        // Build user condition supporting string/ObjectId
        let userObjectId: ObjectId | null = null;
        try { userObjectId = new ObjectId(user.id); } catch {}
        const userCondition: any = userObjectId
          ? { $or: [ { userId: user.id }, { userId: userObjectId } ] }
          : { userId: user.id };

        // Try marking by string IDs first
        const stringResult = await notifsCol.updateMany(
          { _id: { $in: notificationIds as any }, ...userCondition },
          { $set: { read: true } }
        );

        // If none matched, convert to ObjectIds and try again
        if (stringResult.matchedCount === 0) {
          const objectIds = notificationIds
            .map(id => { try { return new ObjectId(id); } catch { return null; } })
            .filter((x): x is ObjectId => x !== null);
          if (objectIds.length > 0) {
            await notifsCol.updateMany(
              { _id: { $in: objectIds }, ...userCondition },
              { $set: { read: true } }
            );
          }
        }
      } else {
        // Mark all as read for this user (support string and ObjectId forms)
        let userObjectId: ObjectId | null = null;
        try { userObjectId = new ObjectId(user.id); } catch {}
        const userCondition: any = userObjectId
          ? { $or: [ { userId: user.id }, { userId: userObjectId } ] }
          : { userId: user.id };
        await notifsCol.updateMany({ ...userCondition, read: { $ne: true } }, { $set: { read: true } });
      }

      await client.close();
      return NextResponse.json({ success: true, message: 'Notifications marked as read' });
    }
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const { notificationIds } = body as { notificationIds?: string[] };

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Notification IDs are required' }, { status: 400 });
    }

    try {
      // Try Prisma first
      if ((prisma as any).notification) {
        await (prisma as any).notification.deleteMany({
          where: {
            id: { in: notificationIds },
            userId: user.id // Ensure user can only delete their own notifications
          }
        });
        return NextResponse.json({ success: true, message: 'Notifications deleted successfully' });
      }
      throw new Error('Notification model unavailable');
    } catch {
      // MongoDB fallback
      const client = new MongoClient(process.env.DATABASE_URL!);
      await client.connect();
      const url = new URL(process.env.DATABASE_URL!);
      const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
      const db = client.db(dbName);
      const notifsCol = db.collection('Notification');

      // Convert string IDs to ObjectIds for MongoDB, filter out invalid ones
      const objectIds: ObjectId[] = notificationIds
        .map(id => {
          try {
            return new ObjectId(id);
          } catch {
            return null;
          }
        })
        .filter((id): id is ObjectId => id !== null);

      // Build user condition supporting string/ObjectId
      let userObjectId: ObjectId | null = null;
      try { userObjectId = new ObjectId(user.id); } catch {}
      const userCondition: any = userObjectId
        ? { $or: [ { userId: user.id }, { userId: userObjectId } ] }
        : { userId: user.id };

      // Try to delete by string IDs first, then ObjectIds if needed
      const deleteResult = await notifsCol.deleteMany({
        _id: { $in: notificationIds as any },
        ...userCondition
      });

      // If no documents were deleted, try with ObjectIds
      if (deleteResult.deletedCount === 0 && objectIds.length > 0) {
        await notifsCol.deleteMany({
          _id: { $in: objectIds },
          ...userCondition
        });
      }

      await client.close();
      return NextResponse.json({ success: true, message: 'Notifications deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


