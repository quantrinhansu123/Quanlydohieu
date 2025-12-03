"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  ProjectOutlined,
  SyncOutlined,
  TeamOutlined,
  TrophyOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  Avatar,
  Badge,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const { Title, Text, Paragraph } = Typography;

interface WorkflowProcess {
  id: string;
  name: string;
  status: "active" | "pending" | "completed" | "blocked";
  totalTasks: number;
  completedTasks: number;
  stages: number;
  members: number;
  discussions: number;
  avgCompletionTime: number; // in hours
  currentStage: string;
  progress: number;
  priority: "high" | "medium" | "low";
  lastUpdate: string;
}

interface KanbanTask {
  id: string;
  title: string;
  process: string;
  assignee: string;
  stage: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  status: "processing" | "completed" | "pending";
  totalAmount: number;
  createdAt: string;
}

// Mock data cho thống kê
const revenueStats = {
  totalRevenue: 1250000000, // 1.25 tỷ VND
  monthlyRevenue: 450000000, // 450 triệu VND
  growth: 15.5, // %
};

const customerStats = {
  newCustomers: 45,
  totalCustomers: 1250,
  growth: 8.2, // %
};

const orderStats = {
  processingOrders: 23,
  completedOrders: 156,
  totalOrders: 179,
};

// Mock data cho charts
const leadSourceData = [
  { name: "Website", value: 35, color: "#0088FE" },
  { name: "Facebook", value: 25, color: "#00C49F" },
  { name: "Zalo", value: 20, color: "#FFBB28" },
  { name: "Giới thiệu", value: 15, color: "#FF8042" },
  { name: "Khác", value: 5, color: "#8884D8" },
];

const orderRateData = [
  { month: "Tháng 1", completed: 120, total: 150 },
  { month: "Tháng 2", completed: 135, total: 160 },
  { month: "Tháng 3", completed: 140, total: 170 },
  { month: "Tháng 4", completed: 150, total: 180 },
  { month: "Tháng 5", completed: 160, total: 190 },
  { month: "Tháng 6", completed: 155, total: 185 },
  { month: "Tháng 7", completed: 170, total: 200 },
  { month: "Tháng 8", completed: 180, total: 210 },
  { month: "Tháng 9", completed: 175, total: 205 },
  { month: "Tháng 10", completed: 190, total: 220 },
  { month: "Tháng 11", completed: 200, total: 230 },
  { month: "Tháng 12", completed: 210, total: 240 },
];

const revenueMonthlyData = [
  { month: "T1", revenue: 320000000 },
  { month: "T2", revenue: 380000000 },
  { month: "T3", revenue: 350000000 },
  { month: "T4", revenue: 420000000 },
  { month: "T5", revenue: 390000000 },
  { month: "T6", revenue: 410000000 },
  { month: "T7", revenue: 440000000 },
  { month: "T8", revenue: 460000000 },
  { month: "T9", revenue: 430000000 },
  { month: "T10", revenue: 480000000 },
  { month: "T11", revenue: 470000000 },
  { month: "T12", revenue: 450000000 },
];

const workingHoursData = [
  { day: "T2", hours: 8, avg: 7 },
  { day: "T3", hours: 7, avg: 7 },
  { day: "T4", hours: 8, avg: 7 },
  { day: "T5", hours: 8, avg: 7 },
  { day: "T6", hours: 7, avg: 7 },
  { day: "T7", hours: 6, avg: 7 },
  { day: "CN", hours: 8, avg: 7 },
];

const projectCategories = [
  { name: "Nghiên cứu", count: 42, color: "#FFB088" },
  { name: "Marketing", count: 35, color: "#90D5FF" },
  { name: "Vận hành", count: 58, color: "#FFE68C" },
  { name: "Khách hàng", count: 47, color: "#95E1A4" },
];

