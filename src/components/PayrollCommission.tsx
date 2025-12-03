"use client";

import {
  DollarOutlined,
  DownloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

interface StaffSalary {
  id: string;
  name: string;
  avatar?: string;
  position: string;
  baseSalary: number;
  completedProducts: number;
  targetProducts: number;
  commissionRate: number;
  avgProductPrice: number;
  totalCommission: number;
  bonus: number;
  penalty: number;
  totalIncome: number;
}

const mockStaffSalary: StaffSalary[] = [
  {
    id: "NV001",
    name: "Nguyễn Văn An",
    position: "Thợ chính",
    baseSalary: 8000000,
    completedProducts: 45,
    targetProducts: 50,
    commissionRate: 5,
    avgProductPrice: 200000,
    totalCommission: 450000,
    bonus: 500000,
    penalty: 0,
    totalIncome: 8950000,
  },
  {
    id: "NV002",
    name: "Trần Thị Hương",
    position: "Thợ chính",
    baseSalary: 8500000,
    completedProducts: 52,
    targetProducts: 50,
    commissionRate: 5,
    avgProductPrice: 200000,
    totalCommission: 520000,
    bonus: 800000,
    penalty: 0,
    totalIncome: 9820000,
  },
  {
    id: "NV003",
    name: "Lê Văn Minh",
    position: "Thợ phụ",
    baseSalary: 6000000,
    completedProducts: 38,
    targetProducts: 50,
    commissionRate: 4,
    avgProductPrice: 180000,
    totalCommission: 273600,
    bonus: 0,
    penalty: 150000,
    totalIncome: 6123600,
  },
  {
    id: "NV004",
    name: "Phạm Thị Mai",
    position: "Thợ phụ",
    baseSalary: 6500000,
    completedProducts: 42,
    targetProducts: 50,
    commissionRate: 4,
    avgProductPrice: 180000,
    totalCommission: 302400,
    bonus: 200000,
    penalty: 0,
    totalIncome: 7002400,
  },
  {
    id: "NV005",
    name: "Hoàng Văn Tùng",
    position: "Thợ chính",
    baseSalary: 9000000,
    completedProducts: 58,
    targetProducts: 50,
    commissionRate: 5.5,
    avgProductPrice: 220000,
    totalCommission: 701800,
    bonus: 1000000,
    penalty: 0,
    totalIncome: 10701800,
  },
];

export default function PayrollCommission() {
  const handleExportExcel = () => {
    console.log("Xuất báo cáo lương ra Excel");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const columns: ColumnsType<StaffSalary> = [
    {
      title: "Nhân viên",
      dataIndex: "name",
      key: "name",
      width: 250,
      fixed: "left",
      render: (name: string, record: StaffSalary) => (
        <Space>
          <Avatar size={40} icon={<UserOutlined />} />
          <div>
            <div className="font-semibold text-base">{name}</div>
            <Tag color={record.position === "Thợ chính" ? "purple" : "blue"}>
              {record.position}
            </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: "Lương cơ bản",
      dataIndex: "baseSalary",
      key: "baseSalary",
      width: 150,
      align: "left",
      render: (value: number) => (
        <span className="font-semibold">{formatCurrency(value)}</span>
      ),
    },
    {
      title: "Hiệu suất",
      key: "performance",
      width: 180,
      align: "left",
      render: (_: unknown, record: StaffSalary) => {
        const percentage = Math.round(
          (record.completedProducts / record.targetProducts) * 100
        );
        const progressStatus =
          percentage >= 100
            ? "success"
            : percentage >= 80
            ? "normal"
            : "exception";

        return (
          <div>
            <div className="text-sm mb-1">
              <span className="font-semibold">{record.completedProducts}</span>
              <span className="text-gray-400">/{record.targetProducts} SP</span>
            </div>
            <Progress
              percent={percentage}
              size="small"
              status={progressStatus}
              className="w-24"
            />
          </div>
        );
      },
    },
    {
      title: "Hoa hồng",
      key: "commission",
      width: 150,
      align: "left",
      render: (_: unknown, record: StaffSalary) => (
        <div>
          <div className="text-sm text-gray-500 mb-1">
            {record.commissionRate}% × {record.completedProducts} SP
          </div>
          <div className="font-semibold text-blue-600">
            {formatCurrency(record.totalCommission)}
          </div>
        </div>
      ),
    },
    {
      title: "Thưởng/Phạt",
      key: "bonusPenalty",
      width: 140,
      align: "left",
      render: (_: unknown, record: StaffSalary) => (
        <div>
          {record.bonus > 0 && (
            <div className="text-sm text-green-600">
              +{formatCurrency(record.bonus)}
            </div>
          )}
          {record.penalty > 0 && (
            <div className="text-sm text-red-600">
              -{formatCurrency(record.penalty)}
            </div>
          )}
          {record.bonus === 0 && record.penalty === 0 && (
            <div className="text-sm text-gray-400">-</div>
          )}
        </div>
      ),
    },
    {
      title: "Tổng thu nhập",
      dataIndex: "totalIncome",
      key: "totalIncome",
      width: 180,
      align: "left",
      fixed: "right",
      render: (value: number) => (
        <div className="text-green-600 font-bold text-lg">
          {formatCurrency(value)}
        </div>
      ),
    },
  ];

  const totalPayroll = mockStaffSalary.reduce(
    (sum, staff) => sum + staff.totalIncome,
    0
  );

  return (
    <div className="w-full">
      <Card
        title={
          <Space>
            <DollarOutlined className="text-green-600" />
            <span>Bảng lương & Hoa hồng tháng 12/2024</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white border-none"
          >
            Xuất Excel
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={mockStaffSalary}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1200 }}
          bordered
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row className="bg-gray-50">
                <Table.Summary.Cell index={0} colSpan={5}>
                  <div className="font-bold text-base">
                    Tổng chi phí lương toàn cửa hàng
                  </div>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <div className="text-green-600 font-bold text-xl">
                    {formatCurrency(totalPayroll)}
                  </div>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Text className="text-gray-500 text-sm">Tổng lương cơ bản</Text>
              <div className="font-bold text-base">
                {formatCurrency(
                  mockStaffSalary.reduce((sum, s) => sum + s.baseSalary, 0)
                )}
              </div>
            </div>
            <div>
              <Text className="text-gray-500 text-sm">Tổng hoa hồng</Text>
              <div className="font-bold text-base text-blue-600">
                {formatCurrency(
                  mockStaffSalary.reduce((sum, s) => sum + s.totalCommission, 0)
                )}
              </div>
            </div>
            <div>
              <Text className="text-gray-500 text-sm">Tổng thưởng</Text>
              <div className="font-bold text-base text-green-600">
                {formatCurrency(
                  mockStaffSalary.reduce((sum, s) => sum + s.bonus, 0)
                )}
              </div>
            </div>
            <div>
              <Text className="text-gray-500 text-sm">Tổng phạt</Text>
              <div className="font-bold text-base text-red-600">
                -
                {formatCurrency(
                  mockStaffSalary.reduce((sum, s) => sum + s.penalty, 0)
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
