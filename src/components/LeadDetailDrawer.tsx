"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  ShopOutlined,
  TagOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Input,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;

interface CustomerInfo {
  name: string;
  avatar: string;
  phone: string;
  email: string;
  address: string;
  company?: string;
  position?: string;
  demand: string;
  budget?: number;
  expectedDate?: string;
}

interface SalesActivity {
  type: "call" | "message" | "email" | "meeting" | "visit";
  date: string;
  staff: string;
  notes: string;
  duration?: number;
}

interface Quotation {
  id: string;
  date: string;
  amount: number;
  items: {
    product: string;
    quantity: number;
    price: number;
  }[];
  status: "sent" | "accepted" | "rejected" | "negotiating";
  validUntil: string;
}

interface Contract {
  id: string;
  date: string;
  value: number;
  status: "draft" | "sent" | "signed" | "cancelled";
  signedDate?: string;
  terms: string;
}

interface VisitSchedule {
  id: string;
  date: string;
  purpose: string;
  staff: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
}

interface Ticket {
  id: string;
  type:
    | "reminder"
    | "send_photo"
    | "appointment"
    | "send_product"
    | "customer_visited"
    | "quoted_silent"
    | "other";
  priority: "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdDate: string;
  dueDate?: string;
  description: string;
  assignedTo: string;
  notes: string[];
}

interface Lead {
  key: string;
  id: number;
  source: "Facebook" | "Zalo" | "TikTok" | "Direct";
  customer: CustomerInfo;
  status:
    | "New"
    | "Assigned"
    | "Contacted"
    | "Qualified"
    | "Proposal"
    | "Negotiation"
    | "Converted"
    | "Failed";
  assignedTo: {
    name: string;
    avatar: string;
  } | null;
  createdAt: string;
  salesActivities: SalesActivity[];
  quotations: Quotation[];
  contracts: Contract[];
  visitSchedules: VisitSchedule[];
  tickets: Ticket[];
  interactionStats: {
    calls: number;
    messages: number;
    emails: number;
    meetings: number;
  };
}

interface LeadDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  lead: Lead | null;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "call":
      return <PhoneOutlined className="text-green-600" />;
    case "message":
      return <MessageOutlined className="text-blue-600" />;
    case "email":
      return <MailOutlined className="text-purple-600" />;
    case "meeting":
      return <UserOutlined className="text-orange-600" />;
    case "visit":
      return <ShopOutlined className="text-red-600" />;
    default:
      return <ClockCircleOutlined />;
  }
};

const getTicketTypeText = (type: string) => {
  const types: Record<string, string> = {
    reminder: "Cần nhắc",
    send_photo: "Hẹn gửi ảnh",
    appointment: "Hẹn gặp mặt",
    send_product: "Hẹn gửi sản phẩm",
    customer_visited: "Khách tới shop",
    quoted_silent: "Đã báo giá - im lặng",
    other: "Khác",
  };
  return types[type] || type;
};

const getTicketTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    reminder: "orange",
    send_photo: "blue",
    appointment: "cyan",
    send_product: "purple",
    customer_visited: "green",
    quoted_silent: "red",
    other: "default",
  };
  return colors[type] || "default";
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    high: "red",
    medium: "orange",
    low: "blue",
  };
  return colors[priority] || "default";
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    open: "red",
    in_progress: "orange",
    resolved: "green",
    closed: "default",
  };
  return colors[status] || "default";
};

const getQuotationStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    sent: "blue",
    accepted: "green",
    rejected: "red",
    negotiating: "orange",
  };
  return colors[status] || "default";
};

const getQuotationStatusText = (status: string) => {
  const texts: Record<string, string> = {
    sent: "Đã gửi",
    accepted: "Chấp nhận",
    rejected: "Từ chối",
    negotiating: "Đang thương lượng",
  };
  return texts[status] || status;
};

const getContractStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: "default",
    sent: "blue",
    signed: "green",
    cancelled: "red",
  };
  return colors[status] || "default";
};

const getContractStatusText = (status: string) => {
  const texts: Record<string, string> = {
    draft: "Bản nháp",
    sent: "Đã gửi",
    signed: "Đã ký",
    cancelled: "Đã hủy",
  };
  return texts[status] || status;
};

