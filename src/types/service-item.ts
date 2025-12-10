/**
 * SERVICE ITEM TYPES
 *
 * Theo PROJECT_MASTER_CONTEXT, mỗi sản phẩm trong order là một "Service Item"
 * với QR Code riêng, workflow riêng, và commission riêng.
 *
 * Schema 4-cấp:
 * Order (lớp 1) → Service Items (lớp 2) → Workflow Steps (lớp 3) → Tasks (lớp 4)
 */

/**
 * LEVEL 1: Commission Configuration
 * Cấu hình hoa hồng cho từng sản phẩm - được capture lúc tạo order
 */
export interface CommissionConfig {
  type: "fixed" | "percent"; // "VNĐ" hoặc "%"
  value: number; // Số tiền hoặc phần trăm
  receiver_id: string; // Người nhận hoa hồng (consultant/sale)
}

/**
 * LEVEL 2: Workflow Step Data (Mức công đoạn của sản phẩm)
 * Một sản phẩm chạy qua nhiều công đoạn, mỗi công đoạn thuộc một phòng ban
 */
export interface SolutionOption {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface WorkflowStepData {
  id: string; // Unique ID cho step này
  step_order: number; // Thứ tự bước (1, 2, 3...)
  department_code: string; // Mã phòng ban (DEPT_001, DEPT_002...)
  department_name: string; // Tên phòng ban (Phòng Xi Mạ, Phòng Đồ Da...)
  step_name: string; // Tên công đoạn (Xi mạ, Khâu form...)
  status: "pending" | "processing" | "done"; // Trạng thái bước
  checklist?: ChecklistTask[]; // Danh sách công việc chi tiết
  assigned_technicians: string[]; // ID các kỹ thuật viên giao việc
  start_time?: number; // Timestamp khi bắt đầu
  end_time?: number; // Timestamp khi kết thúc
  expected_duration_hours?: number; // Thời gian dự kiến
  notes?: string; // Ghi chú kết quả
  // Fields for 12-step workflow
  solutionOptions?: SolutionOption[]; // For BƯỚC 5: 2 phương án xử lý
  selectedSolution?: string; // ID of selected solution
  customerSatisfaction?: number; // For BƯỚC 6: 1-5 rating
  customerCheckResult?: boolean; // For BƯỚC 8: Customer check result
  completionPhotos?: string[]; // For BƯỚC 9: Completion photos/videos
}

/**
 * LEVEL 3: Checklist Task (Mức công việc chi tiết trong mỗi bước)
 * Mỗi bước có thể có nhiều công việc nhỏ cần tick off
 */
export interface ChecklistTask {
  id: string;
  task_name: string; // "Strip ố", "Đánh bóng", "Mạ vàng"
  task_order: number; // Thứ tự công việc
  checked: boolean; // Đã hoàn thành?
  checked_by?: string; // Người tick
  checked_at?: number; // Timestamp khi tick
  notes?: string; // Ghi chú chi tiết cho công việc này
}

/**
 * LEVEL 1: Service Item (Sản phẩm cụ thể trong đơn hàng)
 * Mỗi sản phẩm có QR code riêng, workflow riêng, commission riêng
 */
export interface ServiceItem {
  id: string; // ITEM_QR_123456 - Unique ID encoded in QR
  qr_code: string; // QR string để in sticker
  order_id: string; // Link back to parent order

  // PRODUCT INFORMATION
  product_name: string; // "Túi Hermès Birkin", "Giày Nike"
  service_name: string; // "Full Spa & Gold Plating"
  price: number; // Giá dịch vụ
  quantity: number; // Số lượng (thường = 1)

  // COMMISSION CONFIGURATION (Capture at order creation)
  commission: CommissionConfig;

  // WORKFLOW CONFIGURATION
  workflow_id: string; // Reference to workflow template (e.g., "wf_bag_spa")
  workflow_name: string; // "Quy trình Spa Túi Xách"
  product_type: string; // "bag", "shoe", "metal"...

  // WORKFLOW STATE TRACKING
  current_step_index: number; // Bước hiện tại (0, 1, 2...)
  current_step_id?: string; // ID của bước hiện tại
  status: "pending" | "processing" | "done" | "delivered"; // Trạng thái tổng

  // STEPS EXECUTION
  steps: WorkflowStepData[]; // Danh sách tất cả bước sẽ chạy qua

  // EVIDENCE & DOCUMENTATION
  photos: {
    before: string[]; // Ảnh trước khi làm (từ order creation)
    after: { [stepId: string]: string[] }; // Ảnh kết quả sau mỗi bước
  };
  attachments?: { [key: string]: string[] }; // File đính kèm

  // TIMESTAMPS
  created_at: number;
  updated_at: number;
  started_at?: number; // Khi bắt đầu step đầu tiên
  completed_at?: number; // Khi hoàn thành
  delivered_at?: number; // Khi giao khách
}

/**
 * LEVEL 1: Workflow Template (Mô hình quy trình chuẩn)
 * Admin cấu hình template này một lần, sau đó apply cho các sản phẩm
 */
export interface WorkflowTemplate {
  id: string; // "wf_bag_spa", "wf_shoe_repair"
  name: string; // "Quy trình Spa Túi Xách"
  product_type: string; // "bag", "shoe", "metal"
  description?: string;

  // Danh sách bước trong template
  stages: WorkflowTemplateStage[];

  created_at: number;
  updated_at: number;
}

/**
 * Một stage (công đoạn) trong workflow template
 */
export interface WorkflowTemplateStage {
  id: string;
  stage_order: number;
  department_code: string; // DEPT_001, DEPT_002
  department_name: string;
  stage_name: string; // "Xi mạ", "Vệ sinh"
  description?: string;
  expected_duration_hours?: number;

  // Dynamic checklist cho stage này
  checklist_template: {
    task_id: string;
    task_name: string; // "Strip ố", "Đánh bóng"
    task_order: number;
  }[];
}

/**
 * Firebase collection structure:
 *
 * xoxo/
 *   orders/{orderId}
 *     - customer_info
 *     - consultant_id
 *     - total_amount
 *     - status
 *
 *   service_items/{itemId}
 *     - order_id
 *     - qr_code
 *     - commission
 *     - workflow_id
 *     - current_step_index
 *     - steps[] (WorkflowStepData[])
 *
 *   workflow_templates/{templateId}
 *     - stages[] (WorkflowTemplateStage[])
 *
 *   departments/{deptCode}
 *     - name
 *     - description
 */

// Firebase collection type mappings
export interface FirebaseServiceItems {
  [key: string]: ServiceItem;
}

export interface FirebaseWorkflowTemplates {
  [key: string]: WorkflowTemplate;
}

export interface FirebaseDepartments {
  [key: string]: {
    code: string;
    name: string;
    description?: string;
    createdAt?: number;
    updatedAt?: number;
  };
}
