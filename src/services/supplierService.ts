import { getDatabase, ref, get, set, update, remove, onValue } from "firebase/database";
import { genCode } from "@/utils/genCode";
import { Supplier, SupplierOrder, SupplierPayment } from "@/types/inventory";

const db = getDatabase();
const SUPPLIERS_PATH = "xoxo/suppliers";
const SUPPLIER_ORDERS_PATH = "xoxo/supplier_orders";
const SUPPLIER_PAYMENTS_PATH = "xoxo/supplier_payments";

export class SupplierService {
  // ==================== SUPPLIERS ====================
  
  static async getAllSuppliers(): Promise<Supplier[]> {
    const snapshot = await get(ref(db, SUPPLIERS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, supplier]) => ({
      id,
      ...(supplier as Omit<Supplier, "id">),
    }));
  }

  static async getSupplierById(id: string): Promise<Supplier | null> {
    const snapshot = await get(ref(db, `${SUPPLIERS_PATH}/${id}`));
    const data = snapshot.val();
    if (!data) return null;
    return { id, ...data };
  }

  static async createSupplier(supplier: Omit<Supplier, "id" | "code" | "createdAt" | "updatedAt">): Promise<Supplier> {
    const now = Date.now();
    const id = genCode("SUP_");
    const code = `NCC-${id.slice(-6).toUpperCase()}`;
    
    const supplierData: Omit<Supplier, "id"> = {
      ...supplier,
      code,
      status: supplier.status || "active",
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${SUPPLIERS_PATH}/${id}`), supplierData);
    return { id, ...supplierData };
  }

  static async updateSupplier(id: string, updates: Partial<Omit<Supplier, "id" | "code" | "createdAt">>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: Date.now(),
    };
    await update(ref(db, `${SUPPLIERS_PATH}/${id}`), updateData);
  }

  static async deleteSupplier(id: string): Promise<void> {
    await remove(ref(db, `${SUPPLIERS_PATH}/${id}`));
  }

  static onSuppliersSnapshot(callback: (suppliers: Supplier[]) => void): () => void {
    const suppliersRef = ref(db, SUPPLIERS_PATH);
    const unsubscribe = onValue(suppliersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const suppliers = Object.entries(data).map(([id, supplier]) => ({
        id,
        ...(supplier as Omit<Supplier, "id">),
      }));
      callback(suppliers);
    });
    return unsubscribe;
  }

  // ==================== SUPPLIER ORDERS ====================

  static async getAllOrders(): Promise<SupplierOrder[]> {
    const snapshot = await get(ref(db, SUPPLIER_ORDERS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, order]) => ({
      id,
      ...(order as Omit<SupplierOrder, "id">),
    })).sort((a, b) => b.createdAt - a.createdAt);
  }

  static async getOrdersBySupplierId(supplierId: string): Promise<SupplierOrder[]> {
    const snapshot = await get(ref(db, SUPPLIER_ORDERS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .map(([id, order]) => ({
        id,
        ...(order as Omit<SupplierOrder, "id">),
      }))
      .filter(order => order.supplierId === supplierId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  static async createOrder(order: Omit<SupplierOrder, "id" | "code" | "createdAt" | "updatedAt">): Promise<SupplierOrder> {
    const now = Date.now();
    const id = genCode("SO_");
    const code = `DHNCC-${id.slice(-6).toUpperCase()}`;
    
    const orderData: Omit<SupplierOrder, "id"> = {
      ...order,
      code,
      status: order.status || "pending",
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${SUPPLIER_ORDERS_PATH}/${id}`), orderData);
    return { id, ...orderData };
  }

  static async updateOrder(id: string, updates: Partial<Omit<SupplierOrder, "id" | "code" | "createdAt">>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: Date.now(),
    };
    await update(ref(db, `${SUPPLIER_ORDERS_PATH}/${id}`), updateData);
  }

  static async deleteOrder(id: string): Promise<void> {
    await remove(ref(db, `${SUPPLIER_ORDERS_PATH}/${id}`));
  }

  static onOrdersSnapshot(callback: (orders: SupplierOrder[]) => void): () => void {
    const ordersRef = ref(db, SUPPLIER_ORDERS_PATH);
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const orders = Object.entries(data).map(([id, order]) => ({
        id,
        ...(order as Omit<SupplierOrder, "id">),
      }));
      callback(orders);
    });
    return unsubscribe;
  }

  // ==================== SUPPLIER PAYMENTS ====================

  static async getAllPayments(): Promise<SupplierPayment[]> {
    const snapshot = await get(ref(db, SUPPLIER_PAYMENTS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, payment]) => ({
      id,
      ...(payment as Omit<SupplierPayment, "id">),
    })).sort((a, b) => b.createdAt - a.createdAt);
  }

  static async getPaymentsBySupplierId(supplierId: string): Promise<SupplierPayment[]> {
    const snapshot = await get(ref(db, SUPPLIER_PAYMENTS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .map(([id, payment]) => ({
        id,
        ...(payment as Omit<SupplierPayment, "id">),
      }))
      .filter(payment => payment.supplierId === supplierId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  static async createPayment(payment: Omit<SupplierPayment, "id" | "code" | "createdAt" | "updatedAt">): Promise<SupplierPayment> {
    const now = Date.now();
    const id = genCode("SP_");
    const code = `TTNCC-${id.slice(-6).toUpperCase()}`;
    
    const paymentData: Omit<SupplierPayment, "id"> = {
      ...payment,
      code,
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${SUPPLIER_PAYMENTS_PATH}/${id}`), paymentData);
    return { id, ...paymentData };
  }

  static async updatePayment(id: string, updates: Partial<Omit<SupplierPayment, "id" | "code" | "createdAt">>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: Date.now(),
    };
    await update(ref(db, `${SUPPLIER_PAYMENTS_PATH}/${id}`), updateData);
  }

  static async deletePayment(id: string): Promise<void> {
    await remove(ref(db, `${SUPPLIER_PAYMENTS_PATH}/${id}`));
  }

  static onPaymentsSnapshot(callback: (payments: SupplierPayment[]) => void): () => void {
    const paymentsRef = ref(db, SUPPLIER_PAYMENTS_PATH);
    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const payments = Object.entries(data).map(([id, payment]) => ({
        id,
        ...(payment as Omit<SupplierPayment, "id">),
      }));
      callback(payments);
    });
    return unsubscribe;
  }

  // ==================== DEBT CALCULATION ====================

  static async calculateDebt(supplierId: string): Promise<number> {
    const [orders, payments] = await Promise.all([
      this.getOrdersBySupplierId(supplierId),
      this.getPaymentsBySupplierId(supplierId),
    ]);

    const totalOrders = orders
      .filter(order => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);

    return totalOrders - totalPayments;
  }
}

