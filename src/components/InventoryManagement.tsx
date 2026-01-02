"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { CategoryService } from "@/services/categoryService";
import { InventoryService } from "@/services/inventoryService";
import { Category } from "@/types/category";
import { Unit, unitOptions } from "@/types/enum";
import { Material, PurchaseRequest, PurchaseRequestItem, InventoryTransaction, Supplier, SupplierOrder, SupplierPayment } from "@/types/inventory";
import { SupplierService } from "@/services/supplierService";
import SupplierManagement from "@/components/SupplierManagement";
import { genCode } from "@/utils/genCode";
import {
    DeleteOutlined,
    EditOutlined,
    MinusOutlined,
    PlusOutlined,
    WarningOutlined,
    ShoppingCartOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
    Button,
    Card,
    Checkbox,
    Col,
    DatePicker,
    Descriptions,
    Form,
    Input,
    InputNumber,
    Modal,
    Progress,
    Radio,
    Row,
    Select,
    Space,
    Statistic,
    Tag,
    Table,
    Tooltip,
    Typography,
    message,
    Tabs,
    Upload,
    Image,
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@/firebase/provider";
import { useFirebaseApp } from "@/firebase/provider";
import { getDatabase, ref, set } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { PurchaseRequest, PurchaseRequestItem } from "@/types/inventory";
import type { UploadFile, RcFile } from "antd/es/upload/interface";

const { Text } = Typography;

// Helper function to get unit label from unit value
const getUnitLabel = (unitValue: string): string => {
    const unitOption = unitOptions.find((opt) => opt.value === unitValue);
    return unitOption?.label || unitValue;
};

const isLongStock = (lastUpdated?: string, alertDays: number = 90): boolean => {
    if (!lastUpdated) return false;
    const today = new Date();
    const lastUpdate = new Date(lastUpdated);
    const diffTime = today.getTime() - lastUpdate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > alertDays;
};

// Material Detail Drawer
const createMaterialDetailDrawer = (categories: Category[], onShowHistory?: (material: Material) => void) => {
    const MaterialDetailDrawer: React.FC<PropRowDetails<Material>> = ({
        data,
    }) => {
        const [historyTransactions, setHistoryTransactions] = useState<InventoryTransaction[]>([]);
        const [historyLoading, setHistoryLoading] = useState(false);

        useEffect(() => {
            if (data?.id) {
                const loadHistory = async () => {
                    try {
                        setHistoryLoading(true);
                        const transactions = await InventoryService.getTransactionsByMaterialId(data.id);
                        setHistoryTransactions(transactions);
                    } catch (error) {
                        console.error("Error loading material history:", error);
                    } finally {
                        setHistoryLoading(false);
                    }
                };
                loadHistory();
            }
        }, [data?.id]);

        if (!data) return null;

        const isLowStock = data.stockQuantity < data.minThreshold;
        
        // Kiểm tra cảnh báo hạn mức (gần 30% của alertThreshold)
        const isNearAlertThreshold = data.alertThreshold 
            ? data.stockQuantity >= (data.alertThreshold * 0.7) && data.stockQuantity < data.alertThreshold
            : false;

        // Tính toán số tồn sau mỗi giao dịch
        const sortedTransactions = [...historyTransactions].sort((a, b) => b.createdAt - a.createdAt);
        let currentStock = data.stockQuantity || 0;
        const transactionsWithStock = sortedTransactions.map((transaction) => {
            let stockBefore = currentStock;
            if (transaction.type === "import") {
                stockBefore = currentStock - transaction.quantity;
            } else {
                stockBefore = currentStock + transaction.quantity;
            }
            const stockAfter = currentStock;
            currentStock = Math.max(0, stockBefore);
            return {
                ...transaction,
                stockAfter: stockAfter,
                stockBefore: Math.max(0, stockBefore),
            };
        });

        return (
            <div>
                <Descriptions bordered column={1} size="small">
                    {data.image && (
                        <Descriptions.Item label="Ảnh nguyên liệu">
                            <img 
                                src={data.image} 
                                alt={data.name}
                                style={{ maxWidth: 200, maxHeight: 200, objectFit: "contain" }}
                            />
                        </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Mã NVL">
                        <Text 
                            strong 
                            className="font-mono"
                            style={{ 
                                cursor: onShowHistory ? "pointer" : "default",
                                color: onShowHistory ? "#1890ff" : "inherit"
                            }}
                            onClick={() => {
                                if (onShowHistory) {
                                    onShowHistory(data);
                                }
                            }}
                        >
                            NVL-{data.id.slice(-6).toUpperCase()}
                        </Text>
                        {onShowHistory && (
                            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                (Click để xem lịch sử xuất nhập)
                            </Text>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tên vật liệu">
                        <Text strong>{data.name}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Danh mục">
                        <Tag
                            color={getCategoryColor(data.category, categories)}
                        >
                            {data.category}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Nhà cung cấp">
                        {data.supplier || "Chưa có thông tin"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Đơn vị">
                        {getUnitLabel(data.unit)}
                    </Descriptions.Item>
                    {data.importPrice && (
                        <Descriptions.Item label="Giá nhập">
                            <Text strong>
                                {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                }).format(data.importPrice)}
                                /{getUnitLabel(data.unit)}
                            </Text>
                        </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Tồn kho hiện tại">
                        <Space vertical size="small" style={{}}>
                            <Text
                                strong
                                className={`text-lg ${isLowStock || isNearAlertThreshold ? "text-red-600" : ""}`}
                            >
                                {(isLowStock || isNearAlertThreshold) && (
                                    <WarningOutlined className="mr-2" />
                                )}
                                {data.stockQuantity} {getUnitLabel(data.unit)}
                                {isNearAlertThreshold && (
                                    <Tag color="red" style={{ marginLeft: 8 }}>
                                        Gần hạn mức cảnh báo!
                                    </Tag>
                                )}
                            </Text>
                            <Progress
                                percent={Math.round(
                                    (data.stockQuantity / data.maxCapacity) *
                                        100,
                                )}
                                status={isLowStock || isNearAlertThreshold ? "exception" : "normal"}
                            />
                            <Text className="text-xs text-gray-500">
                                Mức tối thiểu: {data.minThreshold}{" "}
                                {getUnitLabel(data.unit)} / Tối đa:{" "}
                                {data.maxCapacity} {getUnitLabel(data.unit)}
                                {data.alertThreshold && (
                                    <> / Hạn mức cảnh báo: {data.alertThreshold} {getUnitLabel(data.unit)}</>
                                )}
                            </Text>
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Cập nhật">
                        {data.lastUpdated
                            ? dayjs(data.lastUpdated).format("DD/MM/YYYY")
                            : "Chưa cập nhật"}
                    </Descriptions.Item>
                </Descriptions>

                {/* Lịch sử nhập xuất */}
                <div style={{ marginTop: 24 }}>
                    <Tabs
                        defaultActiveKey="import"
                        items={[
                            {
                                key: "import",
                                label: (
                                    <span>
                                        <Tag color="green" style={{ margin: 0 }}>Nhập</Tag>
                                        <span style={{ marginLeft: 8 }}>
                                            ({transactionsWithStock.filter(t => t.type === "import").length})
                                        </span>
                                    </span>
                                ),
                                children: (
                                    <Table
                                        columns={[
                                            {
                                                title: "Ngày",
                                                dataIndex: "date",
                                                key: "date",
                                                width: 100,
                                                sorter: (a: any, b: any) => {
                                                    const dateA = new Date(a.date).getTime();
                                                    const dateB = new Date(b.date).getTime();
                                                    return dateB - dateA;
                                                },
                                            },
                                            {
                                                title: "Số lượng",
                                                dataIndex: "quantity",
                                                key: "quantity",
                                                width: 120,
                                                render: (quantity: number, record: InventoryTransaction) => (
                                                    <Text strong style={{ 
                                                        color: "#52c41a",
                                                        fontSize: 12
                                                    }}>
                                                        +{quantity} {record.unit}
                                                    </Text>
                                                ),
                                            },
                                            {
                                                title: "Tồn kho",
                                                key: "stockAfter",
                                                width: 100,
                                                render: (_: any, record: any) => (
                                                    <Text strong style={{ 
                                                        color: record.stockAfter < data.minThreshold ? "#ff4d4f" : "#52c41a",
                                                        fontSize: 12
                                                    }}>
                                                        {record.stockAfter} {record.unit}
                                                    </Text>
                                                ),
                                            },
                                            {
                                                title: "Đơn giá",
                                                dataIndex: "price",
                                                key: "price",
                                                width: 120,
                                                render: (price: number) =>
                                                    price
                                                        ? new Intl.NumberFormat("vi-VN", {
                                                              style: "currency",
                                                              currency: "VND",
                                                          }).format(price)
                                                        : "-",
                                            },
                                            {
                                                title: "Thành tiền",
                                                dataIndex: "totalAmount",
                                                key: "totalAmount",
                                                width: 120,
                                                render: (totalAmount: number) =>
                                                    totalAmount
                                                        ? new Intl.NumberFormat("vi-VN", {
                                                              style: "currency",
                                                              currency: "VND",
                                                          }).format(totalAmount)
                                                        : "-",
                                            },
                                            {
                                                title: "Nhà cung cấp",
                                                dataIndex: "supplier",
                                                key: "supplier",
                                                width: 150,
                                                ellipsis: true,
                                            },
                                            {
                                                title: "Ghi chú",
                                                dataIndex: "note",
                                                key: "note",
                                                width: 150,
                                                ellipsis: true,
                                            },
                                        ]}
                                        dataSource={transactionsWithStock.filter(t => t.type === "import")}
                                        loading={historyLoading}
                                        rowKey="code"
                                        size="small"
                                        pagination={{
                                            pageSize: 5,
                                            showSizeChanger: false,
                                            showTotal: (total) => `Tổng: ${total} giao dịch nhập`,
                                            simple: true,
                                        }}
                                        scroll={{ y: 250 }}
                                    />
                                ),
                            },
                            {
                                key: "export",
                                label: (
                                    <span>
                                        <Tag color="red" style={{ margin: 0 }}>Xuất</Tag>
                                        <span style={{ marginLeft: 8 }}>
                                            ({transactionsWithStock.filter(t => t.type === "export").length})
                                        </span>
                                    </span>
                                ),
                                children: (
                                    <Table
                                        columns={[
                                            {
                                                title: "Ngày",
                                                dataIndex: "date",
                                                key: "date",
                                                width: 100,
                                                sorter: (a: any, b: any) => {
                                                    const dateA = new Date(a.date).getTime();
                                                    const dateB = new Date(b.date).getTime();
                                                    return dateB - dateA;
                                                },
                                            },
                                            {
                                                title: "Số lượng",
                                                dataIndex: "quantity",
                                                key: "quantity",
                                                width: 120,
                                                render: (quantity: number, record: InventoryTransaction) => (
                                                    <Text strong style={{ 
                                                        color: "#ff4d4f",
                                                        fontSize: 12
                                                    }}>
                                                        -{quantity} {record.unit}
                                                    </Text>
                                                ),
                                            },
                                            {
                                                title: "Tồn kho",
                                                key: "stockAfter",
                                                width: 100,
                                                render: (_: any, record: any) => (
                                                    <Text strong style={{ 
                                                        color: record.stockAfter < data.minThreshold ? "#ff4d4f" : "#52c41a",
                                                        fontSize: 12
                                                    }}>
                                                        {record.stockAfter} {record.unit}
                                                    </Text>
                                                ),
                                            },
                                            {
                                                title: "Lý do",
                                                dataIndex: "reason",
                                                key: "reason",
                                                width: 200,
                                                ellipsis: true,
                                            },
                                            {
                                                title: "Ghi chú",
                                                dataIndex: "note",
                                                key: "note",
                                                width: 200,
                                                ellipsis: true,
                                            },
                                        ]}
                                        dataSource={transactionsWithStock.filter(t => t.type === "export")}
                                        loading={historyLoading}
                                        rowKey="code"
                                        size="small"
                                        pagination={{
                                            pageSize: 5,
                                            showSizeChanger: false,
                                            showTotal: (total) => `Tổng: ${total} giao dịch xuất`,
                                            simple: true,
                                        }}
                                        scroll={{ y: 250 }}
                                    />
                                ),
                            },
                        ]}
                    />
                </div>
            </div>
        );
    };
    return MaterialDetailDrawer;
};

const getCategoryColor = (
    categoryName: string,
    categories: Category[],
): string => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.color || "default";
};

export default function InventoryManagement() {
    const router = useRouter();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPurchaseRequestModalOpen, setIsPurchaseRequestModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyTransactions, setHistoryTransactions] = useState<InventoryTransaction[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedMaterialForHistory, setSelectedMaterialForHistory] = useState<Material | null>(null);
    const { user } = useUser();
    const firebaseApp = useFirebaseApp();
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("inventory");
    const [materialInputType, setMaterialInputType] = useState<
        "new" | "existing"
    >("new");
    const [exportForm] = Form.useForm();
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [purchaseRequestForm] = Form.useForm();
    const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);

    const selectedExistingMaterialId = Form.useWatch("materialId", createForm);
    const hasExistingSelection =
        materialInputType === "existing" && !!selectedExistingMaterialId;
    const updateThresholds = Form.useWatch("updateThresholds", createForm);
    const updateImportPrice = Form.useWatch("updateImportPrice", createForm);

    const {
        query,
        pagination,
        updateQueries,
        reset,
        applyFilter,
        handlePageChange,
    } = useFilter();

    // Load materials, categories and settings
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [materialsData, categoriesData] = await Promise.all([
                    InventoryService.getAllMaterials(),
                    CategoryService.getAll(),
                ]);
                setMaterials(materialsData);
                setCategories(categoriesData);
            } catch (error) {
                console.error("Error loading data:", error);
                message.error("Không thể tải dữ liệu");
            } finally {
                setLoading(false);
            }
        };

        loadData();

        // Subscribe to real-time updates
        const unsubscribeMaterials = InventoryService.onMaterialsSnapshot(
            (materialsData) => {
                setMaterials(materialsData);
            },
        );

        const unsubscribeCategories = CategoryService.onSnapshot(
            (categoriesData) => {
                setCategories(categoriesData);
            },
        );

        return () => {
            unsubscribeMaterials();
            unsubscribeCategories();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredMaterials = applyFilter(materials);

    // Handle create/import
    const handleCreate = async () => {
        try {
            const values = await createForm.validateFields();

            if (materialInputType === "existing") {
                // Nhập kho vật liệu có sẵn
                const material = materials.find(
                    (m) => m.id === values.materialId,
                );
                if (!material) {
                    message.error("Không tìm thấy vật liệu");
                    return;
                }

                // Sử dụng giá tùy chỉnh nếu có, nếu không thì dùng giá từ material
                const price = values.importPrice ?? material.importPrice ?? 0;
                const totalAmount = values.quantity * price;
                const shouldUpdateImportPrice = values.updateImportPrice;

                // Create transaction
                await InventoryService.createTransaction({
                    materialId: material.id,
                    materialName: material.name,
                    type: "import",
                    quantity: values.quantity,
                    unit: material.unit,
                    price: price,
                    totalAmount: totalAmount,
                    date: dayjs(values.importDate).format("YYYY-MM-DD"),
                    supplier: material.supplier || undefined,
                    ...(values.note ? { note: values.note } : {}),
                });

                // Update import price if provided custom price
                if (
                    shouldUpdateImportPrice &&
                    values.importPrice !== undefined &&
                    values.importPrice !== null &&
                    values.importPrice !== material.importPrice
                ) {
                    await InventoryService.updateMaterial(material.id, {
                        importPrice: values.importPrice,
                    });
                }

                if (values.updateThresholds) {
                    await InventoryService.updateMaterial(material.id, {
                        minThreshold: values.minThreshold,
                        maxCapacity: values.maxCapacity,
                    });
                }

                message.success(
                    `Đã nhập ${values.quantity} ${getUnitLabel(material.unit)} ${
                        material.name
                    }`,
                );
            } else {
                // Upload ảnh nếu có
                let imageUrl: string | undefined = undefined;
                if (imageFileList.length > 0 && imageFileList[0].originFileObj) {
                    try {
                        const storage = getStorage(firebaseApp);
                        const file = imageFileList[0].originFileObj as RcFile;
                        const fileName = `materials/${Date.now()}_${file.name}`;
                        const imageRef = storageRef(storage, fileName);
                        await uploadBytes(imageRef, file);
                        imageUrl = await getDownloadURL(imageRef);
                    } catch (error) {
                        console.error("Error uploading image:", error);
                        message.error("Không thể upload ảnh!");
                    }
                }
                
                // Tạo vật liệu mới và nhập kho
                const materialData: Omit<
                    Material,
                    "id" | "createdAt" | "updatedAt"
                > = {
                    name: values.name,
                    category: values.category,
                    stockQuantity: 0, // Sẽ được cập nhật sau khi nhập kho
                    unit: values.unit,
                    minThreshold: values.minThreshold,
                    maxCapacity: values.maxCapacity,
                    alertThreshold: values.alertThreshold,
                    supplier: values.supplier,
                    importPrice: values.importPrice,
                    longStockAlertDays: values.longStockAlertDays,
                    image: imageUrl,
                    lastUpdated: new Date().toISOString().split("T")[0],
                };

                const newMaterial =
                    await InventoryService.createMaterial(materialData);

                // Tự động nhập kho với số lượng ban đầu
                const quantity = values.stockQuantity || values.quantity || 0;
                const price = values.importPrice || 0;
                const totalAmount = quantity * price;

                if (quantity > 0) {
                    await InventoryService.createTransaction({
                        materialId: newMaterial.id,
                        materialName: newMaterial.name,
                        type: "import",
                        quantity: quantity,
                        unit: newMaterial.unit,
                        price: price,
                        totalAmount: totalAmount,
                        date: dayjs(values.importDate || new Date()).format(
                            "YYYY-MM-DD",
                        ),
                        supplier: values.supplier || undefined,
                        ...(values.note ? { note: values.note } : {}),
                    });
                }

                message.success("Tạo vật liệu và nhập kho thành công");
            }

            setIsCreateModalOpen(false);
            createForm.resetFields();
            setMaterialInputType("new");
            setImageFileList([]);
        } catch (error) {
            console.error("Create/Import failed:", error);
        }
    };

    // Handle edit
    const handleEdit = async () => {
        if (!selectedMaterial) return;

        try {
            const values = await editForm.validateFields();
            console.log("Edit form values:", values);
            
            // Upload ảnh nếu có ảnh mới
            let imageUrl: string | undefined = selectedMaterial.image;
            if (imageFileList.length > 0 && imageFileList[0].originFileObj) {
                try {
                    const storage = getStorage(firebaseApp);
                    const file = imageFileList[0].originFileObj as RcFile;
                    const fileName = `materials/${Date.now()}_${file.name}`;
                    const imageRef = storageRef(storage, fileName);
                    await uploadBytes(imageRef, file);
                    imageUrl = await getDownloadURL(imageRef);
                    console.log("Image uploaded:", imageUrl);
                } catch (error) {
                    console.error("Error uploading image:", error);
                    message.error("Không thể upload ảnh: " + (error as Error).message);
                    return;
                }
            } else if (imageFileList.length === 0 && selectedMaterial.image) {
                // Nếu xóa ảnh
                imageUrl = undefined;
            }
            
            // Remove undefined values
            const updateData: any = {
                name: values.name,
                category: values.category,
                unit: values.unit,
                minThreshold: values.minThreshold,
                maxCapacity: values.maxCapacity,
                supplier: values.supplier || undefined,
                image: imageUrl,
                importPrice: values.importPrice || undefined,
                longStockAlertDays: values.longStockAlertDays || undefined,
                lastUpdated: new Date().toISOString().split("T")[0],
            };
            
            // Only include alertThreshold if it has a value
            if (values.alertThreshold !== undefined && values.alertThreshold !== null) {
                updateData.alertThreshold = values.alertThreshold;
            }
            
            // Remove undefined values
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined || updateData[key] === null) {
                    delete updateData[key];
                }
            });
            
            console.log("Updating material with data:", updateData);
            
            await InventoryService.updateMaterial(selectedMaterial.id, updateData);
            message.success("Cập nhật vật liệu thành công");
            setIsEditModalOpen(false);
            setSelectedMaterial(null);
            editForm.resetFields();
            setImageFileList([]);
        } catch (error) {
            console.error("Update failed:", error);
            message.error("Không thể cập nhật vật liệu: " + (error as Error).message);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!selectedMaterial) return;

        try {
            await InventoryService.deleteMaterial(selectedMaterial.id);
            message.success("Xóa vật liệu thành công");
            setIsDeleteModalOpen(false);
            setSelectedMaterial(null);
        } catch (error) {
            console.error("Delete failed:", error);
            message.error("Không thể xóa vật liệu");
        }
    };

    // Handle export
    const handleExport = async () => {
        try {
            const values = await exportForm.validateFields();
            const material = materials.find((m) => m.id === values.materialId);

            if (!material) {
                message.error("Không tìm thấy vật liệu");
                return;
            }

            if (material.stockQuantity < values.quantity) {
                message.error("Số lượng xuất vượt quá tồn kho!");
                return;
            }

            const price = values.price || material.importPrice || 0;
            const totalAmount = values.quantity * price;

            // Create transaction
            await InventoryService.createTransaction({
                materialId: material.id,
                materialName: material.name,
                type: "export",
                quantity: values.quantity,
                unit: material.unit,
                price: price,
                totalAmount: totalAmount,
                date: dayjs(values.exportDate).format("YYYY-MM-DD"),
                ...(values.reason ? { reason: values.reason } : {}),
                ...(values.note ? { note: values.note } : {}),
            });

            message.success(
                `Đã xuất ${values.quantity} ${getUnitLabel(material.unit)} ${
                    material.name
                }`,
            );
            setIsExportModalOpen(false);
            exportForm.resetFields();
        } catch (error) {
            console.error("Export validation failed:", error);
        }
    };

    // Filter fields
    const filterFields = [
        {
            name: "category",
            label: "Danh mục",
            type: "select" as const,
            options: categories.map((cat) => ({
                label: cat.name,
                value: cat.name,
            })),
        },
        {
            name: "unit",
            label: "Đơn vị",
            type: "select" as const,
            options: unitOptions,
        },
    ];

    // Tính toán thống kê
    const lowStockCount = materials.filter(
        (m) => m.stockQuantity < m.minThreshold,
    ).length;
    const nearAlertThresholdCount = materials.filter((m) => {
        if (!m.alertThreshold) return false;
        return m.stockQuantity >= (m.alertThreshold * 0.7) && m.stockQuantity < m.alertThreshold;
    }).length;
    const longStockCount = materials.filter((m) =>
        isLongStock(m.lastUpdated, m.longStockAlertDays || 30),
    ).length;

    const updatedColumns: TableColumnsType<Material> = [
        {
            title: "Ảnh",
            dataIndex: "image",
            key: "image",
            width: 100,
            fixed: "left",
            render: (image: string, record: Material) => (
                image ? (
                    <div style={{ position: "relative", width: 60, height: 60 }}>
                        <Image
                            src={image}
                            alt={record.name}
                            width={60}
                            height={60}
                            style={{ objectFit: "cover", borderRadius: 4 }}
                            preview
                        />
                        <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(0, 0, 0, 0.4)",
                            borderRadius: 4,
                            pointerEvents: "none"
                        }}>
                            <Text style={{
                                color: "white",
                                fontSize: 10,
                                fontWeight: "bold",
                                textAlign: "center",
                                padding: "2px 4px",
                                textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
                            }}>
                                {record.name}
                            </Text>
                        </div>
                    </div>
                ) : (
                    <div style={{ 
                        width: 60, 
                        height: 60, 
                        backgroundColor: "#f0f0f0", 
                        borderRadius: 4, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center" 
                    }}>
                        <ShoppingCartOutlined style={{ fontSize: 24, color: "#999" }} />
                    </div>
                )
            ),
        },
        {
            title: "Tên vật liệu",
            dataIndex: "name",
            key: "name",
            width: 250,
            fixed: "left",
            render: (name: string, record: Material) => (
                <Text 
                    style={{ cursor: "pointer", color: "#1890ff" }}
                    onClick={() => {
                        setSelectedMaterialForHistory(record);
                        setIsHistoryModalOpen(true);
                        loadMaterialHistory(record.id);
                    }}
                >
                    {name}
                </Text>
            ),
        },
        {
            title: "Danh mục",
            dataIndex: "category",
            key: "category",
            width: 150,
            render: (category: string) => (
                <Tag color={getCategoryColor(category, categories)}>
                    {category}
                </Tag>
            ),
        },
        {
            title: "Tồn kho",
            dataIndex: "stockQuantity",
            key: "stock",
            width: 250,
            render: (_: unknown, record: Material) => {
                const isLowStock = record.stockQuantity < record.minThreshold;
                // Kiểm tra cảnh báo hạn mức (gần 30% của alertThreshold)
                const isNearAlertThreshold = record.alertThreshold 
                    ? record.stockQuantity >= (record.alertThreshold * 0.7) && record.stockQuantity < record.alertThreshold
                    : false;
                const shouldAlert = isLowStock || isNearAlertThreshold;
                
                return (
                    <Space vertical size="small" style={{}}>
                        <Text
                            strong
                            className={shouldAlert ? "text-red-600" : ""}
                        >
                            {shouldAlert && <WarningOutlined className="mr-1" />}
                            {record.stockQuantity} {getUnitLabel(record.unit)}
                            {isNearAlertThreshold && (
                                <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>
                                    Gần hạn mức
                                </Tag>
                            )}
                        </Text>
                        <Progress
                            percent={Math.round(
                                (record.stockQuantity / record.maxCapacity) *
                                    100,
                            )}
                            status={shouldAlert ? "exception" : "normal"}
                            size="small"
                        />
                    </Space>
                );
            },
        },
        {
            title: "Giá nhập",
            dataIndex: "importPrice",
            key: "importPrice",
            width: 150,
            render: (_: unknown, record: Material) => {
                const price = record.importPrice;
                return price
                    ? `${new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                      }).format(price)}/${getUnitLabel(record.unit)}`
                    : "-";
            },
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 200,
            fixed: "right",
            render: (_: unknown, record: Material) => (
                <Space size="small">
                    <Tooltip title="Nhập kho">
                        <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                setMaterialInputType("existing");
                                createForm.resetFields();
                                createForm.setFieldsValue({
                                    inputType: "existing",
                                    materialId: record.id,
                                    importDate: dayjs(),
                                    updateImportPrice: false,
                                    updateThresholds: false,
                                });
                                const material = materials.find(
                                    (m) => m.id === record.id,
                                );
                                if (material) {
                                    createForm.setFieldsValue({
                                        unit: material.unit,
                                        importPrice: material.importPrice || 0,
                                        supplier: material.supplier || "",
                                    });
                                }
                                setIsCreateModalOpen(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Xuất kho">
                        <Button
                            size="small"
                            icon={<MinusOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                exportForm.setFieldsValue({
                                    materialId: record.id,
                                });
                                setIsExportModalOpen(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Đề xuất mua">
                        <Button
                            size="small"
                            icon={<ShoppingCartOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                const material = materials.find(
                                    (m) => m.id === record.id,
                                );
                                if (material) {
                                    purchaseRequestForm.setFieldsValue({
                                        materialId: record.id,
                                        unit: material.unit,
                                        suggestedPrice: material.importPrice || 0,
                                    });
                                }
                                setSelectedMaterial(record);
                                setIsPurchaseRequestModalOpen(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMaterial(record);
                                editForm.setFieldsValue({
                                    ...record,
                                });
                                // Load ảnh hiện tại vào fileList nếu có
                                if (record.image) {
                                    setImageFileList([{
                                        uid: '-1',
                                        name: 'image.png',
                                        status: 'done',
                                        url: record.image,
                                    }]);
                                } else {
                                    setImageFileList([]);
                                }
                                setIsEditModalOpen(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMaterial(record);
                                setIsDeleteModalOpen(true);
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <>
            <WrapperContent
                header={{
                    searchInput: {
                        placeholder: "Tìm kiếm vật liệu...",
                        filterKeys: ["name", "category", "supplier"],
                    },
                    filters: {
                        fields: filterFields,
                        query,
                        onApplyFilter: updateQueries,
                        onReset: reset,
                    },
                    buttonEnds: [
                        // {
                        //   name: "Export Excel",
                        //   icon: <FileExcelOutlined />,
                        //   can: true,
                        //   onClick: () => {
                        //     console.log("Export Excel");
                        //   },
                        // },
                        {
                            name: "Nhập kho",
                            icon: <PlusOutlined />,
                            type: "primary",
                            can: true,
                            onClick: () => {
                                console.log(
                                    "Opening create modal, current state:",
                                    isCreateModalOpen,
                                );
                                setIsCreateModalOpen(true);
                                console.log("Set isCreateModalOpen to true");
                            },
                        },
                        {
                            name: "Xuất kho",
                            icon: <MinusOutlined />,
                            can: true,
                            onClick: () => {
                                console.log(
                                    "Opening export modal, current state:",
                                    isExportModalOpen,
                                );
                                setIsExportModalOpen(true);
                                console.log("Set isExportModalOpen to true");
                            },
                        },
                    ],
                }}
                isEmpty={!filteredMaterials?.length}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: "inventory",
                            label: "Kho",
                            children: (
                                <>
                                    <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Tổng vật liệu"
                                value={materials.length}
                                suffix="loại"
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Cảnh báo tồn thấp"
                                value={lowStockCount}
                                styles={{
                                    content: {
                                        color:
                                            lowStockCount > 0
                                                ? "#cf1322"
                                                : undefined,
                                    },
                                }}
                                prefix={
                                    lowStockCount > 0 ? (
                                        <WarningOutlined />
                                    ) : undefined
                                }
                            />
                        </Card>
                    </Col>
                    {nearAlertThresholdCount > 0 && (
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Gần hạn mức cảnh báo"
                                    value={nearAlertThresholdCount}
                                    styles={{
                                        content: { color: "#ff4d4f" },
                                    }}
                                    prefix={<WarningOutlined />}
                                />
                            </Card>
                        </Col>
                    )}
                    {longStockCount > 0 && (
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Tồn quá lâu"
                                    value={longStockCount}
                                    styles={{
                                        content: { color: "#fa8c16" },
                                    }}
                                    prefix={<WarningOutlined />}
                                />
                            </Card>
                        </Col>
                    )}
                </Row>

                <CommonTable<Material>
                    columns={updatedColumns}
                    dataSource={filteredMaterials}
                    pagination={{
                        ...pagination,
                        onChange: handlePageChange,
                    }}
                    loading={loading}
                    rank
                    paging
                    DrawerDetails={createMaterialDetailDrawer(categories, (material) => {
                        setSelectedMaterialForHistory(material);
                        setIsHistoryModalOpen(true);
                        loadMaterialHistory(material.id);
                    })}
                />
                                </>
                            ),
                        },
                        {
                            key: "suppliers",
                            label: "Nhà cung cấp",
                            children: <SupplierManagement />,
                        },
                    ]}
                />
            </WrapperContent>

            {/* Create/Import Material Modal */}
            {isCreateModalOpen && (
                <Modal
                    title="Nhập kho vật liệu"
                    open={isCreateModalOpen}
                    onOk={handleCreate}
                    onCancel={() => {
                        setIsCreateModalOpen(false);
                        createForm.resetFields();
                        setMaterialInputType("new");
                    }}
                    width={700}
                    okText={
                        materialInputType === "existing"
                            ? "Nhập kho"
                            : "Tạo và nhập kho"
                    }
                    cancelText="Hủy"
                    destroyOnHidden
                >
                    <Form form={createForm} layout="vertical" className="mt-4">
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="inputType"
                                    label="Loại nhập"
                                    initialValue="new"
                                    rules={[{ required: true }]}
                                >
                                    <Radio.Group
                                        onChange={(e) => {
                                            setMaterialInputType(
                                                e.target.value,
                                            );
                                            createForm.resetFields([
                                                "inputType",
                                            ]);
                                            createForm.setFieldsValue({
                                                inputType: e.target.value,
                                            });
                                            if (e.target.value === "existing") {
                                                createForm.setFieldsValue({
                                                    importDate: dayjs(),
                                                });
                                            }
                                        }}
                                    >
                                        <Radio value="new">
                                            Nhập nguyên liệu mới
                                        </Radio>
                                        <Radio value="existing">
                                            Nguyên liệu có sẵn
                                        </Radio>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>

                            {materialInputType === "existing" ? (
                                <>
                                    <Col span={24}>
                                        <Form.Item
                                            name="materialId"
                                            label="Vật liệu"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng chọn vật liệu",
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder="Chọn vật liệu"
                                                showSearch={{
                                                    filterOption: (
                                                        input: string,
                                                        option:
                                                            | { label: string }
                                                            | undefined,
                                                    ) =>
                                                        (option?.label ?? "")
                                                            .toLowerCase()
                                                            .includes(
                                                                input.toLowerCase(),
                                                            ),
                                                }}
                                                options={materials.map((m) => ({
                                                    label: `${m.name} (${m.category}) - Tồn: ${m.stockQuantity} ${m.unit} - ${m.supplier}`,
                                                    value: m.id,
                                                }))}
                                                onChange={(value) => {
                                                    const material =
                                                        materials.find(
                                                            (m) =>
                                                                m.id === value,
                                                        );
                                                    if (material) {
                                                        createForm.setFieldsValue(
                                                            {
                                                                unit: material.unit,
                                                                importPrice:
                                                                    material.importPrice ||
                                                                    0,
                                                                supplier:
                                                                    material.supplier ||
                                                                    "",
                                                                name: material.name,
                                                                category:
                                                                    material.category,
                                                                minThreshold:
                                                                    material.minThreshold,
                                                                maxCapacity:
                                                                    material.maxCapacity,
                                                            },
                                                        );
                                                    }
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col span={12}>
                                        <Form.Item
                                            name="quantity"
                                            label="Số lượng"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập số lượng",
                                                },
                                                {
                                                    type: "number",
                                                    min: 1,
                                                    message:
                                                        "Số lượng phải lớn hơn 0",
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                placeholder="Nhập số lượng"
                                                style={{
                                                    width: "100%",
                                                }}
                                                min={1}
                                                disabled={!hasExistingSelection}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="unit" label="Đơn vị">
                                            <Input
                                                disabled
                                                placeholder="Đơn vị"
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col span={12}>
                                        <Form.Item
                                            name="importPrice"
                                            label="Giá nhập (VND/đơn vị)"
                                        >
                                            <InputNumber
                                                disabled={
                                                    !hasExistingSelection ||
                                                    !updateImportPrice
                                                }
                                                style={{
                                                    width: "100%",
                                                }}
                                                formatter={(value) =>
                                                    `${value}`.replace(
                                                        /\B(?=(\d{3})+(?!\d))/g,
                                                        ",",
                                                    )
                                                }
                                                parser={(value) => {
                                                    const parsed = Number(
                                                        value?.replace(
                                                            /,/g,
                                                            "",
                                                        ) || 0,
                                                    );
                                                    return parsed as any;
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="importDate"
                                            label="Ngày nhập"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng chọn ngày",
                                                },
                                            ]}
                                            initialValue={dayjs()}
                                        >
                                            <DatePicker
                                                style={{
                                                    width: "100%",
                                                }}
                                                disabled
                                                format="DD/MM/YYYY"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="updateImportPrice"
                                            valuePropName="checked"
                                            initialValue={false}
                                            tooltip="Bật nếu muốn lưu giá nhập tùy chỉnh thành giá nhập mặc định của vật liệu"
                                        >
                                            <Checkbox
                                                disabled={!hasExistingSelection}
                                            >
                                                Cập nhật giá nhập mặc định
                                            </Checkbox>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="updateThresholds"
                                            valuePropName="checked"
                                            initialValue={false}
                                            tooltip="Bật nếu muốn cập nhật mức tối thiểu / tối đa tồn kho cho vật liệu này"
                                        >
                                            <Checkbox
                                                disabled={!hasExistingSelection}
                                            >
                                                Cập nhật mức tồn (tối thiểu/tối
                                                đa)
                                            </Checkbox>
                                        </Form.Item>
                                    </Col>

                                    <Col span={12}>
                                        <Form.Item
                                            name="minThreshold"
                                            label="Mức tối thiểu"
                                            rules={[
                                                {
                                                    type: "number",
                                                    min: 0,
                                                    message:
                                                        "Mức tối thiểu phải >= 0",
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                formatter={(value) =>
                                                    `${value}`.replace(
                                                        /\B(?=(\d{3})+(?!\d))/g,
                                                        ",",
                                                    )
                                                }
                                                parser={(value) => {
                                                    const parsed = Number(
                                                        value?.replace(
                                                            /,/g,
                                                            "",
                                                        ) || 0,
                                                    );
                                                    return parsed as any;
                                                }}
                                                placeholder="Nhập mức tối thiểu"
                                                style={{
                                                    width: "100%",
                                                }}
                                                min={0}
                                                disabled={
                                                    !hasExistingSelection ||
                                                    !updateThresholds
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="maxCapacity"
                                            label="Mức tối đa"
                                            rules={[
                                                {
                                                    type: "number",
                                                    min: 1,
                                                    message:
                                                        "Mức tối đa phải >= 1",
                                                },
                                                ({ getFieldValue }) => ({
                                                    validator: (_, value) => {
                                                        const min =
                                                            getFieldValue(
                                                                "minThreshold",
                                                            );
                                                        if (
                                                            value ===
                                                                undefined ||
                                                            value === null ||
                                                            min === undefined ||
                                                            min === null
                                                        ) {
                                                            return Promise.resolve();
                                                        }
                                                        if (value >= min)
                                                            return Promise.resolve();
                                                        return Promise.reject(
                                                            new Error(
                                                                "Mức tối đa phải lớn hơn hoặc bằng mức tối thiểu",
                                                            ),
                                                        );
                                                    },
                                                }),
                                            ]}
                                        >
                                            <InputNumber
                                                placeholder="Nhập mức tối đa"
                                                style={{
                                                    width: "100%",
                                                }}
                                                min={1}
                                                formatter={(value) =>
                                                    `${value}`.replace(
                                                        /\B(?=(\d{3})+(?!\d))/g,
                                                        ",",
                                                    )
                                                }
                                                parser={(value) => {
                                                    const parsed = Number(
                                                        value?.replace(
                                                            /,/g,
                                                            "",
                                                        ) || 0,
                                                    );
                                                    return parsed as any;
                                                }}
                                                disabled={
                                                    !hasExistingSelection ||
                                                    !updateThresholds
                                                }
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col span={12}>
                                        <Form.Item
                                            name="supplier"
                                            label="Nhà cung cấp"
                                        >
                                            <Input
                                                disabled
                                                placeholder="Nhà cung cấp"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="note" label="Ghi chú">
                                            <Input.TextArea
                                                rows={3}
                                                placeholder="Nhập ghi chú..."
                                                disabled={!hasExistingSelection}
                                            />
                                        </Form.Item>
                                    </Col>
                                </>
                            ) : (
                                <>
                                    <Col span={12}>
                                        <Form.Item
                                            name="name"
                                            label="Tên vật liệu"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập tên vật liệu",
                                                },
                                            ]}
                                        >
                                            <Input placeholder="Nhập tên vật liệu" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="category"
                                            label="Danh mục"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng chọn danh mục",
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder="Chọn danh mục"
                                                showSearch
                                                filterOption={(input, option) =>
                                                    (option?.label ?? "")
                                                        .toLowerCase()
                                                        .includes(
                                                            input.toLowerCase(),
                                                        )
                                                }
                                                options={categories.map(
                                                    (cat) => ({
                                                        label: cat.name,
                                                        value: cat.name,
                                                    }),
                                                )}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="unit"
                                            label="Đơn vị"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập đơn vị",
                                                },
                                                {
                                                    validator: (_, value) => {
                                                        if (!value)
                                                            return Promise.resolve();
                                                        const validUnits =
                                                            Object.values(Unit);
                                                        if (
                                                            validUnits.includes(
                                                                value as Unit,
                                                            )
                                                        ) {
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject(
                                                            new Error(
                                                                "Đơn vị không hợp lệ",
                                                            ),
                                                        );
                                                    },
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder="Chọn đơn vị"
                                                options={unitOptions}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="minThreshold"
                                            label="Mức tối thiểu"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập mức tối thiểu",
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                placeholder="Nhập mức tối thiểu"
                                                style={{
                                                    width: "100%",
                                                }}
                                                min={0}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="maxCapacity"
                                            label="Mức tối đa"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập mức tối đa",
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                placeholder="Nhập mức tối đa"
                                                style={{
                                                    width: "100%",
                                                }}
                                                min={1}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="alertThreshold"
                                            label="Hạn mức cảnh báo"
                                            tooltip="Khi tồn kho gần tới hạn mức này (khoảng 30%) sẽ cảnh báo đỏ"
                                        >
                                            <InputNumber
                                                placeholder="Nhập hạn mức cảnh báo"
                                                style={{
                                                    width: "100%",
                                                }}
                                                min={0}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            name="image"
                                            label="Ảnh nguyên liệu"
                                        >
                                            <Upload
                                                listType="picture-card"
                                                maxCount={1}
                                                fileList={imageFileList}
                                                onChange={({ fileList }) => setImageFileList(fileList)}
                                                beforeUpload={(file) => {
                                                    const isImage = file.type.startsWith("image/");
                                                    if (!isImage) {
                                                        message.error("Chỉ được upload file ảnh!");
                                                        return Upload.LIST_IGNORE;
                                                    }
                                                    const isLt2M = file.size / 1024 / 1024 < 2;
                                                    if (!isLt2M) {
                                                        message.error("Ảnh phải nhỏ hơn 2MB!");
                                                        return Upload.LIST_IGNORE;
                                                    }
                                                    return false; // Prevent auto upload
                                                }}
                                            >
                                                {imageFileList.length < 1 && (
                                                    <div>
                                                        <UploadOutlined />
                                                        <div style={{ marginTop: 8 }}>Upload</div>
                                                    </div>
                                                )}
                                            </Upload>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="quantity"
                                            label="Số lượng nhập kho"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập số lượng",
                                                },
                                                {
                                                    type: "number",
                                                    min: 0,
                                                    message:
                                                        "Số lượng phải lớn hơn hoặc bằng 0",
                                                },
                                            ]}
                                            initialValue={0}
                                        >
                                            <InputNumber
                                                placeholder="Nhập số lượng"
                                                style={{
                                                    width: "100%",
                                                }}
                                                min={0}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="importPrice"
                                            label="Giá nhập (VND/đơn vị)"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập giá nhập",
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                placeholder="Nhập giá nhập"
                                                style={{
                                                    width: "100%",
                                                }}
                                                min={0}
                                                formatter={(value) =>
                                                    `${value}`.replace(
                                                        /\B(?=(\d{3})+(?!\d))/g,
                                                        ",",
                                                    )
                                                }
                                                parser={(value) =>
                                                    Number(
                                                        value?.replace(
                                                            /\$\s?|(,*)/g,
                                                            "",
                                                        ) || 0,
                                                    ) as any
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="importDate"
                                            label="Ngày nhập"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng chọn ngày",
                                                },
                                            ]}
                                            initialValue={dayjs()}
                                        >
                                            <DatePicker
                                                style={{
                                                    width: "100%",
                                                }}
                                                format="DD/MM/YYYY"
                                                disabled
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="supplier"
                                            label="Nhà cung cấp"
                                        >
                                            <Input placeholder="Nhập nhà cung cấp" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="longStockAlertDays"
                                            label="Cảnh báo tồn quá lâu (ngày)"
                                            tooltip="Số ngày không có giao dịch để cảnh báo tồn quá lâu"
                                        >
                                            <InputNumber
                                                placeholder="Nhập số ngày"
                                                style={{
                                                    width: "100%",
                                                }}
                                                min={1}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name="note" label="Ghi chú">
                                            <Input.TextArea
                                                rows={3}
                                                placeholder="Nhập ghi chú..."
                                            />
                                        </Form.Item>
                                    </Col>
                                </>
                            )}
                        </Row>
                    </Form>
                </Modal>
            )}

            {/* Edit Material Modal */}
            {isEditModalOpen && (
                <Modal
                    title="Chỉnh sửa vật liệu"
                    open={isEditModalOpen}
                    onOk={handleEdit}
                    onCancel={() => {
                        setIsEditModalOpen(false);
                        setSelectedMaterial(null);
                        editForm.resetFields();
                        setImageFileList([]);
                    }}
                    width={700}
                    okText="Cập nhật"
                    cancelText="Hủy"
                    destroyOnHidden
                >
                    <Form form={editForm} layout="vertical" className="mt-4">
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    name="name"
                                    label="Tên vật liệu"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Vui lòng nhập tên vật liệu",
                                        },
                                    ]}
                                >
                                    <Input placeholder="Nhập tên vật liệu" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="category"
                                    label="Danh mục"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng chọn danh mục",
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder="Chọn danh mục"
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? "")
                                                .toLowerCase()
                                                .includes(input.toLowerCase())
                                        }
                                        options={categories.map((cat) => ({
                                            label: cat.name,
                                            value: cat.name,
                                        }))}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="unit"
                                    label="Đơn vị"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng nhập đơn vị",
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder="Chọn đơn vị"
                                        options={[
                                            { label: "m²", value: "m²" },
                                            { label: "cuộn", value: "cuộn" },
                                            { label: "lít", value: "lít" },
                                            { label: "kg", value: "kg" },
                                            { label: "cái", value: "cái" },
                                        ]}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="minThreshold"
                                    label="Mức tối thiểu"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Vui lòng nhập mức tối thiểu",
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        placeholder="Nhập mức tối thiểu"
                                        style={{
                                            width: "100%",
                                        }}
                                        min={0}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="maxCapacity"
                                    label="Mức tối đa"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng nhập mức tối đa",
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        placeholder="Nhập mức tối đa"
                                        style={{
                                            width: "100%",
                                        }}
                                        min={1}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="importPrice"
                                    label="Giá nhập (VND/đơn vị)"
                                >
                                    <InputNumber
                                        placeholder="Nhập giá nhập"
                                        style={{
                                            width: "100%",
                                        }}
                                        min={0}
                                        formatter={(value) =>
                                            `${value}`.replace(
                                                /\B(?=(\d{3})+(?!\d))/g,
                                                ",",
                                            )
                                        }
                                        parser={(value) =>
                                            Number(
                                                value?.replace(
                                                    /\$\s?|(,*)/g,
                                                    "",
                                                ) || 0,
                                            ) as any
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="supplier" label="Nhà cung cấp">
                                    <Input placeholder="Nhập nhà cung cấp" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="longStockAlertDays"
                                    label="Cảnh báo tồn quá lâu (ngày)"
                                    tooltip="Số ngày không có giao dịch để cảnh báo tồn quá lâu"
                                >
                                    <InputNumber
                                        placeholder="Nhập số ngày"
                                        style={{
                                            width: "100%",
                                        }}
                                        min={1}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    name="image"
                                    label="Ảnh nguyên liệu"
                                >
                                    <Upload
                                        listType="picture-card"
                                        maxCount={1}
                                        fileList={imageFileList}
                                        onChange={({ fileList }) => {
                                            setImageFileList(fileList);
                                            // Set image URL to form if file has URL
                                            if (fileList.length > 0 && fileList[0].url) {
                                                editForm.setFieldValue("image", fileList[0].url);
                                            } else if (fileList.length === 0) {
                                                editForm.setFieldValue("image", undefined);
                                            }
                                        }}
                                        beforeUpload={(file) => {
                                            const isImage = file.type.startsWith("image/");
                                            if (!isImage) {
                                                message.error("Chỉ được upload file ảnh!");
                                                return Upload.LIST_IGNORE;
                                            }
                                            const isLt2M = file.size / 1024 / 1024 < 2;
                                            if (!isLt2M) {
                                                message.error("Ảnh phải nhỏ hơn 2MB!");
                                                return Upload.LIST_IGNORE;
                                            }
                                            return false; // Prevent auto upload
                                        }}
                                    >
                                        {imageFileList.length < 1 && (
                                            <div>
                                                <UploadOutlined />
                                                <div style={{ marginTop: 8 }}>Upload</div>
                                            </div>
                                        )}
                                    </Upload>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <Modal
                    title="Xác nhận xóa"
                    open={isDeleteModalOpen}
                    onOk={handleDelete}
                    onCancel={() => {
                        setIsDeleteModalOpen(false);
                        setSelectedMaterial(null);
                    }}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    destroyOnHidden
                >
                    <p>
                        Bạn có chắc chắn muốn xóa vật liệu{" "}
                        <strong>{selectedMaterial?.name}</strong>? Hành động này
                        không thể hoàn tác.
                    </p>
                </Modal>
            )}

            {/* Export Modal */}
            {isExportModalOpen && (
                <Modal
                    title="Xuất kho vật liệu"
                    open={isExportModalOpen}
                    onOk={handleExport}
                    onCancel={() => {
                        setIsExportModalOpen(false);
                        exportForm.resetFields();
                    }}
                    width={600}
                    okText="Xuất kho"
                    cancelText="Hủy"
                    destroyOnHidden
                >
                    <Form form={exportForm} layout="vertical" className="mt-4">
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="materialId"
                                    label="Vật liệu"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng chọn vật liệu",
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder="Chọn vật liệu"
                                        showSearch={{
                                            filterOption: (
                                                input: string,
                                                option:
                                                    | { label: string }
                                                    | undefined,
                                            ) =>
                                                (option?.label ?? "")
                                                    .toLowerCase()
                                                    .includes(
                                                        input.toLowerCase(),
                                                    ),
                                        }}
                                        options={materials.map((m) => ({
                                            label: `${m.name} (${m.category}) - Tồn: ${m.stockQuantity} ${m.unit} - ${m.supplier}`,
                                            value: m.id,
                                        }))}
                                        onChange={(value) => {
                                            const material = materials.find(
                                                (m) => m.id === value,
                                            );
                                            if (material) {
                                                exportForm.setFieldsValue({
                                                    unit: material.unit,
                                                    importPrice:
                                                        material.importPrice ||
                                                        0,
                                                    supplier:
                                                        material.supplier || "",
                                                });
                                            }
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="quantity"
                                    label="Số lượng"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng nhập số lượng",
                                        },
                                        {
                                            type: "number",
                                            min: 1,
                                            message: "Số lượng phải lớn hơn 0",
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        placeholder="Nhập số lượng"
                                        style={{
                                            width: "100%",
                                        }}
                                        min={1}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="unit" label="Đơn vị">
                                    <Input disabled placeholder="Đơn vị" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="importPrice"
                                    label="Giá nhập (VND/đơn vị)"
                                >
                                    <InputNumber
                                        disabled
                                        style={{
                                            width: "100%",
                                        }}
                                        formatter={(value) =>
                                            `${value}`.replace(
                                                /\B(?=(\d{3})+(?!\d))/g,
                                                ",",
                                            )
                                        }
                                        parser={(value) =>
                                            Number(
                                                value?.replace(
                                                    /\$\s?|(,*)/g,
                                                    "",
                                                ) || 0,
                                            ) as any
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="price"
                                    label="Giá xuất (VND/đơn vị)"
                                    tooltip="Nếu không nhập, sẽ sử dụng giá nhập của vật liệu"
                                >
                                    <InputNumber
                                        placeholder="Nhập giá xuất (tùy chọn)"
                                        style={{
                                            width: "100%",
                                        }}
                                        min={0}
                                        formatter={(value) =>
                                            `${value}`.replace(
                                                /\B(?=(\d{3})+(?!\d))/g,
                                                ",",
                                            )
                                        }
                                        parser={(value) =>
                                            Number(
                                                value?.replace(
                                                    /\$\s?|(,*)/g,
                                                    "",
                                                ) || 0,
                                            ) as any
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="exportDate"
                                    label="Ngày xuất"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng chọn ngày",
                                        },
                                    ]}
                                    initialValue={dayjs()}
                                >
                                    <DatePicker
                                        style={{
                                            width: "100%",
                                        }}
                                        format="DD/MM/YYYY"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="supplier" label="Nhà cung cấp">
                                    <Input
                                        disabled
                                        placeholder="Nhà cung cấp"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    name="reason"
                                    label="Lý do xuất"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng nhập lý do",
                                        },
                                    ]}
                                >
                                    <Input.TextArea
                                        rows={3}
                                        placeholder="Nhập lý do xuất kho..."
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="note" label="Ghi chú">
                                    <Input.TextArea
                                        rows={3}
                                        placeholder="Nhập ghi chú..."
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            )}

            {/* Purchase Request Modal */}
            {isPurchaseRequestModalOpen && (
                <Modal
                    title="Đề xuất mua nguyên liệu"
                    open={isPurchaseRequestModalOpen}
                    onOk={async () => {
                        try {
                            const values = await purchaseRequestForm.validateFields();
                            const database = getDatabase(firebaseApp);
                            const requestId = genCode("PR_");
                            const now = Date.now();

                            const material = materials.find(
                                (m) => m.id === values.materialId,
                            );

                            if (!material) {
                                message.error("Không tìm thấy vật liệu!");
                                return;
                            }

                            const items: PurchaseRequestItem[] = [{
                                materialId: material.id,
                                materialName: material.name,
                                quantity: values.quantity,
                                unit: material.unit,
                                suggestedPrice: values.suggestedPrice || 0,
                                totalPrice: (values.suggestedPrice || 0) * values.quantity,
                                note: values.note || "",
                            }];

                            const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

                            const purchaseRequest: PurchaseRequest = {
                                id: requestId,
                                code: requestId,
                                items,
                                totalAmount,
                                status: "pending",
                                requestedBy: user?.uid || "",
                                requestedByName: user?.displayName || user?.email || "Không rõ",
                                requestedAt: now,
                                createdAt: now,
                                updatedAt: now,
                            };

                            await set(ref(database, `xoxo/purchase_requests/${requestId}`), purchaseRequest);

                            message.success("Đã tạo phiếu đề xuất mua thành công!");
                            setIsPurchaseRequestModalOpen(false);
                            purchaseRequestForm.resetFields();
                        } catch (error) {
                            console.error("Error creating purchase request:", error);
                            message.error("Không thể tạo phiếu đề xuất mua!");
                        }
                    }}
                    onCancel={() => {
                        setIsPurchaseRequestModalOpen(false);
                        purchaseRequestForm.resetFields();
                    }}
                    width={600}
                    okText="Tạo đề xuất"
                    cancelText="Hủy"
                    destroyOnHidden
                >
                    <Form form={purchaseRequestForm} layout="vertical" className="mt-4">
                        <Form.Item
                            name="materialId"
                            label="Vật liệu"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng chọn vật liệu",
                                },
                            ]}
                        >
                            <Select
                                placeholder="Chọn vật liệu"
                                disabled
                                options={materials.map((m) => ({
                                    label: `${m.name} (${m.category}) - Tồn: ${m.stockQuantity} ${m.unit}`,
                                    value: m.id,
                                }))}
                            />
                        </Form.Item>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="quantity"
                                    label="Số lượng"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng nhập số lượng",
                                        },
                                        {
                                            type: "number",
                                            min: 1,
                                            message: "Số lượng phải lớn hơn 0",
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        placeholder="Nhập số lượng"
                                        style={{ width: "100%" }}
                                        min={1}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="unit" label="Đơn vị">
                                    <Input disabled placeholder="Đơn vị" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item
                            name="suggestedPrice"
                            label="Giá đề xuất (VND/đơn vị)"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập giá đề xuất",
                                },
                                {
                                    type: "number",
                                    min: 0,
                                    message: "Giá phải lớn hơn hoặc bằng 0",
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder="Nhập giá đề xuất"
                                style={{ width: "100%" }}
                                min={0}
                                formatter={(value) =>
                                    `${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ",",
                                    )
                                }
                                parser={(value) =>
                                    Number(
                                        value?.replace(/\$\s?|(,*)/g, "") || 0,
                                    ) as any
                                }
                            />
                        </Form.Item>
                        <Form.Item
                            name="note"
                            label="Ghi chú"
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="Nhập ghi chú (nếu có)"
                            />
                        </Form.Item>
                        <Descriptions bordered column={1} size="small" className="mb-4">
                            <Descriptions.Item label="Người đề xuất">
                                {user?.displayName || user?.email || "Chưa xác định"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời gian">
                                {dayjs().format("DD/MM/YYYY HH:mm")}
                            </Descriptions.Item>
                        </Descriptions>
                    </Form>
                </Modal>
            )}

            {/* Material History Modal */}
            <Modal
                title={
                    <div>
                        <Text strong>Lịch sử xuất nhập tồn: </Text>
                        <Text>{selectedMaterialForHistory?.name || ""}</Text>
                        {selectedMaterialForHistory && (
                            <div style={{ marginTop: 8 }}>
                                <Tag color="blue" style={{ fontSize: 14 }}>
                                    Tồn hiện tại: {selectedMaterialForHistory.stockQuantity} {getUnitLabel(selectedMaterialForHistory.unit)}
                                </Tag>
                            </div>
                        )}
                    </div>
                }
                open={isHistoryModalOpen}
                onCancel={() => {
                    setIsHistoryModalOpen(false);
                    setSelectedMaterialForHistory(null);
                    setHistoryTransactions([]);
                }}
                footer={null}
                width={1200}
            >
                {(() => {
                    // Tính toán số tồn sau mỗi giao dịch
                    // Sắp xếp từ mới đến cũ để tính ngược từ tồn hiện tại
                    const sortedTransactions = [...historyTransactions].sort((a, b) => b.createdAt - a.createdAt);
                    
                    // Bắt đầu từ số tồn hiện tại và tính ngược lại
                    let currentStock = selectedMaterialForHistory?.stockQuantity || 0;
                    const transactionsWithStock = sortedTransactions.map((transaction) => {
                        // Tính tồn trước giao dịch này
                        let stockBefore = currentStock;
                        if (transaction.type === "import") {
                            stockBefore = currentStock - transaction.quantity; // Trừ đi số nhập
                        } else {
                            stockBefore = currentStock + transaction.quantity; // Cộng lại số xuất
                        }
                        
                        // Tồn sau giao dịch này chính là currentStock
                        const stockAfter = currentStock;
                        
                        // Cập nhật currentStock cho giao dịch tiếp theo (cũ hơn)
                        currentStock = Math.max(0, stockBefore);
                        
                        return {
                            ...transaction,
                            stockAfter: stockAfter,
                            stockBefore: Math.max(0, stockBefore),
                        };
                    });

                    return (
                        <Table
                            columns={[
                                {
                                    title: "Mã giao dịch",
                                    dataIndex: "code",
                                    key: "code",
                                    width: 150,
                                    fixed: "left",
                                    render: (code: string) => (
                                        <Text strong className="font-mono text-xs">
                                            {code}
                                        </Text>
                                    ),
                                },
                                {
                                    title: "Ngày",
                                    dataIndex: "date",
                                    key: "date",
                                    width: 120,
                                    sorter: (a: any, b: any) => {
                                        const dateA = new Date(a.date).getTime();
                                        const dateB = new Date(b.date).getTime();
                                        return dateB - dateA;
                                    },
                                },
                                {
                                    title: "Loại",
                                    dataIndex: "type",
                                    key: "type",
                                    width: 100,
                                    render: (type: string) => (
                                        <Tag color={type === "import" ? "green" : "red"}>
                                            {type === "import" ? "Nhập" : "Xuất"}
                                        </Tag>
                                    ),
                                },
                                {
                                    title: "Số lượng",
                                    dataIndex: "quantity",
                                    key: "quantity",
                                    width: 120,
                                    render: (quantity: number, record: InventoryTransaction) => (
                                        <Text strong={record.type === "export"} style={{ color: record.type === "export" ? "#ff4d4f" : "#52c41a" }}>
                                            {record.type === "export" ? "-" : "+"}{quantity} {record.unit}
                                        </Text>
                                    ),
                                },
                                {
                                    title: "Tồn kho",
                                    key: "stockAfter",
                                    width: 120,
                                    render: (_: any, record: any) => (
                                        <Text strong style={{ color: record.stockAfter < (selectedMaterialForHistory?.minThreshold || 0) ? "#ff4d4f" : "#52c41a" }}>
                                            {record.stockAfter} {record.unit}
                                        </Text>
                                    ),
                                },
                                {
                                    title: "Đơn giá",
                                    dataIndex: "price",
                                    key: "price",
                                    width: 150,
                                    render: (price: number) =>
                                        price
                                            ? new Intl.NumberFormat("vi-VN", {
                                                  style: "currency",
                                                  currency: "VND",
                                              }).format(price)
                                            : "-",
                                },
                                {
                                    title: "Thành tiền",
                                    dataIndex: "totalAmount",
                                    key: "totalAmount",
                                    width: 150,
                                    render: (totalAmount: number) =>
                                        totalAmount
                                            ? new Intl.NumberFormat("vi-VN", {
                                                  style: "currency",
                                                  currency: "VND",
                                              }).format(totalAmount)
                                            : "-",
                                },
                                {
                                    title: "Lý do",
                                    dataIndex: "reason",
                                    key: "reason",
                                    width: 200,
                                },
                                {
                                    title: "Ghi chú",
                                    dataIndex: "note",
                                    key: "note",
                                    width: 200,
                                },
                            ]}
                            dataSource={transactionsWithStock}
                            loading={historyLoading}
                            rowKey="code"
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showTotal: (total) => `Tổng: ${total} giao dịch`,
                            }}
                            scroll={{ x: 1200, y: 400 }}
                        />
                    );
                })()}
            </Modal>
        </>
    );
}
