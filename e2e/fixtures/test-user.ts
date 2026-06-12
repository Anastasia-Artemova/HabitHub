export type TestUser = {
  username: string;
  email: string;
  password: string;
};

export function createTestUser(label = "user"): TestUser {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    username: `${label}_${suffix}`,
    email: `${label}.${suffix}@e2e.test`,
    password: "TestPassword123!",
  };
}
