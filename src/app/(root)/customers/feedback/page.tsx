"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import FeedbackForm from "@/components/FeedbackForm";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { FeedbackService } from "@/services/feedbackService";
import {
  FeedbackType,
  FeedbackTypeLabels,
  FeedbackTypeOptions,
  FeedbackStatus,
  FeedbackStatusLabels,
  FeedbackStatusOptions,
  type CustomerFeedback,
} from "@/types/feedback";
import { EyeOutlined, EditOutlined, DeleteOutlined, StarFilled } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { App, Button, Card, Col, Modal, Rate, Row, Space, Statistic, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const { Text } = Typography;

// Feedback Details Component
const FeedbackDetails: React.FC<PropRowDetails<CustomerFeedback>> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  const getFeedbackColor = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.PRAISE:
        return "green";
      case FeedbackType.NEUTRAL:
        return "blue";
      case FeedbackType.COMPLAINT:
        return "orange";
      case FeedbackType.ANGRY:
        return "red";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Chi tiết Feedback</h3>
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
          <span className="font-medium text-gray-500 text-sm">Khách hàng:</span>
          <p className="font-medium mt-1">{data.customerName}</p>
        </div>
        <div>
          <span className="font-medium text-gray-500 text-sm">Số điện thoại:</span>
          <p className="font-medium mt-1">{data.customerPhone}</p>
        </div>
        <div>
          <span className="font-medium text-gray-500 text-sm">Loại feedback:</span>
          <p className="mt-1">
            <Tag color={getFeedbackColor(data.feedbackType)}>
              {FeedbackTypeLabels[data.feedbackType]}
            </Tag>
          </p>
        </div>
        {data.rating && (
          <div>
            <span className="font-medium text-gray-500 text-sm">Đánh giá:</span>
            <div className="mt-1">
              <Rate disabled value={data.rating} style={{ fontSize: "16px" }} />
              <Text className="ml-2">{data.rating} / 5</Text>
            </div>
          </div>
        )}
        {data.saleName && (
          <div>
            <span className="font-medium text-gray-500 text-sm">Sale phụ trách:</span>
            <p className="font-medium mt-1">{data.saleName}</p>
          </div>
        )}
        <div>
          <span className="font-medium text-gray-500 text-sm">Thu thập bởi:</span>
          <p className="font-medium mt-1">{data.collectedByName || "N/A"}</p>
        </div>
        <div>
          <span className="font-medium text-gray-500 text-sm">Ngày thu thập:</span>
          <p className="font-medium mt-1">
            {dayjs(data.collectedAt).format("DD/MM/YYYY HH:mm")}
          </p>
        </div>
        <div className="col-span-2">
          <span className="font-medium text-gray-500 text-sm">Trạng thái:</span>
          <p className="mt-1">
            <Tag color={
              data.status === FeedbackStatus.GOOD ? "green" :
              data.status === FeedbackStatus.NEED_REPROCESS ? "red" :
              data.status === FeedbackStatus.PROCESSING ? "orange" :
              data.status === FeedbackStatus.RESOLVED ? "blue" :
              data.status === FeedbackStatus.PENDING ? "default" :
              (data.requiresReService ? "red" : "green")
            }>
              {data.status ? FeedbackStatusLabels[data.status] : 
               (data.requiresReService ? "Xử lý lại" : "Tốt")}
            </Tag>
          </p>
          {data.reServiceOrderId && (
            <p className="text-sm mt-1">
              Đơn xử lý lại: {data.reServiceOrderId}
            </p>
          )}
        </div>
        {data.content && (
          <div className="col-span-2">
            <span className="font-medium text-gray-500 text-sm">Nội dung:</span>
            <p className="mt-1 whitespace-pre-wrap">{data.content}</p>
          </div>
        )}
        {data.solution && (
          <div className="col-span-2">
            <span className="font-medium text-gray-500 text-sm">Phương án giải quyết:</span>
            <p className="mt-1 whitespace-pre-wrap">{data.solution}</p>
          </div>
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

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<
    CustomerFeedback | undefined
  >();
  const { message, modal } = App.useApp();
  const router = useRouter();
  const { query, applyFilter, updateQueries, reset } = useFilter();
  const filteredFeedbacks = applyFilter(feedbacks);

  // Calculate statistics
  const stats = useMemo(() => {
    const source = Array.isArray(filteredFeedbacks) ? filteredFeedbacks : [];
    
    // Count by feedback type
    const byType = FeedbackTypeOptions.reduce((acc, option) => {
      acc[option.value] = source.filter(
        (f) => f.feedbackType === option.value
      ).length;
      return acc;
    }, {} as Record<string, number>);

    // Count by status
    const byStatus = FeedbackStatusOptions.reduce((acc, option) => {
      acc[option.value] = source.filter(
        (f) => f.status === option.value || 
        (option.value === FeedbackStatus.NEED_REPROCESS && f.requiresReService) ||
        (option.value === FeedbackStatus.GOOD && !f.status && !f.requiresReService)
      ).length;
      return acc;
    }, {} as Record<string, number>);

    // Count by rating
    const byRating = {
      5: source.filter((f) => f.rating === 5).length,
      4: source.filter((f) => f.rating === 4).length,
      3: source.filter((f) => f.rating === 3).length,
      2: source.filter((f) => f.rating === 2).length,
      1: source.filter((f) => f.rating === 1).length,
    };

    return {
      total: source.length,
      byType,
      byStatus,
      byRating,
    };
  }, [filteredFeedbacks]);

  useEffect(() => {
    const unsubscribe = FeedbackService.onSnapshot((data) => {
      setFeedbacks(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getFeedbackColor = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.PRAISE:
        return "green";
      case FeedbackType.NEUTRAL:
        return "blue";
      case FeedbackType.COMPLAINT:
        return "orange";
      case FeedbackType.ANGRY:
        return "red";
      default:
        return "default";
    }
  };

  const columns: TableColumnsType<CustomerFeedback> = [
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      sorter: true,
    },
    {
      title: "Số điện thoại",
      dataIndex: "customerPhone",
      key: "customerPhone",
    },
    {
      title: "Loại feedback",
      dataIndex: "feedbackType",
      key: "feedbackType",
      render: (type: FeedbackType) => (
        <Tag color={getFeedbackColor(type)}>{FeedbackTypeLabels[type]}</Tag>
      ),
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      render: (rating?: number) => {
        if (!rating) return "N/A";
        return (
          <Space>
            <Rate disabled value={rating} style={{ fontSize: "14px" }} />
            <Text type="secondary">({rating}/5)</Text>
          </Space>
        );
      },
    },
    {
      title: "Ngày thu thập",
      dataIndex: "collectedAt",
      key: "collectedAt",
      render: (date: number) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: true,
    },
    {
      title: "Nội dung",
      dataIndex: "content",
      key: "content",
      render: (content?: string) => (
        <Text ellipsis={{ tooltip: content }} style={{ maxWidth: 200 }}>
          {content || "-"}
        </Text>
      ),
    },
    {
      title: "Phương án giải quyết",
      dataIndex: "solution",
      key: "solution",
      render: (solution?: string) => (
        <Text ellipsis={{ tooltip: solution }} style={{ maxWidth: 200 }}>
          {solution || "-"}
        </Text>
      ),
    },
    {
      title: "Sale phụ trách",
      dataIndex: "saleName",
      key: "saleName",
      render: (saleName?: string) => saleName || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status?: FeedbackStatus, record?: CustomerFeedback) => {
        // Fallback to requiresReService for backward compatibility
        const actualStatus = status || 
          (record?.requiresReService ? FeedbackStatus.NEED_REPROCESS : FeedbackStatus.GOOD);
        
        const getStatusColor = (s: FeedbackStatus) => {
          switch (s) {
            case FeedbackStatus.GOOD:
              return "green";
            case FeedbackStatus.NEED_REPROCESS:
              return "red";
            case FeedbackStatus.PROCESSING:
              return "orange";
            case FeedbackStatus.RESOLVED:
              return "blue";
            case FeedbackStatus.PENDING:
              return "default";
            default:
              return "default";
          }
        };

        return (
          <Tag color={getStatusColor(actualStatus)}>
            {FeedbackStatusLabels[actualStatus]}
          </Tag>
        );
      },
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
            onClick={() => {
              setEditingFeedback(record);
              setFormVisible(true);
            }}
            title="Sửa"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              modal.confirm({
                title: "Xác nhận xóa",
                content: `Bạn có chắc chắn muốn xóa feedback của ${record.customerName}?`,
                okText: "Xóa",
                okType: "danger",
                cancelText: "Hủy",
                onOk: async () => {
                  try {
                    await FeedbackService.delete(record.id);
                    message.success("Đã xóa feedback thành công!");
                  } catch (error) {
                    console.error("Error deleting feedback:", error);
                    message.error("Có lỗi xảy ra khi xóa feedback!");
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
          placeholder: "Tìm kiếm feedback...",
          filterKeys: ["orderCode", "customerName", "customerPhone", "notes", "content", "solution", "saleName"],
        },
        filters: {
          fields: [
            {
              label: "Loại feedback",
              name: "feedbackType",
              type: "select",
              options: [{ label: "Tất cả", value: "" }, ...FeedbackTypeOptions],
            },
            {
              label: "Trạng thái",
              name: "status",
              type: "select",
              options: [
                { label: "Tất cả", value: "" },
                ...FeedbackStatusOptions,
              ],
            },
          ],
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
      }}
      isLoading={loading}
    >
      <div className="space-y-4">
        {/* Statistics Report */}
        <div className="space-y-3">
          <Text strong className="text-base">Báo cáo thống kê</Text>
          
          {/* By Feedback Type */}
          <div>
            <Text type="secondary" className="text-sm mb-2 block">Theo loại feedback</Text>
            <Row gutter={[8, 8]}>
              {FeedbackTypeOptions.map((type) => (
                <Col span={6} key={type.value}>
                  <Card size="small" style={{ textAlign: "center", padding: "8px" }}>
                    <div className="flex flex-col items-center gap-1">
                      <Tag color={getFeedbackColor(type.value)}>{type.label}</Tag>
                      <Text strong style={{ fontSize: "18px" }}>{stats.byType[type.value] || 0}</Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* By Status */}
          <div>
            <Text type="secondary" className="text-sm mb-2 block">Theo trạng thái</Text>
            <Row gutter={[8, 8]}>
              {FeedbackStatusOptions.map((status) => {
                const getStatusColor = (s: FeedbackStatus) => {
                  switch (s) {
                    case FeedbackStatus.GOOD: return "green";
                    case FeedbackStatus.NEED_REPROCESS: return "red";
                    case FeedbackStatus.PROCESSING: return "orange";
                    case FeedbackStatus.RESOLVED: return "blue";
                    case FeedbackStatus.PENDING: return "default";
                    default: return "default";
                  }
                };
                return (
                  <Col span={5} key={status.value}>
                    <Card size="small" style={{ textAlign: "center", padding: "8px" }}>
                      <div className="flex flex-col items-center gap-1">
                        <Tag color={getStatusColor(status.value)}>{status.label}</Tag>
                        <Text strong style={{ fontSize: "18px" }}>{stats.byStatus[status.value] || 0}</Text>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>

          {/* By Rating */}
          <div>
            <Text type="secondary" className="text-sm mb-2 block">Theo đánh giá sao</Text>
            <Row gutter={[8, 8]}>
              {[5, 4, 3, 2, 1].map((rating) => (
                <Col span={5} key={rating}>
                  <Card size="small" style={{ textAlign: "center", padding: "8px" }}>
                    <div className="flex flex-col items-center gap-1">
                      <Rate disabled value={rating} style={{ fontSize: "14px" }} />
                      <Text strong style={{ fontSize: "18px" }}>{stats.byRating[rating as keyof typeof stats.byRating] || 0}</Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        <CommonTable
          dataSource={filteredFeedbacks.reverse()}
          columns={columns}
          loading={loading}
          DrawerDetails={FeedbackDetails}
          paging={true}
          rank={true}
        />
      </div>

      <Modal
        title={editingFeedback ? "Sửa Feedback" : "Thêm Feedback"}
        open={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingFeedback(undefined);
        }}
        footer={null}
        width={600}
      >
        {editingFeedback && (
          <FeedbackForm
            orderId={editingFeedback.orderId}
            orderCode={editingFeedback.orderCode}
            customerName={editingFeedback.customerName}
            customerPhone={editingFeedback.customerPhone}
            customerId={editingFeedback.customerId}
            initialFeedback={editingFeedback}
            onSuccess={() => {
              setFormVisible(false);
              setEditingFeedback(undefined);
            }}
            onCancel={() => {
              setFormVisible(false);
              setEditingFeedback(undefined);
            }}
          />
        )}
      </Modal>
    </WrapperContent>
  );
}


