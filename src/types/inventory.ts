export interface Material {
  id: string;
  name: string;
  category: string;
  stockQuantity: number;
  unit: string;
  minThreshold: number;
  maxCapacity: number;
  alertThreshold?: number; // Hạn mức cảnh báo (khi tồn kho gần tới hạn mức này sẽ cảnh báo)
  expiryDate?: string; // Optional, chỉ cho hàng có hạn sử dụng
  warehouse?: string;
  supplier?: string;
  lastUpdated?: string;
  image?: string; // URL ảnh nguyên liệu
  // Giá nhập nguyên liệu
  importPrice?: number; // Giá nhập mỗi đơn vị
  // Cài đặt thông báo
  longStockAlertDays?: number; // Số ngày tồn quá lâu để cảnh báo (tùy chỉnh)
  createdAt?: number;
  updatedAt?: number;
}

export interface InventoryTransaction {
  code: string;
  materialId: string;
  materialName: string;
  type: "import" | "export"; // Nhập hoặc xuất
  quantity: number;
  unit: string;
  price?: number; // Giá nhập/xuất (nếu có)
  totalAmount?: number; // Tổng tiền = quantity * price
  date: string; // Ngày thực hiện
  warehouse?: string;
  supplier?: string; // Chỉ cho import
  reason?: string; // Lý do xuất (chỉ cho export)
  note?: string;
  images?: string[]; // Ảnh minh chứng (ví dụ: ảnh thanh toán, ảnh nhập kho)
  createdBy?: string; // Người thực hiện
  createdAt: number;
}

export interface InventorySettings {
  // Cài đặt thông báo mặc định
  defaultLongStockDays: number; // Số ngày tồn quá lâu để cảnh báo (mặc định 90)
  updatedAt?: number;
}

// Phiếu đề xuất mua
export interface PurchaseRequest {
  id: string;
  code: string; // Mã phiếu (ví dụ: PR_xxx)
  items: PurchaseRequestItem[]; // Danh sách sản phẩm đề xuất mua
  totalAmount: number; // Tổng giá trị đề xuất
  status: "pending" | "approved" | "rejected" | "paid"; // Trạng thái: Chờ duyệt, Đã duyệt, Từ chối, Đã thanh toán
  requestedBy: string; // ID người đề xuất
  requestedByName?: string; // Tên người đề xuất
  requestedAt: number; // Thời gian đề xuất
  approvedBy?: string; // ID người duyệt
  approvedByName?: string; // Tên người duyệt
  approvedAt?: number; // Thời gian duyệt
  rejectedReason?: string; // Lý do từ chối
  paymentImages?: string[]; // Ảnh minh chứng thanh toán
  paymentNote?: string; // Ghi chú thanh toán
  paidAmount?: number; // Số tiền đã thanh toán
  paidBy?: string; // ID người thanh toán
  paidByName?: string; // Tên người thanh toán
  paidAt?: number; // Thời gian thanh toán
  relatedTaskId?: string; // ID công việc liên quan (nếu có)
  relatedOrderCode?: string; // Mã đơn hàng liên quan (nếu có)
  createdAt: number;
  updatedAt: number;
}

// Chi tiết sản phẩm trong phiếu đề xuất mua
export interface PurchaseRequestItem {
  materialId: string; // ID vật liệu trong kho
  materialName: string; // Tên vật liệu
  quantity: number; // Số lượng đề xuất mua
  unit: string; // Đơn vị
  suggestedPrice?: number; // Giá đề xuất (mỗi đơn vị)
  totalPrice?: number; // Tổng giá = quantity * suggestedPrice
  note?: string; // Ghi chú cho sản phẩm này
}

