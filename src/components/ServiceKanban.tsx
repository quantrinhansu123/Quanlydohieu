"use client";

import { Card, Typography } from "antd";

const { Title, Text } = Typography;

export default function ServiceKanban() {
  return (
    <div className="p-6">
      <Title level={2}>Kanban Dịch vụ</Title>
      <Text className="text-gray-600">
        Theo dõi các công việc sửa chữa và dịch vụ đang thực hiện
      </Text>

      <div className="mt-6">
        <Card>
          <Text>Chức năng Kanban dịch vụ đang được phát triển...</Text>
        </Card>
      </div>
    </div>
  );
}
