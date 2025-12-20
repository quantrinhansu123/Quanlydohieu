"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import RefundManager from "@/components/RefundManager";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { RefundService } from "@/services/refundService";
import {
  RefundStatus,
  RefundStatusLabels,
  RefundStatusOptions,
  RefundType,
  RefundTypeLabels,
  RefundTypeOptions,
  type RefundRequest,
} from "@/types/refund";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { App, Button, Modal, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { Text } = Typography;

// Refund Details Component
const RefundDetails: React.FC<PropRowDetails<RefundRequest>> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  const getStatusColor = (status: RefundStatus) => {
    switch (status) {
      case RefundStatus.PENDING:
        return "orange";
      case RefundStatus.APPROVED:
        return "green";
      case RefundStatus.REJECTED:
        return "red";
      case RefundStatus.PROCESSED:
        return "blue";
      case RefundStatus.CANCELLED:
        return "default";
      default:
        return "default";
    }
  };

  const getTypeColor = (type: RefundType) => {
    switch (type) {
      case RefundType.FULL:
        return "red";
      case RefundType.PARTIAL:
        return "orange";
      case RefundType.COMPENSATION:
        return "purple";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold mb-4">Chi tiết yêu cầu</h3>
      <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium text-gray-500 text-sm">Mã đơn hàng:</span>
            <p className="font-medium mt-1">
              <Button 
                type="link" 
                onClick={() => window.open(`/sale/orders/${data.orderCode}`, '_blank')}
                style={{ padding: 0, height: 'auto' }}
              >
                {data.orderCode}
              </Button>
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-500 text-sm">Loại yêu cầu:</span>
            <p className="mt-1">
              <Tag color={getTypeColor(data.type)}>
                {RefundTypeLabels[data.type]}
              </Tag>
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-500 text-sm">Số tiền:</span>
            <p className="font-semibold text-lg text-red-600 mt-1">
              {data.amount.toLocaleString("vi-VN")} VNĐ
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-500 text-sm">Trạng thái:</span>
            <p className="mt-1">
              <Tag color={getStatusColor(data.status)}>
                {RefundStatusLabels[data.status]}
              </Tag>
            </p>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-gray-500 text-sm">Lý do:</span>
            <p className="mt-1 whitespace-pre-wrap">{data.reason}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500 text-sm">Người yêu cầu:</span>
            <p className="mt-1">{data.requestedByName || "N/A"}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500 text-sm">Ngày yêu cầu:</span>
            <p className="mt-1">
              {dayjs(data.requestedAt).format("DD/MM/YYYY HH:mm")}
            </p>
          </div>
          {data.approvedBy && (
            <>
              <div>
                <span className="font-medium text-gray-500 text-sm">Người duyệt:</span>
                <p className="mt-1">{data.approvedByName || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500 text-sm">Ngày duyệt:</span>
                <p className="mt-1">
                  {data.approvedAt
                    ? dayjs(data.approvedAt).format("DD/MM/YYYY HH:mm")
                    : "N/A"}
                </p>
              </div>
            </>
          )}
          {data.rejectedBy && (
            <>
              <div>
                <span className="font-medium text-gray-500 text-sm">Người từ chối:</span>
                <p className="mt-1">{data.rejectedByName || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500 text-sm">Ngày từ chối:</span>
                <p className="mt-1">
                  {data.rejectedAt
                    ? dayjs(data.rejectedAt).format("DD/MM/YYYY HH:mm")
                    : "N/A"}
                </p>
              </div>
              {data.rejectionReason && (
                <div className="col-span-2">
                  <span className="font-medium text-gray-500 text-sm">Lý do từ chối:</span>
                  <p className="mt-1 whitespace-pre-wrap">{data.rejectionReason}</p>
                </div>
              )}
            </>
          )}
          {data.processedBy && (
            <>
              <div>
                <span className="font-medium text-gray-500 text-sm">Người xử lý:</span>
                <p className="mt-1">{data.processedByName || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500 text-sm">Ngày xử lý:</span>
                <p className="mt-1">
                  {data.processedDate
                    ? dayjs(data.processedDate).format("DD/MM/YYYY HH:mm")
                    : "N/A"}
                </p>
              </div>
            </>
          )}
          {data.notes && (
            <div className="col-span-2">
              <span className="font-medium text-gray-500 text-sm">Ghi chú:</span>
              <p className="mt-1 whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [editingRefund, setEditingRefund] = useState<
    RefundRequest | undefined
  >();
  const router = useRouter();
  const { message, modal } = App.useApp();
  const { query, applyFilter, updateQueries, reset } = useFilter();
  const filteredRefunds = applyFilter(refunds);

  useEffect(() => {
    const unsubscribe = RefundService.onSnapshot((data) => {
      setRefunds(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getStatusColor = (status: RefundStatus) => {
    switch (status) {
      case RefundStatus.PENDING:
        return "orange";
      case RefundStatus.APPROVED:
        return "green";
      case RefundStatus.REJECTED:
        return "red";
      case RefundStatus.PROCESSED:
        return "blue";
      case RefundStatus.CANCELLED:
        return "default";
      default:
        return "default";
    }
  };

  const getTypeColor = (type: RefundType) => {
    switch (type) {
      case RefundType.FULL:
        return "red";
      case RefundType.PARTIAL:
        return "orange";
      case RefundType.COMPENSATION:
        return "purple";
      default:
        return "default";
    }
  };

  const columns: TableColumnsType<RefundRequest> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "orderCode",
      key: "orderCode",
      width: 140,
      render: (code: string) =>
        code ? (
          <Button
            type="link"
            onClick={() => router.push(`/sale/orders/${code}`)}
          >
            {code}
          </Button>
        ) : (
          "N/A"
        ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type: RefundType) => (
        <Tag color={getTypeColor(type)}>{RefundTypeLabels[type]}</Tag>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <Text strong className="text-red-600">
          {amount.toLocaleString("vi-VN")} VNĐ
        </Text>
      ),
      sorter: true,
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: RefundStatus) => (
        <Tag color={getStatusColor(status)}>{RefundStatusLabels[status]}</Tag>
      ),
    },
    {
      title: "Người yêu cầu",
      dataIndex: "requestedByName",
      key: "requestedByName",
    },
    {
      title: "Ngày yêu cầu",
      dataIndex: "requestedAt",
      key: "requestedAt",
      render: (date: number) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: true,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              // CommonTable will handle the drawer via onRowClick
            }}
            title="Xem"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setEditingRefund(record);
              setRefundModalVisible(true);
            }}
            title="Sửa/Duyệt"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              modal.confirm({
                title: "Xác nhận xóa",
                content: `Bạn có chắc chắn muốn xóa yêu cầu hoàn tiền cho đơn hàng ${record.orderCode}?`,
                okText: "Xóa",
                okType: "danger",
                cancelText: "Hủy",
                onOk: async () => {
                  try {
                    await RefundService.delete(record.id);
                    message.success("Đã xóa yêu cầu hoàn tiền thành công!");
                  } catch (error) {
                    console.error("Error deleting refund:", error);
                    message.error("Có lỗi xảy ra khi xóa yêu cầu hoàn tiền!");
                  }
                },
              });
            }}
            title="Xóa"
          />
        </div>
      ),
    },
  ];

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm yêu cầu...",
          filterKeys: [
            "orderCode",
            "reason",
            "requestedByName",
            "approvedByName",
            "rejectedByName",
            "processedByName",
            "notes",
          ],
        },
        filters: {
          fields: [
            {
              label: "Trạng thái",
              name: "status",
              type: "select",
              options: [{ label: "Tất cả", value: "" }, ...RefundStatusOptions],
            },
            {
              label: "Loại",
              name: "type",
              type: "select",
              options: [{ label: "Tất cả", value: "" }, ...RefundTypeOptions],
            },
          ],
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
      }}
      isLoading={loading}
    >
      <CommonTable
        dataSource={filteredRefunds.sort(
          (a, b) => b.requestedAt - a.requestedAt
        )}
        columns={columns}
        loading={loading}
        DrawerDetails={RefundDetails}
        paging={true}
        rank={true}
      />

      {/* Refund Management Modal */}
      {editingRefund && (
        <Modal
          title="Quản lý yêu cầu hoàn tiền"
          open={refundModalVisible}
          onCancel={() => {
            setRefundModalVisible(false);
            setEditingRefund(undefined);
          }}
          footer={null}
          width={600}
        >
          <RefundManager
            refundId={editingRefund.id}
            orderCode={editingRefund.orderCode}
            orderTotalAmount={editingRefund.amount}
            mode={
              editingRefund.status === RefundStatus.PENDING
                ? "approve"
                : editingRefund.status === RefundStatus.APPROVED
                ? "process"
                : "view"
            }
            onSuccess={() => {
              setRefundModalVisible(false);
              setEditingRefund(undefined);
            }}
          />
        </Modal>
      )}
    </WrapperContent>
  );
}


