# Security Specification: Sagomaskan Firestore Security Rules

## 1. Data Invariants
1. Products (`/products/{productId}`) are publicly viewable by any customer, but can only be created, modified or deleted by authorized administrators.
2. Categories (`/categories/{categoryId}`) are publicly viewable, but can only be managed by administrators.
3. Orders (`/orders/{orderId}`) can be created by any customer checking out, but must contain valid contact information, positive total amount, and initial status 'Mottagen'. Once placed, existing orders cannot be modified or deleted by unauthenticated users.
4. Messages (`/messages/{messageId}`) can be submitted by visitors through the contact form with valid name, email and message text, but cannot be read or deleted by public visitors.
5. All document IDs must conform to `^[a-zA-Z0-9_\-]+$` and have a length <= 128 chars.
6. User input strings are size-constrained to prevent wallet-draining denial-of-service attacks.

---

## 2. The "Dirty Dozen" Payloads (Expected to return PERMISSION_DENIED)

1. **Junk ID Injection on Product**: Attempting to write a product with a 2KB junk character ID.
2. **Unauthenticated Product Creation**: Public client trying to inject a fake product directly into `/products/fake123`.
3. **Product Price Negative**: Attempting to set product price to -500 SEK.
4. **Unauthenticated Category Deletion**: Non-admin attempting to delete `/categories/0`.
5. **Order Without Required Email**: Checkout order missing `customerEmail`.
6. **Order Negative Total Amount**: Customer order with `totalAmount: -150`.
7. **Order Status Tampering at Checkout**: Attempting to create an order directly with `status: 'Skickad'` instead of 'Mottagen'.
8. **Public Snooping on Orders**: Unauthenticated user trying to read `/orders/{orderId}` list.
9. **Tampering with Placed Order**: Customer trying to modify another person's order document to change `shippingAddress` or `totalAmount`.
10. **Public Reading of Customer Messages**: Unauthenticated guest trying to list `/messages`.
11. **Malicious Oversized Message**: A spam bot submitting a 500KB string payload into `/messages`.
12. **System Root Document Write**: Attempting to create a document at `/databases/{database}/documents/system/override`.
