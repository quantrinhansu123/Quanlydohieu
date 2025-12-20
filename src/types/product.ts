// Product (Sản phẩm bán thêm) Types
export interface Product {
    code: string;
    name: string;
    category?: string; // Loại sản phẩm: Xi, Gel dưỡng da, v.v.
    brand?: string; // Thương hiệu
    price?: number; // Giá bán
    images?: string[]; // URLs of images
    description?: string; // Mô tả sản phẩm
    usage?: string; // Cách sử dụng
    specifications?: string; // Thông số kỹ thuật
    notes?: string; // Ghi chú
    orderCodes?: string[]; // Mã các đơn hàng đã sử dụng sản phẩm này
    createdAt: number;
    updatedAt: number;
}

export interface FirebaseProducts {
    [key: string]: Product;
}

