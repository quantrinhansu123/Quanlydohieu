"use client";

import { genCode } from "@/utils/genCode";
import { PurchaseRequest, PurchaseRequestItem, Material } from "@/types/inventory";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import { useUser } from "@/firebase/provider";
import { useFirebaseApp } from "@/firebase/provider";
import { getDatabase, ref, set, update } from "firebase/database";
import { InventoryService } from "@/services/inventoryService";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import {
    Button,
    Card,
    Table,
    Tag,
    Space,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Upload,
    message,
    Typography,
    Descriptions,
    Image,
    Row,
    Col,
    Statistic,
} from "antd";
import {
    PlusOutlined,
    CheckOutlined,
    CloseOutlined,
    DollarOutlined,
    UploadOutlined,
    EyeOutlined,
    InboxOutlined,
} from "@ant-design/icons";
import { useState, useMemo } from "react";
import dayjs from "dayjs";
import type { UploadFile } from "antd/es/upload/interface";
import { getBase64 } from "@/utils/getBase64";

const { Text } = Typography;

interface PurchaseRequestManagementProps {
    materials: Material[];
}

export default function PurchaseRequestManagement({ materials }: PurchaseRequestManagementProps) {
    const { user } = useUser();
    const firebaseApp = useFirebaseApp();
    const { data: purchaseRequestsData } = useRealtimeList<PurchaseRequest>("xoxo/purchase_requests");
    
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
    const [createForm] = Form.useForm();
    const [approveForm] = Form.useForm();
    const [paymentForm] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const purchaseRequests = useMemo(() => {
        return (purchaseRequestsData || []).sort((a, b) => b.createdAt - a.createdAt);
    }, [purchaseRequestsData]);

    const handleCreateRequest = async (values: any) => {
        try {
            setLoading(true);
            const database = getDatabase(firebaseApp);
            const requestId = genCode("PR_");
            const now = Date.now();

            const items: PurchaseRequestItem[] = values.items.map((item: any) => ({
                materialId: item.materialId,
                materialName: materials.find(m => m.id === item.materialId)?.name || "",
                quantity: item.quantity,
                unit: item.unit,
                suggestedPrice: item.suggestedPrice || 0,
                totalPrice: (item.suggestedPrice || 0) * item.quantity,
                note: item.note,
            }));

            const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

            const purchaseRequest: PurchaseRequest = {
                id: requestId,
                code: requestId,
                items,
                totalAmount,
                status: "pending",
                requestedBy: user?.uid || "",
                requestedByName: user?.displayName || "",
                requestedAt: now,
                createdAt: now,
                updatedAt: now,
            };

            await set(ref(database, `xoxo/purchase_requests/${requestId}`), purchaseRequest);
            message.success("Tạo phiếu đề xuất mua thành công!");
            setCreateModalVisible(false);
            createForm.resetFields();
        } catch (error) {
            console.error("Error creating purchase request:", error);
            message.error("Không thể tạo phiếu đề xuất mua!");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string, approved: boolean, reason?: string) => {
        try {
            setLoading(true);
            const database = getDatabase(firebaseApp);
            const now = Date.now();

            const request = purchaseRequests.find(r => r.id === requestId);
            
            const updates: any = {
                status: approved ? "approved" : "rejected",
                approvedBy: user?.uid || "",
                approvedByName: user?.displayName || "",
                approvedAt: now,
                updatedAt: now,
            };

            if (!approved && reason) {
                updates.rejectedReason = reason;
            }

            await update(ref(database, `xoxo/purchase_requests/${requestId}`), updates);
            message.success(approved ? "Đã duyệt phiếu đề xuất mua!" : "Đã từ chối phiếu đề xuất mua!");
            
            setApproveModalVisible(false);
            setSelectedRequest(null);
            approveForm.resetFields();
        } catch (error) {
            console.error("Error approving purchase request:", error);
            message.error("Không thể cập nhật phiếu đề xuất mua!");
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (values: any) => {
        try {
            setLoading(true);
            const database = getDatabase(firebaseApp);
            const storage = getStorage(firebaseApp);
            const now = Date.now();

            if (!selectedRequest) {
                message.error("Không tìm thấy phiếu đề xuất mua!");
                return;
            }

            // Upload images
            const imageUrls: string[] = [];
            if (values.images && values.images.length > 0) {
                for (const file of values.images) {
                    if (file.originFileObj) {
                        const imageRef = storageRef(storage, `purchase_requests/${selectedRequest.id}/${Date.now()}_${file.name}`);
                        await uploadBytes(imageRef, file.originFileObj);
                        const url = await getDownloadURL(imageRef);
                        imageUrls.push(url);
                    } else if (file.url) {
                        imageUrls.push(file.url);
                    }
                }
            }

            const paidAmount = values.amount || selectedRequest.totalAmount || 0;
            
            const updates: any = {
                status: "paid",
                paymentImages: imageUrls,
                paymentNote: values.note || "",
                paidAmount: paidAmount,
                paidBy: user?.uid || "",
                paidByName: user?.displayName || "",
                paidAt: now,
                updatedAt: now,
            };

            await update(ref(database, `xoxo/purchase_requests/${selectedRequest.id}`), updates);
            
            // Sau khi thanh toán, tự động nhập kho và lịch sử
            // Tính giá thực tế cho mỗi item dựa trên tỷ lệ số tiền thanh toán
            const totalSuggestedAmount = selectedRequest.totalAmount || 0;
            const priceRatio = totalSuggestedAmount > 0 ? paidAmount / totalSuggestedAmount : 1;
            
            for (const item of selectedRequest.items) {
                // Tính giá thực tế và tổng tiền dựa trên số tiền đã thanh toán
                const actualPrice = (item.suggestedPrice || 0) * priceRatio;
                const actualTotalAmount = (item.totalPrice || 0) * priceRatio;
                
                // Tạo transaction nhập kho trong lịch sử
                await InventoryService.createTransaction({
                    materialId: item.materialId,
                    materialName: item.materialName,
                    type: "import",
                    quantity: item.quantity,
                    unit: item.unit,
                    price: actualPrice,
                    totalAmount: actualTotalAmount,
                    date: dayjs(now).format("YYYY-MM-DD"),
                    supplier: "Nhà cung cấp",
                    note: `Nhập kho từ phiếu đề xuất mua đã thanh toán: ${selectedRequest.code} (Số tiền: ${paidAmount.toLocaleString('vi-VN')} VNĐ)`,
                    images: imageUrls, // Thêm ảnh minh chứng thanh toán vào transaction
                    createdBy: user?.uid || "",
                });
            }

            message.success("Đã cập nhật thanh toán và tự động nhập kho vào lịch sử!");
            setPaymentModalVisible(false);
            setSelectedRequest(null);
            paymentForm.resetFields();
        } catch (error) {
            console.error("Error updating payment:", error);
            message.error("Không thể cập nhật thanh toán!");
        } finally {
            setLoading(false);
        }
    };

    const handleImportToInventory = async () => {
        if (!selectedRequest || !user) return;

        try {
            setLoading(true);
            const database = getDatabase(firebaseApp);
            const now = Date.now();

            // Tạo transaction nhập kho cho từng item trong phiếu
            for (const item of selectedRequest.items) {
                await InventoryService.createTransaction({
                    materialId: item.materialId,
                    materialName: item.materialName,
                    type: "import",
                    quantity: item.quantity,
                    unit: item.unit,
                    price: item.suggestedPrice || 0,
                    totalAmount: item.totalPrice || 0,
                    date: dayjs(now).format("YYYY-MM-DD"),
                    supplier: "Nhà cung cấp",
                    note: `Nhập kho từ phiếu đề xuất mua: ${selectedRequest.code}`,
                    createdBy: user.uid,
                });
            }

            // Cập nhật trạng thái phiếu (có thể thêm trạng thái "imported" nếu cần)
            await update(ref(database, `xoxo/purchase_requests/${selectedRequest.id}`), {
                updatedAt: now,
            });

            message.success("Đã duyệt nhập kho thành công! Đã tạo transaction nhập kho cho tất cả vật liệu.");
            setImportModalVisible(false);
            setSelectedRequest(null);
        } catch (error) {
            console.error("Error importing to inventory:", error);
            message.error("Không thể duyệt nhập kho!");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "orange";
            case "approved":
                return "blue";
            case "rejected":
                return "red";
            case "paid":
                return "green";
            default:
                return "default";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "pending":
                return "Chờ duyệt";
            case "approved":
                return "Đã duyệt";
            case "rejected":
                return "Từ chối";
            case "paid":
                return "Đã thanh toán";
            default:
                return status;
        }
    };

    const columns = [
        {
            title: "Người đề xuất",
            dataIndex: "requestedByName",
            key: "requestedByName",
        },
        {
            title: "Ngày đề xuất",
            dataIndex: "requestedAt",
            key: "requestedAt",
            render: (date: number) => dayjs(date).format("DD/MM/YYYY HH:mm"),
        },
        {
            title: "Số sản phẩm",
            key: "itemCount",
            render: (_: any, record: PurchaseRequest) => record.items.length,
        },
        {
            title: "Tổng giá trị",
            dataIndex: "totalAmount",
            key: "totalAmount",
            render: (amount: number, record: PurchaseRequest) => (
                <Space direction="vertical" size={0} style={{ textAlign: "right" }}>
                    <Text>{Number(amount).toLocaleString('vi-VN')} đ</Text>
                    {record.paidAmount && record.paidAmount !== amount && (
                        <Text type="success" style={{ fontSize: 12 }}>
                            Đã thanh toán: {Number(record.paidAmount).toLocaleString('vi-VN')} đ
                        </Text>
                    )}
                </Space>
            ),
            align: "right" as const,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status: string, record: PurchaseRequest) => (
                <Space direction="vertical" size="small">
                    <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
                    {status === "rejected" && record.rejectedReason && (
                        <Text type="danger" style={{ fontSize: 12, display: "block" }}>
                            Lý do: {record.rejectedReason}
                        </Text>
                    )}
                </Space>
            ),
        },
        {
            title: "Thao tác",
            key: "action",
            render: (_: any, record: PurchaseRequest) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedRequest(record);
                            setViewModalVisible(true);
                        }}
                    >
                        Xem
                    </Button>
                    {record.status === "pending" && (
                        <>
                            <Button
                                type="link"
                                icon={<CheckOutlined />}
                                onClick={() => {
                                    setSelectedRequest(record);
                                    setApproveModalVisible(true);
                                }}
                            >
                                Duyệt
                            </Button>
                        </>
                    )}
                    {record.status === "approved" && (
                        <>
                            <Button
                                type="link"
                                icon={<InboxOutlined />}
                                onClick={() => {
                                    setSelectedRequest(record);
                                    setImportModalVisible(true);
                                }}
                            >
                                Duyệt nhập kho
                            </Button>
                            <Button
                                type="link"
                                icon={<DollarOutlined />}
                                onClick={() => {
                                    setSelectedRequest(record);
                                    paymentForm.setFieldsValue({
                                        amount: record.totalAmount,
                                    });
                                    setPaymentModalVisible(true);
                                }}
                            >
                                Thanh toán
                            </Button>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card
                title="Phiếu đề xuất mua"
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalVisible(true)}
                    >
                        Tạo phiếu đề xuất
                    </Button>
                }
            >
                <Table
                    dataSource={purchaseRequests}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* Create Modal */}
            <Modal
                title="Tạo phiếu đề xuất mua"
                open={createModalVisible}
                onCancel={() => {
                    setCreateModalVisible(false);
                    createForm.resetFields();
                }}
                footer={null}
                width={800}
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreateRequest}
                >
                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Card key={key} style={{ marginBottom: 16 }}>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "materialId"]}
                                                    label="Sản phẩm"
                                                    rules={[{ required: true, message: "Vui lòng chọn sản phẩm" }]}
                                                >
                                                    <Select placeholder="Chọn sản phẩm">
                                                        {materials.map((material) => (
                                                            <Select.Option key={material.id} value={material.id}>
                                                                {material.name}
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "quantity"]}
                                                    label="Số lượng"
                                                    rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
                                                >
                                                    <InputNumber min={1} style={{ width: "100%" }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "unit"]}
                                                    label="Đơn vị"
                                                >
                                                    <Input placeholder="Đơn vị" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "suggestedPrice"]}
                                                    label="Giá đề xuất (đ)"
                                                >
                                                    <InputNumber min={0} style={{ width: "100%" }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "note"]}
                                                    label="Ghi chú"
                                                >
                                                    <Input placeholder="Ghi chú" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Button
                                            type="link"
                                            danger
                                            onClick={() => remove(name)}
                                        >
                                            Xóa
                                        </Button>
                                    </Card>
                                ))}
                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        block
                                        icon={<PlusOutlined />}
                                    >
                                        Thêm sản phẩm
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Tạo phiếu
                            </Button>
                            <Button onClick={() => {
                                setCreateModalVisible(false);
                                createForm.resetFields();
                            }}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Approve Modal */}
            <Modal
                title="Duyệt phiếu đề xuất mua"
                open={approveModalVisible}
                onCancel={() => {
                    setApproveModalVisible(false);
                    setSelectedRequest(null);
                    approveForm.resetFields();
                }}
                footer={null}
                width={600}
            >
                {selectedRequest && (
                    <div>
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Mã phiếu">{selectedRequest.code}</Descriptions.Item>
                            <Descriptions.Item label="Người đề xuất">{selectedRequest.requestedByName}</Descriptions.Item>
                            <Descriptions.Item label="Tổng giá trị">
                                {Number(selectedRequest.totalAmount).toLocaleString('vi-VN')} đ
                            </Descriptions.Item>
                        </Descriptions>
                        <Form
                            form={approveForm}
                            layout="vertical"
                            onFinish={(values) => {
                                handleApprove(selectedRequest.id, values.approved, values.reason);
                            }}
                        >
                            <Form.Item
                                name="approved"
                                label="Quyết định"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Select.Option value={true}>Duyệt</Select.Option>
                                    <Select.Option value={false}>Từ chối</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, currentValues) =>
                                    prevValues.approved !== currentValues.approved
                                }
                            >
                                {({ getFieldValue }) =>
                                    getFieldValue("approved") === false ? (
                                        <Form.Item
                                            name="reason"
                                            label="Lý do từ chối"
                                            rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
                                        >
                                            <Input.TextArea rows={4} />
                                        </Form.Item>
                                    ) : null
                                }
                            </Form.Item>
                            <Form.Item>
                                <Space>
                                    <Button type="primary" htmlType="submit" loading={loading}>
                                        Xác nhận
                                    </Button>
                                    <Button onClick={() => {
                                        setApproveModalVisible(false);
                                        setSelectedRequest(null);
                                        approveForm.resetFields();
                                    }}>
                                        Hủy
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>

            {/* Payment Modal */}
            <Modal
                title="Thanh toán"
                open={paymentModalVisible}
                onCancel={() => {
                    setPaymentModalVisible(false);
                    setSelectedRequest(null);
                    paymentForm.resetFields();
                }}
                footer={null}
                width={600}
            >
                {selectedRequest && (
                    <Form
                        form={paymentForm}
                        layout="vertical"
                        onFinish={handlePayment}
                    >
                        <Form.Item
                            name="amount"
                            label="Số tiền thanh toán"
                            rules={[{ required: true, message: "Vui lòng nhập số tiền thanh toán" }]}
                            initialValue={selectedRequest.totalAmount}
                        >
                            <InputNumber
                                placeholder="Nhập số tiền"
                                style={{ width: "100%" }}
                                formatter={(value) =>
                                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                }
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                                min={0}
                                addonAfter="VNĐ"
                            />
                        </Form.Item>
                        <Form.Item
                            name="images"
                            label="Ảnh minh chứng"
                            rules={[{ required: true, message: "Vui lòng upload ít nhất 1 ảnh" }]}
                        >
                            <Upload
                                listType="picture-card"
                                multiple
                                beforeUpload={() => false}
                            >
                                <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            </Upload>
                        </Form.Item>
                        <Form.Item
                            name="note"
                            label="Ghi chú"
                        >
                            <Input.TextArea rows={4} placeholder="Ghi chú thanh toán" />
                        </Form.Item>
                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Xác nhận thanh toán
                                </Button>
                                <Button onClick={() => {
                                    setPaymentModalVisible(false);
                                    setSelectedRequest(null);
                                    paymentForm.resetFields();
                                }}>
                                    Hủy
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                )}
            </Modal>

            {/* View Modal */}
            <Modal
                title="Chi tiết phiếu đề xuất mua"
                open={viewModalVisible}
                onCancel={() => {
                    setViewModalVisible(false);
                    setSelectedRequest(null);
                }}
                footer={null}
                width={800}
            >
                {selectedRequest && (
                    <div>
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="Mã phiếu">{selectedRequest.code}</Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={getStatusColor(selectedRequest.status)}>
                                    {getStatusLabel(selectedRequest.status)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Người đề xuất">{selectedRequest.requestedByName}</Descriptions.Item>
                            <Descriptions.Item label="Ngày đề xuất">
                                {dayjs(selectedRequest.requestedAt).format("DD/MM/YYYY HH:mm")}
                            </Descriptions.Item>
                            {selectedRequest.approvedByName && (
                                <>
                                    <Descriptions.Item label="Người duyệt">{selectedRequest.approvedByName}</Descriptions.Item>
                                    <Descriptions.Item label="Ngày duyệt">
                                        {selectedRequest.approvedAt ? dayjs(selectedRequest.approvedAt).format("DD/MM/YYYY HH:mm") : "-"}
                                    </Descriptions.Item>
                                </>
                            )}
                            {selectedRequest.status === "rejected" && selectedRequest.rejectedReason && (
                                <Descriptions.Item label="Lý do từ chối" span={2}>
                                    <Text type="danger">{selectedRequest.rejectedReason}</Text>
                                </Descriptions.Item>
                            )}
                            {selectedRequest.paidByName && (
                                <>
                                    <Descriptions.Item label="Người thanh toán">{selectedRequest.paidByName}</Descriptions.Item>
                                    <Descriptions.Item label="Ngày thanh toán">
                                        {selectedRequest.paidAt ? dayjs(selectedRequest.paidAt).format("DD/MM/YYYY HH:mm") : "-"}
                                    </Descriptions.Item>
                                </>
                            )}
                            <Descriptions.Item label="Tổng giá trị" span={2}>
                                <Space direction="vertical" size={0}>
                                    <Text strong>{Number(selectedRequest.totalAmount).toLocaleString('vi-VN')} đ</Text>
                                    {selectedRequest.paidAmount && (
                                        <Text type="success" style={{ fontSize: 14 }}>
                                            Đã thanh toán: {Number(selectedRequest.paidAmount).toLocaleString('vi-VN')} đ
                                        </Text>
                                    )}
                                </Space>
                            </Descriptions.Item>
                        </Descriptions>
                        <Card title="Danh sách sản phẩm" style={{ marginTop: 16 }}>
                            <Table
                                dataSource={selectedRequest.items}
                                columns={[
                                    { title: "Tên sản phẩm", dataIndex: "materialName", key: "materialName" },
                                    { title: "Số lượng", dataIndex: "quantity", key: "quantity" },
                                    { title: "Đơn vị", dataIndex: "unit", key: "unit" },
                                    { 
                                        title: "Giá đề xuất", 
                                        dataIndex: "suggestedPrice", 
                                        key: "suggestedPrice",
                                        render: (price: number) => price ? `${Number(price).toLocaleString('vi-VN')} đ` : "-"
                                    },
                                    { 
                                        title: "Tổng giá", 
                                        dataIndex: "totalPrice", 
                                        key: "totalPrice",
                                        render: (price: number) => price ? `${Number(price).toLocaleString('vi-VN')} đ` : "-"
                                    },
                                    { title: "Ghi chú", dataIndex: "note", key: "note" },
                                ]}
                                rowKey={(record, index) => `${record.materialId}-${index}`}
                                pagination={false}
                                size="small"
                            />
                        </Card>
                        {selectedRequest.paymentImages && selectedRequest.paymentImages.length > 0 && (
                            <Card title="Ảnh minh chứng thanh toán" style={{ marginTop: 16 }}>
                                <Image.PreviewGroup>
                                    {selectedRequest.paymentImages.map((url, index) => (
                                        <Image key={index} src={url} width={100} style={{ marginRight: 8, marginBottom: 8 }} />
                                    ))}
                                </Image.PreviewGroup>
                            </Card>
                        )}
                        {selectedRequest.paymentNote && (
                            <Card title="Ghi chú thanh toán" style={{ marginTop: 16 }}>
                                <Text>{selectedRequest.paymentNote}</Text>
                            </Card>
                        )}
                    </div>
                )}
            </Modal>

            {/* Import to Inventory Modal */}
            <Modal
                title="Duyệt nhập kho"
                open={importModalVisible}
                onOk={handleImportToInventory}
                onCancel={() => {
                    setImportModalVisible(false);
                    setSelectedRequest(null);
                }}
                confirmLoading={loading}
                okText="Duyệt nhập kho"
                cancelText="Hủy"
                width={600}
            >
                {selectedRequest && (
                    <div>
                        <p>Bạn có chắc chắn muốn duyệt nhập kho cho phiếu <Text strong>{selectedRequest.code}</Text>?</p>
                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                            Hệ thống sẽ tự động tạo transaction nhập kho cho {selectedRequest.items.length} vật liệu:
                        </Text>
                        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                            {selectedRequest.items.map((item, index) => (
                                <li key={index} style={{ fontSize: 12, marginBottom: 4 }}>
                                    • {item.materialName}: {item.quantity} {item.unit}
                                    {item.suggestedPrice && ` (Giá: ${item.suggestedPrice.toLocaleString('vi-VN')} đ/${item.unit})`}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </Modal>
        </div>
    );
}


