/**
 * Voucher/Coupon System Types
 */

export type DiscountType = 'percentage' | 'fixed';

export interface Voucher {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  user_limit: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VoucherUsage {
  id: string;
  voucher_id: string;
  user_id: string | null;
  user_email: string | null;
  order_id: string | null;
  discount_amount: number;
  used_at: string;
}

export interface VoucherValidationRequest {
  code: string;
  orderAmount: number;
  userEmail?: string;
  isFoundingMember?: boolean;
}

export interface VoucherValidationResponse {
  valid: boolean;
  message: string;
  voucher?: {
    code: string;
    discount_type: DiscountType;
    discount_value: number;
    discount_amount: number;
    final_amount: number;
  };
  error?: string;
}

export interface CreateVoucherRequest {
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  user_limit?: number;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
}

export interface UpdateVoucherRequest extends Partial<CreateVoucherRequest> {
  id: string;
}

export interface VoucherStats {
  total_vouchers: number;
  active_vouchers: number;
  total_usage: number;
  total_discount_given: number;
  expiring_soon: number;
}
