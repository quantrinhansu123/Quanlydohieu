"use client";

import ButtonCall from "@/components/ButtonCall";
import { PropRowDetails } from "@/components/CommonTable";
import type { Customer, CustomerGroup, Province } from "@/types/customer";
import { IMembers } from "@/types/members";
import { LeadStatus, LeadStatusLabels } from "@/types/enum";
import {
    getCustomerTypeLabel,
    getGenderLabel,
    getSourceColor,
    getSourceLabel,
} from "@/utils/customerUtils";
import { DeleteOutlined, EditOutlined, ShoppingCartOutlined, DollarOutlined, HistoryOutlined } from "@ant-design/icons";
import { Button, Descriptions, Tag, Typography, Card, Table, Space, Statistic, Row, Col, Empty } from "antd";
import dayjs from "dayjs";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import { FirebaseOrderData, PaymentInfo, OrderStatus } from "@/types/order";
import { useMemo } from "react";

interface CustomerDetailProps extends PropRowDetails<Customer> {
    onEdit: (customerCode: string) => void;
    onDelete: (customerCode: string, onCloseDrawer?: () => void) => void;
    provinces?: Province[];
    customerGroups?: Record<string, CustomerGroup>;
    members?: IMembers[];
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({
    data,
    onClose,
    onEdit,
    onDelete,
    provinces = [],
    customerGroups = {},
    members = [],
}) => {
    if (!data) return null;

    // Load orders from Firebase
    const { data: ordersData } = useRealtimeList<FirebaseOrderData>("xoxo/orders");

    // Filter orders for this customer
    const customerOrders = useMemo(() => {
        if (!ordersData || !Array.isArray(ordersData)) return [];
        return ordersData.filter(
            (order) => {
                if (!order) return false;
                return (
                    (order.phone && order.phone === data.phone) || 
                    (order.customerCode && order.customerCode === data.code)
                );
            }
        );
    }, [ordersData, data.phone, data.code]);

    // Calculate total debt (công nợ)
    const totalDebt = useMemo(() => {
        return customerOrders.reduce((sum, order) => {
            const remainingDebt = order.remainingDebt || 0;
            return sum + remainingDebt;
        }, 0);
    }, [customerOrders]);

    // Calculate total amount (tổng giá trị đơn hàng)
    const totalOrderValue = useMemo(() => {
        return customerOrders.reduce((sum, order) => {
            return sum + (order.totalAmount || 0);
        }, 0);
    }, [customerOrders]);

    // Get all payment history
    const paymentHistory = useMemo(() => {
        const payments: Array<PaymentInfo & { orderCode: string; orderDate: number }> = [];
        customerOrders.forEach((order) => {
            if (order.payments && Array.isArray(order.payments)) {
                order.payments.forEach((payment) => {
                    payments.push({
                        ...payment,
                        orderCode: order.code,
                        orderDate: order.orderDate,
                    });
                });
            }
        });
        // Sort by date (newest first)
        return payments.sort((a, b) => (b.paidAt || 0) - (a.paidAt || 0));
    }, [customerOrders]);

    // Order status color mapping
    const getOrderStatusColor = (status?: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING:
                return "orange";
            case OrderStatus.IN_PROGRESS:
                return "blue";
            case OrderStatus.COMPLETED:
                return "green";
            case OrderStatus.CANCELLED:
                return "red";
            default:
                return "default";
        }
    };

