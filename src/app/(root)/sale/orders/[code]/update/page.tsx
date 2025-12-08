"use client";

import OrderForm from "@/components/OrderForm";
import WrapperContent from "@/components/WrapperContent";
import { useRouter } from "next/navigation";
import React from "react";

interface UpdateOrderPageProps {
  params: Promise<{
    code: string;
  }>;
}

const UpdateOrderPage: React.FC<UpdateOrderPageProps> = ({ params }) => {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const orderCode = resolvedParams.code;

  const handleSuccess = (updatedorderCode: string) => {
    router.push("/sale/orders");
  };

  const handleCancel = () => {
    router.push("/sale/orders");
  };

  if (!orderCode) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500">ID đơn hàng không hợp lệ! {orderCode}</p>
        </div>
      </div>
    );
  }

  return (
    <WrapperContent
      title="Cập nhật đơn hàng"
      header={{
        buttonBackTo: "/sale/orders",
      }}
    >
      <OrderForm
        mode="update"
        orderCode={orderCode}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </WrapperContent>
  );
};

export default UpdateOrderPage;
