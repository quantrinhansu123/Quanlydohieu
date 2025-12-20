export enum FeedbackType {
  PRAISE = "praise", // KHEN
  NEUTRAL = "neutral", // TÀM TẠM
  COMPLAINT = "complaint", // CHÊ
  ANGRY = "angry", // BỨC XÚC
}

export enum FeedbackStatus {
  GOOD = "good", // Tốt
  NEED_REPROCESS = "need_reprocess", // Xử lý lại
  PROCESSING = "processing", // Đang xử lý
  RESOLVED = "resolved", // Đã giải quyết
  PENDING = "pending", // Chờ xử lý
}

export interface CustomerFeedback {
  id: string;
  orderId: string;
  orderCode: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  feedbackType: FeedbackType;
  rating?: number; // 1-5 stars (optional)
  notes?: string;
  content?: string; // Nội dung feedback
  solution?: string; // Phương án giải quyết
  saleId?: string; // Sale phụ trách ID
  saleName?: string; // Sale phụ trách tên
  collectedBy?: string; // Staff ID who collected feedback
  collectedByName?: string;
  collectedAt: number;
  createdAt: number;
  updatedAt: number;
  // Status of feedback processing
  status?: FeedbackStatus; // Trạng thái xử lý
  requiresReService?: boolean; // Deprecated: use status instead
  reServiceOrderId?: string; // Link to new order if re-service needed
}

export interface FirebaseFeedback {
  [feedbackId: string]: CustomerFeedback;
}

export const FeedbackTypeLabels: Record<FeedbackType, string> = {
  [FeedbackType.PRAISE]: "Khen",
  [FeedbackType.NEUTRAL]: "Tàm tạm",
  [FeedbackType.COMPLAINT]: "Chê",
  [FeedbackType.ANGRY]: "Bức xúc",
};

export const FeedbackTypeOptions = [
  { label: "Khen", value: FeedbackType.PRAISE },
  { label: "Tàm tạm", value: FeedbackType.NEUTRAL },
  { label: "Chê", value: FeedbackType.COMPLAINT },
  { label: "Bức xúc", value: FeedbackType.ANGRY },
];

export const FeedbackStatusLabels: Record<FeedbackStatus, string> = {
  [FeedbackStatus.GOOD]: "Tốt",
  [FeedbackStatus.NEED_REPROCESS]: "Xử lý lại",
  [FeedbackStatus.PROCESSING]: "Đang xử lý",
  [FeedbackStatus.RESOLVED]: "Đã giải quyết",
  [FeedbackStatus.PENDING]: "Chờ xử lý",
};

export const FeedbackStatusOptions = [
  { label: "Tốt", value: FeedbackStatus.GOOD },
  { label: "Xử lý lại", value: FeedbackStatus.NEED_REPROCESS },
  { label: "Đang xử lý", value: FeedbackStatus.PROCESSING },
  { label: "Đã giải quyết", value: FeedbackStatus.RESOLVED },
  { label: "Chờ xử lý", value: FeedbackStatus.PENDING },
];


