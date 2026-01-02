import { CustomerSource, DiscountType } from "@/types/enum";
import { IMembers } from "@/types/members";
import type { UploadFile } from "antd/es/upload/interface";
import type { Dayjs } from "dayjs";
import type { ProductProcessInstance, FirebaseProductProcessInstances } from "@/types/processInstance";
export { DiscountType } from "@/types/enum";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  REFUND = "refund",
  CANCELLED = "cancelled",
}
// Basic interfaces for Firebase data structure

export interface Workflow {
  name: string;
  department?: string;
}

export interface FirebaseStaff {
  [key: string]: IMembers;
}

export interface FirebaseWorkflows {
  [key: string]: Workflow;
}

export interface FirebaseDepartments {
  [key: string]: {
    code: string;
    name: string;
    createdAt?: number;
    updatedAt?: number;
  };
}

// Workflow and Product data structures
export interface WorkflowData {
  id: string;
  departmentCode?: string;
  workflowCode: string[];
  workflowName: string[];
  members: string[];
  consultantId?: string;
  isDone: boolean;
  checklist?: Array<{
    id: string;
    task_name: string;
    task_order: number;
    checked: boolean;
    checked_by?: string;
    checkedByName?: string;
    checked_at?: number;
    notes?: string;
    deadline?: number;
    cancelReason?: string; // Lý do hủy
    cancelled_at?: number; // Thời gian hủy
  }>;
  deadline?: number;
}

export interface ProductData {
  id: string;
  name: string;
  quantity: number;
  price: number;
  images: (UploadFile & { firebaseUrl?: string })[];
  imagesDone?: (UploadFile & { firebaseUrl?: string })[];
  workflows: WorkflowData[];
  processTemplateIds?: string[]; // IDs of process templates to link with this product
}
export enum WorkflowStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
}

// Firebase storage data structures
export interface FirebaseWorkflowData {
  departmentCode?: string;
  workflowCode: string[];
  workflowName: string[];
  members: string[];
  consultantId?: string;
  isDone: boolean;
  updatedAt: number;
  note?: string;
  isApproved?: boolean;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: number;
  price?: number; // Giá công để tính doanh thu cho nhân sự
  // New fields for process template support (optional for backward compatibility)
  processTemplateId?: string;
  stageId?: string;
  checklist?: Array<{
    id: string;
    task_name: string;
    task_order: number;
    checked: boolean;
    checked_by?: string;
    checkedByName?: string;
    checked_at?: number;
    notes?: string;
    assignedTo?: string; // Nhân sự phụ trách (member ID)
    assignedToName?: string; // Tên nhân sự phụ trách
    estimatedDuration?: number; // Thời gian ước tính (giờ hoặc ngày)
    durationUnit?: "hours" | "days"; // Đơn vị: giờ hoặc ngày
    deadline?: number; // Deadline (timestamp)
    description?: string; // Ghi chú mô tả chi tiết
  }>;
  deadline?: number;
}

export interface FirebaseProductData {
  name: string;
  quantity: number;
  price: number;
  images: Array<{
    uid: string;
    name: string;
    url: string;
  }>;
  imagesDone?: Array<{
    uid: string;
    name: string;
    url: string;
  }>;
  // Legacy workflows (for backward compatibility)
  workflows?: Record<string, FirebaseWorkflowData>;
}



export interface ProcessedProductData {
  id: string;
  name: string;
  quantity: number;
  images: Array<{
    uid: string;
    name: string;
    url: string;
    firebaseUrl?: string;
    error?: boolean;
  }>;
  workflows: WorkflowData[];
}

export enum DeliveryMethod {
  SHIP = "ship", // Gửi ship
  PICKUP = "pickup", // Khách qua lấy
  STORE = "store", // Lưu kho
}

export interface DeliveryInfo {
  method: DeliveryMethod;
  shippingAddress?: string;
  trackingNumber?: string;
  estimatedDate?: number; // Timestamp
  actualDate?: number; // Timestamp
  status: "pending" | "in_transit" | "delivered" | "picked_up" | "stored";
  storageLocation?: string; // For STORE method
  storageInstructionsSent?: boolean; // Whether storage instructions were sent
}

