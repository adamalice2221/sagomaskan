# Security Specification: Sagomaskan Firestore Security Rules

## 1. Data Invariants
1. Products (`/products/{productId}`) are publicly viewable by any customer, but can only be created, modified or deleted by authorized administrators.
2. Categories (`/categories/{categoryId}`) are publicly viewable, but can only be managed by administrators.
3. Orders (`/orders/{orderId}`) can be created by any customer checking out (guest orders must not spoof a `customerId`, authenticated customers must set `customerId == request.auth.uid`), must contain valid contact information, non-negative total amount, and valid initial status. Orders can only be read (`get`/`list`) by verified administrators or the authenticated customer who owns the order (`customerId == request.auth.uid` or verified email match).
4. Messages (`/messages/{messageId}`) can be submitted by visitors through the contact form with valid name, email and message text, but cannot be read or deleted by public visitors.
5. Customers (`/customers/{customerId}`) are keyed by Firebase Auth UID (`request.auth.uid == customerId`). Only the authenticated owner (`request.auth.uid == customerId`) or verified admin can read (`get`), create, or update their profile (including synced `cart`, `giftBoxSelection`, `appliedDiscountCode`, and `watchedProducts`); only admins can `list` all customers or delete profiles. Shadow/RBAC fields (`role`, `isAdmin`, `passwordHash`) are strictly rejected.
6. Order Counter (`/counters/orders`) enforces strictly monotonic `+1` increments on updates so concurrent checkouts across devices always receive unique sequential order numbers.
7. Newsletter Subscribers (`/newsletterSubscribers/{subscriberId}`) allow visitors to register valid emails while blocking all non-admin reads (`get`/`list`) to protect subscriber PII.
8. Stock Watches (`/stockWatches/{watchId}`) allow visitors and signed-in customers to watch out-of-stock products while restricting reads to verified admins or the authenticated customer owner (`customerId == request.auth.uid`).
9. All document IDs must conform to `^[a-zA-Z0-9_\-]+$` and have a length <= 128 chars, and user input strings/arrays are strictly bounded.

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
10. **Public Reading of Customer Messages or Accounts**: Unauthenticated guest trying to list or get `/messages` or `/customers`.
11. **Shadow Field Injection on Customer Registration**: Submitting a `/customers/{customerId}` payload containing extra fields like `isAdmin: true` or `role: "admin"`, or oversized strings (>120 chars name).
12. **System Root Document Write**: Attempting to create a document at `/databases/{database}/documents/system/override`.
