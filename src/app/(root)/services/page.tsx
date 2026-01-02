"use client";

import ServiceFormModal from "@/components/ServiceFormModal";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import type {
    FirebaseBrands,
    FirebaseServiceCategories,
    FirebaseServices,
    Service,
} from "@/types/service";
import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    LeftOutlined,
    PlusOutlined,
    RightOutlined,
} from "@ant-design/icons";
import {
    App,
    Button,
    Card,
    Descriptions,
    Drawer,
    Empty,
    Image,
    Menu,
    Modal,
    Space,
    Table,
    Tag,
    Typography,
} from "antd";
import type { ServiceCategory } from "@/types/service";
import { getDatabase, onValue, ref, remove } from "firebase/database";
import { useEffect, useState } from "react";

const { Text, Title } = Typography;

// Service Card Component with Gallery
const ServiceCard: React.FC<{
    service: Service & { key: string };
    onView: (code: string) => void;
    onEdit: (code: string) => void;
    onDelete: (code: string) => void;
    getCategoryPath: (code?: string) => string;
}> = ({ service, onView, onEdit, onDelete, getCategoryPath }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = service.images || [];
    const hasImages = images.length > 0;

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (images.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (images.length > 0) {
            setCurrentImageIndex(
                (prev) => (prev - 1 + images.length) % images.length,
            );
        }
    };

    const categoryPath = getCategoryPath(service.categoryCode);
    const displayPrice = service.sellingPrice 
        ? service.sellingPrice 
        : (service.priceFrom && service.priceTo ? { from: service.priceFrom, to: service.priceTo } : null);

    return (
        <Card
            hoverable
            className="h-full"
            size="small"
            cover={
                <div className="relative h-32 bg-gray-100 overflow-hidden">
                    {hasImages ? (
                        <>
                            <Image
                                src={images[currentImageIndex]}
                                alt={service.name}
                                className="w-full h-full object-cover"
                                preview={false}
                            />
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-all text-xs"
                                    >
                                        <LeftOutlined />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-all text-xs"
                                    >
                                        <RightOutlined />
                                    </button>
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/50 text-white px-1.5 py-0.5 rounded text-[10px]">
                                        {currentImageIndex + 1}/{images.length}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={false}
                            className="h-full flex items-center justify-center"
                        />
                    )}
                </div>
            }
            styles={{
                body: {
                    padding: "12px",
                },
            }}
        >
            <div className="space-y-2">
                {/* Tên dịch vụ và category */}
                <div>
                    <Text
                        strong
                        className="text-sm line-clamp-2 block mb-1"
                        title={service.name}
                    >
                        {service.name}
                    </Text>
                    {categoryPath && (
                        <Text type="secondary" className="text-xs">
                            {categoryPath}
                        </Text>
                    )}
                </div>

                {/* Giá */}
                {displayPrice && (
                    <div>
                        <Text strong className="text-base text-primary">
                            {typeof displayPrice === 'number' 
                                ? `${new Intl.NumberFormat("vi-VN").format(displayPrice)} đ`
                                : `${new Intl.NumberFormat("vi-VN").format(displayPrice.from)} - ${new Intl.NumberFormat("vi-VN").format(displayPrice.to)} đ`
                            }
                        </Text>
                    </div>
                )}

                {/* Nút hành động */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onView(service.code);
                        }}
                        className="flex-1"
                    >
                        Xem
                    </Button>
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(service.code);
                        }}
                        className="flex-1"
                    >
                        Sửa
                    </Button>
                    <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(service.code);
                        }}
                        className="flex-1"
                    >
                        Xóa
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default function ServicesPage() {
    const [services, setServices] = useState<FirebaseServices>({});
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [viewingService, setViewingService] = useState<Service | null>(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [serviceCategories, setServiceCategories] =
        useState<FirebaseServiceCategories>({});
    const [allServiceCategories, setAllServiceCategories] = useState<
        ServiceCategory[]
    >([]);
    const [brands, setBrands] = useState<FirebaseBrands>({});
    const { message, modal } = App.useApp();
    const { query, applyFilter, updateQuery, reset } = useFilter();
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    // Load services from Firebase
    useEffect(() => {
        const database = getDatabase();
        const servicesRef = ref(database, "xoxo/services");

        const unsubscribe = onValue(
            servicesRef,
            (snapshot) => {
                const data = snapshot.val() || {};
                setServices(data);
                setLoading(false);
            },
            (error) => {
                console.error("Error loading services:", error);
                message.error("Không thể tải danh sách dịch vụ!");
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [message]);

    // Load service categories
    useEffect(() => {
        const database = getDatabase();
        const categoriesRef = ref(database, "xoxo/serviceCategories");

        const unsubscribe = onValue(categoriesRef, (snapshot) => {
            const data = snapshot.val() || {};
            setServiceCategories(data);
            // Convert to array for tree building
            const categoriesArray = Object.entries(data).map(([code, cat]) => ({
                code,
                ...(cat as Omit<ServiceCategory, "code">),
            }));
            setAllServiceCategories(categoriesArray);
        });

        return () => unsubscribe();
    }, []);

    // Load brands
    useEffect(() => {
        const database = getDatabase();
        const brandsRef = ref(database, "xoxo/brands");

        const unsubscribe = onValue(brandsRef, (snapshot) => {
            const data = snapshot.val() || {};
            setBrands(data);
        });

        return () => unsubscribe();
    }, []);

    const handleOpenModal = (serviceCode?: string) => {
        if (serviceCode) {
            const service = services[serviceCode];
            setEditingService(service);
        } else {
            setEditingService(null);
        }
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingService(null);
    };

    const handleViewService = (serviceCode: string) => {
        const service = services[serviceCode];
        setViewingService(service);
        setDrawerVisible(true);
    };

    const handleCloseDrawer = () => {
        setDrawerVisible(false);
        setViewingService(null);
    };

    const handleBatchDelete = () => {
        if (selectedRowKeys.length === 0) {
            message.warning("Vui lòng chọn ít nhất một dịch vụ để xóa!");
            return;
        }

        const selectedServices = selectedRowKeys.map((key) => {
            const service = services[key as string];
            return service ? service.name : key;
        }).filter(Boolean);

        modal.confirm({
            title: "Xác nhận xóa hàng loạt",
            content: (
                <div>
                    <p>Bạn có chắc chắn muốn xóa {selectedRowKeys.length} dịch vụ:</p>
                    <ul className="list-disc list-inside mt-2 max-h-40 overflow-y-auto">
                        {selectedServices.slice(0, 10).map((name, index) => (
                            <li key={index} className="text-sm">{name}</li>
                        ))}
                        {selectedServices.length > 10 && (
                            <li className="text-sm text-gray-500">
                                ...và {selectedServices.length - 10} dịch vụ khác
                            </li>
                        )}
                    </ul>
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
                    const deletePromises = selectedRowKeys.map((key) => {
                        const serviceRef = ref(
                            database,
                            `xoxo/services/${key}`,
                        );
                        return remove(serviceRef);
                    });

                    await Promise.all(deletePromises);
                    message.success(`Đã xóa thành công ${selectedRowKeys.length} dịch vụ!`);
                    setSelectedRowKeys([]);
                } catch (error) {
                    console.error("Error deleting services:", error);
                    message.error("Có lỗi xảy ra khi xóa dịch vụ!");
                }
            },
        });
    };

    const handleDelete = (serviceCode: string, onCloseDrawer?: () => void) => {
        const service = services[serviceCode];
        modal.confirm({
            title: "Xác nhận xóa",
            content: (
                <div>
                    <p>Bạn có chắc chắn muốn xóa dịch vụ:</p>
                    <p className="font-semibold">{service.name}?</p>
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
                    const serviceRef = ref(
                        database,
                        `xoxo/services/${serviceCode}`,
                    );
                    await remove(serviceRef);
                    message.success("Xóa dịch vụ thành công!");
                    if (onCloseDrawer) {
                        onCloseDrawer();
                    }
                } catch (error) {
                    console.error("Error deleting service:", error);
                    message.error("Có lỗi xảy ra khi xóa dịch vụ!");
                }
            },
        });
    };

    const dataSource = Object.entries(services).map(([code, service]) => ({
        ...service,
        key: code,
    }));

    const filteredData = applyFilter(dataSource);

    const getCategoryPath = (categoryCode?: string): string => {
        if (!categoryCode) return "";
        const path: string[] = [];
        let current = allServiceCategories.find((c) => c.code === categoryCode);
        while (current) {
            path.unshift(current.name);
            current = current.parentCode
                ? allServiceCategories.find((c) => c.code === current!.parentCode)
                : undefined;
        }
        return path.join(" > ");
    };

    // Build category tree
    const buildCategoryTree = (categories: ServiceCategory[]): ServiceCategory[] => {
        const categoryMap = new Map<string, ServiceCategory>();
        const rootCategories: ServiceCategory[] = [];

        // First pass: create map
        categories.forEach((cat) => {
            categoryMap.set(cat.code, { ...cat, children: [] });
        });

        // Second pass: build tree
        categories.forEach((cat) => {
            const category = categoryMap.get(cat.code)!;
            if (cat.parentCode && categoryMap.has(cat.parentCode)) {
                const parent = categoryMap.get(cat.parentCode)!;
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(category);
            } else {
                rootCategories.push(category);
            }
        });

        return rootCategories;
    };

    // Get level name
    const getLevelName = (level: number): string => {
        switch (level) {
            case 0:
                return "Ông";
            case 1:
                return "Cha";
            case 2:
                return "Con";
            case 3:
                return "Cháu";
            default:
                return `Cấp ${level}`;
        }
    };

    // Get all child category codes recursively
    const getAllChildCategoryCodes = (
        categoryCode: string,
    ): string[] => {
        const result: string[] = [categoryCode];
        const children = allServiceCategories.filter(
            (cat) => cat.parentCode === categoryCode,
        );
        children.forEach((child) => {
            result.push(...getAllChildCategoryCodes(child.code));
        });
        return result;
    };

    // Selected category state
    const [selectedCategoryCode, setSelectedCategoryCode] = useState<
        string | null
    >(null);

    // Get services for selected category (including all children)
    const getServicesForCategory = (categoryCode: string | null) => {
        if (categoryCode === null) {
            // Show all services
            return filteredData;
        }
        if (categoryCode === "no-category") {
            // Show services without category
            return filteredData.filter((service) => !service.categoryCode);
        }

        // Get all category codes (including children)
        const allCategoryCodes = getAllChildCategoryCodes(categoryCode);

        // Filter services that belong to any of these categories
        return filteredData.filter(
            (service) =>
                service.categoryCode &&
                allCategoryCodes.includes(service.categoryCode),
        );
    };

    // Build menu items recursively - flatten to show all items at same level with indent
    const buildMenuItems = (
        categories: ServiceCategory[],
        level: number = 0,
    ): any[] => {
        const result: any[] = [];
        
        categories.forEach((category) => {
            const children = allServiceCategories.filter(
                (c) => c.parentCode === category.code,
            );
            const serviceCount = getServicesForCategory(category.code).length;

            const menuItem: any = {
                key: category.code,
                label: (
                    <div className="flex items-center justify-between w-full">
                        <Text 
                            ellipsis 
                            style={{ 
                                marginLeft: `${level * 12}px`,
                                fontWeight: level === 0 ? 600 : 400,
                                fontSize: "12px",
                            }}
                        >
                            {category.name}
                        </Text>
                        <Tag 
                            color={category.displayColor || "default"} 
                            style={{ 
                                margin: 0,
                                fontSize: "10px",
                                lineHeight: "16px",
                                height: "16px",
                                padding: "0 4px",
                            }}
                        >
                            {serviceCount}
                        </Tag>
                    </div>
                ),
            };

            result.push(menuItem);

            // Add children recursively
            if (children.length > 0) {
                result.push(...buildMenuItems(children, level + 1));
            }
        });

        return result;
    };

    return (
        <WrapperContent
            header={{
                searchInput: {
                    placeholder: "Tìm kiếm theo tên, mã dịch vụ...",
                    filterKeys: ["name", "code"],
                },
                buttonEnds: [
                    {
                        can: true,
                        name: selectedRowKeys.length > 0 ? `Xóa (${selectedRowKeys.length})` : "Xóa",
                        icon: <DeleteOutlined />,
                        type: "default",
                        danger: selectedRowKeys.length > 0,
                        onClick: handleBatchDelete,
                    },
                    {
                        can: true,
                        name: "Thêm dịch vụ",
                        icon: <PlusOutlined />,
                        type: "primary",
                        onClick: () => handleOpenModal(),
                    },
                ],
            }}
        >
            {loading ? (
                <div className="text-center py-8">Đang tải...</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "row", gap: "16px", alignItems: "flex-start" }}>
                    {/* Left Category Table (20%) */}
                    <div style={{ width: "20%", flexShrink: 0 }}>
                        {(() => {
                            // Build category tree data for expandable table
                            const buildCategoryTreeData = (
                                categories: ServiceCategory[],
                                level: number = 0,
                            ): any[] => {
                                return categories.map((category) => {
                                    const children = allServiceCategories.filter(
                                        (c) => c.parentCode === category.code,
                                    );
                                    const hasChildren = children.length > 0;

                                    return {
                                        key: category.code,
                                        name: category.name,
                                        count: getServicesForCategory(category.code).length,
                                        level,
                                        children: hasChildren ? buildCategoryTreeData(children, level + 1) : undefined,
                                    };
                                });
                            };

                            const rootCategories = buildCategoryTree(allServiceCategories);
                            const categoryTreeData = buildCategoryTreeData(rootCategories, 0);

                            const categoryData = [
                                {
                                    key: "all",
                                    name: "Tất cả",
                                    count: filteredData.length,
                                    level: 0,
                                },
                                ...categoryTreeData,
                                ...(filteredData.filter((s) => !s.categoryCode).length > 0
                                    ? [
                                          {
                                              key: "no-category",
                                              name: "Chưa phân loại",
                                              count: filteredData.filter(
                                                  (s) => !s.categoryCode,
                                              ).length,
                                              level: 0,
                                          },
                                      ]
                                    : []),
                            ];

                            const categoryColumns = [
                                {
                                    title: "Danh mục",
                                    key: "name",
                                    render: (_: any, record: any) => (
                                        <Text
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: record.level === 0 ? 600 : 400,
                                            }}
                                        >
                                            {record.name}
                                        </Text>
                                    ),
                                },
                                {
                                    title: "SL",
                                    key: "count",
                                    width: 50,
                                    render: (_: any, record: any) => (
                                        <Tag
                                            color={record.key === "all" ? "blue" : "default"}
                                            style={{
                                                margin: 0,
                                                fontSize: "10px",
                                                lineHeight: "16px",
                                                height: "16px",
                                                padding: "0 4px",
                                            }}
                                        >
                                            {record.count}
                                        </Tag>
                                    ),
                                },
                            ];

                            return (
                                <Table
                                    dataSource={categoryData}
                                    columns={categoryColumns}
                                    rowKey="key"
                                    pagination={false}
                                    size="small"
                                    expandable={{
                                        childrenColumnName: "children",
                                        defaultExpandAllRows: false,
                                    }}
                                    rowClassName={(record) =>
                                        selectedCategoryCode === record.key ||
                                        (record.key === "all" && selectedCategoryCode === null)
                                            ? "ant-table-row-selected"
                                            : ""
                                    }
                                    onRow={(record) => ({
                                        onClick: () => {
                                            setSelectedCategoryCode(
                                                record.key === "all" ? null : record.key,
                                            );
                                        },
                                        style: { cursor: "pointer" },
                                    })}
                                />
                            );
                        })()}
                    </div>

                    {/* Right Services Table (80%) */}
                    <div style={{ width: "80%", flexShrink: 0 }}>
                        {(() => {
                            try {
                                const displayedServices =
                                    getServicesForCategory(selectedCategoryCode);

                                if (displayedServices.length === 0) {
                                    return (
                                        <Empty description="Chưa có dịch vụ nào trong danh mục này" />
                                    );
                                }

                                const columns = [
                                    {
                                        title: "Ảnh",
                                        key: "image",
                                        width: 80,
                                        render: (_: any, record: Service & { key: string }) => {
                                            const images = record.images || [];
                                            return images.length > 0 ? (
                                                <Image
                                                    src={images[0]}
                                                    alt={record.name}
                                                    width={50}
                                                    height={50}
                                                    style={{ objectFit: "cover", borderRadius: "4px" }}
                                                    preview={{
                                                        mask: "Xem",
                                                    }}
                                                />
                                            ) : (
                                                <Empty
                                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                    description={false}
                                                    style={{ width: 50, height: 50 }}
                                                />
                                            );
                                        },
                                    },
                                    {
                                        title: "Tên dịch vụ",
                                        key: "name",
                                        render: (_: any, record: Service & { key: string }) => {
                                            const workflowCount = record.operationalWorkflowIds?.length || 0;
                                            return (
                                                <div>
                                                    <Text strong style={{ fontSize: "13px" }}>
                                                        {record.name}
                                                    </Text>
                                                    {workflowCount > 0 && (
                                                        <div>
                                                            <Text type="secondary" style={{ fontSize: "11px" }}>
                                                                {workflowCount} công đoạn
                                                            </Text>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        },
                                    },
                                    {
                                        title: "Giá",
                                        key: "price",
                                        width: 150,
                                        render: (_: any, record: Service & { key: string }) => {
                                            const displayPrice = record.sellingPrice 
                                                ? record.sellingPrice 
                                                : (record.priceFrom && record.priceTo ? { from: record.priceFrom, to: record.priceTo } : null);
                                            
                                            if (!displayPrice) return "-";
                                            
                                            return (
                                                <Text strong className="text-primary" style={{ fontSize: "13px" }}>
                                                    {typeof displayPrice === 'number' 
                                                        ? `${new Intl.NumberFormat("vi-VN").format(displayPrice)} đ`
                                                        : `${new Intl.NumberFormat("vi-VN").format(displayPrice.from)} - ${new Intl.NumberFormat("vi-VN").format(displayPrice.to)} đ`
                                                    }
                                                </Text>
                                            );
                                        },
                                    },
                                    {
                                        title: "Thao tác",
                                        key: "actions",
                                        width: 180,
                                        fixed: "right" as const,
                                        render: (_: any, record: Service & { key: string }) => (
                                            <Space size="small">
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<EyeOutlined />}
                                                    onClick={() => handleViewService(record.code)}
                                                >
                                                    Xem
                                                </Button>
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<EditOutlined />}
                                                    onClick={() => handleOpenModal(record.code)}
                                                >
                                                    Sửa
                                                </Button>
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => handleDelete(record.code)}
                                                >
                                                    Xóa
                                                </Button>
                                            </Space>
                                        ),
                                    },
                                ];

                                const rowSelectionConfig = {
                                    type: "checkbox" as const,
                                    selectedRowKeys,
                                    onChange: (selectedKeys: React.Key[]) => {
                                        setSelectedRowKeys(selectedKeys);
                                    },
                                };

                                return (
                                    <Table
                                        dataSource={displayedServices}
                                        columns={columns}
                                        rowKey="code"
                                        rowSelection={rowSelectionConfig}
                                        pagination={{
                                            pageSize: 20,
                                            showSizeChanger: true,
                                            showTotal: (total) => `Tổng ${total} dịch vụ`,
                                        }}
                                        size="small"
                                        scroll={{ x: "max-content" }}
                                    />
                                );
                            } catch (error) {
                                console.error(
                                    "Error rendering services:",
                                    error,
                                );
                                return (
                                    <Empty description="Có lỗi xảy ra khi hiển thị dịch vụ" />
                                );
                            }
                        })()}
                    </div>
                </div>
            )}

            {/* View Service Drawer */}
            <Drawer
                title="Chi tiết dịch vụ"
                placement="right"
                onClose={handleCloseDrawer}
                open={drawerVisible}
                width={600}
                extra={
                    viewingService && (
                        <Space>
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => {
                                    handleCloseDrawer();
                                    handleOpenModal(viewingService.code);
                                }}
                            >
                                Sửa
                            </Button>
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                    handleCloseDrawer();
                                    handleDelete(viewingService.code);
                                }}
                            >
                                Xóa
                            </Button>
                        </Space>
                    )
                }
            >
                {viewingService && (
                    <div className="space-y-6">
                        {/* Images */}
                        {viewingService.images &&
                            viewingService.images.length > 0 && (
                                <div>
                                    <Title level={5}>Hình ảnh</Title>
                                    <Image.PreviewGroup>
                                        <div className="grid grid-cols-2 gap-2">
                                            {viewingService.images.map(
                                                (img, index) => (
                                                    <Image
                                                        key={index}
                                                        src={img}
                                                        alt={`${viewingService.name} - ${index + 1}`}
                                                        className="rounded"
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </Image.PreviewGroup>
                                </div>
                            )}

                        {/* Basic Information */}
                        <div>
                            <Title level={5}>Thông tin cơ bản</Title>
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="Mã dịch vụ">
                                    <Text strong>{viewingService.code}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Tên dịch vụ">
                                    <Text strong>{viewingService.name}</Text>
                                </Descriptions.Item>
                                {viewingService.categoryCode && (
                                    <Descriptions.Item label="Nhóm hàng">
                                        <Tag color="blue">
                                            {getCategoryPath(
                                                viewingService.categoryCode,
                                            )}
                                        </Tag>
                                    </Descriptions.Item>
                                )}
                                {viewingService.brandCode && (
                                    <Descriptions.Item label="Thương hiệu">
                                        <Tag>{viewingService.brandCode}</Tag>
                                    </Descriptions.Item>
                                )}
                                {viewingService.sellingPrice && (
                                    <Descriptions.Item label="Giá bán">
                                        <Text strong className="text-primary">
                                            {new Intl.NumberFormat("vi-VN").format(
                                                viewingService.sellingPrice,
                                            )}{" "}
                                            đ
                                        </Text>
                                    </Descriptions.Item>
                                )}
                                {viewingService.priceFrom && viewingService.priceTo && (
                                    <>
                                        <Descriptions.Item label="Từ khoảng giá">
                                            <Text>
                                                {new Intl.NumberFormat("vi-VN").format(
                                                    viewingService.priceFrom,
                                                )}{" "}
                                                đ
                                            </Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Tới khoảng giá">
                                            <Text>
                                                {new Intl.NumberFormat("vi-VN").format(
                                                    viewingService.priceTo,
                                                )}{" "}
                                                đ
                                            </Text>
                                        </Descriptions.Item>
                                    </>
                                )}
                                {viewingService.imageNotes && (
                                    <Descriptions.Item label="Ghi chú hình ảnh">
                                        <Text>{viewingService.imageNotes}</Text>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </div>

                        {/* Description */}
                        {viewingService.description && (
                            <div>
                                <Title level={5}>Mô tả</Title>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: viewingService.description,
                                    }}
                                    className="prose prose-sm max-w-none"
                                />
                            </div>
                        )}

                        {/* Notes */}
                        {viewingService.notes && (
                            <div>
                                <Title level={5}>Ghi chú</Title>
                                <Text>{viewingService.notes}</Text>
                            </div>
                        )}
                    </div>
                )}
            </Drawer>

            <ServiceFormModal
                open={modalVisible}
                editingService={editingService}
                serviceCategories={serviceCategories}
                brands={brands}
                onCancel={handleCloseModal}
                onSuccess={handleCloseModal}
            />
        </WrapperContent>
    );
}

