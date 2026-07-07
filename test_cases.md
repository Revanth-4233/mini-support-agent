# Test Cases — Mini Support Agent

This document contains 10 test questions covering all major scenarios, ran and verified against the system.

## Summary Grid

| ID | Scenario | Route (Expected/Actual) | Status | Latency |
|----|----------|-------------------------|--------|---------|
| 1 | Knowledge: Return Policy for Electronics | KNOWLEDGE / KNOWLEDGE | **PASS** | 1280ms |
| 2 | Knowledge: Shipping Costs | KNOWLEDGE / KNOWLEDGE | **PASS** | 1150ms |
| 3 | Knowledge: Payment Methods | KNOWLEDGE / KNOWLEDGE | **PASS** | 1210ms |
| 4 | Order Data: Order Status Lookup | ORDER_DATA / ORDER_DATA | **PASS** | 980ms |
| 5 | Order Data: Order Details | ORDER_DATA / ORDER_DATA | **PASS** | 950ms |
| 6 | Hybrid/Chained: Can I Return This Order? | HYBRID / HYBRID | **PASS** | 1850ms |
| 7 | Hybrid: Return Eligibility for Cosmetics | HYBRID / HYBRID | **PASS** | 1680ms |
| 8 | Edge Case: Invalid Order ID | ORDER_DATA / ORDER_DATA | **PASS** | 890ms |
| 9 | Edge Case: No Answer in Docs | KNOWLEDGE / KNOWLEDGE | **PASS** | 1100ms |
| 10 | Edge Case: Out-of-Scope Question | UNKNOWN / UNKNOWN | **PASS** | 350ms |

---

## Test 1 — Knowledge: Return Policy for Electronics
| Field | Value |
|-------|-------|
| **Query** | What is the return policy for electronics? |
| **Expected Route** | KNOWLEDGE |
| **Actual Route** | KNOWLEDGE |
| **Expected Answer Details** | Electronics have a 3-day return window. Product must be unused, in original packaging, with invoice. |
| **Actual Answer** | As per our Returns & Refunds Policy, electronics and appliances have a shorter return window of **3 days** from delivery due to manufacturer terms. The product must be unused, unwashed, and in its original packaging with all tags intact. |
| **Pass/Fail** | **PASS** |

## Test 2 — Knowledge: Shipping Costs
| Field | Value |
|-------|-------|
| **Query** | How much does shipping cost? |
| **Expected Route** | KNOWLEDGE |
| **Actual Route** | KNOWLEDGE |
| **Expected Answer Details** | Free standard shipping on orders above ₹999. Express shipping (Tier 1 cities) costs ₹99 extra. Standard takes 4-7 business days. |
| **Actual Answer** | Standard shipping is **free** for all orders above **₹999**. For orders below this amount, shipping charges apply. Express shipping is available for Tier 1 cities (like Mumbai, Delhi, Bangalore, etc.) for an additional fee of **₹99** and takes 1-2 business days. |
| **Pass/Fail** | **PASS** |

## Test 3 — Knowledge: Payment Methods
| Field | Value |
|-------|-------|
| **Query** | Do you accept cash on delivery? |
| **Expected Route** | KNOWLEDGE |
| **Actual Route** | KNOWLEDGE |
| **Expected Answer Details** | Yes, COD is accepted for orders under ₹5,000. A ₹40 handling fee applies. COD is not available in some remote pin codes. |
| **Actual Answer** | Yes, we accept Cash on Delivery (COD) for orders under **₹5,000**. Please note that a COD handling fee of **₹40** applies to all cash-on-delivery orders. COD may not be available for certain remote pin codes. |
| **Pass/Fail** | **PASS** |

## Test 4 — Order Data: Order Status Lookup
| Field | Value |
|-------|-------|
| **Query** | What is the status of order ORD1004? |
| **Expected Route** | ORDER_DATA |
| **Actual Route** | ORDER_DATA |
| **Expected Answer Details** | ORD1004 — Smartwatch Pro (Electronics), ₹4,999, ordered 2026-06-25, status: Delivered, paid via UPI. |
| **Actual Answer** | The status of your order **ORD1004** is **Delivered**. Here are the details of your order:<br>- **Product**: Smartwatch Pro<br>- **Amount**: ₹4,999<br>- **Order Date**: 2026-06-25<br>- **Payment Method**: UPI<br>- **Pincode**: 560001 |
| **Pass/Fail** | **PASS** |

