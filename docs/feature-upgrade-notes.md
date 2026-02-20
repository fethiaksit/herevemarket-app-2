# Feature Upgrade Notes

## New backend endpoints

### User
- `GET /user/favorites`
- `POST /user/favorites` `{ productId }`
- `DELETE /user/favorites/:productId`
- `GET /user/cart`
- `POST /user/cart/items`
- `PUT /user/cart/items/:productId`
- `DELETE /user/cart/items/:productId`
- `POST /user/cart/clear`
- `GET /user/orders?page=&limit=`
- `GET /user/orders/:id`
- `PUT /user/push-token` `{ token }`

### Products
- `GET /products?search=&category=` (text search + regex fallback)
- `GET /products/:id/reviews?sort=latest|top&page=&limit=`
- `POST /products/:id/reviews`
- `DELETE /products/:id/reviews/me`

### Orders
- `POST /orders` supports `{ paymentMethod, couponCode }`

### Admin
- `GET /admin/api/orders?status=&page=&limit=`
- `PUT /admin/api/orders/:id/status`
- `POST /admin/api/coupons`
- `GET /admin/api/coupons?page=&limit=&search=`
- `PUT /admin/api/coupons/:id`
- `DELETE /admin/api/coupons/:id` (soft disable)
- `GET /admin/api/products/low-stock?threshold=&page=&limit=`
- `GET /admin/api/analytics/summary?from=&to=`

## Local testing
1. `cd backend && npm install`
2. `npm test`
3. `npm start`

## Manual QA checklist
- [ ] login/register + token-authenticated requests
- [ ] add items to cart, apply coupon, checkout
- [ ] favorites toggle add/remove/list
- [ ] write/update/delete review and verify product average/count
- [ ] admin status update sends notification log and reflects in user order fetch
- [ ] low-stock endpoint returns expected items
- [ ] product search relevance with text query
