"use client";

import WrapperContent from "@/components/WrapperContent";
import { useFirebaseApp } from "@/firebase";
import { useUser } from "@/firebase/provider";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import useFilter from "@/hooks/useFilter";
import { ROLES } from "@/types/enum";
import { FirebaseOrderData, OrderStatus } from "@/types/order";
import { PlusOutlined, CheckOutlined, DeleteOutlined } from "@ant-design/icons";
import { App, Card, Typography, Tag, Button, Table, Space, Popconfirm } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { getDatabase, ref, update, remove, get } from "firebase/database";
import dayjs from "dayjs";

const { Text } = Typography;

// Status columns configuration
const statusColumns = [
    {
        key: OrderStatus.CONFIRMED,
        title: "Lên đơn",
        color: "#fa8c16",
        bgColor: "#432f0e",
    },
    {
        key: OrderStatus.IN_PROGRESS,
        title: "Sản xuất",
        color: "#1890ff",
        bgColor: "#0d3b66",
    },
    {
        key: OrderStatus.ON_HOLD,
        title: "Thanh toán",
        color: "#722ed1",
        bgColor: "#2d1a4d",
    },
    {
        key: OrderStatus.COMPLETED,
        title: "CSKH",
        color: "#52c41a",
        bgColor: "#1a3d1a",
    },
];