// Phiếu xin order nguyên liệu trong kho
export interface MaterialOrder {
  id: string;
  code: string; // Mã phiếu (ví dụ: MO_xxx)
  materialId: string; // ID vật liệu
  materialName: string; // Tên vật liệu
  quantity: number; // Số lượng
  unit: string; // Đơn vị
  note?: string; // Ghi chú
  status: "pending" | "approved" | "rejected"; // Trạng thái: Chờ duyệt, Đã duyệt, Từ chối
  requestedBy: string; // ID người tạo
  requestedByName?: string; // Tên người tạo
  requestedAt: number; // Thời gian tạo
  orderDate: number; // Thời gian order
  approvedBy?: string; // ID người duyệt
  approvedByName?: string; // Tên người duyệt
  approvedAt?: number; // Thời gian duyệt
  rejectedReason?: string; // Lý do từ chối
  relatedOrderCode?: string; // Mã đơn hàng liên quan
  relatedProductCode?: string; // Mã sản phẩm liên quan
  createdAt: number;
  updatedAt: number;
  // Lịch sử
  history?: Array<{
    action: string; // Hành động (created, approved, rejected, etc.)
    actionName: string; // Tên hành động
    by: string; // ID người thực hiện
    byName: string; // Tên người thực hiện
    at: number; // Thời gian
    note?: string; // Ghi chú
  }>;
}

// Nhà cung cấp (NCC)
export interface Supplier {
  id: string;
  code: string; // Mã NCC
  name: string; // Tên NCC
  contactPerson?: string; // Người liên hệ
  phone?: string; // Số điện thoại
  email?: string; // Email
  address?: string; // Địa chỉ
  taxCode?: string; // Mã số thuế
  bankAccount?: string; // Số tài khoản
  bankName?: string; // Tên ngân hàng
  paymentQR?: string; // Ảnh QR thanh toán
  notes?: string; // Ghi chú
  status?: "active" | "inactive"; // Trạng thái
  createdAt: number;
  updatedAt: number;
}

// Đơn hàng từ NCC
export interface SupplierOrder {
  id: string;
  code: string; // Mã đơn hàng
  supplierId: string; // ID NCC
  supplierName: string; // Tên NCC
  items: SupplierOrderItem[]; // Danh sách sản phẩm
  totalAmount: number; // Tổng tiền
  orderDate: number; // Ngày đặt hàng
  deliveryDate?: number; // Ngày giao hàng dự kiến
  receivedDate?: number; // Ngày nhận hàng thực tế
  status: "pending" | "ordered" | "delivered" | "completed" | "cancelled"; // Trạng thái
  notes?: string; // Ghi chú
  createdBy: string; // ID người tạo
  createdByName?: string; // Tên người tạo
  createdAt: number;
  updatedAt: number;
}

// Chi tiết sản phẩm trong đơn hàng NCC
export interface SupplierOrderItem {
  materialId: string; // ID vật liệu
  materialName: string; // Tên vật liệu
  quantity: number; // Số lượng
  unit: string; // Đơn vị
  unitPrice: number; // Đơn giá
  totalPrice: number; // Thành tiền
  note?: string; // Ghi chú
}

// Thanh toán cho NCC
export interface SupplierPayment {
  id: string;
  code: string; // Mã thanh toán
  supplierId: string; // ID NCC
  supplierName: string; // Tên NCC
  orderId?: string; // ID đơn hàng (nếu thanh toán cho đơn hàng cụ thể)
  orderCode?: string; // Mã đơn hàng
  amount: number; // Số tiền thanh toán
  paymentDate: number; // Ngày thanh toán
  paymentMethod?: "cash" | "bank_transfer" | "check" | "other"; // Phương thức thanh toán
  bankAccount?: string; // Số tài khoản (nếu chuyển khoản)
  bankName?: string; // Tên ngân hàng
  checkNumber?: string; // Số séc (nếu thanh toán bằng séc)
  notes?: string; // Ghi chú
  images?: string[]; // Ảnh minh chứng thanh toán
  createdBy: string; // ID người tạo
  createdByName?: string; // Tên người tạo
  createdAt: number;
  updatedAt: number;
}