const mockRecentOrders: RecentOrder[] = [
  {
    id: "1",
    orderNumber: "DH2024-001",
    customer: "Công ty TNHH ABC",
    status: "processing",
    totalAmount: 25000000,
    createdAt: "2 giờ trước",
  },
  {
    id: "2",
    orderNumber: "DH2024-002",
    customer: "Nguyễn Văn A",
    status: "completed",
    totalAmount: 15000000,
    createdAt: "5 giờ trước",
  },
  {
    id: "3",
    orderNumber: "DH2024-003",
    customer: "Trần Thị B",
    status: "processing",
    totalAmount: 30000000,
    createdAt: "1 ngày trước",
  },
  {
    id: "4",
    orderNumber: "DH2024-004",
    customer: "Công ty XYZ",
    status: "pending",
    totalAmount: 45000000,
    createdAt: "2 ngày trước",
  },
  {
    id: "5",
    orderNumber: "DH2024-005",
    customer: "Lê Văn C",
    status: "completed",
    totalAmount: 20000000,
    createdAt: "3 ngày trước",
  },
];

const mockProcesses: WorkflowProcess[] = [
  {
    id: "1",
    name: "Quy trình sản xuất đơn hàng #2024-001",
    status: "active",
    totalTasks: 15,
    completedTasks: 8,
    stages: 5,
    members: 6,
    discussions: 23,
    avgCompletionTime: 48,
    currentStage: "Cắt vải",
    progress: 53,
    priority: "high",
    lastUpdate: "2 giờ trước",
  },
  {
    id: "2",
    name: "Quy trình kiểm tra chất lượng tháng 12",
    status: "active",
    totalTasks: 10,
    completedTasks: 10,
    stages: 4,
    members: 3,
    discussions: 15,
    avgCompletionTime: 24,
    currentStage: "Hoàn thành",
    progress: 100,
    priority: "medium",
    lastUpdate: "5 giờ trước",
  },
  {
    id: "3",
    name: "Quy trình nhập nguyên vật liệu",
    status: "blocked",
    totalTasks: 8,
    completedTasks: 3,
    stages: 3,
    members: 4,
    discussions: 8,
    avgCompletionTime: 36,
    currentStage: "Kiểm tra kho",
    progress: 38,
    priority: "high",
    lastUpdate: "1 ngày trước",
  },
  {
    id: "4",
    name: "Quy trình đào tạo nhân viên mới",
    status: "active",
    totalTasks: 12,
    completedTasks: 7,
    stages: 6,
    members: 8,
    discussions: 31,
    avgCompletionTime: 72,
    currentStage: "Đào tạo thực hành",
    progress: 58,
    priority: "medium",
    lastUpdate: "3 giờ trước",
  },
  {
    id: "5",
    name: "Quy trình bảo trì máy móc định kỳ",
    status: "pending",
    totalTasks: 6,
    completedTasks: 0,
    stages: 3,
    members: 2,
    discussions: 2,
    avgCompletionTime: 16,
    currentStage: "Chưa bắt đầu",
    progress: 0,
    priority: "low",
    lastUpdate: "2 ngày trước",
  },
];

const mockKanbanTasks: Record<string, KanbanTask[]> = {
  pending: [
    {
      id: "t1",
      title: "Chuẩn bị nguyên vật liệu",
      process: "Đơn hàng #2024-001",
      assignee: "Nguyễn Văn A",
      stage: "Chuẩn bị",
      priority: "high",
      dueDate: "03/12/2024",
    },
    {
      id: "t2",
      title: "Kiểm tra máy cắt",
      process: "Bảo trì định kỳ",
      assignee: "Trần Thị B",
      stage: "Chuẩn bị",
      priority: "low",
      dueDate: "05/12/2024",
    },
  ],
  inProgress: [
    {
      id: "t3",
      title: "Cắt vải theo mẫu",
      process: "Đơn hàng #2024-001",
      assignee: "Lê Văn C",
      stage: "Đang thực hiện",
      priority: "high",
      dueDate: "03/12/2024",
    },
    {
      id: "t4",
      title: "Đào tạo kỹ thuật may",
      process: "Đào tạo nhân viên",
      assignee: "Phạm Thị D",
      stage: "Đang thực hiện",
      priority: "medium",
      dueDate: "04/12/2024",
    },
    {
      id: "t5",
      title: "Kiểm tra chất lượng da",
      process: "Nhập NVL",
      assignee: "Hoàng Văn E",
      stage: "Đang thực hiện",
      priority: "high",
      dueDate: "03/12/2024",
    },
  ],
  review: [
    {
      id: "t6",
      title: "Kiểm tra sản phẩm hoàn thiện",
      process: "Đơn hàng #2024-001",
      assignee: "Vũ Thị F",
      stage: "Đang kiểm tra",
      priority: "high",
      dueDate: "04/12/2024",
    },
  ],
  completed: [
    {
      id: "t7",
      title: "Đóng gói sản phẩm",
      process: "Kiểm tra chất lượng",
      assignee: "Đỗ Văn G",
      stage: "Hoàn thành",
      priority: "medium",
      dueDate: "02/12/2024",
    },
    {
      id: "t8",
      title: "Xuất kho nguyên vật liệu",
      process: "Đơn hàng #2024-001",
      assignee: "Bùi Thị H",
      stage: "Hoàn thành",
      priority: "medium",
      dueDate: "01/12/2024",
    },
  ],
};