export interface PaymentInfo {
  id: string;
  amount: number; // Số tiền đã thanh toán
  content?: string; // Nội dung thanh toán
  images?: Array<{
    uid: string;
    name: string;
    status: "done" | "uploading" | "error";
    url: string;
    originFileObj?: File;
  }>; // Ảnh chứng từ thanh toán
  paidAt: number; // Thời gian thanh toán
  paidBy?: string; // User ID người tạo thanh toán
  paidByName?: string; // Tên người tạo thanh toán
  createdAt?: number;
}

export interface ReturnInfo {
  id: string;
  returnedBy?: string; // User ID người trả
  returnedByName?: string; // Tên người trả
  returnedAt: number; // Thời gian trả (now)
  images?: Array<{
    uid: string;
    name: string;
    status: "done" | "uploading" | "error";
    url: string;
    originFileObj?: File;
  }>; // Ảnh minh chứng
  createdAt?: number;
}

export interface FirebaseOrderData {
  code: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  customerSource: CustomerSource;
  orderDate: number;
  deliveryDate: number;
  createdBy: string;
  createdByName: string;
  consultantId?: string;
  consultantName?: string;
  commissionPercentage?: number; // Commission percentage for consultant (at order level)
  createdAt?: number;
  updatedAt?: number;
  notes?: string;
  discount?: number;
  discountType?: "amount" | "percentage";
  shippingFee?: number;
  products: Record<string, FirebaseProductData>;
  status?: OrderStatus;
  totalAmount?: number;
  discountAmount?: number;
  subtotal?: number;
  deposit?: number;
  depositType?: "amount" | "percentage";
  depositAmount?: number;
  isDepositPaid?: boolean;
  customerCode?: string;
  issues?: string[];
  appointmentId?: string;
  deliveryInfo?: DeliveryInfo;
  warrantyId?: string;
  refundRequestId?: string;
  caredBy?: string; // User ID who marked as cared
  caredByName?: string; // User name who marked as cared
  caredAt?: number; // Timestamp when marked as cared
  careCount?: number; // Number of times this order has been cared for
  careStatus?: string; // Latest care status
  careNotes?: Array<{
    status: string; // Care status
    note: string; // Care note
    caredBy: string; // User ID
    caredByName: string; // User name
    caredAt: number; // Timestamp
  }>; // History of care notes
  payments?: PaymentInfo[]; // Danh sách các lần thanh toán
  totalPaidAmount?: number; // Tổng số tiền đã thanh toán
  remainingDebt?: number; // Số tiền còn nợ (tự động tính = totalAmount - totalPaidAmount)
  returns?: ReturnInfo[]; // Danh sách các lần trả đồ
}

// Form related interfaces
export interface FormValues {
  code: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  customerSource: CustomerSource;
  orderDate: Dayjs;
  deliveryDate: Dayjs;
  createdBy: string;
  createdByName: string;
  consultantId?: string;
  consultantName?: string;
  commissionPercentage?: number; // Commission percentage for consultant (at order level)
  notes?: string;
  discount?: number;
  discountType?: DiscountType;
  shippingFee?: number;
  status?: OrderStatus;
  totalAmount?: number;
  deposit?: number;
  depositType?: DiscountType;
  isDepositPaid?: boolean;
  customerCode?: string;
  issues?: string[];
}

export interface OrderFormProps {
  mode: "create" | "update";
  orderCode?: string;
  onSuccess?: (orderCode: string) => void;
  onCancel?: () => void;
}

// Component props interfaces
export interface ProductCardProps {
  product: ProductData;
  onUpdate: (product: ProductData) => void;
  onRemove: () => void;
  staffOptions: Array<{ value: string; label: string }>;
  workflowOptions: Array<{ value: string; label: string }>;
  workflows: FirebaseWorkflows;
  staff: FirebaseStaff;
  departments: FirebaseDepartments;
  memberOptions?: Record<string, Array<{ value: string; label: string }>>;
  processTemplates?: Array<{ id: string; name: string }>; // Process templates for selection
}
