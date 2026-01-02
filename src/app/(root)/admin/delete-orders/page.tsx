"use client";

import { App, Button, Card, Typography, Space, Alert, Table, Popconfirm, Input } from "antd";
import { useState, useEffect, useMemo } from "react";
import { getDatabase, ref, get, remove } from "firebase/database";
import { OperationalWorkflowService } from "@/services/operationalWorkflowService";
import { useFirebaseApp } from "@/firebase/provider";
import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { FirebaseOrderData } from "@/types/order";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface OrderListItem {
    id: string; // Order ID (key in Firebase)
    code: string; // Order code
    customerName: string;
    phone: string;
    createdAt?: number;
    status?: string;
    totalAmount?: number;
}

export default function DeleteOrdersPage() {
    const { message: antdMessage } = App.useApp();
    const firebaseApp = useFirebaseApp();
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<OrderListItem[]>([]);
    const [searchText, setSearchText] = useState("");

    // Load all orders
    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const db = getDatabase(firebaseApp);
            const ordersRef = ref(db, "xoxo/orders");

            const snapshot = await get(ordersRef);
            const ordersData = snapshot.val() || {};

            const ordersList: OrderListItem[] = Object.entries(ordersData).map(
                ([id, order]: [string, any]) => ({
                    id,
                    code: order.code || id,
                    customerName: order.customerName || "N/A",
                    phone: order.phone || "N/A",
                    createdAt: order.createdAt || order.orderDate,
                    status: order.status || "N/A",
                    totalAmount: order.totalAmount || 0,
                })
            );

            setOrders(ordersList);
        } catch (error: any) {
            console.error("Error loading orders:", error);
            antdMessage.error(`Lỗi khi tải đơn hàng: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Handle delete order
    const handleDeleteOrder = async (orderId: string, orderCode: string) => {
        try {
            const db = getDatabase(firebaseApp);
            const orderRef = ref(db, `xoxo/orders/${orderId}`);

            // Delete order
            await remove(orderRef);

            // Also delete related operational workflow items
            await OperationalWorkflowService.deleteItemsByOrderCode(orderCode);

            antdMessage.success(`Đã xóa đơn hàng ${orderCode} và các công việc liên quan thành công!`);
            
            // Reload orders
            await loadOrders();
        } catch (error: any) {
            console.error("Error deleting order:", error);
            antdMessage.error(`Lỗi khi xóa đơn hàng: ${error.message}`);
        }
    };

    // Filter orders by search text
    const filteredOrders = useMemo(() => {
        if (!searchText.trim()) {
            return orders;
        }

        const searchLower = searchText.toLowerCase();
        return orders.filter(
            (order) =>
                order.code.toLowerCase().includes(searchLower) ||
                order.customerName.toLowerCase().includes(searchLower) ||
                order.phone.includes(searchText)
        );
    }, [orders, searchText]);

    const columns = [
        {
            title: "Mã đơn hàng",
            dataIndex: "code",
            key: "code",
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: "Khách hàng",
            dataIndex: "customerName",
            key: "customerName",
        },
        {
            title: "Số điện thoại",
            dataIndex: "phone",
            key: "phone",
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalAmount",
            key: "totalAmount",
            render: (amount: number) =>
                amount ? `${amount.toLocaleString("vi-VN")} đ` : "N/A",
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (timestamp: number) =>
                timestamp
                    ? dayjs(timestamp).format("DD/MM/YYYY HH:mm")
                    : "N/A",
        },
        {
            title: "Thao tác",
            key: "action",
            render: (_: any, record: OrderListItem) => (
                <Popconfirm
                    title="Xóa đơn hàng"
                    description={`Bạn có chắc chắn muốn xóa đơn hàng ${record.code}?`}
                    onConfirm={() => handleDeleteOrder(record.id, record.code)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                >
                    <Button
                        type="primary"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                    >
                        Xóa
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Title level={2}>Xóa Đơn hàng</Title>

            <Alert
                message="Cảnh báo"
                description="Trang này cho phép xóa đơn hàng trực tiếp từ database. Hành động này không thể hoàn tác!"
                type="warning"
                showIcon
                className="mb-6"
            />

            <Card>
                <Space direction="vertical" className="w-full" size="large">
                    {/* Search */}
                    <Input
                        placeholder="Tìm theo mã đơn hàng, tên khách hàng, số điện thoại..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                    />

                    {/* Orders Table */}
                    <div>
                        <Text strong className="mb-2 block">
                            Tổng số đơn hàng: {filteredOrders.length}
                        </Text>
                        <Table
                            columns={columns}
                            dataSource={filteredOrders}
                            rowKey="id"
                            loading={loading}
                            pagination={{
                                pageSize: 20,
                                showSizeChanger: true,
                                showTotal: (total) => `Tổng ${total} đơn hàng`,
                            }}
                            scroll={{ x: 1000 }}
                        />
                    </div>

                    {/* Refresh Button */}
                    <Button
                        onClick={loadOrders}
                        loading={loading}
                        icon={<SearchOutlined />}
                    >
                        Tải lại danh sách
                    </Button>
                </Space>
            </Card>
        </div>
    );
}

