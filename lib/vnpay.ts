import crypto from "crypto"

interface VNPayConfig {
  vnp_TmnCode: string
  vnp_HashSecret: string
  vnp_Url: string
  vnp_ApiUrl?: string
  vnp_ReturnUrl: string
}

export function getVNPayConfig(): VNPayConfig {
  return {
    vnp_TmnCode: process.env.VNPAY_TMN_CODE || "TMNCODE123",
    vnp_HashSecret: process.env.VNPAY_HASH_SECRET || "YOURSECRETKEY",
    vnp_Url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paygate",
    vnp_ApiUrl: process.env.VNPAY_API_URL || "https://api.vnpayment.vn",
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:3000/payment/callback",
  }
}

export function createVNPayUrl(params: Record<string, string | number>) {
  const config = getVNPayConfig()

  const vnp_Params: Record<string, string | number> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.vnp_TmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: params.vnp_TxnRef,
    vnp_OrderInfo: params.vnp_OrderInfo,
    vnp_OrderType: "other",
    vnp_Amount: params.vnp_Amount,
    vnp_ReturnUrl: config.vnp_ReturnUrl,
    vnp_IpAddr: params.vnp_IpAddr || "127.0.0.1",
    vnp_CreateDate: params.vnp_CreateDate,
    ...params,
  }

  // Sort parameters
  const sortedParams = Object.keys(vnp_Params)
    .sort()
    .reduce((acc: Record<string, string | number>, key) => {
      acc[key] = vnp_Params[key]
      return acc
    }, {})

  // Create HMAC SHA512 hash
  const signData = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&")

  const hmac = crypto.createHmac("sha512", config.vnp_HashSecret).update(Buffer.from(signData, "utf-8")).digest("hex")

  return `${config.vnp_Url}?${signData}&vnp_SecureHash=${hmac}`
}

export function verifyVNPayResponse(responseParams: Record<string, string>): boolean {
  const config = getVNPayConfig()

  const secureHash = responseParams.vnp_SecureHash
  const orderedParams = Object.keys(responseParams)
    .filter((key) => key.substring(0, 4) === "vnp_" && key !== "vnp_SecureHash")
    .sort()
    .map((key) => `${key}=${responseParams[key]}`)
    .join("&")

  const hmac = crypto
    .createHmac("sha512", config.vnp_HashSecret)
    .update(Buffer.from(orderedParams, "utf-8"))
    .digest("hex")

  return hmac === secureHash
}

export interface VNPayResponse {
  vnp_Amount: string
  vnp_BankCode: string
  vnp_BankTranNo: string
  vnp_CardType: string
  vnp_OrderInfo: string
  vnp_PayDate: string
  vnp_ResponseCode: string
  vnp_TmnCode: string
  vnp_TransactionNo: string
  vnp_TransactionStatus: string
  vnp_TxnRef: string
  vnp_SecureHash: string
}
