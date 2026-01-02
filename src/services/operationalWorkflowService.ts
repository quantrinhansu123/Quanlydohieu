import { getDatabase, ref, get, set, update, remove, onValue } from "firebase/database";
import { genCode } from "@/utils/genCode";

const OPERATIONAL_WORKFLOWS_PATH = "xoxo/operational_workflows";

export interface OperationalWorkflowTask {
  id: string;
  taskName: string;
  taskOrder: number;
}

export interface OperationalWorkflowJob {
  id: string;
  jobName: string;
  jobOrder: number;
  tasks: OperationalWorkflowTask[];
  materials?: OperationalWorkflowMaterial[]; // Danh mục vật liệu cho hành động này
}

export interface OperationalWorkflowMaterial {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
}

export interface OperationalWorkflow {
  id: string;
  workflowName: string;
  departmentCode?: string;
  jobs: OperationalWorkflowJob[];
  materials?: OperationalWorkflowMaterial[]; // Danh mục vật liệu liên kết
  createdAt: number;
  updatedAt: number;
}

export interface OperationalWorkflowItem {
  id: string;
  workflowId: string;
  workflowName: string;
  jobId: string;
  jobName: string;
  jobOrder: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: number;
  updatedAt: number;
  // Thời gian tracking
  startedAt?: number; // Thời gian bắt đầu CV (bằng completedAt của CV trước)
  completedAt?: number; // Thời gian hoàn thành CV
  durationHours?: number; // Số giờ hoàn thành = (completedAt - startedAt) / (1000 * 60 * 60)
  // Thông tin hủy
  cancelledAt?: number; // Thời gian hủy
  cancelledBy?: string; // ID người hủy
  cancelledByName?: string; // Tên người hủy
  cancelReason?: string; // Lý do hủy
  confirmedCancelled?: boolean; // Đã xác nhận hoàn thành sau khi hủy
  // Nhân sự phụ trách
  assignedTo?: string; // ID nhân sự phụ trách
  assignedToName?: string; // Tên nhân sự phụ trách
  // Liên kết với đơn hàng
  orderCode?: string;
  productId?: string;
  productName?: string;
  customerName?: string;
  // Ghi chú và ảnh (cho quy trình tự tạo không có đơn hàng)
  notes?: string;
  images?: string[];
  lastEditedBy?: string;
  lastEditedByName?: string;
  lastEditedAt?: number;
}

const OPERATIONAL_WORKFLOW_ITEMS_PATH = "xoxo/operational_workflow_items";

