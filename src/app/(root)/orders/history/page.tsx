"use client";

import CommonTable, { type PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import {
  ClockCircleOutlined,
  DollarOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  PrinterOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  Avatar,
  Badge,
  Card,
  Col,
  Descriptions,
  Image,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
} from "antd";
import dayjs from "dayjs";

const { Text, Title, Paragraph } = Typography;

interface OrderHistory {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  customer: string;
  status:
    | "pending"
    | "processing"
    | "quality_check"
    | "completed"
    | "cancelled";
  paymentStatus: "unpaid" | "partial" | "paid";
  totalAmount: number;
  paidAmount: number;
  invoiceStaff: string;
  salesStaff: string;
  technician: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  images: {
    before: string[];
    after: string[];
  };
  notes: string;
  timeline: {
    date: string;
    action: string;
    staff: string;
    notes?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const mockOrderHistory: OrderHistory[] = [
  {
    id: "1",
    orderNumber: "DH-2024-001",
    invoiceNumber: "HD-2024-001",
    invoiceDate: "2024-11-15",
    customer: "Công ty TNHH ABC",
    status: "completed",
    paymentStatus: "paid",
    totalAmount: 50000000,
    paidAmount: 50000000,
    invoiceStaff: "Nguyễn Văn A",
    salesStaff: "Trần Thị B",
    technician: "Lê Văn C",
    items: [
      {
        id: "1",
        productName: "Ví da bò cao cấp",
        quantity: 100,
        price: 300000,
        total: 30000000,
      },
      {
        id: "2",
        productName: "Thắt lưng da",
        quantity: 50,
        price: 400000,
        total: 20000000,
      },
    ],
    images: {
      before: [
        "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=300&h=300",
        "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=300&h=300",
      ],
      after: [
        "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=300&h=300",
        "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=300&h=300",
      ],
    },
    notes: "Đơn hàng đã hoàn thành xuất sắc, khách hàng rất hài lòng",
    timeline: [
      { date: "2024-11-15 08:30", action: "Tạo đơn hàng", staff: "Trần Thị B" },
      {
        date: "2024-11-15 10:00",
        action: "Xác nhận đơn hàng",
        staff: "Nguyễn Văn A",
      },
      {
        date: "2024-11-16 09:00",
        action: "Bắt đầu sản xuất",
        staff: "Lê Văn C",
        notes: "Đã chuẩn bị đầy đủ nguyên vật liệu",
      },
      {
        date: "2024-11-20 14:30",
        action: "Hoàn thành sản xuất",
        staff: "Lê Văn C",
      },
      {
        date: "2024-11-21 10:00",
        action: "Kiểm tra chất lượng",
        staff: "Phạm Thị D",
        notes: "Chất lượng đạt chuẩn",
      },
      {
        date: "2024-11-22 08:00",
        action: "Thanh toán đầy đủ",
        staff: "Nguyễn Văn A",
      },
      {
        date: "2024-11-22 14:00",
        action: "Giao hàng",
        staff: "Hoàng Văn E",
        notes: "Giao hàng thành công",
      },
    ],
    createdAt: "2024-11-15 08:30:00",
    updatedAt: "2024-11-22 14:00:00",
    completedAt: "2024-11-22 14:00:00",
  },
  {
    id: "2",
    orderNumber: "DH-2024-002",
    invoiceNumber: "HD-2024-002",
    invoiceDate: "2024-11-20",
    customer: "Cửa hàng XYZ",
    status: "completed",
    paymentStatus: "paid",
    totalAmount: 30000000,
    paidAmount: 30000000,
    invoiceStaff: "Phạm Thị D",
    salesStaff: "Hoàng Văn E",
    technician: "Vũ Thị F",
    items: [
      {
        id: "3",
        productName: "Túi xách nữ",
        quantity: 80,
        price: 375000,
        total: 30000000,
      },
    ],
    images: {
      before: [
        "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=300&h=300",
      ],
      after: [
        "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=300&h=300",
        "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=300&h=300",
      ],
    },
    notes: "Khách hàng đặt lại đơn hàng lần 3",
    timeline: [
      {
        date: "2024-11-20 09:00",
        action: "Tạo đơn hàng",
        staff: "Hoàng Văn E",
      },
      {
        date: "2024-11-20 10:30",
        action: "Xác nhận đơn hàng",
        staff: "Phạm Thị D",
      },
      {
        date: "2024-11-21 08:00",
        action: "Bắt đầu sản xuất",
        staff: "Vũ Thị F",
      },
      {
        date: "2024-11-25 15:00",
        action: "Hoàn thành sản xuất",
        staff: "Vũ Thị F",
      },
      {
        date: "2024-11-26 09:00",
        action: "Kiểm tra chất lượng",
        staff: "Phạm Thị D",
      },
      {
        date: "2024-11-27 10:00",
        action: "Thanh toán đầy đủ",
        staff: "Phạm Thị D",
      },
      { date: "2024-11-28 11:00", action: "Giao hàng", staff: "Hoàng Văn E" },
    ],
    createdAt: "2024-11-20 09:00:00",
    updatedAt: "2024-11-28 11:00:00",
    completedAt: "2024-11-28 11:00:00",
  },
  {
    id: "3",
    orderNumber: "DH-2024-003",
    invoiceNumber: "HD-2024-003",
    invoiceDate: "2024-11-25",
    customer: "Siêu thị DEF",
    status: "completed",
    paymentStatus: "paid",
    totalAmount: 75000000,
    paidAmount: 75000000,
    invoiceStaff: "Đỗ Văn G",
    salesStaff: "Bùi Thị H",
    technician: "Lý Văn I",
    items: [
      {
        id: "4",
        productName: "Giày da nam",
        quantity: 150,
        price: 500000,
        total: 75000000,
      },
    ],
    images: {
      before: [
        "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=300&h=300",
      ],
      after: [
        "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=300&h=300",
      ],
    },
    notes: "Đơn hàng lớn, ưu tiên cao",
    timeline: [
      { date: "2024-11-25 10:15", action: "Tạo đơn hàng", staff: "Bùi Thị H" },
      {
        date: "2024-11-25 11:00",
        action: "Xác nhận đơn hàng",
        staff: "Đỗ Văn G",
      },
      {
        date: "2024-11-26 08:00",
        action: "Thanh toán 50%",
        staff: "Đỗ Văn G",
        notes: "Đã nhận 37,500,000 VNĐ",
      },
      {
        date: "2024-11-26 09:00",
        action: "Bắt đầu sản xuất",
        staff: "Lý Văn I",
      },
      {
        date: "2024-11-30 16:00",
        action: "Hoàn thành sản xuất",
        staff: "Lý Văn I",
      },
      {
        date: "2024-12-01 10:00",
        action: "Kiểm tra chất lượng",
        staff: "Phạm Thị D",
      },
      {
        date: "2024-12-02 09:00",
        action: "Thanh toán 50% còn lại",
        staff: "Đỗ Văn G",
      },
      { date: "2024-12-02 15:00", action: "Giao hàng", staff: "Hoàng Văn E" },
    ],
    createdAt: "2024-11-25 10:15:00",
    updatedAt: "2024-12-02 15:00:00",
    completedAt: "2024-12-02 15:00:00",
  },
  {
    id: "4",
    orderNumber: "DH-2024-004",
    invoiceNumber: "HD-2024-004",
    invoiceDate: "2024-10-10",
    customer: "Khách hàng cá nhân - Nguyễn Thị K",
    status: "completed",
    paymentStatus: "paid",
    totalAmount: 15000000,
    paidAmount: 15000000,
    invoiceStaff: "Nguyễn Thị K",
    salesStaff: "Trần Văn L",
    technician: "Lê Văn C",
    items: [
      {
        id: "5",
        productName: "Balo da",
        quantity: 30,
        price: 500000,
        total: 15000000,
      },
    ],
    images: {
      before: [],
      after: [
        "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=300&h=200",
      ],
    },
    notes: "Khách hàng thân thiết",
    timeline: [
      { date: "2024-10-10 14:00", action: "Tạo đơn hàng", staff: "Trần Văn L" },
      {
        date: "2024-10-10 15:00",
        action: "Xác nhận đơn hàng",
        staff: "Nguyễn Thị K",
      },
      {
        date: "2024-10-11 08:00",
        action: "Bắt đầu sản xuất",
        staff: "Lê Văn C",
      },
      {
        date: "2024-10-14 16:00",
        action: "Hoàn thành sản xuất",
        staff: "Lê Văn C",
      },
      {
        date: "2024-10-15 09:00",
        action: "Kiểm tra chất lượng",
        staff: "Phạm Thị D",
      },
      {
        date: "2024-10-15 14:00",
        action: "Thanh toán đầy đủ",
        staff: "Nguyễn Thị K",
      },
      { date: "2024-10-16 10:00", action: "Giao hàng", staff: "Hoàng Văn E" },
    ],
    createdAt: "2024-10-10 14:00:00",
    updatedAt: "2024-10-16 10:00:00",
    completedAt: "2024-10-16 10:00:00",
  },
];

const getStatusColor = (status: string) => {
  const colors = {
    pending: "default",
    processing: "processing",
    quality_check: "warning",
    completed: "success",
    cancelled: "error",
  };
  return colors[status as keyof typeof colors] || "default";
};

const getStatusText = (status: string) => {
  const texts = {
    pending: "Chờ xử lý",
    processing: "Đang sản xuất",
    quality_check: "Kiểm tra chất lượng",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  return texts[status as keyof typeof texts] || status;
};

const getPaymentStatusColor = (status: string) => {
  const colors = {
    unpaid: "error",
    partial: "warning",
    paid: "success",
  };
  return colors[status as keyof typeof colors] || "default";
};

const getPaymentStatusText = (status: string) => {
  const texts = {
    unpaid: "Chưa thanh toán",
    partial: "Thanh toán một phần",
    paid: "Đã thanh toán",
  };
  return texts[status as keyof typeof texts] || status;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// Order History Detail Drawer
const OrderHistoryDetailDrawer: React.FC<PropRowDetails<OrderHistory>> = ({
  data,
}) => {
  if (!data) return null;

  const paymentProgress = Math.round(
    (data.paidAmount / data.totalAmount) * 100
  );
  const totalDays = data.completedAt
    ? dayjs(data.completedAt).diff(dayjs(data.createdAt), "day")
    : 0;

  return (
    <Space vertical size="large" className="w-full">
      <div>
        <Title level={4}>Thông tin đơn hàng</Title>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Số đơn hàng">
            <Text strong>{data.orderNumber}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Số hóa đơn">
            <Text strong>{data.invoiceNumber}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày in hóa đơn">
            {dayjs(data.invoiceDate).format("DD/MM/YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Khách hàng">
            <Text strong>{data.customer}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Tình trạng">
            <Tag color={getStatusColor(data.status)}>
              {getStatusText(data.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Thanh toán">
            <Space vertical size="small" className="w-full">
              <Tag color={getPaymentStatusColor(data.paymentStatus)}>
                {getPaymentStatusText(data.paymentStatus)}
              </Tag>
              <Progress percent={paymentProgress} size="small" />
              <Text className="text-xs">
                Đã thanh toán: {formatCurrency(data.paidAmount)} /{" "}
                {formatCurrency(data.totalAmount)}
              </Text>
            </Space>
          </Descriptions.Item>
          {data.completedAt && (
            <Descriptions.Item label="Thời gian hoàn thành">
              <Space vertical size={0}>
                <Text strong>{totalDays} ngày</Text>
                <Text className="text-xs text-gray-500">
                  Từ {dayjs(data.createdAt).format("DD/MM/YYYY")} đến{" "}
                  {dayjs(data.completedAt).format("DD/MM/YYYY")}
                </Text>
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <div>
        <Title level={4}>Nhân viên phụ trách</Title>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="NV lập hóa đơn">
            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              {data.invoiceStaff}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="NV Sale">
            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              {data.salesStaff}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Kỹ thuật viên">
            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              {data.technician}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </div>

      <div>
        <Title level={4}>Chi tiết sản phẩm</Title>
        <Table
          dataSource={data.items}
          pagination={false}
          size="small"
          columns={[
            {
              title: "Sản phẩm",
              dataIndex: "productName",
              key: "productName",
            },
            {
              title: "SL",
              dataIndex: "quantity",
              key: "quantity",
              align: "center",
              width: 80,
            },
            {
              title: "Đơn giá",
              dataIndex: "price",
              key: "price",
              align: "right",
              render: (price: number) => formatCurrency(price),
            },
            {
              title: "Thành tiền",
              dataIndex: "total",
              key: "total",
              align: "right",
              render: (total: number) => (
                <Text strong>{formatCurrency(total)}</Text>
              ),
            },
          ]}
        />
      </div>

      <div>
        <Title level={4}>Lịch sử xử lý</Title>
        <Timeline
          items={data.timeline.map((item) => ({
            color: "blue",
            children: (
              <Space vertical size={0}>
                <Text strong>{item.action}</Text>
                <Space size="small">
                  <TeamOutlined />
                  <Text className="text-xs">{item.staff}</Text>
                </Space>
                <Text className="text-xs text-gray-500">
                  {dayjs(item.date).format("DD/MM/YYYY HH:mm")}
                </Text>
                {item.notes && (
                  <Text className="text-xs italic text-gray-600">
                    {item.notes}
                  </Text>
                )}
              </Space>
            ),
          }))}
        />
      </div>

      {(data.images.before.length > 0 || data.images.after.length > 0) && (
        <div>
          <Title level={4}>Tài liệu đính kèm</Title>
          <Row gutter={[16, 16]}>
            {data.images.before.length > 0 && (
              <Col span={24}>
                <Card size="small" title="Hình ảnh trước sản xuất">
                  <Image.PreviewGroup>
                    <Space wrap>
                      {data.images.before.map((img, idx) => (
                        <Image
                          key={idx}
                          width={120}
                          height={90}
                          src={img}
                          alt={`Before ${idx + 1}`}
                          style={{ objectFit: "cover" }}
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                </Card>
              </Col>
            )}
            {data.images.after.length > 0 && (
              <Col span={24}>
                <Card size="small" title="Hình ảnh sau sản xuất">
                  <Image.PreviewGroup>
                    <Space wrap>
                      {data.images.after.map((img, idx) => (
                        <Image
                          key={idx}
                          width={120}
                          height={90}
                          src={img}
                          alt={`After ${idx + 1}`}
                          style={{ objectFit: "cover" }}
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                </Card>
              </Col>
            )}
          </Row>
        </div>
      )}

      {data.notes && (
        <div>
          <Title level={4}>Ghi chú</Title>
          <Paragraph className="p-3 bg-gray-50 rounded">{data.notes}</Paragraph>
        </div>
      )}
    </Space>
  );
};

export default function OrderHistoryPage() {
  const {
    query,
    pagination,
    updateQueries,
    reset,
    applyFilter,
    handlePageChange,
  } = useFilter();

  const filteredOrders = applyFilter(mockOrderHistory);

  // Statistics
  const totalOrders = mockOrderHistory.length;
  const totalRevenue = mockOrderHistory.reduce(
    (sum, o) => sum + o.totalAmount,
    0
  );
  const avgOrderValue = totalRevenue / totalOrders;
  const avgCompletionDays =
    mockOrderHistory.reduce((sum, o) => {
      if (o.completedAt) {
        return sum + dayjs(o.completedAt).diff(dayjs(o.createdAt), "day");
      }
      return sum;
    }, 0) / totalOrders;

  // Filter fields
  const filterFields = [
    {
      name: "status",
      label: "Tình trạng",
      type: "select" as const,
      options: [
        { label: "Chờ xử lý", value: "pending" },
        { label: "Đang sản xuất", value: "processing" },
        { label: "Kiểm tra chất lượng", value: "quality_check" },
        { label: "Hoàn thành", value: "completed" },
        { label: "Đã hủy", value: "cancelled" },
      ],
    },
    {
      name: "paymentStatus",
      label: "Thanh toán",
      type: "select" as const,
      options: [
        { label: "Chưa thanh toán", value: "unpaid" },
        { label: "Thanh toán một phần", value: "partial" },
        { label: "Đã thanh toán", value: "paid" },
      ],
    },
    {
      name: "invoiceDate",
      label: "Ngày hóa đơn",
      type: "date" as const,
    },
    {
      name: "customer",
      label: "Khách hàng",
      type: "input" as const,
    },
  ];

  // Table columns
  const columns: TableColumnsType<OrderHistory> = [
    {
      title: "Số ĐH / HĐ",
      key: "orderInfo",
      width: 180,
      fixed: "left",
      render: (_: unknown, record: OrderHistory) => (
        <Space vertical size={0}>
          <Text strong className="text-sm">
            {record.orderNumber}
          </Text>
          <Text className="text-xs text-gray-500">{record.invoiceNumber}</Text>
        </Space>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      key: "customer",
      width: 200,
      fixed: "left",
    },
    {
      title: "Ngày HĐ",
      dataIndex: "invoiceDate",
      key: "invoiceDate",
      width: 120,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Tình trạng",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Thanh toán",
      key: "payment",
      width: 140,
      render: (_: unknown, record: OrderHistory) => (
        <Tag color={getPaymentStatusColor(record.paymentStatus)}>
          {getPaymentStatusText(record.paymentStatus)}
        </Tag>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 140,
      align: "right",
      render: (amount: number) => <Text strong>{formatCurrency(amount)}</Text>,
    },
    {
      title: "NV Sale",
      dataIndex: "salesStaff",
      key: "salesStaff",
      width: 130,
    },
    {
      title: "Kỹ thuật",
      dataIndex: "technician",
      key: "technician",
      width: 130,
    },
    {
      title: "Thời gian",
      key: "duration",
      width: 120,
      render: (_: unknown, record: OrderHistory) => {
        if (record.completedAt) {
          const days = dayjs(record.completedAt).diff(
            dayjs(record.createdAt),
            "day"
          );
          return (
            <Space>
              <ClockCircleOutlined />
              <Text>{days} ngày</Text>
            </Space>
          );
        }
        return "-";
      },
    },
    {
      title: "Tài liệu",
      key: "documents",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_: unknown, record: OrderHistory) => {
        const totalImages =
          record.images.before.length + record.images.after.length;
        return totalImages > 0 ? (
          <Badge count={totalImages}>
            <FileImageOutlined className="text-lg text-blue-500" />
          </Badge>
        ) : (
          <FileImageOutlined className="text-lg text-gray-300" />
        );
      },
    },
  ];

  return (
    <WrapperContent
      title="Lịch sử Mua hàng"
      header={{
        searchInput: {
          placeholder: "Tìm kiếm đơn hàng, hóa đơn, khách hàng...",
          filterKeys: ["orderNumber", "invoiceNumber", "customer"],
        },
        filters: {
          fields: filterFields,
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
        buttonEnds: [
          {
            name: "Export Excel",
            icon: <FileExcelOutlined />,
            onClick: () => console.log("Export Excel"),
          },
          {
            name: "In báo cáo",
            icon: <PrinterOutlined />,
            onClick: () => console.log("Print Report"),
          },
        ],
      }}
      isEmpty={!filteredOrders?.length}
    >
      <Space vertical size="large" className="w-full">
        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng đơn hàng"
                value={totalOrders}
                prefix={<ShoppingOutlined />}
                suffix="đơn"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng doanh thu"
                value={totalRevenue}
                prefix={<DollarOutlined />}
                formatter={(value) => formatCurrency(Number(value))}
                styles={{ content: { color: "#52c41a" } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Giá trị TB/đơn"
                value={avgOrderValue}
                prefix={<DollarOutlined />}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="TG hoàn thành TB"
                value={Math.round(avgCompletionDays)}
                prefix={<ClockCircleOutlined />}
                suffix="ngày"
                styles={{ content: { color: "#1890ff" } }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Table */}
        <Card>
          <CommonTable<OrderHistory>
            columns={columns}
            dataSource={filteredOrders}
            pagination={{
              ...pagination,
              onChange: handlePageChange,
            }}
            loading={false}
            rank
            paging
            DrawerDetails={OrderHistoryDetailDrawer}
          />
        </Card>
      </Space>
    </WrapperContent>
  );
}
