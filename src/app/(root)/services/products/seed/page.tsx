"use client";

import { Product } from "@/types/product";
import { genCode } from "@/utils/genCode";
import { App, Button, Card, Space, Typography } from "antd";
import { getDatabase, ref, set } from "firebase/database";
import { useState } from "react";

const { Title, Text } = Typography;

// Sample products data with demo images
const sampleProducts: Omit<Product, "code" | "createdAt" | "updatedAt">[] = [
    {
        name: "Xi Phục Chế Da Thật Premium",
        category: "Xi (Sáp)",
        brand: "Leather Care Pro",
        price: 450000,
        images: [
            "https://images.unsplash.com/photo-1624378515193-0c02297064b4?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&h=600&fit=crop",
        ],
        description: "<p>Xi phục chế chuyên dụng cho da thật, giúp phục hồi độ bóng và mềm mại cho các sản phẩm da cao cấp. Sản phẩm được nhập khẩu từ châu Âu, đảm bảo chất lượng cao.</p>",
        usage: "Làm sạch bề mặt da trước khi sử dụng. Dùng khăn mềm thoa đều xi lên bề mặt, để khô tự nhiên trong 2-3 giờ. Đánh bóng bằng khăn mềm sau khi khô.",
        specifications: "Dung tích: 250ml | Thành phần: Sáp tự nhiên, dầu dưỡng da, chất bảo vệ UV | Xuất xứ: Châu Âu",
        notes: "Bảo quản nơi khô ráo, tránh ánh nắng trực tiếp. Sử dụng trong vòng 24 tháng kể từ ngày sản xuất.",
    },
    {
        name: "Gel Dưỡng Da Tự Nhiên",
        category: "Gel dưỡng da",
        brand: "Premium Leather",
        price: 380000,
        images: [
            "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop",
        ],
        description: "<p>Gel dưỡng da chuyên dụng, giúp phục hồi độ ẩm và độ đàn hồi cho da. Sản phẩm không chứa hóa chất độc hại, an toàn cho da tự nhiên.</p>",
        usage: "Làm sạch bề mặt da. Thoa gel đều lên bề mặt, massage nhẹ nhàng trong 5-10 phút. Để khô tự nhiên hoặc dùng khăn mềm lau nhẹ.",
        specifications: "Dung tích: 200ml | Thành phần: Gel tự nhiên, vitamin E, dầu argan | Xuất xứ: Hàn Quốc",
        notes: "Sử dụng 2-3 lần/tuần để đạt hiệu quả tốt nhất. Tránh tiếp xúc với mắt.",
    },
    {
        name: "Chất Tẩy Rửa Chuyên Dụng",
        category: "Chất tẩy rửa",
        brand: "Clean Pro",
        price: 250000,
        images: [
            "https://images.unsplash.com/photo-1584622650111-993a141f33f9?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=600&fit=crop",
        ],
        description: "<p>Chất tẩy rửa chuyên dụng cho đồ da, loại bỏ vết bẩn, dầu mỡ và mùi hôi. An toàn cho da tự nhiên, không làm mất màu.</p>",
        usage: "Pha loãng với nước theo tỷ lệ 1:10. Dùng khăn mềm thấm dung dịch và lau nhẹ lên bề mặt da. Lau lại bằng khăn ẩm sạch.",
        specifications: "Dung tích: 500ml | Thành phần: Chất tẩy rửa tự nhiên, không chứa cồn | Xuất xứ: Nhật Bản",
        notes: "Không sử dụng trực tiếp lên da, luôn pha loãng. Tránh tiếp xúc với da tay.",
    },
    {
        name: "Kem Bảo Vệ Da Chống Nước",
        category: "Kem bảo vệ",
        brand: "Protect Plus",
        price: 320000,
        images: [
            "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=600&fit=crop",
        ],
        description: "<p>Kem bảo vệ da chống nước và chống tia UV, giúp bảo vệ sản phẩm da khỏi tác động của môi trường. Tạo lớp bảo vệ mỏng, không làm mất vẻ đẹp tự nhiên của da.</p>",
        usage: "Làm sạch và để khô bề mặt da. Thoa kem đều lên bề mặt, để khô trong 30 phút. Có thể thoa 2 lớp để tăng hiệu quả.",
        specifications: "Dung tích: 150ml | Thành phần: Chất bảo vệ UV, silicon tự nhiên | Xuất xứ: Đức",
        notes: "Hiệu quả bảo vệ kéo dài 3-6 tháng tùy điều kiện sử dụng. Nên thoa lại sau khi tiếp xúc với nước.",
    },
    {
        name: "Dầu Dưỡng Da Tự Nhiên",
        category: "Dầu dưỡng",
        brand: "Natural Care",
        price: 420000,
        images: [
            "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=600&fit=crop",
        ],
        description: "<p>Dầu dưỡng da tự nhiên 100%, giúp phục hồi độ ẩm và độ mềm mại cho da. Phù hợp cho các sản phẩm da cao cấp như túi xách, ví, giày.</p>",
        usage: "Làm sạch bề mặt da. Nhỏ vài giọt dầu lên khăn mềm, thoa đều lên bề mặt da. Để thấm trong 2-3 giờ, sau đó lau nhẹ bằng khăn sạch.",
        specifications: "Dung tích: 100ml | Thành phần: Dầu argan, dầu jojoba, vitamin E | Xuất xứ: Morocco",
        notes: "Sử dụng 1-2 lần/tháng để duy trì độ mềm mại. Không để dầu tiếp xúc trực tiếp với ánh nắng.",
    },
    {
        name: "Bàn Chải Chuyên Dụng Phục Chế",
        category: "Bàn chải chuyên dụng",
        brand: "Professional Tools",
        price: 150000,
        images: [
            "https://images.unsplash.com/photo-1584622650111-993a141f33f9?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=600&fit=crop",
        ],
        description: "<p>Bàn chải chuyên dụng với lông mềm, phù hợp để làm sạch và đánh bóng bề mặt da. Thiết kế ergonomic, dễ cầm nắm.</p>",
        usage: "Sử dụng kết hợp với chất tẩy rửa hoặc xi phục chế. Chải nhẹ nhàng theo một chiều, tránh chải quá mạnh làm xước da.",
        specifications: "Kích thước: 15cm x 5cm | Chất liệu: Lông tự nhiên, gỗ cao cấp | Xuất xứ: Việt Nam",
        notes: "Vệ sinh bàn chải sau mỗi lần sử dụng. Để khô tự nhiên, tránh ngâm nước lâu.",
    },
    {
        name: "Khăn Lau Chuyên Dụng Microfiber",
        category: "Khăn lau chuyên dụng",
        brand: "Premium Care",
        price: 80000,
        images: [
            "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1624378515193-0c02297064b4?w=800&h=600&fit=crop",
        ],
        description: "<p>Khăn lau microfiber chuyên dụng, mềm mại, không để lại xơ vải. Phù hợp để lau và đánh bóng các sản phẩm da cao cấp.</p>",
        usage: "Sử dụng khô để đánh bóng hoặc ẩm để lau sạch. Giặt sạch sau mỗi lần sử dụng, phơi khô tự nhiên.",
        specifications: "Kích thước: 30cm x 30cm | Chất liệu: Microfiber cao cấp | Xuất xứ: Hàn Quốc",
        notes: "Có thể giặt máy ở nhiệt độ thấp. Không sử dụng chất tẩy mạnh.",
    },
    {
        name: "Bộ Dụng Cụ Phục Chế Đồ Hiệu",
        category: "Bộ dụng cụ",
        brand: "Complete Set",
        price: 1200000,
        images: [
            "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&h=600&fit=crop",
        ],
        description: "<p>Bộ dụng cụ đầy đủ cho phục chế đồ hiệu, bao gồm: xi phục chế, gel dưỡng, chất tẩy rửa, kem bảo vệ, bàn chải, khăn lau và hộp đựng cao cấp.</p>",
        usage: "Sử dụng theo hướng dẫn của từng sản phẩm trong bộ. Phù hợp cho người mới bắt đầu hoặc chuyên nghiệp.",
        specifications: "Bao gồm: 7 sản phẩm chính + hộp đựng | Trọng lượng: 1.5kg | Xuất xứ: Đa quốc gia",
        notes: "Bộ sản phẩm được đóng gói cẩn thận, phù hợp làm quà tặng. Bảo hành 12 tháng.",
    },
];

