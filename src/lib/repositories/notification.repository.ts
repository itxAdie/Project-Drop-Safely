import { BaseRepository } from "./base.repository";
import { Notification } from "@/lib/db/models";
import type { INotification } from "@/types";

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }

  async findUnreadByUser(userId: string): Promise<INotification[]> {
    return this.model
      .find({ recipientId: userId, isRead: false })
      .sort({ sentAt: -1 })
      .lean()
      .exec() as unknown as INotification[];
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.model
      .updateMany({ recipientId: userId, isRead: false }, { isRead: true })
      .exec();
    return result.modifiedCount;
  }

  async findByUser(userId: string, limit = 50): Promise<INotification[]> {
    return this.model
      .find({ recipientId: userId })
      .sort({ sentAt: -1 })
      .limit(limit)
      .lean()
      .exec() as unknown as INotification[];
  }
}
