"use client";

import {
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EditOutlined,
  PhoneOutlined,
  TagOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Draggable } from "@hello-pangea/dnd";
import { Card, Progress, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import React, { useMemo } from "react";

import MemberTag from "@/components/MemberTag";
import { columnsKanban } from "@/configs/table";
import { FirebaseOrderData } from "@/types/order";
import { formatCurrency } from "@/utils/formatCurrency";
import type { MenuProps } from "antd";

const { Text } = Typography;

// Types
interface KanbanCardProps {
  members: Record<string, { name: string; role: string }>;
  order: FirebaseOrderData & { id: string };
  index: number;
  onEdit: (order: FirebaseOrderData & { id: string }) => void;
  onContact: (phone: string) => void;
}

interface CardMetrics {
  progressPercent: number;
  completedWorkflows: number;
  totalWorkflows: number;
  daysRemaining: number;
  urgencyLevel: "urgent" | "warning" | "normal";
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  members,
  order,
  index,
  onEdit,
  onContact,
}) => {
  // Memoized calculations for performance
  const metrics: CardMetrics = useMemo(() => {
    const allWorkflows = order?.products
      ? Object.values(order.products).flatMap((product) =>
          product?.workflows ? Object.values(product.workflows) : []
        )
      : [];

    const completed = allWorkflows.filter((workflow) => workflow?.isDone);
    const progressPercent =
      allWorkflows.length > 0
        ? Math.round((completed.length / allWorkflows.length) * 100)
        : 0;

    const daysRemaining = order?.deliveryDate
      ? Math.ceil(
          (order.deliveryDate - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    const urgencyLevel: CardMetrics["urgencyLevel"] =
      daysRemaining <= 1 ? "urgent" : daysRemaining <= 2 ? "warning" : "normal";

    return {
      progressPercent,
      completedWorkflows: completed.length,
      totalWorkflows: allWorkflows.length,
      daysRemaining,
      urgencyLevel,
    };
  }, [order]);

  const cardActions: MenuProps["items"] = [
    {
      key: "edit",
      label: "Cập nhật công đoạn",
      icon: <EditOutlined />,
      onClick: () => onEdit(order),
    },
    {
      key: "contact",
      label: "Liên hệ khách hàng",
      icon: <PhoneOutlined />,
      onClick: () => onContact(order.phone || ""),
    },
  ];

  const columnStyle = columnsKanban.find((col) => col.key === order.status);
  return (
    <Draggable draggableId={order.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 transition-transform duration-200 ${
            snapshot.isDragging ? "rotate-1 scale-105 shadow-lg" : ""
          }`}
        >
          <Card
            onClick={() => onEdit(order)}
            size="small"
            className="shadow-sm hover:shadow-md transition-all cursor-pointer w-full"
            style={{
              borderLeft: `4px solid ${columnStyle?.color || "#d9d9d9"}`,
            }}
            styles={{ body: { padding: "12px" } }}
          >
            <div className="space-y-2">
              {/* Header - Compact Info */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Text strong className="text-sm text-gray-900">
                    {order.code}
                  </Text>
                  <Tag
                    color={
                      metrics.urgencyLevel === "urgent"
                        ? "red"
                        : metrics.urgencyLevel === "warning"
                        ? "orange"
                        : "blue"
                    }
                    icon={<ClockCircleOutlined />}
                    className="text-xs"
                  >
                    {metrics.daysRemaining > 0
                      ? `${metrics.daysRemaining}d`
                      : "Quá hạn"}
                  </Tag>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <UserOutlined className="w-3 h-3" />
                  <Text className="truncate" title={order.customerName}>
                    {order.customerName}
                  </Text>
                </div>
              </div>

              {/* Progress - Compact Display */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Tiến độ</span>
                  <span className="font-medium">
                    {metrics.completedWorkflows}/{metrics.totalWorkflows}
                  </span>
                </div>
                <Progress
                  percent={metrics.progressPercent}
                  size="small"
                  status={
                    metrics.progressPercent === 100 ? "success" : "active"
                  }
                  strokeColor={{
                    "0%": "#108ee9",
                    "100%": "#87d068",
                  }}
                  showInfo={false}
                  strokeWidth={6}
                />
              </div>

              {/* Products - Streamlined List */}
              {order?.products && Object.keys(order.products).length > 0 && (
                <div className="space-y-1 max-h-32 overflow-auto scrollbar-thin scrollbar-thumb-gray-300">
                  {Object.entries(order.products).map(
                    ([productId, product]) => (
                      <div
                        key={productId}
                        className="bg-gray-50 p-2 rounded border-l-2 border-blue-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <TagOutlined className="text-xs text-gray-400 shrink-0" />
                            <Text className="text-xs font-medium truncate">
                              {product?.name || "Sản phẩm"}
                            </Text>
                          </div>
                          {product?.quantity && (
                            <span className="text-xs text-gray-500 ml-1">
                              x{product.quantity}
                            </span>
                          )}
                        </div>
                        {product?.workflows &&
                          Object.keys(product.workflows).length > 0 && (
                            <div className="mt-1">
                              <MemberTag
                                workflows={Object.values(product.workflows)}
                                members={members}
                              />
                            </div>
                          )}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Footer - Essential Info */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CalendarOutlined className="w-3 h-3" />
                  <span>
                    {order.createdAt
                      ? dayjs(order.createdAt).format("DD/MM")
                      : "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <DollarOutlined className="w-3 h-3 text-green-600" />
                  <Text className="text-xs font-semibold text-green-600">
                    {formatCurrency(order.totalAmount || 0)}
                  </Text>
                </div>
              </div>

              {/* Notes - Compact */}
              {order.notes && (
                <div>
                  <Text>Ghi chú:</Text>
                  <Tooltip title={order.notes} placement="topLeft">
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded truncate">
                      {order.notes}
                    </div>
                  </Tooltip>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </Draggable>
  );
};