    const getOrderStatusLabel = (status?: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING:
                return "Chờ xử lý";
            case OrderStatus.IN_PROGRESS:
                return "Đang xử lý";
            case OrderStatus.COMPLETED:
                return "Hoàn thành";
            case OrderStatus.CANCELLED:
                return "Đã hủy";
            default:
                return "Chưa xác định";
        }
    };

    // Helper function to get location name from code
    const getLocationName = (
        code: string | undefined,
        type: "province" | "district" | "ward",
    ): string => {
        if (!code || provinces.length === 0) return code || "";

        if (type === "province") {
            const province = provinces.find((p) => p.code === code);
            return province?.name || code;
        }

        if (type === "district") {
            for (const province of provinces) {
                const district = province.districts?.find(
                    (d) => d.code === code,
                );
                if (district) return district.name;
            }
            return code;
        }

        if (type === "ward") {
            for (const province of provinces) {
                for (const district of province.districts || []) {
                    const ward = district.wards?.find((w) => w.code === code);
                    if (ward) return ward.name;
                }
            }
            return code;
        }

        return code;
    };

    const getFullAddress = () => {
        const parts = [];
        // Thứ tự: Địa chỉ (Đường), Xã/Phường, Quận/Huyện, Tỉnh/Thành phố
        if (data.address) parts.push(data.address);
        if (data.ward) {
            const wardName = getLocationName(data.ward, "ward");
            parts.push(wardName);
        }
        if (data.district) {
            const districtName = getLocationName(data.district, "district");
            parts.push(districtName);
        }
        if (data.province) {
            const provinceName = getLocationName(data.province, "province");
            parts.push(provinceName);
        }
        return parts.length > 0 ? parts.join(", ") : "-";
    };

    const handleEdit = () => {
        onEdit(data.code);
        onClose();
    };

    const handleDelete = () => {
        onDelete(data.code, onClose);
    };

    return (
        <div className="space-y-4">
            <Descriptions bordered column={1}>
                <Descriptions.Item label="Mã KH">{data.code}</Descriptions.Item>
                <Descriptions.Item label="Tên khách hàng">
                    {data.name}
                </Descriptions.Item>
                <Descriptions.Item label="Loại khách">
                    {getCustomerTypeLabel(data.customerType)}
                </Descriptions.Item>
                <Descriptions.Item label="Giới tính">
                    {getGenderLabel(data.gender)}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                    {data.phone || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                    {data.email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày sinh">
                    {data.dateOfBirth
                        ? dayjs(data.dateOfBirth).format("DD/MM/YYYY")
                        : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                    {getFullAddress()}
                </Descriptions.Item>
                <Descriptions.Item label="Nguồn khách hàng">
                    <Tag color={getSourceColor(data.customerSource)}>
                        {getSourceLabel(data.customerSource)}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Nhóm khách hàng">
                    {data.customerGroup ? (
                        customerGroups[data.customerGroup] ? (
                            <Tag color="cyan">
                                {customerGroups[data.customerGroup].name}
                            </Tag>
                        ) : (
                            <Typography.Text type="secondary">
                                {data.customerGroup}
                            </Typography.Text>
                        )
                    ) : (
                        "-"
                    )}
                </Descriptions.Item>
                <Descriptions.Item label="Mã số thuế">
                    {data.taxCode || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Facebook">
                    {data.facebook || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Sale phụ trách">
                    {data.salePerson ? (
                        members.find((m) => m.id === data.salePerson)?.name ||
                        data.salePerson
                    ) : (
                        "-"
                    )}
                </Descriptions.Item>
                <Descriptions.Item label="MKT phụ trách">
                    {data.mktPerson ? (
                        members.find((m) => m.id === data.mktPerson)?.name ||
                        data.mktPerson
                    ) : (
                        "-"
                    )}
                </Descriptions.Item>
                <Descriptions.Item label="Trực page">
                    {data.pageManager || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                    {data.status ? (
                        <Tag
                            color={
                                data.status === LeadStatus.Considering
                                    ? "blue"
                                    : data.status === LeadStatus.WaitingForPhotos
                                      ? "orange"
                                      : data.status === LeadStatus.WaitingForVisit
                                        ? "cyan"
                                        : data.status === LeadStatus.WaitingForItems
                                          ? "purple"
                                          : data.status === LeadStatus.NotInterested
                                            ? "red"
                                            : "default"
                            }
                        >
                            {LeadStatusLabels[data.status]}
                        </Tag>
                    ) : (
                        "-"
                    )}
                </Descriptions.Item>
                <Descriptions.Item label="Ghi chú">
                    {data.notes || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                    {data.createdAt
                        ? dayjs(data.createdAt).format("DD/MM/YYYY HH:mm")
                        : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày cập nhật">
                    {data.updatedAt
                        ? dayjs(data.updatedAt).format("DD/MM/YYYY HH:mm")
                        : "-"}
                </Descriptions.Item>
            </Descriptions>

            {/* Orders and Debt Summary */}
            <Card 
                title={
                    <Space>
                        <ShoppingCartOutlined />
                        <span>Đơn hàng & Công nợ</span>
                    </Space>
                }
                className="mt-4"
            >
                <Row gutter={16} className="mb-4">
                    <Col span={8}>
                        <Statistic
                            title="Tổng đơn hàng"
                            value={customerOrders.length}
                            prefix={<ShoppingCartOutlined />}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Tổng giá trị"
                            value={totalOrderValue}
                            formatter={(value) => `${Number(value).toLocaleString('vi-VN')} đ`}
                            prefix={<DollarOutlined />}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Công nợ"
                            value={totalDebt}
                            formatter={(value) => `${Number(value).toLocaleString('vi-VN')} đ`}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: totalDebt > 0 ? '#cf1322' : '#3f8600' }}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Purchase History */}
            <Card 
                title={
                    <Space>
                        <HistoryOutlined />
                        <span>Lịch sử mua hàng ({customerOrders.length})</span>
                    </Space>
                }
                className="mt-4"
            >
                {customerOrders.length > 0 ? (
                    <Table
                        dataSource={customerOrders}
                        rowKey={(record) => record.code || record.id || Math.random().toString()}
                        pagination={{ pageSize: 5 }}
                        size="small"
                        columns={[
                            {
                                title: "Mã đơn",
                                dataIndex: "code",
                                key: "code",
                                render: (code: string) => (
                                    <Typography.Text strong copyable>
                                        {code}
                                    </Typography.Text>
                                ),
                            },
                            {
                                title: "Ngày đặt",
                                dataIndex: "orderDate",
                                key: "orderDate",
                                render: (date: number) =>
                                    date ? dayjs(date).format("DD/MM/YYYY") : "-",
                            },
                            {
                                title: "Tổng tiền",
                                dataIndex: "totalAmount",
                                key: "totalAmount",
                                render: (amount: number) =>
                                    amount
                                        ? `${Number(amount).toLocaleString('vi-VN')} đ`
                                        : "-",
                                align: "right",
                            },
                            {
                                title: "Đã thanh toán",
                                dataIndex: "totalPaidAmount",
                                key: "totalPaidAmount",
                                render: (amount: number) =>
                                    amount
                                        ? `${Number(amount).toLocaleString('vi-VN')} đ`
                                        : "0 đ",
                                align: "right",
                            },
                            {
                                title: "Còn nợ",
                                dataIndex: "remainingDebt",
                                key: "remainingDebt",
                                render: (debt: number) => (
                                    <Typography.Text
                                        type={debt > 0 ? "danger" : "success"}
                                    >
                                        {debt
                                            ? `${Number(debt).toLocaleString('vi-VN')} đ`
                                            : "0 đ"}
                                    </Typography.Text>
                                ),
                                align: "right",
                            },
                            {
                                title: "Trạng thái",
                                dataIndex: "status",
                                key: "status",
                                render: (status?: OrderStatus) => (
                                    <Tag color={getOrderStatusColor(status)}>
                                        {getOrderStatusLabel(status)}
                                    </Tag>
                                ),
                            },
                        ]}
                    />
                ) : (
                    <Empty description="Chưa có đơn hàng nào" />
                )}
            </Card>

            {/* Payment History */}
            <Card 
                title={
                    <Space>
                        <DollarOutlined />
                        <span>Lịch sử thanh toán ({paymentHistory.length})</span>
                    </Space>
                }
                className="mt-4"
            >
                {paymentHistory.length > 0 ? (
                    <Table
                        dataSource={paymentHistory}
                        rowKey={(record, index) => `${record.orderCode || 'unknown'}-${index}-${record.paidAt || Date.now()}`}
                        pagination={{ pageSize: 5 }}
                        size="small"
                        columns={[
                            {
                                title: "Mã đơn",
                                dataIndex: "orderCode",
                                key: "orderCode",
                                render: (code: string) => (
                                    <Typography.Text strong copyable>
                                        {code}
                                    </Typography.Text>
                                ),
                            },
                            {
                                title: "Số tiền",
                                dataIndex: "amount",
                                key: "amount",
                                render: (amount: number) =>
                                    `${Number(amount).toLocaleString('vi-VN')} đ`,
                                align: "right",
                            },
                            {
                                title: "Nội dung",
                                dataIndex: "content",
                                key: "content",
                                render: (content: string) => content || "-",
                            },
                            {
                                title: "Người thanh toán",
                                dataIndex: "paidByName",
                                key: "paidByName",
                                render: (name: string) => name || "-",
                            },
                            {
                                title: "Ngày thanh toán",
                                dataIndex: "paidAt",
                                key: "paidAt",
                                render: (date: number) =>
                                    date
                                        ? dayjs(date).format("DD/MM/YYYY HH:mm")
                                        : "-",
                            },
                        ]}
                    />
                ) : (
                    <Empty description="Chưa có lịch sử thanh toán" />
                )}
            </Card>

            <div className="flex justify-end gap-2 mt-4 p-3">
                <ButtonCall phone={data.phone || ""} />
                <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                >
                    Sửa
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                    Xóa
                </Button>
            </div>
        </div>
    );
};

export default CustomerDetail;