export default function LeadDetailDrawer({
  visible,
  onClose,
  lead,
}: LeadDetailDrawerProps) {
  if (!lead) return null;

  // Tab 1: Customer Info
  const renderCustomerInfo = () => (
    <Space vertical size="large" className="w-full">
      <Card size="small" title="Thông tin cá nhân">
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Họ tên" span={2}>
            <Space>
              <Avatar src={lead.customer.avatar} size={32} />
              <Text strong>{lead.customer.name}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Điện thoại">
            <Space>
              <PhoneOutlined />
              <Text copyable>{lead.customer.phone}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            <Space>
              <MailOutlined />
              <Text copyable>{lead.customer.email}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ" span={2}>
            {lead.customer.address}
          </Descriptions.Item>
          {lead.customer.company && (
            <>
              <Descriptions.Item label="Công ty">
                {lead.customer.company}
              </Descriptions.Item>
              <Descriptions.Item label="Chức vụ">
                {lead.customer.position}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      <Card size="small" title="Nhu cầu khách hàng">
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Mô tả nhu cầu" span={2}>
            <Paragraph className="mb-0">{lead.customer.demand}</Paragraph>
          </Descriptions.Item>
          {lead.customer.budget && (
            <Descriptions.Item label="Ngân sách dự kiến">
              <Text strong className="text-green-600">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(lead.customer.budget)}
              </Text>
            </Descriptions.Item>
          )}
          {lead.customer.expectedDate && (
            <Descriptions.Item label="Ngày dự kiến">
              {dayjs(lead.customer.expectedDate).format("DD/MM/YYYY")}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </Space>
  );

  // Tab 2: Sales Activities & Pipeline
  const renderSalesActivities = () => (
    <Space vertical size="large" className="w-full">
      <Card
        size="small"
        title="Thống kê hoạt động chăm sóc"
        extra={
          <Button type="primary" size="small">
            Thêm hoạt động
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card className="text-center">
              <PhoneOutlined className="text-2xl text-green-600" />
              <Title level={4} className="mt-2 mb-0">
                {lead.interactionStats.calls}
              </Title>
              <Text className="text-gray-500">Cuộc gọi</Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="text-center">
              <MessageOutlined className="text-2xl text-blue-600" />
              <Title level={4} className="mt-2 mb-0">
                {lead.interactionStats.messages}
              </Title>
              <Text className="text-gray-500">Tin nhắn</Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="text-center">
              <MailOutlined className="text-2xl text-purple-600" />
              <Title level={4} className="mt-2 mb-0">
                {lead.interactionStats.emails}
              </Title>
              <Text className="text-gray-500">Email</Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="text-center">
              <UserOutlined className="text-2xl text-orange-600" />
              <Title level={4} className="mt-2 mb-0">
                {lead.interactionStats.meetings}
              </Title>
              <Text className="text-gray-500">Cuộc họp</Text>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card size="small" title="Lịch sử tương tác">
        <Timeline
          items={lead.salesActivities.map((activity) => ({
            dot: getActivityIcon(activity.type),
            children: (
              <Space vertical size={0}>
                <Text strong>
                  {activity.type === "call"
                    ? "Cuộc gọi"
                    : activity.type === "message"
                    ? "Tin nhắn"
                    : activity.type === "email"
                    ? "Email"
                    : activity.type === "meeting"
                    ? "Cuộc họp"
                    : "Hẹn"}
                </Text>
                <Text className="text-xs text-gray-500">
                  {dayjs(activity.date).format("DD/MM/YYYY HH:mm")} -{" "}
                  {activity.staff}
                </Text>
                <Paragraph className="text-sm mb-0">{activity.notes}</Paragraph>
                {activity.duration && (
                  <Text className="text-xs text-gray-400">
                    Thời lượng: {activity.duration} phút
                  </Text>
                )}
              </Space>
            ),
          }))}
        />
      </Card>
    </Space>
  );

  // Tab 3: Quotations
  const renderQuotations = () => {
    const quotationColumns: ColumnsType<Quotation> = [
      {
        title: "Mã báo giá",
        dataIndex: "id",
        key: "id",
        width: 120,
      },
      {
        title: "Ngày tạo",
        dataIndex: "date",
        key: "date",
        width: 140,
        render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      },
      {
        title: "Giá trị",
        dataIndex: "amount",
        key: "amount",
        width: 150,
        render: (amount: number) => (
          <Text strong className="text-green-600">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(amount)}
          </Text>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (status: string) => (
          <Tag color={getQuotationStatusColor(status)}>
            {getQuotationStatusText(status)}
          </Tag>
        ),
      },
      {
        title: "Hạn báo giá",
        dataIndex: "validUntil",
        key: "validUntil",
        width: 120,
        render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
      },
    ];

    return (
      <Space vertical size="large" className="w-full">
        <Button type="primary" icon={<DollarOutlined />}>
          Tạo báo giá mới
        </Button>

        <Table
          dataSource={lead.quotations}
          columns={quotationColumns}
          pagination={false}
          size="small"
          bordered
          expandable={{
            expandedRowRender: (record: Quotation) => (
              <Table
                dataSource={record.items}
                columns={[
                  {
                    title: "Sản phẩm/Dịch vụ",
                    dataIndex: "product",
                    key: "product",
                  },
                  {
                    title: "Số lượng",
                    dataIndex: "quantity",
                    key: "quantity",
                    width: 100,
                  },
                  {
                    title: "Đơn giá",
                    dataIndex: "price",
                    key: "price",
                    width: 150,
                    render: (price: number) =>
                      new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(price),
                  },
                ]}
                pagination={false}
                size="small"
              />
            ),
          }}
        />
      </Space>
    );
  };

  // Tab 4: Contracts
  const renderContracts = () => (
    <Space vertical size="large" className="w-full">
      <Button type="primary" icon={<FileTextOutlined />}>
        Tạo hợp đồng mới
      </Button>

      {lead.contracts.length > 0 ? (
        lead.contracts.map((contract) => (
          <Card key={contract.id} size="small">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Mã HĐ">
                <Text strong>{contract.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={getContractStatusColor(contract.status)}>
                  {getContractStatusText(contract.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(contract.date).format("DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Giá trị">
                <Text strong className="text-green-600">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(contract.value)}
                </Text>
              </Descriptions.Item>
              {contract.signedDate && (
                <Descriptions.Item label="Ngày ký" span={2}>
                  {dayjs(contract.signedDate).format("DD/MM/YYYY")}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Điều khoản" span={2}>
                <Paragraph className="mb-0">{contract.terms}</Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        ))
      ) : (
        <Card>
          <Text className="text-gray-400">Chưa có hợp đồng nào</Text>
        </Card>
      )}
    </Space>
  );

  // Tab 5: Visit Schedules
  const renderVisitSchedules = () => (
    <Space vertical size="large" className="w-full">
      <Button type="primary" icon={<CalendarOutlined />}>
        Đặt lịch Hẹn
      </Button>

      {lead.visitSchedules.length > 0 ? (
        lead.visitSchedules.map((visit) => (
          <Card
            key={visit.id}
            size="small"
            className={visit.status === "scheduled" ? "border-blue-300" : ""}
          >
            <Space vertical size="small" className="w-full">
              <div className="flex items-center justify-between">
                <Text strong>{visit.purpose}</Text>
                <Tag
                  color={
                    visit.status === "scheduled"
                      ? "blue"
                      : visit.status === "completed"
                      ? "green"
                      : "red"
                  }
                >
                  {visit.status === "scheduled"
                    ? "Đã đặt lịch"
                    : visit.status === "completed"
                    ? "Hoàn thành"
                    : "Đã hủy"}
                </Tag>
              </div>
              <Space size="large">
                <Space>
                  <CalendarOutlined />
                  <Text>{dayjs(visit.date).format("DD/MM/YYYY HH:mm")}</Text>
                </Space>
                <Space>
                  <UserOutlined />
                  <Text>{visit.staff}</Text>
                </Space>
              </Space>
              {visit.notes && (
                <Paragraph className="text-sm text-gray-600 mb-0">
                  {visit.notes}
                </Paragraph>
              )}
            </Space>
          </Card>
        ))
      ) : (
        <Card>
          <Text className="text-gray-400">Chưa có lịch Hẹn nào</Text>
        </Card>
      )}
    </Space>
  );

  // Tab 6: Tickets
  const renderTickets = () => (
    <Space vertical size="large" className="w-full">
      <Button type="primary" icon={<TagOutlined />}>
        Tạo ticket mới
      </Button>

      {lead.tickets.length > 0 ? (
        lead.tickets.map((ticket) => (
          <Card
            key={ticket.id}
            size="small"
            className={
              ticket.priority === "high"
                ? "border-red-300"
                : ticket.priority === "medium"
                ? "border-orange-300"
                : ""
            }
          >
            <Space vertical size="small" className="w-full">
              <div className="flex items-center justify-between">
                <Space>
                  <Tag color={getTicketTypeColor(ticket.type)}>
                    {getTicketTypeText(ticket.type)}
                  </Tag>
                  <Tag color={getPriorityColor(ticket.priority)}>
                    {ticket.priority === "high"
                      ? "Ưu tiên cao"
                      : ticket.priority === "medium"
                      ? "Trung bình"
                      : "Thấp"}
                  </Tag>
                </Space>
                <Tag color={getStatusColor(ticket.status)}>
                  {ticket.status === "open"
                    ? "Mở"
                    : ticket.status === "in_progress"
                    ? "Đang xử lý"
                    : ticket.status === "resolved"
                    ? "Đã giải quyết"
                    : "Đã đóng"}
                </Tag>
              </div>

              <Text strong>{ticket.description}</Text>

              <Space size="large">
                <Space>
                  <ClockCircleOutlined />
                  <Text className="text-xs">
                    Tạo: {dayjs(ticket.createdDate).format("DD/MM/YYYY")}
                  </Text>
                </Space>
                {ticket.dueDate && (
                  <Space>
                    <WarningOutlined className="text-orange-500" />
                    <Text className="text-xs text-orange-500">
                      Hạn: {dayjs(ticket.dueDate).format("DD/MM/YYYY")}
                    </Text>
                  </Space>
                )}
                <Space>
                  <UserOutlined />
                  <Text className="text-xs">{ticket.assignedTo}</Text>
                </Space>
              </Space>

              {ticket.notes.length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <Text strong className="text-xs">
                    Ghi chú:
                  </Text>
                  {ticket.notes.map((note, idx) => (
                    <div key={idx} className="ml-2">
                      <Text className="text-xs">• {note}</Text>
                    </div>
                  ))}
                </div>
              )}
            </Space>
          </Card>
        ))
      ) : (
        <Card>
          <Text className="text-gray-400">Chưa có ticket nào</Text>
        </Card>
      )}
    </Space>
  );

  return (
    <Drawer
      title={
        <Space>
          <Avatar src={lead.customer.avatar} size={40} />
          <div>
            <div>
              <Text strong>{lead.customer.name}</Text>
            </div>
            <div>
              <Text className="text-xs text-gray-500">Lead #{lead.id}</Text>
            </div>
          </div>
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={800}
    >
      <Tabs
        items={[
          {
            key: "1",
            label: (
              <span>
                <UserOutlined /> Thông tin KH
              </span>
            ),
            children: renderCustomerInfo(),
          },
          {
            key: "2",
            label: (
              <span>
                <PhoneOutlined /> Hoạt động chăm sóc
              </span>
            ),
            children: renderSalesActivities(),
          },
          {
            key: "3",
            label: (
              <span>
                <DollarOutlined /> Báo giá ({lead.quotations.length})
              </span>
            ),
            children: renderQuotations(),
          },
          {
            key: "4",
            label: (
              <span>
                <FileTextOutlined /> Hợp đồng ({lead.contracts.length})
              </span>
            ),
            children: renderContracts(),
          },
          {
            key: "5",
            label: (
              <span>
                <CalendarOutlined /> Lịch Hẹn ({lead.visitSchedules.length})
              </span>
            ),
            children: renderVisitSchedules(),
          },
          // {
          //   key: "6",
          //   label: (
          //     <span>
          //       <TagOutlined /> Tickets ({lead.tickets.length})
          //     </span>
          //   ),
          //   children: renderTickets(),
          // },
        ]}
      />

      <div className="mt-4 pt-4 border-t">
        <Space wrap>
          <Button
            type="primary"
            icon={<PhoneOutlined />}
            onClick={() => {
              window.location.href = `tel:${lead.customer.phone}`;
            }}
          >
            Gọi điện
          </Button>
          <Button
            icon={<MailOutlined />}
            onClick={() => {
              window.location.href = `mailto:${lead.customer.email}`;
            }}
          >
            Gửi Email
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => window.print()}>
            Xuất PDF
          </Button>
          <Button icon={<CheckCircleOutlined />}>Chuyển trạng thái</Button>
        </Space>
      </div>
    </Drawer>
  );
}
