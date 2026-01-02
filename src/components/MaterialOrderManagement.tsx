"use client";

import { genCode } from "@/utils/genCode";
import { MaterialOrder, Material } from "@/types/inventory";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import { useUser } from "@/firebase/provider";
import { useFirebaseApp } from "@/firebase/provider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { getDatabase, ref, update } from "firebase/database";
import { InventoryService } from "@/services/inventoryService";
import {
    Button,
    Card,
    Table,
    Tag,
    Space,
    Modal,
    Form,
    Input,
    message,
    Typography,
    Descriptions,
    Row,
    Col,
    Statistic,
} from "antd";
import {
    CheckOutlined,
    CloseOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import { useState, useMemo } from "react";
import dayjs from "dayjs";

const { Text, Title } = Typography;

interface MaterialOrderManagementProps {
    materials: Material[];
}

export default function MaterialOrderManagement({ materials }: MaterialOrderManagementProps) {
    const { user } = useUser();
    const { isAdmin } = useIsAdmin();
    const firebaseApp = useFirebaseApp();
    const { data: materialOrdersData } = useRealtimeList<MaterialOrder>("xoxo/material_orders");
    
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<MaterialOrder | null>(null);
    const [rejectForm] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const materialOrders = useMemo(() => {
        return (materialOrdersData || []).sort((a, b) => b.createdAt - a.createdAt);
    }, [materialOrdersData]);

    const handleApprove = async () => {
        if (!selectedOrder || !user) return;

        try {
            setLoading(true);
            const database = getDatabase(firebaseApp);
            const now = Date.now();

            // Cập nhật trạng thái phiếu order
            const updatedOrder: Partial<MaterialOrder> = {
                status: "approved",
                approvedBy: user.uid,
                approvedByName: user.displayName || user.email || "Không rõ",
                approvedAt: now,
                updatedAt: now,
                history: [
                    ...(selectedOrder.history || []),
                    {
                        action: "approved",
                        actionName: "Duyệt phiếu",
                        by: user.uid,
                        byName: user.displayName || user.email || "Không rõ",
                        at: now,
                        note: "Phiếu đã được duyệt và tự động tạo transaction trong lịch sử kho"
                    }
                ]
            };

            await update(ref(database, `xoxo/material_orders/${selectedOrder.id}`), updatedOrder);

            // Tự động tạo transaction trong lịch sử kho (xuất kho)
            await InventoryService.createTransaction({
                materialId: selectedOrder.materialId,
                materialName: selectedOrder.materialName,
                type: "export",
                quantity: selectedOrder.quantity,
                unit: selectedOrder.unit,
                date: dayjs(selectedOrder.orderDate).format("YYYY-MM-DD"),
                reason: "Order nguyên liệu đã được duyệt",
                note: selectedOrder.note || `Phiếu order: ${selectedOrder.code}`,
                createdBy: user.uid,
            });

            message.success("Đã duyệt phiếu và tạo transaction trong lịch sử kho!");
            setApproveModalVisible(false);
            setSelectedOrder(null);
        } catch (error) {
            console.error("Error approving material order:", error);
            message.error("Không thể duyệt phiếu!");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (values: { reason: string }) => {
        if (!selectedOrder || !user) return;

        try {
            setLoading(true);
            const database = getDatabase(firebaseApp);
            const now = Date.now();

            const updatedOrder: Partial<MaterialOrder> = {
                status: "rejected",
                rejectedReason: values.reason,
                updatedAt: now,
                history: [
                    ...(selectedOrder.history || []),
                    {
                        action: "rejected",
                        actionName: "Từ chối phiếu",
                        by: user.uid,
                        byName: user.displayName || user.email || "Không rõ",
                        at: now,
                        note: values.reason
                    }
                ]
            };

            await update(ref(database, `xoxo/material_orders/${selectedOrder.id}`), updatedOrder);

            message.success("Đã từ chối phiếu!");
            setRejectModalVisible(false);
            setSelectedOrder(null);
            rejectForm.resetFields();
        } catch (error) {
            console.error("Error rejecting material order:", error);
            message.error("Không thể từ chối phiếu!");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "orange";
            case "approved":
                return "green";
            case "rejected":
                return "red";
            default:
                return "default";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "pending":
                return "Chờ duyệt";
            case "approved":
                return "Đã duyệt";
            case "rejected":
                return "Từ chối";
            default:
                return status;
        }
    };

    const columns = [
        {
            title: "Mã phiếu",
            dataIndex: "code",
            key: "code",
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: "Vật liệu",
            dataIndex: "materialName",
            key: "materialName",
            render: (text: string, record: MaterialOrder) => {
                const material = materials.find(m => m.id === record.materialId);
                const stockQuantity = material?.stockQuantity || 0;
                const unit = material?.unit || record.unit;
                return (
                    <Space direction="vertical" size={0}>
                        <Text>{text}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Tồn kho: {stockQuantity} {unit}
                        </Text>
                    </Space>
                );
            },
        },
        {
            title: "Số lượng",
            key: "quantity",
            render: (_: any, record: MaterialOrder) => (
                <Text>
                    {record.quantity} {record.unit}
                </Text>
            ),
        },
        {
            title: "Người tạo",
            dataIndex: "requestedByName",
            key: "requestedByName",
        },
        {
            title: "Thời gian order",
            key: "orderDate",
            render: (_: any, record: MaterialOrder) => (
                <Text>
                    {dayjs(record.orderDate).format("DD/MM/YYYY HH:mm")}
                </Text>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusText(status)}
                </Tag>
            ),
        },
        {
            title: "Thao tác",
            key: "action",
            render: (_: any, record: MaterialOrder) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedOrder(record);
                            setViewModalVisible(true);
                        }}
                    >
                        Xem
                    </Button>
                    {isAdmin && record.status === "pending" && (
                        <>
                            <Button
                                type="link"
                                danger={false}
                                icon={<CheckOutlined />}
                                onClick={() => {
                                    setSelectedOrder(record);
                                    setApproveModalVisible(true);
                                }}
                            >
                                Duyệt
                            </Button>
                            <Button
                                type="link"
                                danger
                                icon={<CloseOutlined />}
                                onClick={() => {
                                    setSelectedOrder(record);
                                    setRejectModalVisible(true);
                                }}
                            >
                                Từ chối
                            </Button>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    const pendingCount = materialOrders.filter(o => o.status === "pending").length;
    const approvedCount = materialOrders.filter(o => o.status === "approved").length;
    const rejectedCount = materialOrders.filter(o => o.status === "rejected").length;

    return (
        <div>
            <Row gutter={16} className="mb-4">
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Chờ duyệt"
                            value={pendingCount}
                            valueStyle={{ color: "#fa8c16" }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Đã duyệt"
                            value={approvedCount}
                            valueStyle={{ color: "#52c41a" }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Từ chối"
                            value={rejectedCount}
                            valueStyle={{ color: "#ff4d4f" }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card>
                <Table
                    columns={columns}
                    dataSource={materialOrders}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} phiếu`,
                    }}
                />
            </Card>

            {/* View Modal */}
            <Modal
                title={`Chi tiết phiếu: ${selectedOrder?.code}`}
                open={viewModalVisible}
                onCancel={() => {
                    setViewModalVisible(false);
                    setSelectedOrder(null);
                }}
                footer={[
                    <Button key="close" onClick={() => {
                        setViewModalVisible(false);
                        setSelectedOrder(null);
                    }}>
                        Đóng
                    </Button>,
                    ...(isAdmin && selectedOrder?.status === "pending" ? [
                        <Button
                            key="approve"
                            type="primary"
                            icon={<CheckOutlined />}
                            onClick={() => {
                                setViewModalVisible(false);
                                setApproveModalVisible(true);
                            }}
                        >
                            Duyệt
                        </Button>,
                        <Button
                            key="reject"
                            danger
                            icon={<CloseOutlined />}
                            onClick={() => {
                                setViewModalVisible(false);
                                setRejectModalVisible(true);
                            }}
                        >
                            Từ chối
                        </Button>,
                    ] : []),
                ]}
                width={700}
            >
                {selectedOrder && (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Mã phiếu">
                            <Text strong>{selectedOrder.code}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Vật liệu">
                            <Space direction="vertical" size={0}>
                                <Text>{selectedOrder.materialName}</Text>
                                {(() => {
                                    const material = materials.find(m => m.id === selectedOrder.materialId);
                                    const stockQuantity = material?.stockQuantity || 0;
                                    const unit = material?.unit || selectedOrder.unit;
                                    return (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Tồn kho: {stockQuantity} {unit}
                                        </Text>
                                    );
                                })()}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Số lượng">
                            {selectedOrder.quantity} {selectedOrder.unit}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian order">
                            {dayjs(selectedOrder.orderDate).format("DD/MM/YYYY HH:mm")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ghi chú">
                            {selectedOrder.note || "Không có"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={getStatusColor(selectedOrder.status)}>
                                {getStatusText(selectedOrder.status)}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Người tạo">
                            {selectedOrder.requestedByName || "Không rõ"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian tạo">
                            {dayjs(selectedOrder.createdAt).format("DD/MM/YYYY HH:mm")}
                        </Descriptions.Item>
                        {selectedOrder.status === "approved" && (
                            <>
                                <Descriptions.Item label="Người duyệt">
                                    {selectedOrder.approvedByName || "Không rõ"}
                                </Descriptions.Item>
                                <Descriptions.Item label="Thời gian duyệt">
                                    {selectedOrder.approvedAt
                                        ? dayjs(selectedOrder.approvedAt).format("DD/MM/YYYY HH:mm")
                                        : "Không rõ"}
                                </Descriptions.Item>
                            </>
                        )}
                        {selectedOrder.status === "rejected" && selectedOrder.rejectedReason && (
                            <Descriptions.Item label="Lý do từ chối">
                                <Text type="danger">{selectedOrder.rejectedReason}</Text>
                            </Descriptions.Item>
                        )}
                        {selectedOrder.relatedOrderCode && (
                            <Descriptions.Item label="Mã đơn hàng liên quan">
                                {selectedOrder.relatedOrderCode}
                            </Descriptions.Item>
                        )}
                        {selectedOrder.history && selectedOrder.history.length > 0 && (
                            <Descriptions.Item label="Lịch sử">
                                <Space direction="vertical" style={{ width: "100%" }} size="small">
                                    {selectedOrder.history.map((item, index) => (
                                        <div key={index} style={{ borderLeft: "2px solid #1890ff", paddingLeft: 12, paddingTop: 4, paddingBottom: 4 }}>
                                            <Text strong>{item.actionName}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {item.byName} - {dayjs(item.at).format("DD/MM/YYYY HH:mm")}
                                            </Text>
                                            {item.note && (
                                                <>
                                                    <br />
                                                    <Text style={{ fontSize: 12 }}>{item.note}</Text>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </Space>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                )}
            </Modal>

            {/* Approve Modal */}
            <Modal
                title="Xác nhận duyệt phiếu"
                open={approveModalVisible}
                onOk={handleApprove}
                onCancel={() => {
                    setApproveModalVisible(false);
                    setSelectedOrder(null);
                }}
                confirmLoading={loading}
                okText="Duyệt"
                cancelText="Hủy"
            >
                <p>Bạn có chắc chắn muốn duyệt phiếu <Text strong>{selectedOrder?.code}</Text>?</p>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                    Sau khi duyệt, hệ thống sẽ tự động tạo transaction xuất kho trong lịch sử.
                </Text>
            </Modal>

            {/* Reject Modal */}
            <Modal
                title="Từ chối phiếu"
                open={rejectModalVisible}
                onCancel={() => {
                    setRejectModalVisible(false);
                    setSelectedOrder(null);
                    rejectForm.resetFields();
                }}
                footer={null}
            >
                <Form
                    form={rejectForm}
                    layout="vertical"
                    onFinish={handleReject}
                >
                    <Form.Item
                        name="reason"
                        label="Lý do từ chối"
                        rules={[{ required: true, message: "Vui lòng nhập lý do từ chối" }]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Nhập lý do từ chối..."
                        />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" danger htmlType="submit" loading={loading}>
                                Từ chối
                            </Button>
                            <Button onClick={() => {
                                setRejectModalVisible(false);
                                setSelectedOrder(null);
                                rejectForm.resetFields();
                            }}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