export default function OrderListPage() {
    const { message: antdMessage } = App.useApp();
    const router = useRouter();
    const { user } = useUser();
    const firebaseApp = useFirebaseApp();
    const { data: ordersData, isLoading: ordersLoading } =
        useRealtimeList<FirebaseOrderData>("xoxo/orders");

    const orders = ordersData || [];
    const { query, applyFilter, setQuery } = useFilter({ search: "" });
    const filteredOrders = applyFilter(orders);

    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    useEffect(() => {
        let cancelled = false;
        const loadRole = async () => {
            if (!user) return;
            try {
                const token = await user.getIdTokenResult();
                if (!cancelled) {
                    setIsAdmin(token.claims.role === ROLES.admin);
                }
            } catch (error) {
                console.error("Failed to load user role", error);
            }
        };

        loadRole();
        return () => {
            cancelled = true;
        };
    }, [user]);


    const handleApprove = useCallback(
        async (order: FirebaseOrderData, targetStatus: OrderStatus) => {
            try {
                // Định nghĩa thứ tự quy trình
                const statusOrder = [
                    OrderStatus.PENDING,
                    OrderStatus.CONFIRMED,      // Lên đơn
                    OrderStatus.IN_PROGRESS,     // Sản xuất
                    OrderStatus.ON_HOLD,         // Thanh toán
                    OrderStatus.COMPLETED,       // CSKH
                ];

                const currentIndex = statusOrder.indexOf(order.status || OrderStatus.PENDING);
                const targetIndex = statusOrder.indexOf(targetStatus);

                // Kiểm tra xem có thể chuyển sang trạng thái tiếp theo không
                if (currentIndex === -1 || targetIndex === -1) {
                    antdMessage.error("Trạng thái không hợp lệ!");
                    return;
                }

                if (targetIndex !== currentIndex + 1) {
                    antdMessage.error(`Đơn hàng phải qua bước ${statusColumns.find(c => c.key === statusOrder[currentIndex])?.title || ""} trước khi chuyển sang ${statusColumns.find(c => c.key === targetStatus)?.title || ""}!`);
                    return;
                }

                const database = getDatabase(firebaseApp);
                const orderRef = ref(database, `xoxo/orders/${order.code}`);
                await update(orderRef, {
                    status: targetStatus,
                    updatedAt: Date.now(),
                });
                antdMessage.success(`Đã duyệt đơn hàng sang ${statusColumns.find(c => c.key === targetStatus)?.title || ""}!`);
            } catch (error) {
                console.error("Error approving order:", error);
                antdMessage.error("Không duyệt được đơn, thử lại nhé.");
            }
        },
        [antdMessage, firebaseApp]
    );


    // Handle delete multiple orders
    const handleDeleteMultiple = useCallback(
        async () => {
            if (selectedRowKeys.length === 0) {
                antdMessage.warning("Vui lòng chọn ít nhất một đơn hàng để xóa!");
                return;
            }

            try {
                const database = getDatabase(firebaseApp);
                const ordersRef = ref(database, "xoxo/orders");
                const snapshot = await get(ordersRef);
                const ordersData = snapshot.val() || {};

                // Find order IDs by code
                const orderIds: string[] = [];
                Object.entries(ordersData).forEach(([id, order]: [string, any]) => {
                    if (selectedRowKeys.includes(order.code)) {
                        orderIds.push(id);
                    }
                });

                if (orderIds.length === 0) {
                    antdMessage.error("Không tìm thấy đơn hàng để xóa!");
                    return;
                }

                // Delete all orders
                const deletePromises = orderIds.map((id) => {
                    const orderRef = ref(database, `xoxo/orders/${id}`);
                    return remove(orderRef);
                });

                await Promise.all(deletePromises);
                antdMessage.success(`Đã xóa ${orderIds.length} đơn hàng thành công!`);
                setSelectedRowKeys([]);
            } catch (error) {
                console.error("Error deleting orders:", error);
                antdMessage.error("Có lỗi xảy ra khi xóa đơn hàng!");
            }
        },
        [selectedRowKeys, orders, antdMessage, firebaseApp]
    );

    const tableColumns = [
        {
            title: 'Mã đơn',
            dataIndex: 'code',
            key: 'code',
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Khách hàng',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (text: string) => <Text strong>{text || "Khách lẻ"}</Text>,
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
        },
        {
            title: 'Người tạo',
            dataIndex: 'createdByName',
            key: 'createdByName',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: OrderStatus) => {
                const col = statusColumns.find(c => c.key === status);
                return <Tag color={col?.color}>{col?.title || status}</Tag>;
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: FirebaseOrderData) => (
                <Space size="middle">
                    <Button 
                        type="link" 
                        onClick={() => router.push(`/sale/orders/${record.code}/update`)}
                    >
                        Chi tiết
                    </Button>
                    {isAdmin && record.status === OrderStatus.PENDING && (
                         <Button 
                            type="link" 
                            onClick={() => handleApprove(record, OrderStatus.CONFIRMED)}
                        >
                            Duyệt
                        </Button>
                    )}
                    {isAdmin && record.status !== OrderStatus.PENDING && record.status !== OrderStatus.COMPLETED && record.status !== OrderStatus.CANCELLED && (
                        <Button 
                            type="link" 
                            onClick={() => {
                                const statusOrder = [
                                    OrderStatus.CONFIRMED,
                                    OrderStatus.IN_PROGRESS,
                                    OrderStatus.ON_HOLD,
                                    OrderStatus.COMPLETED,
                                ];
                                const currentIndex = statusOrder.indexOf(record.status);
                                if (currentIndex !== -1 && currentIndex < statusOrder.length - 1) {
                                    handleApprove(record, statusOrder[currentIndex + 1]);
                                }
                            }}
                        >
                            Duyệt tiếp
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <WrapperContent
            header={{
                searchInput: {
                    placeholder: "Tìm theo mã đơn hàng, tên khách hàng...",
                    filterKeys: ["code", "customerName"],
                },
                filters: {
                    fields: [
                        {
                            name: "status",
                            label: "Trạng thái",
                            type: "select",
                            options: statusColumns.map((col) => ({
                                value: col.key,
                                label: col.title,
                            })),
                        },
                        {
                            name: "createdAt",
                            label: "Ngày tạo",
                            type: "dateRange",
                        },
                    ],
                    query,
                    onApplyFilter: (arr) => {
                        const newQuery: any = { ...query };
                        arr.forEach(({ key, value }) => {
                            if (value === null || value === undefined || value === "") {
                                delete newQuery[key];
                            } else {
                                newQuery[key] = value;
                            }
                        });
                        setQuery(newQuery);
                    },
                    onReset: () => {
                        setQuery({ search: "" });
                    },
                },
                buttonEnds: [
                    {
                        can: selectedRowKeys.length > 0,
                        name: `Xóa (${selectedRowKeys.length})`,
                        icon: <DeleteOutlined />,
                        type: "default",
                        danger: true,
                        onClick: handleDeleteMultiple,
                    },
                    {
                        can: true,
                        name: "Tạo đơn hàng",
                        icon: <PlusOutlined />,
                        type: "primary",
                        onClick: () => router.push("/sale/orders/create"),
                    },
                ],
            }}
            isLoading={ordersLoading}
            title="Đơn hàng"
        >
            <Card>
                <Table 
                    dataSource={filteredOrders} 
                    columns={tableColumns} 
                    rowKey="code"
                    pagination={{ pageSize: 10 }}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (selectedKeys) => {
                            setSelectedRowKeys(selectedKeys);
                        },
                        getCheckboxProps: (record) => ({
                            name: record.code,
                        }),
                    }}
                />
            </Card>
        </WrapperContent>
    );
}