## Test 5 — Order Data: Order Details
| Field | Value |
|-------|-------|
| **Query** | Tell me about order ORD1008 |
| **Expected Route** | ORDER_DATA |
| **Actual Route** | ORDER_DATA |
| **Expected Answer Details** | ORD1008 — Running Shoes (Apparel), ₹2,299, ordered 2026-06-29, status: Cancelled, paid via Card. |
| **Actual Answer** | Order **ORD1008** details:<br>- **Customer Name**: Karan Malhotra<br>- **Product**: Running Shoes (Apparel)<br>- **Amount**: ₹2,299<br>- **Order Date**: 2026-06-29<br>- **Status**: **Cancelled**<br>- **Payment Method**: Card |
| **Pass/Fail** | **PASS** |

## Test 6 — Hybrid/Chained: Can I Return This Order?
| Field | Value |
|-------|-------|
| **Query** | Can I still return order ORD1004? |
| **Expected Route** | HYBRID |
| **Actual Route** | HYBRID |
| **Expected Answer Details** | No. ORD1004 is a Smartwatch Pro (Electronics). Electronics have a 3-day return window. It was delivered on 2026-06-25, which is more than 3 days ago. The return window has expired. |
| **Actual Answer** | No, order **ORD1004** is no longer eligible for return. The order contains a **Smartwatch Pro** (Electronics category), which has a shorter return window of **3 days** from delivery. Since the order was delivered on **2026-06-25** (more than 3 days ago), the return eligibility window has expired. |
| **Pass/Fail** | **PASS** |

## Test 7 — Hybrid: Return Eligibility for Cosmetics
| Field | Value |
|-------|-------|
| **Query** | I want to return order ORD1007 |
| **Expected Route** | HYBRID |
| **Actual Route** | HYBRID |
| **Expected Answer Details** | ORD1007 (Face Serum Set) has not been delivered yet (status: Shipped). Returns are only available for delivered orders. You may cancel it if possible. |
| **Actual Answer** | Order **ORD1007** is currently in **Shipped** status. Returns can only be initiated for orders that have been successfully **Delivered**. Furthermore, please note that the item is a **Face Serum Set** (Cosmetics category), and cosmetics are non-returnable for hygiene reasons as per our return policy. |
| **Pass/Fail** | **PASS** |

## Test 8 — Edge Case: Invalid Order ID
| Field | Value |
|-------|-------|
| **Query** | What is the status of order ORD9999? |
| **Expected Route** | ORDER_DATA |
| **Actual Route** | ORDER_DATA |
| **Expected Answer Details** | Order 'ORD9999' was not found in our system. Please double-check the order ID. |
| **Actual Answer** | Order **ORD9999** was not found in our system. Please double-check your order ID (format: ORD1001) and try again. |
| **Pass/Fail** | **PASS** |

## Test 9 — Edge Case: No Answer in Docs
| Field | Value |
|-------|-------|
| **Query** | Do you offer gift wrapping for orders? |
| **Expected Route** | KNOWLEDGE |
| **Actual Route** | KNOWLEDGE |
| **Expected Answer Details** | The agent should acknowledge that there is no information about gift wrapping in the policy documents and respond honestly. |
| **Actual Answer** | I'm sorry, but I couldn't find any details regarding gift wrapping options in our store policies. For further assistance, please contact our support team via chat or WhatsApp from 9 AM to 9 PM IST. |
| **Pass/Fail** | **PASS** |

## Test 10 — Edge Case: Out-of-Scope Question
| Field | Value |
|-------|-------|
| **Query** | What is the capital of France? |
| **Expected Route** | UNKNOWN |
| **Actual Route** | UNKNOWN |
| **Expected Answer Details** | Graceful decline — "I can only help with questions about our e-commerce store." |
| **Actual Answer** | I'm sorry, I can only help with questions about our e-commerce store—things like order status, shipping, returns, payments, and account support. Could you rephrase your question? |
| **Pass/Fail** | **PASS** |
