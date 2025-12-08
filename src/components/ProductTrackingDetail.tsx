"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Card, Image, Space, Tag, Timeline, Typography } from "antd";

const { Title, Text, Paragraph } = Typography;

interface ProductInfo {
  code: string;
  name: string;
  customerName: string;
  customerPhone: string;
  issueDescription: string;
  receivedDate: string;
  estimatedCompletion: string;
  status: string;
}

interface HistoryItem {
  workflow: string;
  time: string;
  user: string;
  note: string;
  isCurrent?: boolean;
  isCompleted?: boolean;
}

interface ProductImages {
  before: string[];
  process: string[];
  after: string[];
}

const mockProductInfo: ProductInfo = {
  code: "RP-2024-001",
  name: "Túi xách da cao cấp",
  customerName: "Nguyễn Văn An",
  customerPhone: "0912345678",
  issueDescription:
    "Khóa kéo bị hỏng, lớp da bị trầy xước ở góc dưới bên phải, cần xi mạ lại kim loại",
  receivedDate: "2024-12-01 09:30",
  estimatedCompletion: "2024-12-05 17:00",
  status: "Đang xử lý",
};

const mockHistory: HistoryItem[] = [
  {
    workflow: "Nhận đồ",
    time: "2024-12-01 09:30",
    user: "Nguyễn Thu Hương",
    note: "Đã kiểm tra tình trạng ban đầu và chụp ảnh lưu trữ",
    isCompleted: true,
  },
  {
    workflow: "Đánh giá",
    time: "2024-12-01 10:15",
    user: "Trần Văn Minh",
    note: "Cần thay khóa kéo YKK số 5, xi mạ kim loại, sửa chữa lớp da",
    isCompleted: true,
  },
  {
    workflow: "Tháo rời",
    time: "2024-12-01 14:00",
    user: "Lê Thị Phương",
    note: "Đã tháo khóa kéo cũ và các chi tiết kim loại",
    isCompleted: true,
  },
  {
    workflow: "Đang xi mạ",
    time: "2024-12-02 08:30",
    user: "Phạm Văn Tùng",
    note: "Đang tiến hành xi mạ các chi tiết kim loại",
    isCurrent: true,
  },
  {
    workflow: "Lắp ráp",
    time: "",
    user: "",
    note: "Chưa bắt đầu",
    isCompleted: false,
  },
  {
    workflow: "Kiểm tra chất lượng",
    time: "",
    user: "",
    note: "Chưa bắt đầu",
    isCompleted: false,
  },
  {
    workflow: "Hoàn thành",
    time: "",
    user: "",
    note: "Chưa hoàn thành",
    isCompleted: false,
  },
];

const mockImages: ProductImages = {
  before: [
    "https://picsum.photos/seed/before1/400/300",
    "https://picsum.photos/seed/before2/400/300",
  ],
  process: [
    "https://picsum.photos/seed/process1/400/300",
    "https://picsum.photos/seed/process2/400/300",
  ],
  after: [
    "https://picsum.photos/seed/after1/400/300",
    "https://picsum.photos/seed/after2/400/300",
  ],
};

