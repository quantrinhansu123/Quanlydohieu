import OrderInvoicePDF from "@/components/OrderInvoicePDF";
import { FirebaseOrderData } from "@/types/order";
import { pdf } from "@react-pdf/renderer";
import { App } from "antd";
import dayjs from "dayjs";
import { useCallback, useState } from "react";


const downloadFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


interface UseGenerateOrderPdfProps {
  order: FirebaseOrderData;
  consultantInfo?: {
    code?: string;
    phone?: string;
  };
}


function useGenerateOrderPdf({
  order,
  consultantInfo,
}: UseGenerateOrderPdfProps) {
  const { message } = App.useApp();
  const [isLoading, setIsLoading] = useState<boolean>(false);


  const generatePDF = useCallback(
    async (fileName?: string): Promise<void> => {
      setIsLoading(true);

      if (!order) {
        message.error("Không có dữ liệu đơn hàng!");
        setIsLoading(false);
        return;
      }

      if (!order.products || Object.keys(order.products).length === 0) {
        message.error("Đơn hàng chưa có sản phẩm!");
        setIsLoading(false);
        return;
      }

      try {
        const blob = await pdf(
          <OrderInvoicePDF order={order} consultantInfo={consultantInfo} />
        ).toBlob();

        const defaultFileName = `xoxo-order-${order.code}.pdf`;
        downloadFile(blob, fileName || defaultFileName);

        message.success("Đã tạo PDF thành công!");
      } catch (error) {
        console.error("Error generating order PDF:", error);
        message.error("Có lỗi xảy ra khi tạo PDF!");
      } finally {
        setIsLoading(false);
      }
    },
    [order, consultantInfo, message]
  );

  return { isLoading, generatePDF };
}

export default useGenerateOrderPdf;
