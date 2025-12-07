import crypto from "crypto";
import * as qs from "querystring"; // hoặc import qs from 'qs';

interface VNPayConfig {
  vnp_TmnCode: string;
  vnp_HashSecret: string;
  vnp_Url: string;
  vnp_ApiUrl?: string;
  vnp_ReturnUrl: string;
}

export function getVNPayConfig(): VNPayConfig {
  return {
    vnp_TmnCode: process.env.NEXT_PUBLIC_VNPAY_TMN_CODE || "TMNCODE123",
    vnp_HashSecret: process.env.NEXT_PUBLIC_VNPAY_HASH_SECRET || "YOURSECRETKEY",
    vnp_Url:
      process.env.NEXT_PUBLIC_VNPAY_URL ||
      "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnp_ApiUrl: process.env.VNPAY_API_URL || "https://api.vnpayment.vn",
    vnp_ReturnUrl:
      process.env.NEXT_PUBLIC_VNPAY_RETURN_URL ||
      "http://localhost:3000/payment/callback",
  };
}

function sortObject(obj: Record<string, string | number>): Record<string, string> {
  const sortedKeys = Object.keys(obj).sort();
  const sorted: Record<string, string> = {};

  for (const key of sortedKeys) {
    const value = String(obj[key]);

    sorted[key] = encodeURIComponent(value).replace(/%20/g, "+");
  }

  return sorted;
}

function formatDateVN(date: Date) {
  // Tạo theo múi giờ Việt Nam (GMT+7)
  const tzOffset = 7 * 60 * 60000; // 7 tiếng
  const vnTime = new Date(date.getTime() + tzOffset);

  const year = vnTime.getUTCFullYear();
  const month = String(vnTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(vnTime.getUTCDate()).padStart(2, "0");
  const hour = String(vnTime.getUTCHours()).padStart(2, "0");
  const minute = String(vnTime.getUTCMinutes()).padStart(2, "0");
  const second = String(vnTime.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hour}${minute}${second}`; // yyyyMMddHHmmss
}

function getExpireDate() {
  const expire = new Date();
  expire.setMinutes(expire.getMinutes() + 15); // hết hạn sau 15 phút
  return formatDateVN(expire);
}

export function createVNPayUrl(params: Record<string, string | number>) {
  const config = getVNPayConfig();

  const vnp_Params: Record<string, string | number> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.vnp_TmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: params.vnp_TxnRef,
    vnp_OrderInfo: String(params.vnp_OrderInfo).replace(/-/g, ""),
    vnp_OrderType: "other",
    vnp_Amount: Number(params.vnp_Amount),
    vnp_ReturnUrl: config.vnp_ReturnUrl,
    vnp_IpAddr: String(params.vnp_IpAddr || "127.0.0.1"),
    vnp_CreateDate: params.vnp_CreateDate as string,
    vnp_ExpireDate: getExpireDate(),
  };

  const sortedParams = sortObject(vnp_Params);

  const signData = Object.entries(sortedParams)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const secureHash = crypto
    .createHmac("sha512", config.vnp_HashSecret)
    .update(signData, "utf8")
    .digest("hex");

  const paymentUrl =
    `${config.vnp_Url}?${signData}&vnp_SecureHash=${secureHash}`;

  return paymentUrl;
}

export function verifyVNPayResponse(responseParams: Record<string, string>): boolean {
  const config = getVNPayConfig();

  const secureHash = responseParams.vnp_SecureHash;
  const params: Record<string, string> = {};

  for (const key in responseParams) {
    if (key.startsWith("vnp_") && key !== "vnp_SecureHash") {
      params[key] = responseParams[key];
    }
  }

  const sortedParams = sortObject(params);

  const signData = Object.entries(sortedParams)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const hash = crypto
    .createHmac("sha512", config.vnp_HashSecret)
    .update(signData, "utf8")
    .digest("hex");

  return hash === secureHash;
}
