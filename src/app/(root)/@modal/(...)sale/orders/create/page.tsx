"use client";

import OrderForm from "@/components/OrderForm";
import { Modal } from "antd";
import { useRouter } from "next/navigation";
import React from "react";

const CreateOrderModal: React.FC = () => {
  const router = useRouter();

  const handleSuccess = (orderCode: string) => {
    // Alternative 1: Use replace to avoid adding to history
    router.back();
    // Optional: Show success message or redirect
  };

  const handleCancel = () => {
    // Alternative 1: Use replace to avoid adding to history
    router.back();
  };

  return (
    <Modal
      title="Tạo đơn hàng mới"
      open={true}
      onCancel={handleCancel}
      footer={null}
      width={1200}
      centered
      destroyOnHidden
      // maskClosable={false}
    >
      <OrderForm
        mode="create"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </Modal>
  );
};

export default CreateOrderModal;
