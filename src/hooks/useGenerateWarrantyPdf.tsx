import WarrantyInvoicePDF from "@/components/WarrantyInvoicePDF";
import { WarrantyClaim } from "@/types/warrantyClaim";
import { pdf } from "@react-pdf/renderer";
import { App } from "antd";
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

interface UseGenerateWarrantyPdfProps {
  warrantyClaim: WarrantyClaim;
  consultantInfo?: {
    code?: string;
    phone?: string;
  };
  warrantyPeriod?: number;
  warrantyStartDate?: number;
  warrantyEndDate?: number;
}


function useGenerateWarrantyPdf({
  warrantyClaim,
  consultantInfo,
  warrantyPeriod = 12,
  warrantyStartDate,
  warrantyEndDate,
}: UseGenerateWarrantyPdfProps) {
  const { message } = App.useApp();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const generatePDF = useCallback(
    async (fileName?: string): Promise<void> => {
      setIsLoading(true);

      if (!warrantyClaim) {
        message.error("Không có dữ liệu phiếu bảo hành!");
        setIsLoading(false);
        return;
      }

      if (
        !warrantyClaim.products ||
        Object.keys(warrantyClaim.products).length === 0
      ) {
        message.error("Phiếu bảo hành chưa có sản phẩm!");
        setIsLoading(false);
        return;
      }

      try {
        const blob = await pdf(
          <WarrantyInvoicePDF
            warrantyClaim={warrantyClaim}
            consultantInfo={consultantInfo}
            warrantyPeriod={warrantyPeriod}
            warrantyStartDate={warrantyStartDate}
            warrantyEndDate={warrantyEndDate}
          />
        ).toBlob();

        const defaultFileName = `xoxo-warranty-${warrantyClaim.code}.pdf`;
        downloadFile(blob, fileName || defaultFileName);

        message.success("Đã tạo PDF thành công!");
      } catch (error) {
        console.error("Error generating warranty PDF:", error);
        message.error("Có lỗi xảy ra khi tạo PDF!");
      } finally {
        setIsLoading(false);
      }
    },
    [
      warrantyClaim,
      consultantInfo,
      warrantyPeriod,
      warrantyStartDate,
      warrantyEndDate,
      message,
    ]
  );

  return { isLoading, generatePDF };
}

export default useGenerateWarrantyPdf;
