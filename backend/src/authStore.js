export const users = [
  {
    id: "customer-1",
    email: "customer@example.com",
    password: "password123",
    role: "customer",
  },
];

export function findUserByEmail(email) {
  return users.find((user) => user.email === email);
}

export function findUserById(id) {
  return users.find((user) => user.id === id);
}
