import {
    FollowUpSchedule,
    FollowUpType
} from "@/types/followUp";
import dayjs from "dayjs";
import {
    get,
    getDatabase,
    onValue,
    push,
    ref,
    remove,
    set,
    update,
} from "firebase/database";

const db = getDatabase();
const FOLLOW_UP_PATH = "xoxo/followUps";

export class FollowUpService {
  static async getAll(): Promise<FollowUpSchedule[]> {
    const snapshot = await get(ref(db, FOLLOW_UP_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, followUp]) => ({
      id,
      ...(followUp as Omit<FollowUpSchedule, "id">),
    }));
  }

  static async getById(id: string): Promise<FollowUpSchedule | null> {
    const snapshot = await get(ref(db, `${FOLLOW_UP_PATH}/${id}`));
    const data = snapshot.val();
    return data ? { id, ...data } : null;
  }

  static async getByOrderId(orderId: string): Promise<FollowUpSchedule[]> {
    const snapshot = await get(ref(db, FOLLOW_UP_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .filter(
        ([_, followUp]) => (followUp as FollowUpSchedule).orderId === orderId
      )
      .map(([id, followUp]) => ({
        id,
        ...(followUp as Omit<FollowUpSchedule, "id">),
      }));
  }

  static async getByOrderCode(
    orderCode: string
  ): Promise<FollowUpSchedule[]> {
    const snapshot = await get(ref(db, FOLLOW_UP_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .filter(
        ([_, followUp]) =>
          (followUp as FollowUpSchedule).orderCode === orderCode
      )
      .map(([id, followUp]) => ({
        id,
        ...(followUp as Omit<FollowUpSchedule, "id">),
      }));
  }

  static async getPending(): Promise<FollowUpSchedule[]> {
    const all = await this.getAll();
    return all.filter((f) => f.status === "pending");
  }

  static async getOverdue(): Promise<FollowUpSchedule[]> {
    const all = await this.getAll();
    const now = Date.now();
    return all.filter(
      (f) => f.status === "pending" && f.scheduledDate < now
    );
  }

  // Auto-create follow-up schedules when order is completed
  static async createFollowUpSchedules(
    orderId: string,
    orderCode: string,
    customerId: string | undefined,
    customerName: string,
    customerPhone: string,
    completedDate: number
  ): Promise<void> {
    const now = Date.now();

    // Calculate scheduled dates
    const twoDaysDate = completedDate + 2 * 24 * 60 * 60 * 1000;
    const sixMonthsDate = dayjs(completedDate)
      .add(6, "month")
      .valueOf();
    const twelveMonthsDate = dayjs(completedDate)
      .add(12, "month")
      .valueOf();

    const schedules: Omit<FollowUpSchedule, "id" | "createdAt" | "updatedAt">[] =
      [
        {
          orderId,
          orderCode,
          customerId,
          customerName,
          customerPhone,
          followUpType: FollowUpType.TWO_DAYS,
          scheduledDate: twoDaysDate,
          status: "pending",
        },
        {
          orderId,
          orderCode,
          customerId,
          customerName,
          customerPhone,
          followUpType: FollowUpType.SIX_MONTHS,
          scheduledDate: sixMonthsDate,
          status: "pending",
        },
        {
          orderId,
          orderCode,
          customerId,
          customerName,
          customerPhone,
          followUpType: FollowUpType.TWELVE_MONTHS,
          scheduledDate: twelveMonthsDate,
          status: "pending",
        },
      ];

    // Create all schedules
    for (const schedule of schedules) {
      const followUpRef = push(ref(db, FOLLOW_UP_PATH));
      const followUpData: FollowUpSchedule = {
        ...schedule,
        id: followUpRef.key!,
        createdAt: now,
        updatedAt: now,
      };
      await set(followUpRef, followUpData);
    }
  }

  static async create(
    followUp: Omit<FollowUpSchedule, "id" | "createdAt" | "updatedAt">
  ): Promise<FollowUpSchedule> {
    const now = new Date().getTime();
    const followUpRef = push(ref(db, FOLLOW_UP_PATH));
    const followUpId = followUpRef.key!;

    const followUpData: FollowUpSchedule = {
      ...followUp,
      id: followUpId,
      createdAt: now,
      updatedAt: now,
    };

    await set(followUpRef, followUpData);
    return followUpData;
  }

  static async update(
    id: string,
    followUp: Partial<Omit<FollowUpSchedule, "id" | "createdAt">>
  ): Promise<void> {
    const followUpData = {
      ...followUp,
      updatedAt: new Date().getTime(),
    };
    await update(ref(db, `${FOLLOW_UP_PATH}/${id}`), followUpData);
  }

  static async complete(
    id: string,
    completedBy: string,
    completedByName: string,
    notes?: string
  ): Promise<void> {
    await this.update(id, {
      status: "completed",
      completedDate: new Date().getTime(),
      completedBy,
      completedByName,
      notes,
    });
  }

  static async delete(id: string): Promise<void> {
    await remove(ref(db, `${FOLLOW_UP_PATH}/${id}`));
  }

  static onSnapshot(
    callback: (followUps: FollowUpSchedule[]) => void
  ): () => void {
    const followUpsRef = ref(db, FOLLOW_UP_PATH);
    const unsubscribe = onValue(followUpsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const followUps = Object.entries(data).map(([id, followUp]) => ({
        id,
        ...(followUp as Omit<FollowUpSchedule, "id">),
      }));
      callback(followUps);
    });
    return unsubscribe;
  }

  // Check and update overdue status
  static async checkAndUpdateOverdue(): Promise<void> {
    const all = await this.getAll();
    const now = Date.now();
    const overdue = all.filter(
      (f) => f.status === "pending" && f.scheduledDate < now
    );

    for (const followUp of overdue) {
      await this.update(followUp.id, { status: "overdue" });
    }
  }
}
