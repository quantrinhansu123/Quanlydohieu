import { OrderStatus } from "@/types/order";

export const columnsKanban = [
  {
    key: OrderStatus.PENDING,
    title: "Lên đơn",
    color: "#1890ff",
    bgColor: "#f0f7ff",
    description: "Đơn hàng mới tạo (Pending)",
    status: OrderStatus.PENDING,
  },
  {
    key: OrderStatus.IN_PROGRESS,
    title: "Sản xuất",
    color: "#fa8c16",
    bgColor: "#fff7e6",
    description: "Đang thực hiện (In Progress)",
    status: OrderStatus.IN_PROGRESS,
  },
  {
    key: OrderStatus.ON_HOLD,
    title: "Thanh toán",
    color: "#722ed1",
    bgColor: "#f9f0ff",
    description: "Chờ thanh toán (On Hold)",
    status: OrderStatus.ON_HOLD,
  },
  {
    key: OrderStatus.COMPLETED,
    title: "CSKH",
    color: "#52c41a",
    bgColor: "#f6ffed",
    description: "Hoàn thành (Completed)",
    status: OrderStatus.COMPLETED,
  },
  {
    key: OrderStatus.CANCELLED,
    title: "Huỷ",
    color: "#ff4d4f",
    bgColor: "#fff2f0",
    description: "Đơn hàng bị huỷ (Cancelled)",
    status: OrderStatus.CANCELLED,
  },
];
