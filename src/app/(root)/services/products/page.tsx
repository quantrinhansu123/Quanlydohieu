"use client";

import ProductFormModal from "@/components/ProductFormModal";
import WrapperContent from "@/components/WrapperContent";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import useFilter from "@/hooks/useFilter";
import { Product } from "@/types/product";
import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    PlusOutlined,
    DatabaseOutlined,
} from "@ant-design/icons";
import {
    App,
    Button,
    Card,
    Col,
    Descriptions,
    Drawer,
    Empty,
    Image,
    Modal,
    Row,
    Space,
    Table,
    Tag,
    Timeline,
    Typography,
} from "antd";
import { getDatabase, ref, remove, set } from "firebase/database";
import { useState } from "react";

const { Text, Title } = Typography;

export default function ProductsPage() {
    const { data: productsData, isLoading } = useRealtimeList<Product>(
        "xoxo/products",
    );
    const { query, applyFilter } = useFilter();
    const { message, modal } = App.useApp();
    const [modalVisible, setModalVisible] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [seeding, setSeeding] = useState(false);

    const filteredData = applyFilter(productsData || []);

    const handleOpenModal = (productCode?: string) => {
        if (productCode) {
            const product = productsData?.find((p) => p.code === productCode);
            setEditingProduct(product || null);
        } else {
            setEditingProduct(null);
        }
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingProduct(null);
    };

    const handleViewProduct = (productCode: string) => {
        const product = productsData?.find((p) => p.code === productCode);
        setViewingProduct(product || null);
        setDrawerVisible(true);
    };

    const handleCloseDrawer = () => {
        setDrawerVisible(false);
        setViewingProduct(null);
    };

    const handleDelete = (productCode: string) => {
        const product = productsData?.find((p) => p.code === productCode);
        modal.confirm({
            title: "Xác nhận xóa",
            content: `Bạn có chắc chắn muốn xóa sản phẩm "${product?.name}"?`,
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const database = getDatabase();
                    const productRef = ref(database, `xoxo/products/${productCode}`);
                    await remove(productRef);
                    message.success("Xóa sản phẩm thành công!");
                    if (drawerVisible && viewingProduct?.code === productCode) {
                        handleCloseDrawer();
                    }
                } catch (error) {
                    console.error("Error deleting product:", error);
                    message.error("Có lỗi xảy ra khi xóa sản phẩm!");
                }
            },
        });
    };

    const handleSeedData = async () => {
        modal.confirm({
            title: "Tạo dữ liệu mẫu",
            content: "Bạn có muốn tạo 8 sản phẩm mẫu với đầy đủ thông tin và ảnh demo?",
            okText: "Tạo",
            cancelText: "Hủy",
            onOk: async () => {
                setSeeding(true);
                try {
                    const database = getDatabase();
                    const now = new Date().getTime();

                    const sampleProducts = [
                        {
                            name: "Xi Phục Chế Da Thật Premium",
                            category: "Xi (Sáp)",
                            brand: "Leather Care Pro",
                            price: 450000,
                            images: [
                                "https://images.unsplash.com/photo-1624378515193-0c02297064b4?w=800&h=600&fit=crop",
                                "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&h=600&fit=crop",
                            ],
                            description: "<p>Xi phục chế chuyên dụng cho da thật, giúp phục hồi độ bóng và mềm mại cho các sản phẩm da cao cấp.</p>",
                            usage: "Làm sạch bề mặt da trước khi sử dụng. Dùng khăn mềm thoa đều xi lên bề mặt.",
                            specifications: "Dung tích: 250ml | Thành phần: Sáp tự nhiên, dầu dưỡng da",
                            notes: "Bảo quản nơi khô ráo, tránh ánh nắng trực tiếp.",
                        },
                        {
                            name: "Gel Dưỡng Da Tự Nhiên",
                            category: "Gel dưỡng da",
                            brand: "Premium Leather",
                            price: 380000,
                            images: [
                                "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop",
                            ],
                            description: "<p>Gel dưỡng da chuyên dụng, giúp phục hồi độ ẩm và độ đàn hồi cho da.</p>",
                            usage: "Thoa gel đều lên bề mặt, massage nhẹ nhàng trong 5-10 phút.",
                            specifications: "Dung tích: 200ml | Thành phần: Gel tự nhiên, vitamin E",
                            notes: "Sử dụng 2-3 lần/tuần để đạt hiệu quả tốt nhất.",
                        },
                        {
                            name: "Chất Tẩy Rửa Chuyên Dụng",
                            category: "Chất tẩy rửa",
                            brand: "Clean Pro",
                            price: 250000,
                            images: [
                                "https://images.unsplash.com/photo-1584622650111-993a141f33f9?w=800&h=600&fit=crop",
                            ],
                            description: "<p>Chất tẩy rửa chuyên dụng cho đồ da, loại bỏ vết bẩn và mùi hôi.</p>",
                            usage: "Pha loãng với nước theo tỷ lệ 1:10. Dùng khăn mềm lau nhẹ.",
                            specifications: "Dung tích: 500ml | Thành phần: Chất tẩy rửa tự nhiên",
                            notes: "Không sử dụng trực tiếp lên da, luôn pha loãng.",
                        },
                        {
                            name: "Kem Bảo Vệ Da Chống Nước",
                            category: "Kem bảo vệ",
                            brand: "Protect Plus",
                            price: 320000,
                            images: [
                                "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&h=600&fit=crop",
                            ],
                            description: "<p>Kem bảo vệ da chống nước và chống tia UV, giúp bảo vệ sản phẩm da khỏi tác động của môi trường.</p>",
                            usage: "Thoa kem đều lên bề mặt, để khô trong 30 phút.",
                            specifications: "Dung tích: 150ml | Thành phần: Chất bảo vệ UV",
                            notes: "Hiệu quả bảo vệ kéo dài 3-6 tháng.",
                        },
                        {
                            name: "Dầu Dưỡng Da Tự Nhiên",
                            category: "Dầu dưỡng",
                            brand: "Natural Care",
                            price: 420000,
                            images: [
                                "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=600&fit=crop",
                            ],
                            description: "<p>Dầu dưỡng da tự nhiên 100%, giúp phục hồi độ ẩm và độ mềm mại cho da.</p>",
                            usage: "Nhỏ vài giọt dầu lên khăn mềm, thoa đều lên bề mặt da.",
                            specifications: "Dung tích: 100ml | Thành phần: Dầu argan, dầu jojoba",
                            notes: "Sử dụng 1-2 lần/tháng để duy trì độ mềm mại.",
                        },
                        {
                            name: "Bàn Chải Chuyên Dụng Phục Chế",
                            category: "Bàn chải chuyên dụng",
                            brand: "Professional Tools",
                            price: 150000,
                            images: [
                                "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=600&fit=crop",
                            ],
                            description: "<p>Bàn chải chuyên dụng với lông mềm, phù hợp để làm sạch và đánh bóng bề mặt da.</p>",
                            usage: "Chải nhẹ nhàng theo một chiều, tránh chải quá mạnh.",
                            specifications: "Kích thước: 15cm x 5cm | Chất liệu: Lông tự nhiên",
                            notes: "Vệ sinh bàn chải sau mỗi lần sử dụng.",
                        },
                        {
                            name: "Khăn Lau Chuyên Dụng Microfiber",
                            category: "Khăn lau chuyên dụng",
                            brand: "Premium Care",
                            price: 80000,
                            images: [
                                "https://images.unsplash.com/photo-1624378515193-0c02297064b4?w=800&h=600&fit=crop",
                            ],
                            description: "<p>Khăn lau microfiber chuyên dụng, mềm mại, không để lại xơ vải.</p>",
                            usage: "Sử dụng khô để đánh bóng hoặc ẩm để lau sạch.",
                            specifications: "Kích thước: 30cm x 30cm | Chất liệu: Microfiber",
                            notes: "Có thể giặt máy ở nhiệt độ thấp.",
                        },
                        {
                            name: "Bộ Dụng Cụ Phục Chế Đồ Hiệu",
                            category: "Bộ dụng cụ",
                            brand: "Complete Set",
                            price: 1200000,
                            images: [
                                "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop",
                            ],
                            description: "<p>Bộ dụng cụ đầy đủ cho phục chế đồ hiệu, bao gồm: xi phục chế, gel dưỡng, chất tẩy rửa, kem bảo vệ, bàn chải, khăn lau.</p>",
                            usage: "Sử dụng theo hướng dẫn của từng sản phẩm trong bộ.",
                            specifications: "Bao gồm: 7 sản phẩm chính + hộp đựng",
                            notes: "Bộ sản phẩm được đóng gói cẩn thận, phù hợp làm quà tặng.",
                        },
                    ];

                    for (const product of sampleProducts) {
                        const code = `PRD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        const productData: Product = {
                            ...product,
                            code,
                            createdAt: now,
                            updatedAt: now,
                        };

                        const productRef = ref(database, `xoxo/products/${code}`);
                        await set(productRef, productData);
                    }

                    message.success(
                        `Đã tạo thành công ${sampleProducts.length} sản phẩm mẫu!`,
                    );
                } catch (error) {
                    console.error("Error seeding products:", error);
                    message.error("Có lỗi xảy ra khi tạo dữ liệu mẫu!");
                } finally {
                    setSeeding(false);
                }
            },
        });
    };

    return (
        <WrapperContent
            isEmpty={filteredData.length === 0 && !isLoading}
            isLoading={isLoading}
            header={{
                searchInput: {
                    placeholder: "Tìm kiếm theo tên, mã sản phẩm...",
                    filterKeys: ["name", "code", "category", "brand"],
                },
                buttonEnds: [
                    {
                        can: true,
                        name: "Tạo dữ liệu mẫu",
                        icon: <DatabaseOutlined />,
                        type: "default",
                        onClick: handleSeedData,
                        loading: seeding,
                    },
                    {
                        can: true,
                        name: "Thêm sản phẩm",
                        icon: <PlusOutlined />,
                        type: "primary",
                        onClick: () => handleOpenModal(),
                    },
                ],
            }}
        >
            {filteredData.length === 0 ? (
                <Empty description="Chưa có sản phẩm nào" />
            ) : (
                <Row gutter={[16, 16]}>
                    {filteredData.map((product) => (
                        <Col key={product.code} xs={24} sm={12} md={8} lg={6} xl={4}>
                            <Card
                                hoverable
                                cover={
                                    product.images && product.images.length > 0 ? (
                                        <div className="h-48 bg-gray-100 overflow-hidden">
                                            <Image
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                                preview={false}
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-48 bg-gray-100 flex items-center justify-center">
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description={false}
                                            />
                                        </div>
                                    )
                                }
                                actions={[
                                    <EyeOutlined
                                        key="view"
                                        onClick={() => handleViewProduct(product.code)}
                                        className="text-blue-500 hover:text-blue-700"
                                    />,
                                    <EditOutlined
                                        key="edit"
                                        onClick={() => handleOpenModal(product.code)}
                                        className="text-green-500 hover:text-green-700"
                                    />,
                                    <DeleteOutlined
                                        key="delete"
                                        onClick={() => handleDelete(product.code)}
                                        className="text-red-500 hover:text-red-700"
                                    />,
                                ]}
                            >
                                <div className="space-y-2">
                                    <Title level={5} className="mb-2 line-clamp-2">
                                        {product.name}
                                    </Title>
                                    <div className="space-y-1">
                                        {product.category && (
                                            <div className="flex items-center gap-1">
                                                <Text type="secondary" className="text-xs">
                                                    Loại:
                                                </Text>
                                                <Tag className="text-xs m-0 px-1 py-0">
                                                    {product.category}
                                                </Tag>
                                            </div>
                                        )}
                                        {product.brand && (
                                            <div className="flex items-center gap-1">
                                                <Text type="secondary" className="text-xs">
                                                    Thương hiệu:
                                                </Text>
                                                <Tag className="text-xs m-0 px-1 py-0">
                                                    {product.brand}
                                                </Tag>
                                            </div>
                                        )}
                                        {product.price && (
                                            <div className="pt-1 border-t border-gray-100">
                                                <div className="flex items-center justify-between">
                                                    <Text type="secondary" className="text-xs">
                                                        Giá:
                                                    </Text>
                                                    <Text strong className="text-primary text-sm">
                                                        {new Intl.NumberFormat("vi-VN").format(
                                                            product.price,
                                                        )}{" "}
                                                        đ
                                                    </Text>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <ProductFormModal
                open={modalVisible}
                editingProduct={editingProduct}
                onCancel={handleCloseModal}
                onSuccess={handleCloseModal}
            />

            <Drawer
                title="Chi tiết sản phẩm"
                placement="right"
                onClose={handleCloseDrawer}
                open={drawerVisible}
                width={600}
                extra={
                    viewingProduct && (
                        <Space>
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => {
                                    handleCloseDrawer();
                                    handleOpenModal(viewingProduct.code);
                                }}
                            >
                                Sửa
                            </Button>
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                    handleCloseDrawer();
                                    handleDelete(viewingProduct.code);
                                }}
                            >
                                Xóa
                            </Button>
                        </Space>
                    )
                }
            >
                {viewingProduct && (
                    <div className="space-y-6">
                        {/* Images */}
                        {viewingProduct.images &&
                            viewingProduct.images.length > 0 && (
                                <div>
                                    <Title level={5}>Hình ảnh</Title>
                                    <Image.PreviewGroup>
                                        <div className="grid grid-cols-2 gap-2">
                                            {viewingProduct.images.map((img, index) => (
                                                <Image
                                                    key={index}
                                                    src={img}
                                                    alt={`${viewingProduct.name} - ${index + 1}`}
                                                    className="rounded"
                                                    unoptimized
                                                />
                                            ))}
                                        </div>
                                    </Image.PreviewGroup>
                                </div>
                            )}

                        {/* Basic Information */}
                        <div>
                            <Title level={5}>Thông tin cơ bản</Title>
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="Mã sản phẩm">
                                    <Text strong>{viewingProduct.code}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Tên sản phẩm">
                                    <Text strong>{viewingProduct.name}</Text>
                                </Descriptions.Item>
                                {viewingProduct.category && (
                                    <Descriptions.Item label="Loại sản phẩm">
                                        <Tag>{viewingProduct.category}</Tag>
                                    </Descriptions.Item>
                                )}
                                {viewingProduct.brand && (
                                    <Descriptions.Item label="Thương hiệu">
                                        <Tag>{viewingProduct.brand}</Tag>
                                    </Descriptions.Item>
                                )}
                                {viewingProduct.price && (
                                    <Descriptions.Item label="Giá bán">
                                        <Text strong className="text-primary">
                                            {new Intl.NumberFormat("vi-VN").format(
                                                viewingProduct.price,
                                            )}{" "}
                                            đ
                                        </Text>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </div>

                        {/* Description */}
                        {viewingProduct.description && (
                            <div>
                                <Title level={5}>Mô tả</Title>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: viewingProduct.description,
                                    }}
                                    className="prose prose-sm max-w-none"
                                />
                            </div>
                        )}

                        {/* Usage */}
                        {viewingProduct.usage && (
                            <div>
                                <Title level={5}>Cách sử dụng</Title>
                                <Text>{viewingProduct.usage}</Text>
                            </div>
                        )}

                        {/* Specifications */}
                        {viewingProduct.specifications && (
                            <div>
                                <Title level={5}>Thông số kỹ thuật</Title>
                                <Text>{viewingProduct.specifications}</Text>
                            </div>
                        )}

                        {/* Notes */}
                        {viewingProduct.notes && (
                            <div>
                                <Title level={5}>Ghi chú</Title>
                                <Text>{viewingProduct.notes}</Text>
                            </div>
                        )}

                        {/* Order Tracking */}
                        <div>
                            <Title level={5}>Theo dõi đơn hàng</Title>
                            {(() => {
                                const relatedOrders = ordersData?.filter(
                                    (order) =>
                                        viewingProduct.orderCodes?.includes(order.code) ||
                                        Object.values(order.products || {}).some(
                                            (product) => {
                                                // Check if product name matches or contains product code
                                                return (
                                                    product.name
                                                        .toLowerCase()
                                                        .includes(
                                                            viewingProduct.name.toLowerCase(),
                                                        ) ||
                                                    product.name
                                                        .toLowerCase()
                                                        .includes(
                                                            viewingProduct.code.toLowerCase(),
                                                        )
                                                );
                                            },
                                        ),
                                );

                                if (!relatedOrders || relatedOrders.length === 0) {
                                    return (
                                        <Empty
                                            description="Chưa có đơn hàng nào sử dụng sản phẩm này"
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        />
                                    );
                                }

                                const getStatusColor = (status?: OrderStatus) => {
                                    switch (status) {
                                        case OrderStatus.PENDING:
                                            return "default";
                                        case OrderStatus.CONFIRMED:
                                            return "warning";
                                        case OrderStatus.IN_PROGRESS:
                                            return "processing";
                                        case OrderStatus.ON_HOLD:
                                            return "orange";
                                        case OrderStatus.COMPLETED:
                                            return "success";
                                        case OrderStatus.CANCELLED:
                                            return "error";
                                        default:
                                            return "default";
                                    }
                                };

                                const getStatusLabel = (status?: OrderStatus) => {
                                    switch (status) {
                                        case OrderStatus.PENDING:
                                            return "Chờ xử lý";
                                        case OrderStatus.CONFIRMED:
                                            return "Đã xác nhận";
                                        case OrderStatus.IN_PROGRESS:
                                            return "Đang thực hiện";
                                        case OrderStatus.ON_HOLD:
                                            return "Tạm giữ";
                                        case OrderStatus.COMPLETED:
                                            return "Hoàn thành";
                                        case OrderStatus.CANCELLED:
                                            return "Đã hủy";
                                        default:
                                            return "Chưa xác định";
                                    }
                                };

                                return (
                                    <Table
                                        dataSource={relatedOrders}
                                        rowKey="code"
                                        pagination={false}
                                        size="small"
                                        columns={[
                                            {
                                                title: "Mã đơn",
                                                dataIndex: "code",
                                                key: "code",
                                                render: (code: string) => (
                                                    <Button
                                                        type="link"
                                                        onClick={() => {
                                                            window.open(
                                                                `/sale/orders/${code}`,
                                                                "_blank",
                                                            );
                                                        }}
                                                    >
                                                        {code}
                                                    </Button>
                                                ),
                                            },
                                            {
                                                title: "Khách hàng",
                                                dataIndex: "customerName",
                                                key: "customerName",
                                            },
                                            {
                                                title: "Trạng thái",
                                                dataIndex: "status",
                                                key: "status",
                                                render: (status?: OrderStatus) => (
                                                    <Tag color={getStatusColor(status)}>
                                                        {getStatusLabel(status)}
                                                    </Tag>
                                                ),
                                            },
                                            {
                                                title: "Ngày đặt",
                                                dataIndex: "orderDate",
                                                key: "orderDate",
                                                render: (date: number) =>
                                                    date
                                                        ? new Date(date).toLocaleDateString(
                                                              "vi-VN",
                                                          )
                                                        : "-",
                                            },
                                            {
                                                title: "Ngày giao",
                                                dataIndex: "deliveryDate",
                                                key: "deliveryDate",
                                                render: (date: number) =>
                                                    date
                                                        ? new Date(date).toLocaleDateString(
                                                              "vi-VN",
                                                          )
                                                        : "-",
                                            },
                                            {
                                                title: "Sản phẩm trong đơn",
                                                key: "products",
                                                render: (_, record: FirebaseOrderData) => {
                                                    const products = Object.values(
                                                        record.products || {},
                                                    );
                                                    const matchingProducts = products.filter(
                                                        (p) =>
                                                            p.name
                                                                .toLowerCase()
                                                                .includes(
                                                                    viewingProduct.name.toLowerCase(),
                                                                ) ||
                                                            p.name
                                                                .toLowerCase()
                                                                .includes(
                                                                    viewingProduct.code.toLowerCase(),
                                                                ),
                                                    );
                                                    return (
                                                        <Space direction="vertical" size="small">
                                                            {matchingProducts.map((p, idx) => {
                                                                const workflows = p.workflows || {};
                                                                const total = Object.keys(
                                                                    workflows,
                                                                ).length;
                                                                const completed = Object.values(
                                                                    workflows,
                                                                ).filter((w: any) => w.isDone)
                                                                    .length;
                                                                return (
                                                                    <div key={idx}>
                                                                        <Text strong>
                                                                            {p.name}
                                                                        </Text>
                                                                        <div className="text-xs text-gray-500">
                                                                            SL: {p.quantity} | Tiến
                                                                            độ: {completed}/{total}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </Space>
                                                    );
                                                },
                                            },
                                        ]}
                                    />
                                );
                            })()}
                        </div>
                    </div>
                )}
            </Drawer>
        </WrapperContent>
    );
}

