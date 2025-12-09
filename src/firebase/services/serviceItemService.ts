/**
 * Service Item Firebase Operations
 * Quản lý collection xoxo/service_items
 */

import {
  getDatabase,
  ref,
  set,
  update,
  remove,
  push,
  onValue,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import {
  ServiceItem,
  WorkflowTemplate,
  WorkflowStepData,
  ChecklistTask,
} from "@/types/service-item";
import { CommissionConfig } from "@/types/service-item";

/**
 * Generate unique QR Code ID cho service item
 * Format: ITEM_{timestamp}_{randomString}
 */
export function generateServiceItemQRCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ITEM_${timestamp}_${random}`.toUpperCase();
}

/**
 * Tạo service item từ product data
 * Gọi khi submit order để tạo service_items trong batch write
 */
export function createServiceItemFromProduct(
  orderId: string,
  productName: string,
  serviceName: string,
  price: number,
  quantity: number,
  commission: CommissionConfig,
  workflowTemplate: WorkflowTemplate,
  productImages: string[]
): ServiceItem {
  const qrCode = generateServiceItemQRCode();
  const now = Date.now();

  // Initialize steps từ workflow template
  const steps: WorkflowStepData[] = workflowTemplate.stages.map((stage) => ({
    id: `step_${stage.id}_${Date.now()}`,
    step_order: stage.stage_order,
    department_code: stage.department_code,
    department_name: stage.department_name,
    step_name: stage.stage_name,
    status: stage.stage_order === 1 ? "pending" : "pending", // First step will be 'processing' after order created
    checklist: stage.checklist_template.map((task) => ({
      id: `task_${task.task_id}_${Date.now()}`,
      task_name: task.task_name,
      task_order: task.task_order,
      checked: false,
    })),
    assigned_technicians: [],
    expected_duration_hours: stage.expected_duration_hours,
  }));

  return {
    id: qrCode,
    qr_code: qrCode,
    order_id: orderId,
    product_name: productName,
    service_name: serviceName,
    price,
    quantity,
    commission,
    workflow_id: workflowTemplate.id,
    workflow_name: workflowTemplate.name,
    product_type: workflowTemplate.product_type,
    current_step_index: 0,
    current_step_id: steps[0]?.id,
    status: "pending",
    steps,
    photos: {
      before: productImages,
      after: {},
    },
    created_at: now,
    updated_at: now,
  };
}

/**
 * Lưu service item vào Firebase
 */
export async function saveServiceItem(item: ServiceItem): Promise<void> {
  const db = getDatabase();
  const itemRef = ref(db, `xoxo/service_items/${item.id}`);
  await set(itemRef, item);
}

/**
 * Batch create multiple service items (dùng trong order submission)
 */
export async function batchCreateServiceItems(
  items: ServiceItem[]
): Promise<void> {
  const db = getDatabase();
  const updates: { [key: string]: any } = {};

  items.forEach((item) => {
    updates[`xoxo/service_items/${item.id}`] = item;
  });

  await update(ref(db), updates);
}

/**
 * Cập nhật trạng thái service item
 */
export async function updateServiceItemStatus(
  itemId: string,
  status: ServiceItem["status"]
): Promise<void> {
  const db = getDatabase();
  const itemRef = ref(db, `xoxo/service_items/${itemId}`);
  await update(itemRef, {
    status,
    updated_at: Date.now(),
  });
}

/**
 * Update checklist task
 */
export async function updateChecklistTask(
  itemId: string,
  stepIndex: number,
  taskIndex: number,
  checked: boolean,
  checkedBy: string
): Promise<void> {
  const db = getDatabase();
  const taskPath = `xoxo/service_items/${itemId}/steps/${stepIndex}/checklist/${taskIndex}`;
  const taskRef = ref(db, taskPath);

  await update(taskRef, {
    checked,
    checked_by: checkedBy,
    checked_at: Date.now(),
  });

  // Check if all tasks in this step are done
  const itemRef = ref(db, `xoxo/service_items/${itemId}`);
  return new Promise((resolve) => {
    onValue(
      itemRef,
      (snapshot) => {
        const item = snapshot.val() as ServiceItem;
        if (!item) {
          resolve();
          return;
        }

        const currentStep = item.steps[item.current_step_index];
        if (!currentStep) {
          resolve();
          return;
        }

        const allTasksDone =
          currentStep.checklist?.every((task) => task.checked) ?? true;

        if (allTasksDone) {
          // Auto move to next step
          moveToNextStep(itemId).then(resolve);
        } else {
          resolve();
        }
      },
      { onlyOnce: true }
    );
  });
}

/**
 * Move service item to next step
 */
export async function moveToNextStep(itemId: string): Promise<void> {
  const db = getDatabase();
  const itemRef = ref(db, `xoxo/service_items/${itemId}`);

  return new Promise((resolve) => {
    onValue(
      itemRef,
      async (snapshot) => {
        const item = snapshot.val() as ServiceItem;
        if (!item) {
          resolve();
          return;
        }

        const nextStepIndex = item.current_step_index + 1;

        if (nextStepIndex < item.steps.length) {
          const nextStep = item.steps[nextStepIndex];

          // Update current step to done
          const currentStepRef = ref(
            db,
            `xoxo/service_items/${itemId}/steps/${item.current_step_index}`
          );
          await update(currentStepRef, {
            status: "done",
            end_time: Date.now(),
          });

          // Update next step to processing
          const nextStepRef = ref(
            db,
            `xoxo/service_items/${itemId}/steps/${nextStepIndex}`
          );
          await update(nextStepRef, {
            status: "processing",
            start_time: Date.now(),
          });

          // Update item's current step pointer
          await update(itemRef, {
            current_step_index: nextStepIndex,
            current_step_id: nextStep.id,
            updated_at: Date.now(),
          });
        } else {
          // All steps done
          const currentStepRef = ref(
            db,
            `xoxo/service_items/${itemId}/steps/${item.current_step_index}`
          );
          await update(currentStepRef, {
            status: "done",
            end_time: Date.now(),
          });

          await update(itemRef, {
            status: "done",
            completed_at: Date.now(),
            updated_at: Date.now(),
          });
        }
        resolve();
      },
      { onlyOnce: true }
    );
  });
}

/**
 * Assign technicians to current step
 */
export async function assignTechniciansToStep(
  itemId: string,
  stepIndex: number,
  technicianIds: string[]
): Promise<void> {
  const db = getDatabase();
  const stepRef = ref(
    db,
    `xoxo/service_items/${itemId}/steps/${stepIndex}`
  );

  await update(stepRef, {
    assigned_technicians: technicianIds,
    updated_at: Date.now(),
  });
}

/**
 * Upload after photos for a step
 */
export async function addAfterPhotosToStep(
  itemId: string,
  stepId: string,
  photoUrls: string[]
): Promise<void> {
  const db = getDatabase();
  const itemRef = ref(db, `xoxo/service_items/${itemId}`);

  await update(itemRef, {
    [`photos/after/${stepId}`]: photoUrls,
    updated_at: Date.now(),
  });
}

/**
 * Get service item by QR code
 */
export async function getServiceItemByQRCode(
  qrCode: string
): Promise<ServiceItem | null> {
  const db = getDatabase();
  const itemRef = ref(db, `xoxo/service_items/${qrCode}`);

  return new Promise((resolve) => {
    onValue(
      itemRef,
      (snapshot) => {
        resolve(snapshot.val() as ServiceItem | null);
      },
      { onlyOnce: true }
    );
  });
}

/**
 * Get all service items for an order
 */
export function subscribeToOrderServiceItems(
  orderId: string,
  callback: (items: ServiceItem[]) => void
): () => void {
  const db = getDatabase();
  const itemsRef = ref(db, "xoxo/service_items");

  const unsubscribe = onValue(itemsRef, (snapshot) => {
    const allItems = snapshot.val() as { [key: string]: ServiceItem } || {};
    const orderItems = Object.values(allItems).filter(
      (item) => item.order_id === orderId
    );
    callback(orderItems);
  });

  return unsubscribe;
}

/**
 * Get all service items for a technician
 */
export function subscribeToTechnicianTasks(
  technicianId: string,
  callback: (items: ServiceItem[]) => void
): () => void {
  const db = getDatabase();
  const itemsRef = ref(db, "xoxo/service_items");

  const unsubscribe = onValue(itemsRef, (snapshot) => {
    const allItems = snapshot.val() as { [key: string]: ServiceItem } || {};
    const techItems = Object.values(allItems).filter((item) => {
      const currentStep = item.steps[item.current_step_index];
      return (
        currentStep &&
        currentStep.assigned_technicians.includes(technicianId) &&
        item.status !== "done"
      );
    });
    callback(techItems);
  });

  return unsubscribe;
}

/**
 * Delete service item
 */
export async function deleteServiceItem(itemId: string): Promise<void> {
  const db = getDatabase();
  const itemRef = ref(db, `xoxo/service_items/${itemId}`);
  await remove(itemRef);
}