const getStatusColor = (status: string) => {
  const colors = {
    active: "processing",
    completed: "success",
    pending: "default",
    blocked: "error",
  };
  return colors[status as keyof typeof colors] || "default";
};

const getStatusText = (status: string) => {
  const texts = {
    active: "Đang thực hiện",
    completed: "Hoàn thành",
    pending: "Chưa bắt đầu",
    blocked: "Bị chặn",
  };
  return texts[status as keyof typeof texts] || status;
};

const getPriorityColor = (priority: string) => {
  const colors = {
    high: "red",
    medium: "orange",
    low: "blue",
  };
  return colors[priority as keyof typeof colors] || "default";
};

const getPriorityText = (priority: string) => {
  const texts = {
    high: "Cao",
    medium: "Trung bình",
    low: "Thấp",
  };
  return texts[priority as keyof typeof texts] || priority;
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Tính toán thống kê tổng quan
  const totalProcesses = mockProcesses.length;
  const activeProcesses = mockProcesses.filter(
    (p) => p.status === "active"
  ).length;
  const completedProcesses = mockProcesses.filter(
    (p) => p.status === "completed"
  ).length;
  const blockedProcesses = mockProcesses.filter(
    (p) => p.status === "blocked"
  ).length;
  const totalTasks = mockProcesses.reduce((sum, p) => sum + p.totalTasks, 0);
  const completedTasks = mockProcesses.reduce(
    (sum, p) => sum + p.completedTasks,
    0
  );
  const totalMembers = new Set(mockProcesses.map((p) => p.members)).size;
  const avgProgress = Math.round(
    mockProcesses.reduce((sum, p) => sum + p.progress, 0) / totalProcesses
  );

  const processColumns: TableColumnsType<WorkflowProcess> = [
    {
      title: "Quy trình",
      dataIndex: "name",
      key: "name",
      width: 300,
      fixed: "left",
      render: (text: string, record: WorkflowProcess) => (
        <Space vertical size={0}>
          <Text strong>{text}</Text>
          <Text className="text-xs text-gray-500">
            Giai đoạn: {record.currentStage}
          </Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityText(priority)}
        </Tag>
      ),
    },
    {
      title: "Tiến độ",
      dataIndex: "progress",
      key: "progress",
      width: 200,
      render: (progress: number, record: WorkflowProcess) => (
        <Space vertical size="small" className="w-full">
          <Progress
            percent={progress}
            size="small"
            status={progress === 100 ? "success" : "active"}
          />
          <Text className="text-xs text-gray-500">
            {record.completedTasks}/{record.totalTasks} nhiệm vụ
          </Text>
        </Space>
      ),
    },
    {
      title: "Thành viên",
      dataIndex: "members",
      key: "members",
      width: 120,
      align: "center",
      render: (members: number) => (
        <Space>
          <TeamOutlined />
          <Text>{members}</Text>
        </Space>
      ),
    },
    {
      title: "Trao đổi",
      dataIndex: "discussions",
      key: "discussions",
      width: 100,
      align: "center",
      render: (discussions: number) => (
        <Badge count={discussions} showZero>
          <FileTextOutlined className="text-lg" />
        </Badge>
      ),
    },
    {
      title: "TG trung bình",
      dataIndex: "avgCompletionTime",
      key: "avgCompletionTime",
      width: 140,
      render: (hours: number) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{hours}h</Text>
        </Space>
      ),
    },
    {
      title: "Cập nhật",
      dataIndex: "lastUpdate",
      key: "lastUpdate",
      width: 130,
      fixed: "right",
      render: (text: string) => <Text className="text-xs">{text}</Text>,
    },
  ];

  const renderKanbanColumn = (
    title: string,
    tasks: KanbanTask[],
    color: string
  ) => (
    <Col xs={24} sm={12} lg={6}>
      <Card
        title={
          <Space>
            <Badge color={color} />
            <Text strong>{title}</Text>
            <Badge count={tasks.length} style={{ backgroundColor: color }} />
          </Space>
        }
        styles={{ body: { padding: "12px" } }}
      >
        <Space vertical size="small" className="w-full">
          {tasks.map((task) => (
            <Card
              key={task.id}
              size="small"
              hoverable
              styles={{ body: { padding: "12px" } }}
            >
              <Space vertical size="small" className="w-full">
                <Text strong className="text-sm">
                  {task.title}
                </Text>
                <Text className="text-xs text-gray-500">{task.process}</Text>
                <div className="flex items-center justify-between">
                  <Tag
                    color={getPriorityColor(task.priority)}
                    className="text-xs"
                  >
                    {getPriorityText(task.priority)}
                  </Tag>
                  <Text className="text-xs text-gray-500">{task.dueDate}</Text>
                </div>
                <div className="flex items-center justify-between">
                  <Space size="small">
                    <Avatar size="small" className="bg-blue-500">
                      {task.assignee.charAt(0)}
                    </Avatar>
                    <Text className="text-xs">{task.assignee}</Text>
                  </Space>
                </div>
              </Space>
            </Card>
          ))}
        </Space>
      </Card>
    </Col>
  );

  return (
    <Space vertical size="large" className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="mb-2">
            Dashboard
          </Title>
          <Text className="text-gray-500">
            Kiểm soát tiến độ và đo lường hiệu suất các quy trình
          </Text>
        </div>
      </div>

      {/* Business Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu tháng này"
              value={revenueStats.monthlyRevenue}
              prefix="₫"
              suffix="VNĐ"
              formatter={(value) => `${(value as number).toLocaleString()}`}
            />
            <div className="mt-2">
              <Text className="text-green-600 text-sm">
                +{revenueStats.growth}% so với tháng trước
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Khách hàng mới"
              value={customerStats.newCustomers}
              prefix={<TeamOutlined />}
              suffix="khách"
            />
            <div className="mt-2">
              <Text className="text-green-600 text-sm">
                +{customerStats.growth}% so với tháng trước
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn đang xử lý"
              value={orderStats.processingOrders}
              prefix={<SyncOutlined spin />}
              suffix="đơn"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn đã hoàn thiện"
              value={orderStats.completedOrders}
              prefix={<CheckCircleOutlined />}
              suffix="đơn"
            />
          </Card>
        </Col>
      </Row>

      {/* Statistics Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng quy trình"
              value={totalProcesses}
              prefix={<ProjectOutlined />}
              suffix="quy trình"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang thực hiện"
              value={activeProcesses}
              prefix={<SyncOutlined spin />}
              styles={{ content: { color: "#1890ff" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Bị chặn"
              value={blockedProcesses}
              prefix={<ExclamationCircleOutlined />}
              styles={{
                content: {
                  color: blockedProcesses > 0 ? "#ff4d4f" : undefined,
                },
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tiến độ trung bình"
              value={avgProgress}
              prefix={<TrophyOutlined />}
              suffix="%"
              styles={{ content: { color: "#52c41a" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Giờ làm việc trong tuần"
            extra={
              <Text className="text-xs text-gray-500">
                Tuần này • Avg. 7h/tháng
              </Text>
            }
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={workingHoursData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#FF8C42" radius={[8, 8, 0, 0]} />
                <Bar dataKey="avg" fill="#FFE68C" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Doanh thu dự án"
            extra={
              <Text className="text-xs text-gray-500">
                Năm • Avg. $3000/tháng
              </Text>
            }
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) =>
                    `${(value / 1000000).toFixed(0)}tr`
                  }
                />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                  {revenueMonthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? "#B794F6" : "#90CDF4"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Project Progress & Categories */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Tiến độ dự án"
            extra={<Text className="text-xs text-gray-500">Xem thêm →</Text>}
          >
            <Space vertical size="middle" className="w-full">
              {[
                { month: "February", progress: 45, color: "#FFB088" },
                { month: "March", progress: 65, color: "#90D5FF" },
                { month: "April", progress: 85, color: "#95E1A4" },
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <Text className="text-sm">{item.month}</Text>
                  </div>
                  <Progress
                    percent={item.progress}
                    strokeColor={item.color}
                    showInfo={false}
                    size="small"
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Danh mục dự án"
            extra={<Text className="text-xs text-gray-500">Xem thêm →</Text>}
          >
            <Row gutter={[12, 12]}>
              {projectCategories.map((category, index) => (
                <Col span={12} key={index}>
                  <Card
                    size="small"
                    style={{ backgroundColor: category.color, border: "none" }}
                    styles={{ body: { padding: "16px" } }}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">
                        {index === 0
                          ? "📊"
                          : index === 1
                          ? "📢"
                          : index === 2
                          ? "⚙️"
                          : "😊"}
                      </div>
                      <Text strong className="text-base">
                        {category.name}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "overview",
              label: (
                <span>
                  <ProjectOutlined /> Tổng quan quy trình
                </span>
              ),
              children: (
                <Table<WorkflowProcess>
                  columns={processColumns}
                  dataSource={mockProcesses}
                  rowKey="id"
                  pagination={false}
                />
              ),
            },
            {
              key: "kanban",
              label: (
                <span>
                  <ProjectOutlined /> Kanban Board
                </span>
              ),
              children: (
                <div>
                  <div className="mb-4">
                    <Text className="text-gray-500">
                      Theo dõi trực quan tiến độ thực thi từng quy trình
                    </Text>
                  </div>
                  <Row gutter={[16, 16]}>
                    {renderKanbanColumn(
                      "Chưa bắt đầu",
                      mockKanbanTasks.pending,
                      "#d9d9d9"
                    )}
                    {renderKanbanColumn(
                      "Đang thực hiện",
                      mockKanbanTasks.inProgress,
                      "#1890ff"
                    )}
                    {renderKanbanColumn(
                      "Đang kiểm tra",
                      mockKanbanTasks.review,
                      "#faad14"
                    )}
                    {renderKanbanColumn(
                      "Hoàn thành",
                      mockKanbanTasks.completed,
                      "#52c41a"
                    )}
                  </Row>
                </div>
              ),
            },
            {
              key: "timeline",
              label: (
                <span>
                  <ClockCircleOutlined /> Dòng thời gian
                </span>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={16}>
                    <Timeline
                      items={[
                        {
                          color: "green",
                          children: (
                            <Space vertical size={0}>
                              <Text strong>Hoàn thành kiểm tra chất lượng</Text>
                              <Text className="text-xs text-gray-500">
                                Quy trình: Kiểm tra chất lượng tháng 12
                              </Text>
                              <Text className="text-xs text-gray-500">
                                5 giờ trước
                              </Text>
                            </Space>
                          ),
                        },
                        {
                          color: "blue",
                          children: (
                            <Space vertical size={0}>
                              <Text strong>Chuyển sang giai đoạn cắt vải</Text>
                              <Text className="text-xs text-gray-500">
                                Quy trình: Đơn hàng #2024-001
                              </Text>
                              <Text className="text-xs text-gray-500">
                                2 giờ trước
                              </Text>
                            </Space>
                          ),
                        },
                        {
                          color: "red",
                          children: (
                            <Space vertical size={0}>
                              <Text strong>
                                <WarningOutlined className="mr-2" />
                                Phát hiện vấn đề tại kiểm tra kho
                              </Text>
                              <Text className="text-xs text-gray-500">
                                Quy trình: Nhập nguyên vật liệu
                              </Text>
                              <Text className="text-xs text-gray-500">
                                1 ngày trước
                              </Text>
                            </Space>
                          ),
                        },
                        {
                          color: "blue",
                          children: (
                            <Space vertical size={0}>
                              <Text strong>Bắt đầu đào tạo thực hành</Text>
                              <Text className="text-xs text-gray-500">
                                Quy trình: Đào tạo nhân viên mới
                              </Text>
                              <Text className="text-xs text-gray-500">
                                3 giờ trước
                              </Text>
                            </Space>
                          ),
                        },
                        {
                          color: "gray",
                          children: (
                            <Space vertical size={0}>
                              <Text strong>Tạo quy trình bảo trì định kỳ</Text>
                              <Text className="text-xs text-gray-500">
                                Quy trình: Bảo trì máy móc định kỳ
                              </Text>
                              <Text className="text-xs text-gray-500">
                                2 ngày trước
                              </Text>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card title="Quy trình bị chặn" className="mb-4">
                      <Space vertical size="middle" className="w-full">
                        {mockProcesses
                          .filter((p) => p.status === "blocked")
                          .map((process) => (
                            <div key={process.id}>
                              <Text strong className="text-sm">
                                {process.name}
                              </Text>
                              <div className="mt-2">
                                <Tag color="red" icon={<WarningOutlined />}>
                                  Bị chặn tại: {process.currentStage}
                                </Tag>
                              </div>
                              <Paragraph className="text-xs text-gray-500 mt-2 mb-0">
                                Cần xử lý ngay để tránh ảnh hưởng đến tiến độ
                              </Paragraph>
                            </div>
                          ))}
                      </Space>
                    </Card>
                    <Card title="Cảnh báo ưu tiên cao">
                      <Space vertical size="small" className="w-full">
                        {mockProcesses
                          .filter((p) => p.priority === "high")
                          .map((process) => (
                            <div
                              key={process.id}
                              className="p-2 bg-red-50 rounded"
                            >
                              <Text strong className="text-xs">
                                {process.name}
                              </Text>
                              <div className="mt-1">
                                <Progress
                                  percent={process.progress}
                                  size="small"
                                  strokeColor="#ff4d4f"
                                />
                              </div>
                            </div>
                          ))}
                      </Space>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "statistics",
              label: (
                <span>
                  <TrophyOutlined /> Thống kê Charts
                </span>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card title="Nguồn Lead Tới">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={leadSourceData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent = 0 }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {leadSourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card title="Tỷ Lệ Đơn Hàng Hoàn Thành">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={orderRateData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="completed"
                            stroke="#8884d8"
                            name="Đơn hoàn thành"
                          />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#82ca9d"
                            name="Tổng đơn"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Card>

      {/* Recent Orders */}
      <Card title="Đơn Hàng Gần Đây" className="mt-6">
        <Table<RecentOrder>
          columns={[
            {
              title: "Mã đơn",
              dataIndex: "orderNumber",
              key: "orderNumber",
              render: (text: string) => <Text strong>{text}</Text>,
            },
            {
              title: "Khách hàng",
              dataIndex: "customer",
              key: "customer",
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              key: "status",
              render: (status: string) => {
                const statusMap = {
                  processing: { color: "processing", text: "Đang xử lý" },
                  completed: { color: "success", text: "Hoàn thành" },
                  pending: { color: "default", text: "Chờ xử lý" },
                };
                const { color, text } =
                  statusMap[status as keyof typeof statusMap];
                return <Tag color={color}>{text}</Tag>;
              },
            },
            {
              title: "Tổng tiền",
              dataIndex: "totalAmount",
              key: "totalAmount",
              render: (amount: number) => (
                <Text>{amount.toLocaleString()} VNĐ</Text>
              ),
            },
            {
              title: "Thời gian",
              dataIndex: "createdAt",
              key: "createdAt",
              render: (text: string) => <Text className="text-xs">{text}</Text>,
            },
          ]}
          dataSource={mockRecentOrders}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </Space>
  );
}