export class OperationalWorkflowService {
  /**
   * Get all operational workflows
   */
  static async getAll(): Promise<OperationalWorkflow[]> {
    const db = getDatabase();
    const snapshot = await get(ref(db, OPERATIONAL_WORKFLOWS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, workflow]) => ({
      id,
      ...(workflow as Omit<OperationalWorkflow, "id">),
    }));
  }

  /**
   * Get a operational workflow by ID
   */
  static async getById(id: string): Promise<OperationalWorkflow | null> {
    const db = getDatabase();
    const snapshot = await get(ref(db, `${OPERATIONAL_WORKFLOWS_PATH}/${id}`));
    const data = snapshot.val();
    if (!data) return null;
    return { id, ...data };
  }

  /**
   * Create a new operational workflow
   */
  static async create(
    workflow: Omit<OperationalWorkflow, "id" | "createdAt" | "updatedAt">,
  ): Promise<OperationalWorkflow> {
    const db = getDatabase();
    const now = Date.now();
    const id = genCode("OPW_");

    const workflowData: Omit<OperationalWorkflow, "id"> = {
      ...workflow,
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${OPERATIONAL_WORKFLOWS_PATH}/${id}`), workflowData);

    return { id, ...workflowData };
  }

  /**
   * Update an existing operational workflow
   */
  static async update(
    id: string,
    updates: Partial<Omit<OperationalWorkflow, "id" | "createdAt">>,
  ): Promise<void> {
    const db = getDatabase();
    const updateData = {
      ...updates,
      updatedAt: Date.now(),
    };
    await update(ref(db, `${OPERATIONAL_WORKFLOWS_PATH}/${id}`), updateData);
  }

  /**
   * Delete an operational workflow
   */
  static async delete(id: string): Promise<void> {
    const db = getDatabase();
    await remove(ref(db, `${OPERATIONAL_WORKFLOWS_PATH}/${id}`));
  }

  /**
   * Subscribe to operational workflows changes
   * Returns an unsubscribe function
   */
  static onSnapshot(
    callback: (workflows: OperationalWorkflow[]) => void,
  ): () => void {
    const db = getDatabase();
    const workflowsRef = ref(db, OPERATIONAL_WORKFLOWS_PATH);
    const unsubscribe = onValue(workflowsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const workflows = Object.entries(data).map(([id, workflow]) => ({
        id,
        ...(workflow as Omit<OperationalWorkflow, "id">),
      }));
      callback(workflows);
    });

    return unsubscribe;
  }

  // ==================== WORKFLOW ITEMS (Đơn công việc) ====================

  /**
   * Get all operational workflow items
   */
  static async getAllItems(): Promise<OperationalWorkflowItem[]> {
    const db = getDatabase();
    const snapshot = await get(ref(db, OPERATIONAL_WORKFLOW_ITEMS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, item]) => ({
      id,
      ...(item as Omit<OperationalWorkflowItem, "id">),
    }));
  }

  /**
   * Create a new workflow item
   */
  static async createItem(
    item: Omit<OperationalWorkflowItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<OperationalWorkflowItem> {
    const db = getDatabase();
    const now = Date.now();
    const id = genCode("OPWI_");

    const itemData: Omit<OperationalWorkflowItem, "id"> = {
      ...item,
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${OPERATIONAL_WORKFLOW_ITEMS_PATH}/${id}`), itemData);

    return { id, ...itemData };
  }

  /**
   * Update workflow item status
   */
  static async updateItemStatus(
    id: string,
    status: OperationalWorkflowItem["status"],
    additionalData?: Partial<OperationalWorkflowItem>
  ): Promise<void> {
    const db = getDatabase();
    const updateData: Partial<OperationalWorkflowItem> = {
      status,
      updatedAt: Date.now(),
      ...additionalData,
    };

    if (status === "completed") {
      const now = Date.now();
      updateData.completedAt = now;
      
      // Tính durationHours nếu có startedAt
      if (additionalData?.startedAt) {
        const durationMs = now - additionalData.startedAt;
        updateData.durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100; // Làm tròn 2 chữ số
      }
    }

    await update(ref(db, `${OPERATIONAL_WORKFLOW_ITEMS_PATH}/${id}`), updateData);
  }

  /**
   * Move item to next job in workflow
   */
  static async moveToNextJob(
    itemId: string,
    workflow: OperationalWorkflow,
    currentJobId: string,
  ): Promise<void> {
    const db = getDatabase();
    const currentJobIndex = workflow.jobs.findIndex((j) => j.id === currentJobId);
    
    if (currentJobIndex < 0 || currentJobIndex >= workflow.jobs.length - 1) {
      // Already at last job or job not found
      return;
    }

    const nextJob = workflow.jobs[currentJobIndex + 1];
    
    await update(ref(db, `${OPERATIONAL_WORKFLOW_ITEMS_PATH}/${itemId}`), {
      jobId: nextJob.id,
      jobName: nextJob.jobName,
      jobOrder: nextJob.jobOrder,
      status: "pending",
      updatedAt: Date.now(),
    });
  }

  /**
   * Subscribe to operational workflow items changes
   */
  static onItemsSnapshot(
    callback: (items: OperationalWorkflowItem[]) => void,
  ): () => void {
    const db = getDatabase();
    const itemsRef = ref(db, OPERATIONAL_WORKFLOW_ITEMS_PATH);
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const items = Object.entries(data).map(([id, item]) => ({
        id,
        ...(item as Omit<OperationalWorkflowItem, "id">),
      }));
      callback(items);
    });

    return unsubscribe;
  }

  /**
   * Delete items by order code
   */
  static async deleteItemsByOrderCode(orderCode: string): Promise<void> {
    const db = getDatabase();
    const itemsRef = ref(db, OPERATIONAL_WORKFLOW_ITEMS_PATH);
    const snapshot = await get(itemsRef);
    const items = snapshot.val() || {};

    const updates: Record<string, null> = {};
    Object.entries(items).forEach(([id, item]: [string, any]) => {
      if (item.orderCode === orderCode) {
        updates[`${OPERATIONAL_WORKFLOW_ITEMS_PATH}/${id}`] = null;
      }
    });

    if (Object.keys(updates).length > 0) {
      await update(ref(db, "xoxo"), updates);
    }
  }

  /**
   * Delete items that don't have corresponding orders
   */
  static async deleteOrphanedItems(): Promise<number> {
    const db = getDatabase();
    
    // Get all orders
    const ordersRef = ref(db, "xoxo/orders");
    const ordersSnapshot = await get(ordersRef);
    const orders = ordersSnapshot.val() || {};
    
    // Extract orderCodes from orders (order.code field, not the key)
    const orderCodes = new Set<string>();
    Object.values(orders).forEach((order: any) => {
      if (order.code) {
        orderCodes.add(order.code);
      }
      // Also add the order ID (key) in case items reference by ID
      // But we'll check both
    });
    
    // Also add order IDs (keys) to the set
    Object.keys(orders).forEach((orderId) => {
      orderCodes.add(orderId);
    });

    // Get all items
    const itemsRef = ref(db, OPERATIONAL_WORKFLOW_ITEMS_PATH);
    const itemsSnapshot = await get(itemsRef);
    const items = itemsSnapshot.val() || {};

    const updates: Record<string, null> = {};
    let deletedCount = 0;

    Object.entries(items).forEach(([id, item]: [string, any]) => {
      // If item has orderCode but order doesn't exist, delete it
      if (item.orderCode && !orderCodes.has(item.orderCode)) {
        updates[`${OPERATIONAL_WORKFLOW_ITEMS_PATH}/${id}`] = null;
        deletedCount++;
      }
    });

    if (Object.keys(updates).length > 0) {
      await update(ref(db, "xoxo"), updates);
    }

    return deletedCount;
  }
}

