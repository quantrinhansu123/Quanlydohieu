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

    return (
        <Card
            hoverable
            className="h-full"
            size="small"
            cover={
                <div className="relative h-56 bg-gray-100 overflow-hidden">
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
            actions={[
                <EyeOutlined
                    key="view"
                    onClick={() => onView(service.code)}
                    className="text-base text-blue-500 hover:text-blue-700"
                />,
                <EditOutlined
                    key="edit"
                    onClick={() => onEdit(service.code)}
                    className="text-base text-green-500 hover:text-green-700"
                />,
                <DeleteOutlined
                    key="delete"
                    onClick={() => onDelete(service.code)}
                    className="text-base text-red-500 hover:text-red-700"
                />,
            ]}
        >
            <div className="space-y-1.5">
                <Text
                    strong
                    className="text-sm line-clamp-2 mb-1 block"
                    title={service.name}
                >
                    {service.name}
                </Text>
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Text type="secondary" className="text-[10px]">
                            Mã:
                        </Text>
                        <Text strong className="text-[10px]">
                            {service.code}
                        </Text>
                    </div>
                    {service.brandCode && (
                        <div className="flex items-center gap-1">
                            <Text type="secondary" className="text-[10px]">
                                Thương hiệu:
                            </Text>
                            <Tag className="text-[10px] m-0 px-1 py-0">
                                {service.brandCode}
                            </Tag>
                        </div>
                    )}
                    <div className="pt-1 border-t border-gray-100">
                        {service.sellingPrice && (
                            <div className="flex items-center justify-between">
                                <Text type="secondary" className="text-[10px]">
                                    Giá bán:
                                </Text>
                                <Text strong className="text-primary text-xs">
                                    {new Intl.NumberFormat("vi-VN").format(
                                        service.sellingPrice,
                                    )}{" "}
                                    đ
                                </Text>
                            </div>
                        )}
                        {service.priceFrom && service.priceTo && (
                            <div className="flex items-center justify-between mt-0.5">
                                <Text type="secondary" className="text-[10px]">
                                    Khoảng giá:
                                </Text>
                                <Text className="text-[10px]">
                                    {new Intl.NumberFormat("vi-VN").format(
                                        service.priceFrom,
                                    )} - {new Intl.NumberFormat("vi-VN").format(
                                        service.priceTo,
                                    )} đ
                                </Text>
                            </div>
                        )}
                    </div>
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
            const levelName = getLevelName(level);
            const serviceCount = getServicesForCategory(category.code).length;

            const menuItem: any = {
                key: category.code,
                label: (
                    <div
                        className="flex items-center justify-between w-full pr-4"
                        style={{ paddingLeft: `${level * 16}px` }}
                    >
                        <div className="flex items-center gap-2">
                            <Tag color={category.displayColor || "default"}>
                                {levelName}
                            </Tag>
                            <Text strong>{category.name}</Text>
                        </div>
                        <Text type="secondary" className="text-xs">
                            ({serviceCount})
                                </Text>
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
                <div className="flex gap-4 h-full">
                    {/* Left Menu */}
                    <div className="w-64 flex-shrink-0">
                        <Menu
                            mode="inline"
                            style={{ width: 256, height: "100%" }}
                            selectedKeys={
                                selectedCategoryCode
                                    ? [selectedCategoryCode]
                                    : ["all"]
                            }
                            onClick={({ key }) => {
                                // When clicking on a category, show all products of that category and its children
                                setSelectedCategoryCode(
                                    key === "all" ? null : key,
                                );
                            }}
                            items={[
                                {
                                    key: "all",
                                    label: (
                                        <div className="flex items-center justify-between">
                                            <Text strong>Tất cả dịch vụ</Text>
                                            <Text type="secondary" className="text-xs">
                                                ({filteredData.length})
                                            </Text>
                                        </div>
                                    ),
                                },
                                ...(allServiceCategories.length > 0
                                    ? buildMenuItems(
                                          buildCategoryTree(allServiceCategories),
                                          0,
                                      )
                                    : []),
                                ...(filteredData.filter((s) => !s.categoryCode)
                                    .length > 0
                                    ? [
                                          {
                                              key: "no-category",
                                              label: (
                                                  <div className="flex items-center justify-between">
                                                      <Tag color="default">
                                                          Không phân loại
                                                      </Tag>
                                                      <Text
                                                          type="secondary"
                                                          className="text-xs"
                                                      >
                                                          (
                                                          {
                                                              filteredData.filter(
                                                                  (s) =>
                                                                      !s.categoryCode,
                                                              ).length
                                                          }
                                                          )
                                                      </Text>
                                                  </div>
                                              ),
                                          },
                                      ]
                                    : []),
                            ]}
                        />
                    </div>

                    {/* Right Content - Services Grid */}
                    <div className="flex-1">
                        {(() => {
                            try {
                                const displayedServices =
                                    getServicesForCategory(selectedCategoryCode);

                                if (displayedServices.length === 0) {
                                    return (
                                        <Empty description="Chưa có dịch vụ nào trong danh mục này" />
                                    );
                                }

                                return (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                        {displayedServices.map((service) => (
                                            <ServiceCard
                                                key={service.code}
                                                service={service}
                                                onView={handleViewService}
                                                onEdit={handleOpenModal}
                                                onDelete={handleDelete}
                                                getCategoryPath={getCategoryPath}
                                            />
                                        ))}
                                    </div>
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

