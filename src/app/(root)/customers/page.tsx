"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import CustomerDetail from "@/components/CustomerDetail";
import CustomerFormModal from "@/components/CustomerFormModal";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import type { FilterField } from "@/types";
import type {
    Customer,
    FirebaseCustomerGroups,
    FirebaseCustomers,
    Province,
} from "@/types/customer";
import { CustomerSource, CustomerSourceOptions, LeadStatus, LeadStatusLabels, LeadStatusOptions } from "@/types/enum";
import {
    getCustomerTypeLabel,
    getSourceColor,
    getSourceLabel,
} from "@/utils/customerUtils";
import { PlusOutlined, UserOutlined, MessageOutlined, CopyOutlined, FacebookOutlined, GlobalOutlined, PhoneOutlined, ShopOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, UpOutlined, DownOutlined, DollarOutlined } from "@ant-design/icons";
import { App, Card, Col, Row, Statistic, Tag, Typography, Button, Tooltip, Space } from "antd";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { getDatabase, onValue, ref, remove } from "firebase/database";
import { Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MemberService } from "@/services/memberService";
import { IMembers } from "@/types/members";
import dayjs from "dayjs";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { getDatePresets, getDateRangeByPreset } from "@/utils/datePresets";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import { FirebaseOrderData, OrderStatus } from "@/types/order";

const { Text } = Typography;

