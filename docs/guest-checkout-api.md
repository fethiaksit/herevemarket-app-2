# Guest Checkout API

## POST `/public/orders`

Creates an order without authentication.

### Request body

```json
{
  "customer": {
    "fullName": "Ali Veli",
    "phone": "05551234567",
    "email": "ali@example.com"
  },
  "delivery": {
    "title": "Ev",
    "detail": "Kadıköy, İstanbul",
    "note": "Kapıyı çalın"
  },
  "items": [
    { "productId": "1001", "quantity": 2 }
  ],
  "paymentMethod": "cash"
}
```

### Success response

```json
{
  "id": "65f2...",
  "summary": {
    "subtotal": 220,
    "discount": 0,
    "total": 220,
    "itemCount": 2,
    "isGuest": true
  }
}
```

### cURL example

```bash
curl -X POST http://localhost:8080/public/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {"fullName": "Ali Veli", "phone": "05551234567", "email": "ali@example.com"},
    "delivery": {"title": "Ev", "detail": "Kadıköy, İstanbul", "note": "3. kat"},
    "items": [{"productId": "1001", "quantity": 2}],
    "paymentMethod": "cash"
  }'
```

### Notes

- Client prices are ignored, totals are always computed server-side.
- `quantity` must be between `1` and `50`.
- Guest order endpoint has IP rate limit (default `10` requests / `10` minutes).
