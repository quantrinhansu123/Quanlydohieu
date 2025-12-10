"use client";

import { useUser } from "@/firebase/provider";
import { FollowUpService } from "@/services/followUpService";
import { FollowUpTypeLabels, type FollowUpSchedule } from "@/types/followUp";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { App, Badge, Button, List, Modal, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { Text } = Typography;

interface FollowUpReminderProps {
  limit?: number; // Limit number of items to show
  showCompleted?: boolean; // Show completed follow-ups
}

export default function FollowUpReminder({
  limit = 10,
  showCompleted = false,
}: FollowUpReminderProps) {
  const [followUps, setFollowUps] = useState<FollowUpSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFollowUp, setSelectedFollowUp] =
    useState<FollowUpSchedule | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { message } = App.useApp();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = FollowUpService.onSnapshot((data) => {
      // Filter and sort
      let filtered = data;
      if (!showCompleted) {
        filtered = filtered.filter((f) => f.status !== "completed");
      }

      // Sort by scheduled date (earliest first)
      filtered.sort((a, b) => a.scheduledDate - b.scheduledDate);

      // Apply limit
      if (limit) {
        filtered = filtered.slice(0, limit);
      }

      setFollowUps(filtered);
      setLoading(false);
    });

    // Check for overdue on mount
    FollowUpService.checkAndUpdateOverdue();

    return () => {
      unsubscribe();
    };
  }, [limit, showCompleted]);

  const getStatusColor = (status: FollowUpSchedule["status"]) => {
    switch (status) {
      case "pending":
        return "blue";
      case "completed":
        return "green";
      case "overdue":
        return "red";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: FollowUpSchedule["status"]) => {
    switch (status) {
      case "pending":
        return <ClockCircleOutlined />;
      case "completed":
        return <CheckCircleOutlined />;
      case "overdue":
        return <ExclamationCircleOutlined />;
      default:
        return <CalendarOutlined />;
    }
  };

  const handleComplete = async (followUp: FollowUpSchedule) => {
    if (!user?.uid) {
      message.error("Vui lòng đăng nhập!");
      return;
    }

    try {
      await FollowUpService.complete(
        followUp.id,
        user.uid,
        user.displayName || user.email || "Người dùng hiện tại"
      );
      message.success("Đã đánh dấu hoàn thành!");
      setModalVisible(false);
      setSelectedFollowUp(null);
    } catch (error) {
      console.error("Error completing follow-up:", error);
      message.error("Có lỗi xảy ra!");
    }
  };

  const isOverdue = (followUp: FollowUpSchedule) => {
    return followUp.status === "pending" && followUp.scheduledDate < Date.now();
  };

  return (
    <div>
      <List
        loading={loading}
        dataSource={followUps}
        locale={{ emptyText: "Không có follow-up nào" }}
        renderItem={(followUp) => {
          const overdue = isOverdue(followUp);
          return (
            <List.Item
              className={`cursor-pointer hover:bg-gray-50 p-3 rounded ${
                overdue ? "bg-red-50 border-l-4 border-red-500" : ""
              }`}
              onClick={() => {
                setSelectedFollowUp(followUp);
                setModalVisible(true);
              }}
            >
              <List.Item.Meta
                avatar={
                  <Badge
                    status={
                      followUp.status === "completed"
                        ? "success"
                        : overdue
                        ? "error"
                        : "processing"
                    }
                  >
                    {getStatusIcon(followUp.status)}
                  </Badge>
                }
                title={
                  <Space>
                    <Text strong>{followUp.customerName}</Text>
                    <Tag color={getStatusColor(followUp.status)}>
                      {FollowUpTypeLabels[followUp.followUpType]}
                    </Tag>
                    {overdue && <Tag color="red">Quá hạn</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary" className="text-sm">
                      Đơn hàng: {followUp.orderCode}
                    </Text>
                    <br />
                    <Text type="secondary" className="text-sm">
                      Hẹn:{" "}
                      {dayjs(followUp.scheduledDate).format("DD/MM/YYYY HH:mm")}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />

      <Modal
        title="Chi tiết Follow-up"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedFollowUp(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setModalVisible(false);
              setSelectedFollowUp(null);
            }}
          >
            Đóng
          </Button>,
          selectedFollowUp?.status === "pending" && (
            <Button
              key="complete"
              type="primary"
              onClick={() =>
                selectedFollowUp && handleComplete(selectedFollowUp)
              }
            >
              Đánh dấu hoàn thành
            </Button>
          ),
          <Button
            key="view"
            onClick={() => {
              if (selectedFollowUp) {
                router.push(`/sale/orders/${selectedFollowUp.orderCode}`);
              }
            }}
          >
            Xem đơn hàng
          </Button>,
        ]}
      >
        {selectedFollowUp && (
          <div className="space-y-3">
            <div>
              <Text strong>Khách hàng: </Text>
              <Text>{selectedFollowUp.customerName}</Text>
            </div>
            <div>
              <Text strong>Số điện thoại: </Text>
              <Text>{selectedFollowUp.customerPhone}</Text>
            </div>
            <div>
              <Text strong>Mã đơn hàng: </Text>
              <Text>{selectedFollowUp.orderCode}</Text>
            </div>
            <div>
              <Text strong>Loại follow-up: </Text>
              <Tag color={getStatusColor(selectedFollowUp.status)}>
                {FollowUpTypeLabels[selectedFollowUp.followUpType]}
              </Tag>
            </div>
            <div>
              <Text strong>Ngày hẹn: </Text>
              <Text>
                {dayjs(selectedFollowUp.scheduledDate).format(
                  "DD/MM/YYYY HH:mm"
                )}
              </Text>
            </div>
            <div>
              <Text strong>Trạng thái: </Text>
              <Tag color={getStatusColor(selectedFollowUp.status)}>
                {selectedFollowUp.status === "pending"
                  ? "Chờ thực hiện"
                  : selectedFollowUp.status === "completed"
                  ? "Đã hoàn thành"
                  : selectedFollowUp.status === "overdue"
                  ? "Quá hạn"
                  : "Đã hủy"}
              </Tag>
            </div>
            {selectedFollowUp.completedDate && (
              <div>
                <Text strong>Hoàn thành lúc: </Text>
                <Text>
                  {dayjs(selectedFollowUp.completedDate).format(
                    "DD/MM/YYYY HH:mm"
                  )}
                </Text>
              </div>
            )}
            {selectedFollowUp.notes && (
              <div>
                <Text strong>Ghi chú: </Text>
                <Text>{selectedFollowUp.notes}</Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
