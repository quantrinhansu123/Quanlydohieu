"use client";

import { allMenuItems } from "@/configs/menu";
import WrapperContent from "@/components/WrapperContent";
import { Card, Col, Row, Typography } from "antd";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const { Title, Text } = Typography;

export default function MenuGroupPage() {
    const params = useParams();
    const groupKey = params.group as string;

    // Helper function to normalize Vietnamese text for URL matching
    const normalizeVietnamese = (text: string): string => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
            .replace(/\s+/g, "-")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "d");
    };

    // Find menu item by group key
    const menuItem = useMemo(() => {
        if (!groupKey) return null;
        
        // Decode URL-encoded characters
        const decodedKey = decodeURIComponent(groupKey);
        
        return allMenuItems.find((item) => {
            if (!item.children || item.children.length === 0) return false;
            const normalizedItemTitle = normalizeVietnamese(item.title);
            const normalizedKey = normalizeVietnamese(decodedKey);
            return normalizedItemTitle === normalizedKey || item.title === decodedKey;
        });
    }, [groupKey]);

    if (!menuItem || !menuItem.children || menuItem.children.length === 0) {
        return (
            <WrapperContent>
                <div className="text-center py-8">
                    <Text type="secondary">Không tìm thấy menu này</Text>
                </div>
            </WrapperContent>
        );
    }

    return (
        <WrapperContent
            header={{
                title: menuItem.prefix ? `${menuItem.prefix} ${menuItem.title}` : menuItem.title,
            }}
        >
            <Row gutter={[16, 16]} className="mt-4">
                {menuItem.children.map((child) => {
                    const IconComponent = child.icon;
                    const isDisabled = child.disable === true;

                    return (
                        <Col
                            key={child.href}
                            xs={12}
                            sm={8}
                            md={6}
                            lg={4}
                            xl={3}
                        >
                            <Link
                                href={isDisabled ? "#" : child.href}
                                style={{
                                    pointerEvents: isDisabled ? "none" : "auto",
                                    opacity: isDisabled ? 0.5 : 1,
                                }}
                            >
                                <Card
                                    hoverable={!isDisabled}
                                    className="h-full text-center"
                                    style={{
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "24px 16px",
                                        textAlign: "center",
                                        minHeight: "120px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "32px",
                                            color: child.color || menuItem.color || "#1890ff",
                                            marginBottom: "12px",
                                        }}
                                    >
                                        <IconComponent />
                                    </div>
                                    <Text
                                        strong
                                        style={{
                                            fontSize: "14px",
                                            color: isDisabled ? "#999" : undefined,
                                        }}
                                    >
                                        {child.title}
                                    </Text>
                                </Card>
                            </Link>
                        </Col>
                    );
                })}
            </Row>
        </WrapperContent>
    );
}