export default function SeedProductsPage() {
    const { message } = App.useApp();
    const [seeding, setSeeding] = useState(false);

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const database = getDatabase();
            const now = new Date().getTime();

            for (const product of sampleProducts) {
                const code = genCode("PRD_");
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
    };

    return (
        <div className="p-6">
            <Card>
                <Title level={3}>Tạo Dữ Liệu Mẫu - Sản Phẩm Bán Thêm</Title>
                <div className="mt-4 space-y-4">
                    <Text>
                        Script này sẽ tạo {sampleProducts.length} sản phẩm mẫu với đầy đủ
                        thông tin và ảnh demo vào Firebase.
                    </Text>
                    <div className="mt-4">
                        <Title level={5}>Danh sách sản phẩm sẽ được tạo:</Title>
                        <ul className="list-disc list-inside space-y-2 mt-2">
                            {sampleProducts.map((product, index) => (
                                <li key={index}>
                                    <Text strong>{product.name}</Text> - {product.category} -{" "}
                                    {new Intl.NumberFormat("vi-VN").format(product.price || 0)} đ
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="mt-6">
                        <Button
                            type="primary"
                            size="large"
                            loading={seeding}
                            onClick={handleSeed}
                        >
                            {seeding ? "Đang tạo..." : "Tạo Dữ Liệu Mẫu"}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}



