"use client";

import { SupplierService } from "@/services/supplierService";
import { Supplier, SupplierOrder, SupplierPayment } from "@/types/inventory";
import { genCode } from "@/utils/genCode";
import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    DollarOutlined,
    ShoppingOutlined,
} from "@ant-design/icons";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message,
    Tabs,
    Descriptions,
    Popconfirm,
    Upload,
    Image,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useUser, useFirebaseApp } from "@/firebase/provider";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import type { TableColumnsType } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { UploadOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function SupplierManagement() {
    const { user } = useUser();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
    const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
    const [activeTab, setActiveTab] = useState("suppliers");
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null);
    const [supplierForm] = Form.useForm();
    const [orderForm] = Form.useForm();
    const [paymentForm] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [debts, setDebts] = useState<Record<string, number>>({});
    const [qrImageFileList, setQrImageFileList] = useState<UploadFile[]>([]);
    const firebaseApp = useFirebaseApp();

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [suppliersData, ordersData, paymentsData] = await Promise.all([
                    SupplierService.getAllSuppliers(),
                    SupplierService.getAllOrders(),
                    SupplierService.getAllPayments(),
                ]);
                setSuppliers(suppliersData);
                setSupplierOrders(ordersData);
                setSupplierPayments(paymentsData);

                // Calculate debts
                const debtsMap: Record<string, number> = {};
                for (const supplier of suppliersData) {
                    debtsMap[supplier.id] = await SupplierService.calculateDebt(supplier.id);
                }
                setDebts(debtsMap);
            } catch (error) {
                console.error("Error loading supplier data:", error);
                message.error("Không thể tải dữ liệu");
            } finally {
                setLoading(false);
            }
        };

        loadData();

        const unsubscribeSuppliers = SupplierService.onSuppliersSnapshot((data) => {
            setSuppliers(data);
        });

        const unsubscribeOrders = SupplierService.onOrdersSnapshot((data) => {
            setSupplierOrders(data);
        });

        const unsubscribePayments = SupplierService.onPaymentsSnapshot((data) => {
            setSupplierPayments(data);
        });

        return () => {
            unsubscribeSuppliers();
            unsubscribeOrders();
            unsubscribePayments();
        };
    }, []);

    // Supplier columns
    const supplierColumns: TableColumnsType<Supplier> = [
        {
            title: "Mã NCC",
            dataIndex: "code",
            key: "code",
            width: 120,
            fixed: "left",
        },
        {
            title: "Tên NCC",
            dataIndex: "name",
            key: "name",
            width: 200,
        },
        {
            title: "Người liên hệ",
            dataIndex: "contactPerson",
            key: "contactPerson",
            width: 150,
        },
        {
            title: "Số điện thoại",
            dataIndex: "phone",
            key: "phone",
            width: 120,
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            width: 180,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 100,
            render: (status: string) => (
                <Tag color={status === "active" ? "green" : "default"}>
                    {status === "active" ? "Hoạt động" : "Ngừng hoạt động"}
                </Tag>
            ),
        },
        {
            title: "Công nợ",
            key: "debt",
            width: 150,
            render: (_: any, record: Supplier) => {
                const debt = debts[record.id] || 0;
                return (
                    <Text strong style={{ color: debt > 0 ? "#ff4d4f" : "#52c41a" }}>
                        {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                        }).format(debt)}
                    </Text>
                );
            },
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 150,
            fixed: "right",
            render: (_: any, record: Supplier) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setSelectedSupplier(record);
                            supplierForm.setFieldsValue(record);
                            if (record.paymentQR) {
                                setQrImageFileList([{
                                    uid: '-1',
                                    name: 'qr.png',
                                    status: 'done',
                                    url: record.paymentQR,
                                }]);
                            } else {
                                setQrImageFileList([]);
                            }
                            setIsSupplierModalOpen(true);
                        }}
                    />
                    <Popconfirm
                        title="Xác nhận xóa"
                        description="Bạn có chắc chắn muốn xóa NCC này?"
                        onConfirm={async () => {
                            try {
                                await SupplierService.deleteSupplier(record.id);
                                message.success("Xóa NCC thành công");
                            } catch (error) {
                                message.error("Không thể xóa NCC");
                            }
                        }}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Order columns
    const orderColumns: TableColumnsType<SupplierOrder> = [
        {
            title: "Mã đơn hàng",
            dataIndex: "code",
            key: "code",
            width: 150,
            fixed: "left",
        },
        {
            title: "NCC",
            dataIndex: "supplierName",
            key: "supplierName",
            width: 200,
        },
        {
            title: "Ngày đặt",
            dataIndex: "orderDate",
            key: "orderDate",
            width: 120,
            render: (date: number) => dayjs(date).format("DD/MM/YYYY"),
        },
        {
            title: "Ngày giao",
            dataIndex: "deliveryDate",
            key: "deliveryDate",
            width: 120,
            render: (date?: number) => date ? dayjs(date).format("DD/MM/YYYY") : "-",
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalAmount",
            key: "totalAmount",
            width: 150,
            render: (amount: number) =>
                new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                }).format(amount),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status: string) => {
                const statusMap: Record<string, { color: string; label: string }> = {
                    pending: { color: "default", label: "Chờ xử lý" },
                    ordered: { color: "blue", label: "Đã đặt" },
                    delivered: { color: "orange", label: "Đã giao" },
                    completed: { color: "green", label: "Hoàn thành" },
                    cancelled: { color: "red", label: "Đã hủy" },
                };
                const statusInfo = statusMap[status] || { color: "default", label: status };
                return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
            },
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 100,
            fixed: "right",
            render: (_: any, record: SupplierOrder) => (
                <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                        setSelectedOrder(record);
                        orderForm.setFieldsValue({
                            ...record,
                            orderDate: dayjs(record.orderDate),
                            deliveryDate: record.deliveryDate ? dayjs(record.deliveryDate) : undefined,
                        });
                        setIsOrderModalOpen(true);
                    }}
                />
            ),
        },
    ];

    // Payment columns
    const paymentColumns: TableColumnsType<SupplierPayment> = [
        {
            title: "Mã thanh toán",
            dataIndex: "code",
            key: "code",
            width: 150,
            fixed: "left",
        },
        {
            title: "NCC",
            dataIndex: "supplierName",
            key: "supplierName",
            width: 200,
        },
        {
            title: "Mã đơn hàng",
            dataIndex: "orderCode",
            key: "orderCode",
            width: 150,
        },
        {
            title: "Số tiền",
            dataIndex: "amount",
            key: "amount",
            width: 150,
            render: (amount: number) =>
                new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                }).format(amount),
        },
        {
            title: "Ngày thanh toán",
            dataIndex: "paymentDate",
            key: "paymentDate",
            width: 120,
            render: (date: number) => dayjs(date).format("DD/MM/YYYY"),
        },
        {
            title: "Phương thức",
            dataIndex: "paymentMethod",
            key: "paymentMethod",
            width: 120,
            render: (method?: string) => {
                const methodMap: Record<string, string> = {
                    cash: "Tiền mặt",
                    bank_transfer: "Chuyển khoản",
                    check: "Séc",
                    other: "Khác",
                };
                return methodMap[method || "other"] || "Khác";
            },
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 100,
            fixed: "right",
            render: (_: any, record: SupplierPayment) => (
                <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                        paymentForm.setFieldsValue({
                            ...record,
                            paymentDate: dayjs(record.paymentDate),
                        });
                        setIsPaymentModalOpen(true);
                    }}
                />
            ),
        },
    ];

    // Handlers
    const handleSupplierSubmit = async () => {
        try {
            const values = await supplierForm.validateFields();
            if (selectedSupplier) {
                await SupplierService.updateSupplier(selectedSupplier.id, values);
                message.success("Cập nhật NCC thành công");
            } else {
                await SupplierService.createSupplier(values);
                message.success("Tạo NCC thành công");
            }
            setIsSupplierModalOpen(false);
            setSelectedSupplier(null);
            supplierForm.resetFields();
        } catch (error) {
            console.error("Error saving supplier:", error);
            message.error("Không thể lưu NCC");
        }
    };

    const handleOrderSubmit = async () => {
        try {
            const values = await orderForm.validateFields();
            const items = values.items || [];
            const totalAmount = items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
            
            if (selectedOrder) {
                await SupplierService.updateOrder(selectedOrder.id, {
                    ...values,
                    orderDate: values.orderDate.valueOf(),
                    deliveryDate: values.deliveryDate?.valueOf(),
                    totalAmount,
                });
                message.success("Cập nhật đơn hàng thành công");
            } else {
                const supplier = suppliers.find(s => s.id === values.supplierId);
                await SupplierService.createOrder({
                    ...values,
                    supplierId: values.supplierId,
                    supplierName: supplier?.name || "",
                    items,
                    orderDate: values.orderDate.valueOf(),
                    deliveryDate: values.deliveryDate?.valueOf(),
                    totalAmount,
                    createdBy: user?.uid || "",
                    createdByName: user?.displayName || user?.email || "",
                });
                message.success("Tạo đơn hàng thành công");
            }
            setIsOrderModalOpen(false);
            setSelectedOrder(null);
            orderForm.resetFields();
        } catch (error) {
            console.error("Error saving order:", error);
            message.error("Không thể lưu đơn hàng");
        }
    };

    const handlePaymentSubmit = async () => {
        try {
            const values = await paymentForm.validateFields();
            const supplier = suppliers.find(s => s.id === values.supplierId);
            
            await SupplierService.createPayment({
                ...values,
                supplierId: values.supplierId,
                supplierName: supplier?.name || "",
                paymentDate: values.paymentDate.valueOf(),
                createdBy: user?.uid || "",
                createdByName: user?.displayName || user?.email || "",
            });
            message.success("Tạo thanh toán thành công");
            setIsPaymentModalOpen(false);
            paymentForm.resetFields();
        } catch (error) {
            console.error("Error saving payment:", error);
            message.error("Không thể lưu thanh toán");
        }
    };

    return (
        <div>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: "suppliers",
                        label: "Danh mục NCC",
                        children: (
                            <div>
                                <div style={{ marginBottom: 16 }}>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => {
                                            setSelectedSupplier(null);
                                            supplierForm.resetFields();
                                            setIsSupplierModalOpen(true);
                                        }}
                                    >
                                        Thêm NCC
                                    </Button>
                                </div>
                                <Table
                                    columns={supplierColumns}
                                    dataSource={suppliers}
                                    loading={loading}
                                    rowKey="id"
                                    pagination={{ pageSize: 10 }}
                                    scroll={{ x: 1200 }}
                                />
                            </div>
                        ),
                    },
                    {
                        key: "orders",
                        label: "Lịch sử đơn hàng",
                        children: (
                            <div>
                                <div style={{ marginBottom: 16 }}>
                                    <Button
                                        type="primary"
                                        icon={<ShoppingOutlined />}
                                        onClick={() => {
                                            setSelectedOrder(null);
                                            orderForm.resetFields();
                                            orderForm.setFieldsValue({
                                                orderDate: dayjs(),
                                                items: [{ materialId: "", materialName: "", quantity: 0, unit: "", unitPrice: 0, totalPrice: 0 }],
                                            });
                                            setIsOrderModalOpen(true);
                                        }}
                                    >
                                        Tạo đơn hàng
                                    </Button>
                                </div>
                                <Table
                                    columns={orderColumns}
                                    dataSource={supplierOrders}
                                    loading={loading}
                                    rowKey="id"
                                    pagination={{ pageSize: 10 }}
                                    scroll={{ x: 1200 }}
                                />
                            </div>
                        ),
                    },
                    {
                        key: "payments",
                        label: "Lịch sử thanh toán",
                        children: (
                            <div>
                                <div style={{ marginBottom: 16 }}>
                                    <Button
                                        type="primary"
                                        icon={<DollarOutlined />}
                                        onClick={() => {
                                            paymentForm.resetFields();
                                            paymentForm.setFieldsValue({
                                                paymentDate: dayjs(),
                                            });
                                            setIsPaymentModalOpen(true);
                                        }}
                                    >
                                        Thêm thanh toán
                                    </Button>
                                </div>
                                <Table
                                    columns={paymentColumns}
                                    dataSource={supplierPayments}
                                    loading={loading}
                                    rowKey="id"
                                    pagination={{ pageSize: 10 }}
                                    scroll={{ x: 1200 }}
                                />
                            </div>
                        ),
                    },
                    {
                        key: "debts",
                        label: "Công nợ",
                        children: (
                            <Table
                                columns={[
                                    {
                                        title: "Mã NCC",
                                        dataIndex: "code",
                                        key: "code",
                                        width: 120,
                                    },
                                    {
                                        title: "Tên NCC",
                                        dataIndex: "name",
                                        key: "name",
                                        width: 200,
                                    },
                                    {
                                        title: "Số điện thoại",
                                        dataIndex: "phone",
                                        key: "phone",
                                        width: 120,
                                    },
                                    {
                                        title: "Công nợ",
                                        key: "debt",
                                        width: 150,
                                        render: (_: any, record: Supplier) => {
                                            const debt = debts[record.id] || 0;
                                            return (
                                                <Text strong style={{ color: debt > 0 ? "#ff4d4f" : "#52c41a" }}>
                                                    {new Intl.NumberFormat("vi-VN", {
                                                        style: "currency",
                                                        currency: "VND",
                                                    }).format(debt)}
                                                </Text>
                                            );
                                        },
                                    },
                                ]}
                                dataSource={suppliers}
                                loading={loading}
                                rowKey="id"
                                pagination={{ pageSize: 10 }}
                            />
                        ),
                    },
                ]}
            />

            {/* Supplier Modal */}
            <Modal
                title={selectedSupplier ? "Chỉnh sửa NCC" : "Thêm NCC mới"}
                open={isSupplierModalOpen}
                onOk={handleSupplierSubmit}
                onCancel={() => {
                    setIsSupplierModalOpen(false);
                    setSelectedSupplier(null);
                    supplierForm.resetFields();
                    setQrImageFileList([]);
                }}
                width={900}
            >
                <Form form={supplierForm} layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="name" label="Tên NCC" rules={[{ required: true, message: "Vui lòng nhập tên NCC" }]}>
                                <Input placeholder="Nhập tên NCC" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="contactPerson" label="Người liên hệ">
                                <Input placeholder="Nhập tên người liên hệ" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="phone" label="Số điện thoại">
                                <Input placeholder="Nhập số điện thoại" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="address" label="Địa chỉ">
                                <Input.TextArea placeholder="Nhập địa chỉ" rows={2} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="bankAccount" label="Số tài khoản">
                                <Input placeholder="Nhập số tài khoản" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="bankName" label="Tên ngân hàng">
                                <Input placeholder="Nhập tên ngân hàng" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="status" label="Trạng thái" initialValue="active">
                                <Select>
                                    <Select.Option value="active">Hoạt động</Select.Option>
                                    <Select.Option value="inactive">Ngừng hoạt động</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item name="paymentQR" label="QR thanh toán">
                                <Upload
                                    listType="picture-card"
                                    fileList={qrImageFileList}
                                    onChange={({ fileList }) => setQrImageFileList(fileList)}
                                    beforeUpload={() => false}
                                    maxCount={1}
                                    accept="image/*"
                                >
                                    {qrImageFileList.length < 1 && (
                                        <div>
                                            <UploadOutlined />
                                            <div style={{ marginTop: 8 }}>Upload</div>
                                        </div>
                                    )}
                                </Upload>
                                {selectedSupplier?.paymentQR && qrImageFileList.length === 0 && (
                                    <Image
                                        src={selectedSupplier.paymentQR}
                                        alt="QR thanh toán"
                                        width={100}
                                        height={100}
                                        style={{ marginTop: 8 }}
                                        preview
                                    />
                                )}
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="notes" label="Ghi chú">
                                <Input.TextArea placeholder="Nhập ghi chú" rows={3} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Order Modal - Simplified for now */}
            <Modal
                title={selectedOrder ? "Chỉnh sửa đơn hàng" : "Tạo đơn hàng mới"}
                open={isOrderModalOpen}
                onOk={handleOrderSubmit}
                onCancel={() => {
                    setIsOrderModalOpen(false);
                    setSelectedOrder(null);
                    orderForm.resetFields();
                }}
                width={800}
            >
                <Form form={orderForm} layout="vertical">
                    <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true, message: "Vui lòng chọn NCC" }]}>
                        <Select placeholder="Chọn NCC">
                            {suppliers.map(s => (
                                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="orderDate" label="Ngày đặt hàng" rules={[{ required: true }]}>
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="deliveryDate" label="Ngày giao hàng dự kiến">
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="notes" label="Ghi chú">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Payment Modal */}
            <Modal
                title="Thêm thanh toán"
                open={isPaymentModalOpen}
                onOk={handlePaymentSubmit}
                onCancel={() => {
                    setIsPaymentModalOpen(false);
                    paymentForm.resetFields();
                }}
                width={600}
            >
                <Form form={paymentForm} layout="vertical">
                    <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true, message: "Vui lòng chọn NCC" }]}>
                        <Select placeholder="Chọn NCC">
                            {suppliers.map(s => (
                                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="orderCode" label="Mã đơn hàng">
                        <Input placeholder="Nhập mã đơn hàng (nếu có)" />
                    </Form.Item>
                    <Form.Item name="amount" label="Số tiền" rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}>
                        <InputNumber
                            style={{ width: "100%" }}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => Number(value?.replace(/,/g, '') || 0) as any}
                            min={0}
                        />
                    </Form.Item>
                    <Form.Item name="paymentDate" label="Ngày thanh toán" rules={[{ required: true }]}>
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="paymentMethod" label="Phương thức thanh toán">
                        <Select>
                            <Select.Option value="cash">Tiền mặt</Select.Option>
                            <Select.Option value="bank_transfer">Chuyển khoản</Select.Option>
                            <Select.Option value="check">Séc</Select.Option>
                            <Select.Option value="other">Khác</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="notes" label="Ghi chú">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

