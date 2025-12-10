import { OrderStatus } from "@/types/order";

export const columnsKanban = [
  {
    key: OrderStatus.PENDING,
    title: "Chờ xác nhận",
    color: "#d9d9d9",
    bgColor: "#fafafa",
    description: "Đơn hàng chờ xác nhận (Pending)",
    status: OrderStatus.PENDING,
    canDrag: false,
  },
  {
    key: OrderStatus.CONFIRMED,
    title: "Lên đơn",
    color: "#1890ff",
    bgColor: "#f0f7ff",
    description: "Đơn hàng đã xác nhận (Confirmed)",
    status: OrderStatus.CONFIRMED,
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
    description: "Chăm sóc khách hàng (Completed)",
    status: OrderStatus.COMPLETED,
  },
];
