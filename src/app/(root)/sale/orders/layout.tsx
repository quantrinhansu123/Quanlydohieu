import React from "react";

interface OrdersLayoutProps {
  children: React.ReactNode;
  modal: React.ReactNode;
}

export default function OrdersLayout({ children }: OrdersLayoutProps) {
  return (
    <>
      {children}
    </>
  );
}