export default function ProductTrackingDetail() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột Trái (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Phần 1 - Gallery So sánh ảnh */}
          <Card>
            <Title level={4} className="mb-4">
              <ToolOutlined className="mr-2" />
              Đối chứng Hiện trạng
            </Title>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ảnh TRƯỚC */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Tag color="red" className="text-sm font-semibold">
                    ẢNH TRƯỚC KHI SỬA
                  </Tag>
                </div>
                <div className="border-2 border-dashed border-gray-300 p-2 rounded-lg bg-gray-50">
                  <Image.PreviewGroup>
                    <div className="grid grid-cols-2 gap-2">
                      {mockImages.before.map((url, index) => (
                        <div key={index} className="rounded overflow-hidden">
                          <Image
                            src={url}
                            alt={`Before ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </Image.PreviewGroup>
                </div>
              </div>

              {/* Ảnh SAU */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Tag color="green" className="text-sm font-semibold">
                    ẢNH SAU KHI SỬA
                  </Tag>
                </div>
                <div className="border-2 border-dashed border-gray-300 p-2 rounded-lg bg-gray-50">
                  {mockImages.after.length > 0 ? (
                    <Image.PreviewGroup>
                      <div className="grid grid-cols-2 gap-2">
                        {mockImages.after.map((url, index) => (
                          <div key={index} className="rounded overflow-hidden">
                            <Image
                              src={url}
                              alt={`After ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </Image.PreviewGroup>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      <span className="text-sm">Chưa có ảnh hoàn thành</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ảnh Quá trình */}
            {mockImages.process.length > 0 && (
              <div className="mt-4">
                <Tag color="blue" className="text-sm font-semibold mb-2">
                  ẢNH QUÁ TRÌNH XỬ LÝ
                </Tag>
                <div className="border-2 border-dashed border-blue-200 p-2 rounded-lg bg-blue-50">
                  <Image.PreviewGroup>
                    <div className="grid grid-cols-4 gap-2">
                      {mockImages.process.map((url, index) => (
                        <div key={index} className="rounded overflow-hidden">
                          <Image
                            src={url}
                            alt={`Process ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </Image.PreviewGroup>
                </div>
              </div>
            )}
          </Card>

          {/* Phần 2 - Thông tin chung */}
          <Card title="Thông tin sản phẩm">
            <Space vertical size="middle" className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text className="text-gray-500 text-sm">Mã phiếu</Text>
                  <div className="font-mono font-bold text-lg text-blue-600">
                    {mockProductInfo.code}
                  </div>
                </div>
                <div>
                  <Text className="text-gray-500 text-sm">Trạng thái</Text>
                  <div>
                    <Tag color="processing" className="text-sm">
                      {mockProductInfo.status}
                    </Tag>
                  </div>
                </div>
              </div>

              <div>
                <Text className="text-gray-500 text-sm">Tên sản phẩm</Text>
                <div className="font-semibold text-base">
                  {mockProductInfo.name}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text className="text-gray-500 text-sm">Khách hàng</Text>
                  <div className="font-semibold">
                    {mockProductInfo.customerName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {mockProductInfo.customerPhone}
                  </div>
                </div>
                <div>
                  <Text className="text-gray-500 text-sm">Ngày nhận</Text>
                  <div className="font-semibold">
                    {mockProductInfo.receivedDate}
                  </div>
                  <Text className="text-gray-500 text-sm">
                    Dự kiến hoàn thành
                  </Text>
                  <div className="font-semibold text-orange-600">
                    {mockProductInfo.estimatedCompletion}
                  </div>
                </div>
              </div>

              <div>
                <Text className="text-gray-500 text-sm">Mô tả vấn đề</Text>
                <Paragraph className="mt-1 bg-gray-50 p-3 rounded border border-gray-200">
                  {mockProductInfo.issueDescription}
                </Paragraph>
              </div>
            </Space>
          </Card>
        </div>

        {/* Cột Phải (1/3) - Timeline */}
        <div className="lg:col-span-1">
          <Card title="Lịch sử xử lý">
            <Timeline
              items={mockHistory.map((item) => {
                let color = "gray";
                let icon = <ClockCircleOutlined />;

                if (item.isCompleted) {
                  color = "green";
                  icon = <CheckCircleOutlined />;
                } else if (item.isCurrent) {
                  color = "blue";
                  icon = <LoadingOutlined />;
                }

                return {
                  color: color,
                  dot: icon,
                  children: (
                    <div className="pb-4">
                      <div className="font-semibold text-base mb-1">
                        {item.workflow}
                      </div>
                      {item.time && (
                        <div className="text-gray-400 text-xs mb-2">
                          {item.time}
                        </div>
                      )}
                      {item.user && (
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar size="small" icon={<UserOutlined />} />
                          <span className="text-sm text-gray-700">
                            {item.user}
                          </span>
                        </div>
                      )}
                      {item.note && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {item.note}
                        </div>
                      )}
                    </div>
                  ),
                };
              })}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
