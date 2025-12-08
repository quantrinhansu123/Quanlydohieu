// ==================== WORKFLOW SYSTEM TYPES ====================

/** Status of a workflow step/workflow */
export type WorkflowStepStatus = 'pending' | 'in_progress' | 'completed';

/** Staff role */
export type StaffRole = 'worker' | 'sale' | 'manager' | 'admin';

// ==================== STAFF (formerly EMPLOYEES) ====================

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  createdAt?: number;
}

export interface StaffMap {
  [staffId: string]: Staff;
}

// ==================== STAGES (formerly WORKFLOW TEMPLATES) ====================

export interface Workflow {
  id: string;
  name: string;
  defaultStaff?: string[]; // Array of staff IDs
  createdAt: number;
  order?: number; // For sorting workflows
}

export interface WorkflowMap {
  [workflowCode: string]: Omit<Workflow, 'id'>;
}

// ==================== ORDER - PRODUCT - STAGES ====================

/** Workflow inside a product (cloned from template) */
export interface ProductWorkflow {
  workflowCode: string;
  name: string;
  staff: { [staffId: string]: boolean }; // Object map for Firebase
  status: WorkflowStepStatus;
  completedQuantity: number;
  updatedAt: number;
  order?: number; // For sorting
}

export interface ProductWorkflowMap {
  [workflowKey: string]: ProductWorkflow;
}

/** Product inside an order */
export interface OrderProduct {
  name: string;
  quantity: number;
  price?: number;
  workflows: ProductWorkflowMap;
  createdAt?: number;
}

export interface OrderProductMap {
  [productId: string]: OrderProduct;
}

/** Order main structure */
export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  createdBy: string; // Member ID
  createdAt: number;
  updatedAt?: number;
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  totalAmount?: number;
  notes?: string;
  products: OrderProductMap;
}

export interface OrderMap {
  [orderCode: string]: Omit<Order, 'id'>;
}

// ==================== FIREBASE REALTIME DATABASE ROOT STRUCTURE ====================

export interface RealtimeDatabaseSchema {
  xoxo: {
    workflows: WorkflowMap;
    staff: StaffMap;
    orders: OrderMap;
  };
}

// ==================== API/ACTION PAYLOAD TYPES ====================

/** Payload for creating a new order */
export interface CreateOrderPayload {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  createdBy: string;
  notes?: string;
  products: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
}

/** Payload for updating workflow progress */
export interface UpdateWorkflowProgressPayload {
  orderCode: string;
  productId: string;
  workflowKey: string;
  completedQuantity?: number;
  status?: WorkflowStepStatus;
  staff?: { [staffId: string]: boolean };
}

/** Payload for assigning/removing staff */
export interface UpdateWorkflowStaffPayload {
  orderCode: string;
  productId: string;
  workflowKey: string;
  staffId: string;
  action: 'add' | 'remove';
}

// ==================== UI HELPER TYPES ====================

/** Expanded workflow data with staff details (for UI display) */
export interface WorkflowWithDetails extends ProductWorkflow {
  workflowKey: string;
  productId: string;
  productName: string;
  productQuantity: number;
  staffDetails: Staff[];
}

/** Order with expanded data (for UI display) */
export interface OrderWithDetails extends Order {
  createdByStaff?: Staff;
  totalProducts: number;
  totalWorkflows: number;
  completedWorkflows: number;
}