// Helper function to check if today is a reminder day (1, 3, 5, 7 days after createdAt)
const getReminderInfo = (createdAt: number, status?: LeadStatus) => {
    if (status !== LeadStatus.Considering || !createdAt) {
        return null;
    }

    const createdDate = dayjs(createdAt);
    const today = dayjs();
    const daysDiff = today.diff(createdDate, "day");

    // Check if today is one of the reminder days (1, 3, 5, 7)
    const reminderDays = [1, 3, 5, 7];
    const isReminderDay = reminderDays.includes(daysDiff);

    // Generate auto message based on day
    let autoMessage = "";
    if (isReminderDay) {
        autoMessage = `Xin chào! Đây là tin nhắn nhắc nhở từ chúng tôi sau ${daysDiff} ngày. Chúng tôi rất mong được hỗ trợ bạn. Vui lòng liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.`;
    } else {
        // Calculate next reminder day
        const nextReminderDay = reminderDays.find(day => day > daysDiff) || reminderDays[reminderDays.length - 1];
        const daysUntilNext = nextReminderDay - daysDiff;
        autoMessage = `Tin nhắn nhắc nhở sẽ được gửi sau ${daysUntilNext} ngày nữa (ngày thứ ${nextReminderDay}).`;
    }

    if (isReminderDay) {
        return {
            isReminder: true,
            day: daysDiff,
            message: `Nhắc khách - Ngày thứ ${daysDiff}`,
            autoMessage: autoMessage,
        };
    }

    // Check if overdue (past reminder days)
    const maxReminderDay = Math.max(...reminderDays);
    if (daysDiff > maxReminderDay) {
        return {
            isReminder: true,
            day: daysDiff,
            message: `Quá hạn nhắc - ${daysDiff} ngày`,
            isOverdue: true,
            autoMessage: `Xin chào! Đã qua ${daysDiff} ngày kể từ lần liên hệ cuối. Chúng tôi rất mong được hỗ trợ bạn. Vui lòng liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.`,
        };
    }

    // Return info even if not a reminder day (to show upcoming reminder)
    return {
        isReminder: false,
        day: daysDiff,
        message: `Chưa đến ngày nhắc (${daysDiff} ngày)`,
        autoMessage: autoMessage,
    };
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<FirebaseCustomers>({});
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(
        null,
    );
    const { message, modal } = App.useApp();
    const { query, updateQuery, applyFilter, reset } = useFilter();

    // Customer Groups state
    const [customerGroups, setCustomerGroups] =
        useState<FirebaseCustomerGroups>({});

    // Location state
    const [provinces, setProvinces] = useState<Province[]>([]);

    // Members state for Sale/MKT selection
    const [members, setMembers] = useState<IMembers[]>([]);
    
    // Show/hide reports state
    const [showReports, setShowReports] = useState(true);

    // Load orders to check which customers have purchased
    const { data: ordersData } = useRealtimeList<FirebaseOrderData>("xoxo/orders");

    // Load customers from Firebase
    useEffect(() => {
        const database = getDatabase();
        const customersRef = ref(database, "xoxo/customers");

        const unsubscribe = onValue(
            customersRef,
            (snapshot) => {
                const data = snapshot.val() || {};
                setCustomers(data);
                setLoading(false);
            },
            (error) => {
                console.error("Error loading customers:", error);
                message.error("Không thể tải danh sách khách hàng!");
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [message]);

    // Load customer groups from Firebase
    useEffect(() => {
        const database = getDatabase();
        const groupsRef = ref(database, "xoxo/customerGroups");

        const unsubscribe = onValue(
            groupsRef,
            (snapshot) => {
                const data = snapshot.val() || {};
                setCustomerGroups(data);
            },
            (error) => {
                console.error("Error loading customer groups:", error);
            },
        );

        return () => unsubscribe();
    }, []);

    // Load provinces data
    useEffect(() => {
        const loadProvinces = async () => {
            try {
                const response = await fetch(
                    "https://provinces.open-api.vn/api/?depth=3",
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (Array.isArray(data)) {
                    setProvinces(data);
                } else {
                    console.error("Unexpected API response format:", data);
                }
            } catch (error) {
                console.error("Error loading provinces:", error);
                // Only show error message if it's a network error, not for silent failures
                if (
                    error instanceof TypeError &&
                    error.message === "Failed to fetch"
                ) {
                    console.warn(
                        "Provinces API unavailable, location names will show codes instead",
                    );
                } else {
                    message.error("Không thể tải danh sách tỉnh/thành phố!");
                }
            }
        };

        loadProvinces();
    }, [message]);

    // Load members for Sale/MKT selection
    useEffect(() => {
        const unsubscribe = MemberService.onSnapshot((data) => {
            setMembers(data);
        });
        return () => unsubscribe();
    }, []);

    const handleOpenModal = (customerCode?: string) => {
        if (customerCode) {
            const customer = customers[customerCode];
            setEditingCustomer(customer);
        } else {
            setEditingCustomer(null);
        }
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingCustomer(null);
    };

    const handleModalSuccess = () => {
        handleCloseModal();
    };

    const handleDelete = (customerCode: string, onCloseDrawer?: () => void) => {
        const customer = customers[customerCode];
        modal.confirm({
            title: "Xác nhận xóa",
            content: (
                <div>
                    <p>Bạn có chắc chắn muốn xóa khách hàng:</p>
                    <p className="font-semibold">{customer.name}?</p>
                    <p className="text-red-500 text-sm mt-2">
                        Thao tác này không thể hoàn tác!
                    </p>
                </div>
            ),
            okText: "Xóa",
            cancelText: "Hủy",
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    const database = getDatabase();
                    const customerRef = ref(
                        database,
                        `xoxo/customers/${customerCode}`,
                    );
                    await remove(customerRef);
                    message.success("Xóa khách hàng thành công!");
                    // Close drawer after successful deletion
                    if (onCloseDrawer) {
                        onCloseDrawer();
                    }
                } catch (error) {
                    console.error("Error deleting customer:", error);
                    message.error("Có lỗi xảy ra khi xóa khách hàng!");
                }
            },
        });
    };

    const dataSource = Object.entries(customers).map(([code, customer]) => ({
        ...customer,
        key: code,
    }));

    // Apply custom filters
    const filteredData = useMemo(() => {
        let filtered = dataSource;

        // Filter by salePerson
        if (query.salePerson && query.salePerson !== "") {
            filtered = filtered.filter(
                (customer) => customer.salePerson === query.salePerson,
            );
        }

        // Filter by mktPerson
        if (query.mktPerson && query.mktPerson !== "") {
            filtered = filtered.filter(
                (customer) => customer.mktPerson === query.mktPerson,
            );
        }

        // Filter by pageManager (search in string)
        if (query.pageManager && query.pageManager !== "") {
            const searchTerm = (query.pageManager as string).toLowerCase();
            filtered = filtered.filter(
                (customer) =>
                    customer.pageManager
                        ?.toLowerCase()
                        .includes(searchTerm),
            );
        }

        // Apply date preset filter if selected
        if (query.datePreset) {
            const dateRange = getDateRangeByPreset(query.datePreset as string);
            if (dateRange) {
                filtered = filtered.filter((customer) => {
                    if (!customer.createdAt) return false;
                    const customerDate = new Date(customer.createdAt);
                    return (
                        customerDate >= dateRange.from &&
                        customerDate <= dateRange.to
                    );
                });
            }
        }

        // Apply other filters from useFilter (customerSource, status, search, etc.)
        return applyFilter(filtered);
    }, [dataSource, query, applyFilter]);

    // Calculate statistics based on filtered data
    const stats = useMemo(() => {
        const source = Array.isArray(filteredData) ? filteredData : [];
        
        // Count by source
        const bySource = CustomerSourceOptions.reduce((acc, option) => {
            acc[option.value] = source.filter(
                (c) => c.customerSource === option.value
            ).length;
            return acc;
        }, {} as Record<string, number>);

        // Count by status
        const byStatus = LeadStatusOptions.reduce((acc, option) => {
            acc[option.value] = source.filter(
                (c) => c.status === option.value
            ).length;
            return acc;
        }, {} as Record<string, number>);

        // Count by customer type (Loại khách) - OLD: Cá nhân/Doanh nghiệp
        // NEW: Đã mua / Suy nghĩ / Khách cũ
        const orders = ordersData || [];
        
        // Create a map of customer phones/codes that have orders
        const customersWithOrders = new Set<string>();
        orders.forEach((order) => {
            if (order.phone) {
                customersWithOrders.add(order.phone);
            }
            if (order.customerCode) {
                customersWithOrders.add(order.customerCode);
            }
        });

        const byGroup = {
            purchased: 0, // Đã mua
            considering: 0, // Suy nghĩ
            oldCustomer: 0, // Khách cũ
        };

        source.forEach((customer) => {
            // Find all orders for this customer
            const customerOrders = orders.filter(
                (o) => o.phone === customer.phone || o.customerCode === customer.code
            );
            
            if (customerOrders.length > 0) {
                // Customer has orders
                const hasCompletedOrder = customerOrders.some(
                    (o) => o.status === OrderStatus.COMPLETED
                );
                
                if (hasCompletedOrder) {
                    // Khách cũ: Có đơn hàng đã hoàn thành
                    byGroup.oldCustomer++;
                } else {
                    // Đã mua: Có đơn hàng nhưng chưa hoàn thành
                    byGroup.purchased++;
                }
            } else {
                // No order - Suy nghĩ
                byGroup.considering++;
            }
        });

        // Calculate total revenue and total debt from all orders
        const totalRevenue = orders.reduce((sum, order) => {
            return sum + (order.totalAmount || 0);
        }, 0);
        
        const totalDebt = orders.reduce((sum, order) => {
            return sum + (order.remainingDebt || 0);
        }, 0);

        return {
            total: source.length,
            bySource,
            byStatus,
            byType: {
                individual: source.filter((c) => c.customerType === "individual").length,
                enterprise: source.filter((c) => c.customerType === "enterprise").length,
            },
            byGroup,
            totalRevenue,
            totalDebt,
        };
    }, [filteredData, ordersData]);

    // Prepare pie chart data for customer group (Đã mua / Suy nghĩ / Khách cũ)
    const customerTypeChartData = useMemo(() => {
        return [
            {
                name: "Đã mua",
                value: stats.byGroup.purchased,
                color: "#52c41a",
            },
            {
                name: "Suy nghĩ",
                value: stats.byGroup.considering,
                color: "#1890ff",
            },
            {
                name: "Khách cũ",
                value: stats.byGroup.oldCustomer,
                color: "#faad14",
            },
        ].filter((item) => item.value > 0);
    }, [stats.byGroup]);

    // Prepare pie chart data for status
    const statusChartData = useMemo(() => {
        return LeadStatusOptions.map((status) => {
            const getStatusColor = () => {
                switch (status.value) {
                    case LeadStatus.Considering:
                        return "#1890ff";
                    case LeadStatus.NotInterested:
                    case LeadStatus.Cancel:
                        return "#ff4d4f";
                    default:
                        return "#52c41a";
                }
            };
            return {
                name: status.label,
                value: stats.byStatus[status.value] || 0,
                color: getStatusColor(),
            };
        }).filter((item) => item.value > 0);
    }, [stats.byStatus]);

    const columns = [
        {
            title: "Tên khách hàng",
            dataIndex: "name",
            key: "name",
            width: 200,
            render: (name: string) => (
                <div className="flex items-center gap-2">
                    <UserOutlined className="text-gray-400" />
                    <Text strong>{name}</Text>
                </div>
            ),
        },
        {
            title: "Số điện thoại",
            dataIndex: "phone",
            key: "phone",
            width: 150,
            render: (phone: string) => (
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <Text copyable>{phone}</Text>
                </div>
            ),
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            width: 260,
            render: (email: string) => (
                <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <Text copyable={email ? true : false}>{email || "-"}</Text>
                </div>
            ),
        },
        {
            title: "Địa chỉ",
            dataIndex: "address",
            key: "address",
            width: 250,
            render: (address: string) => (
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <Text ellipsis={{ tooltip: address }}>{address}</Text>
                </div>
            ),
        },
        {
            title: "Loại khách",
            dataIndex: "customerType",
            key: "customerType",
            width: 120,
            filters: [
                { text: "Cá nhân", value: "individual" },
                { text: "Doanh nghiệp", value: "enterprise" },
            ],
            onFilter: (value: any, record: Customer) =>
                record.customerType === value,
            render: (type?: "individual" | "enterprise") => (
                <Tag color={type === "enterprise" ? "blue" : "default"}>
                    {getCustomerTypeLabel(type)}
                </Tag>
            ),
        },
        {
            title: "Nhóm khách",
            dataIndex: "customerGroup",
            key: "customerGroup",
            width: 150,
            render: (groupCode?: string) => {
                if (!groupCode) return <Text type="secondary">-</Text>;
                const group = customerGroups[groupCode];
                return group ? (
                    <Tag color="cyan">{group.name}</Tag>
                ) : (
                    <Text type="secondary">{groupCode}</Text>
                );
            },
        },
        {
            title: "Nguồn khách",
            dataIndex: "customerSource",
            key: "customerSource",
            width: 150,
            filters: CustomerSourceOptions.map((opt) => ({
                text: opt.label,
                value: opt.value,
            })),
            onFilter: (value: any, record: Customer) =>
                record.customerSource === value,
            render: (source: CustomerSource) => (
                <Tag color={getSourceColor(source)}>
                    {getSourceLabel(source)}
                </Tag>
            ),
        },
        {
            title: "Sale phụ trách",
            dataIndex: "salePerson",
            key: "salePerson",
            width: 150,
            render: (salePersonId?: string) => {
                if (!salePersonId) return <Text type="secondary">-</Text>;
                const member = members.find((m) => m.id === salePersonId);
                return member ? (
                    <Text>{member.name}</Text>
                ) : (
                    <Text type="secondary">{salePersonId}</Text>
                );
            },
        },
        {
            title: "MKT phụ trách",
            dataIndex: "mktPerson",
            key: "mktPerson",
            width: 150,
            render: (mktPersonId?: string) => {
                if (!mktPersonId) return <Text type="secondary">-</Text>;
                const member = members.find((m) => m.id === mktPersonId);
                return member ? (
                    <Text>{member.name}</Text>
                ) : (
                    <Text type="secondary">{mktPersonId}</Text>
                );
            },
        },
        {
            title: "Trực page",
            dataIndex: "pageManager",
            key: "pageManager",
            width: 150,
            render: (pageManager?: string) => (
                <Text>{pageManager || "-"}</Text>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 180,
            filters: LeadStatusOptions.map((opt) => ({
                text: opt.label,
                value: opt.value,
            })),
            onFilter: (value: any, record: Customer) =>
                record.status === value,
            render: (status?: LeadStatus, record?: Customer) => {
                if (!status) return <Text type="secondary">-</Text>;
                
                const reminderInfo = record?.createdAt
                    ? getReminderInfo(record.createdAt, status)
                    : null;

                const colorMap: Record<LeadStatus, string> = {
                    [LeadStatus.Considering]: "blue",
                    [LeadStatus.WaitingForPhotos]: "orange",
                    [LeadStatus.WaitingForVisit]: "cyan",
                    [LeadStatus.WaitingForItems]: "purple",
                    [LeadStatus.NotInterested]: "red",
                    [LeadStatus.Cancel]: "default",
                };

                return (
                    <div className="flex flex-col gap-1">
                        <Tag color={colorMap[status]}>
                            {LeadStatusLabels[status]}
                        </Tag>
                        {reminderInfo && (
                            <Tag
                                color="red"
                                icon={<ExclamationCircleOutlined />}
                                className="animate-pulse"
                            >
                                {reminderInfo.message}
                            </Tag>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 150,
            sorter: (a: Customer, b: Customer) => a.createdAt - b.createdAt,
            render: (date: number) => (
                <Text type="secondary">
                    {new Date(date).toLocaleDateString("vi-VN")}
                </Text>
            ),
        },
        {
            title: "Tin nhắn tự động",
            key: "autoMessage",
            width: 120,
            fixed: "right" as const,
            render: (_: unknown, record: Customer) => {
                const reminderInfo = record?.createdAt && record?.status === LeadStatus.Considering
                    ? getReminderInfo(record.createdAt, record.status)
                    : null;

                if (!reminderInfo || !reminderInfo.autoMessage) {
                    return <Text type="secondary">-</Text>;
                }

                return (
                    <Button
                        size="small"
                        type="link"
                        icon={<CopyOutlined />}
                        onClick={() => {
                            navigator.clipboard.writeText(reminderInfo.autoMessage || "");
                            message.success("Đã sao chép tin nhắn!");
                        }}
                    >
                        Sao chép
                    </Button>
                );
            },
        },
    ];

    // Date presets for quick filter
    const datePresets = getDatePresets();
    const datePresetOptions = datePresets.map((preset) => ({
        label: preset.label,
        value: preset.value,
    }));

    // Filter fields for WrapperContent
    const filterFields: FilterField[] = [
        {
            name: "datePreset",
            label: "Lọc nhanh theo ngày",
            type: "select",
            options: datePresetOptions,
            placeholder: "Chọn khoảng thời gian",
        },
        {
            name: "customerSource",
            label: "Nguồn khách hàng",
            type: "select",
            options: CustomerSourceOptions,
        },
        {
            name: "status",
            label: "Trạng thái",
            type: "select",
            options: LeadStatusOptions,
        },
        {
            name: "salePerson",
            label: "Sale phụ trách",
            type: "select",
            options: [
                { label: "Tất cả", value: "" },
                ...members
                    .filter((m) => m.role === "sales" || m.isActive !== false)
                    .map((member) => ({
                        label: member.name,
                        value: member.id,
                    })),
            ],
            placeholder: "Chọn Sale phụ trách",
        },
        {
            name: "mktPerson",
            label: "MKT phụ trách",
            type: "select",
            options: [
                { label: "Tất cả", value: "" },
                ...members
                    .filter((m) => m.isActive !== false)
                    .map((member) => ({
                        label: member.name,
                        value: member.id,
                    })),
            ],
            placeholder: "Chọn MKT phụ trách",
        },
        {
            name: "pageManager",
            label: "Trực page",
            type: "input",
            placeholder: "Nhập tên người trực page",
        },
    ];

    // Wrapper component for CustomerDetail with handlers
    const CustomerDetailWrapper: React.FC<PropRowDetails<Customer>> = (
        props,
    ) => {
        const handleDeleteWithClose = (customerCode: string) => {
            handleDelete(customerCode, props.onClose);
        };

        return (
            <CustomerDetail
                {...props}
                onEdit={handleOpenModal}
                onDelete={handleDeleteWithClose}
                provinces={provinces}
                customerGroups={customerGroups}
                members={members}
            />
        );
    };

    return (
        <WrapperContent
            title="Lead Khách hàng"
            header={{
                searchInput: {
                    placeholder: "Tìm kiếm theo tên, SĐT, email...",
                    filterKeys: ["name", "phone", "email"],
                },
                filters: {
                    fields: filterFields,
                    query: query,
                    onApplyFilter: (filters) => {
                        filters.forEach(({ key, value }) => {
                            if (key === "datePreset" && value) {
                                // Convert date preset to date range for createdAt
                                const dateRange = getDateRangeByPreset(value as string);
                                if (dateRange) {
                                    updateQuery("createdAt", {
                                        from: dateRange.from,
                                        to: dateRange.to,
                                    });
                                }
                                // Keep datePreset in query for display
                                updateQuery("datePreset", value);
                            } else {
                                updateQuery(key, value);
                            }
                        });
                    },
                    onReset: () => {
                        reset();
                        updateQuery("datePreset", undefined);
                    },
                },
                buttonEnds: [
                    {
                        can: true,
                        name: "Thêm Lead Khách hàng",
                        icon: <PlusOutlined />,
                        type: "primary",
                        onClick: () => handleOpenModal(),
                    },
                ],
            }}
        >
            <div className="space-y-4">
                {/* Toggle Reports Button */}
                <div className="flex justify-end">
                    <Button
                        type="text"
                        icon={showReports ? <UpOutlined /> : <DownOutlined />}
                        onClick={() => setShowReports(!showReports)}
                    >
                        {showReports ? "Ẩn báo cáo" : "Hiện báo cáo"}
                    </Button>
                </div>

                {showReports && (
                    <>
                        <Row gutter={[16, 16]}>
                            {/* Total Statistics - Full Width */}
                            <Col span={24}>
                                <Row gutter={[16, 16]}>
                                    <Col span={8}>
                                        <Card 
                                            size="small" 
                                            style={{ 
                                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                border: "none"
                                            }}
                                        >
                                            <div className="flex items-center justify-center gap-4" style={{ padding: "16px" }}>
                                                <UserOutlined style={{ fontSize: "32px", color: "#fff" }} />
                                                <div className="flex flex-col items-center">
                                                    <Text strong style={{ fontSize: "36px", color: "#fff", lineHeight: 1 }}>{stats.total}</Text>
                                                    <Text style={{ fontSize: "16px", color: "#fff", opacity: 0.9 }}>Tổng số khách hàng</Text>
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card 
                                            size="small" 
                                            style={{ 
                                                background: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                                                border: "none"
                                            }}
                                        >
                                            <div className="flex items-center justify-center gap-4" style={{ padding: "16px" }}>
                                                <DollarOutlined style={{ fontSize: "32px", color: "#fff" }} />
                                                <div className="flex flex-col items-center">
                                                    <Text strong style={{ fontSize: "36px", color: "#fff", lineHeight: 1 }}>
                                                        {Number(stats.totalRevenue || 0).toLocaleString('vi-VN')}
                                                    </Text>
                                                    <Text style={{ fontSize: "16px", color: "#fff", opacity: 0.9 }}>Tổng doanh thu (đ)</Text>
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card 
                                            size="small" 
                                            style={{ 
                                                background: stats.totalDebt > 0 
                                                    ? "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)"
                                                    : "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                                                border: "none"
                                            }}
                                        >
                                            <div className="flex items-center justify-center gap-4" style={{ padding: "16px" }}>
                                                <DollarOutlined style={{ fontSize: "32px", color: "#fff" }} />
                                                <div className="flex flex-col items-center">
                                                    <Text strong style={{ fontSize: "36px", color: "#fff", lineHeight: 1 }}>
                                                        {Number(stats.totalDebt || 0).toLocaleString('vi-VN')}
                                                    </Text>
                                                    <Text style={{ fontSize: "16px", color: "#fff", opacity: 0.9 }}>Tổng công nợ (đ)</Text>
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>
                            </Col>

                            {/* Statistics By Source */}
                            <Col span={24} lg={12}>
                                <Card title="Theo kênh" size="small">
                                    <Row gutter={[8, 8]}>
                                        {CustomerSourceOptions.map((source) => {
                                    const getSourceIcon = () => {
                                        switch (source.value) {
                                            case CustomerSource.Facebook:
                                                return <FacebookOutlined style={{ fontSize: "18px", color: "#1877f2" }} />;
                                            case CustomerSource.Zalo:
                                                return <Text strong style={{ fontSize: "18px", color: "#0068ff" }}>Z</Text>;
                                            case CustomerSource.Website:
                                                return <GlobalOutlined style={{ fontSize: "18px", color: "#52c41a" }} />;
                                            case CustomerSource.Phone:
                                                return <PhoneOutlined style={{ fontSize: "18px", color: "#fa8c16" }} />;
                                            case CustomerSource.WalkIn:
                                                return <ShopOutlined style={{ fontSize: "18px", color: "#faad14" }} />;
                                            case CustomerSource.Referral:
                                                return <TeamOutlined style={{ fontSize: "18px", color: "#fadb14" }} />;
                                            default:
                                                return <UserOutlined style={{ fontSize: "18px" }} />;
                                        }
                                    };
                                    return (
                                        <Col span={6} key={source.value}>
                                            <Card size="small" style={{ padding: "8px", textAlign: "center" }}>
                                                <div className="flex flex-col items-center gap-1">
                                                    {getSourceIcon()}
                                                    <Text strong style={{ fontSize: "20px" }}>{stats.bySource[source.value] || 0}</Text>
                                                    <Text type="secondary" style={{ fontSize: "11px" }}>{source.label}</Text>
                                                </div>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </Card>
                    </Col>

                    {/* Pie Charts: Customer Type and Status */}
                    <Col span={24} lg={12}>
                        <div className="space-y-4">
                            <Card title="Loại khách" size="small">
                                {customerTypeChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={customerTypeChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent = 0 }) =>
                                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                                }
                                                outerRadius={70}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {customerTypeChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center py-8">
                                        <Text type="secondary">Không có dữ liệu</Text>
                                    </div>
                                )}
                            </Card>
                            <Card title="Trạng thái" size="small">
                                {statusChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={statusChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent = 0 }) =>
                                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                                }
                                                outerRadius={70}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {statusChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center py-8">
                                        <Text type="secondary">Không có dữ liệu</Text>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </Col>
                </Row>

                {/* Statistics By Status */}
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Card title="Theo trạng thái" size="small">
                            <Row gutter={[8, 8]}>
                                {LeadStatusOptions.map((status) => {
                                    const getStatusIcon = () => {
                                        switch (status.value) {
                                            case LeadStatus.Considering:
                                                return <ClockCircleOutlined style={{ fontSize: "18px", color: "#1890ff" }} />;
                                            case LeadStatus.NotInterested:
                                            case LeadStatus.Cancel:
                                                return <CloseCircleOutlined style={{ fontSize: "18px", color: "#ff4d4f" }} />;
                                            default:
                                                return <CheckCircleOutlined style={{ fontSize: "18px", color: "#52c41a" }} />;
                                        }
                                    };
                                    const getStatusColor = () => {
                                        switch (status.value) {
                                            case LeadStatus.Considering:
                                                return "#1890ff";
                                            case LeadStatus.NotInterested:
                                            case LeadStatus.Cancel:
                                                return "#ff4d4f";
                                            default:
                                                return "#52c41a";
                                        }
                                    };
                                    return (
                                        <Col span={8} md={4} key={status.value}>
                                            <Card size="small" style={{ padding: "8px", textAlign: "center" }}>
                                                <div className="flex flex-col items-center gap-1">
                                                    {getStatusIcon()}
                                                    <Text strong style={{ fontSize: "20px", color: getStatusColor() }}>{stats.byStatus[status.value] || 0}</Text>
                                                    <Text type="secondary" style={{ fontSize: "11px" }}>{status.label}</Text>
                                                </div>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </Card>
                    </Col>
                </Row>
                    </>
                )}

                <CommonTable
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    DrawerDetails={CustomerDetailWrapper}
                    rowKey="code"
                />
            </div>

            <CustomerFormModal
                open={modalVisible}
                editingCustomer={editingCustomer}
                customerGroups={customerGroups}
                provinces={provinces}
                members={members}
                onCancel={handleCloseModal}
                onSuccess={handleModalSuccess}
            />
        </WrapperContent>
    );
}
