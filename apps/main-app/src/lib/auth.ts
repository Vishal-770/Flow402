import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../drizzle/db";
import * as schema from "../drizzle/schema";
import { sendWelcomeEmail } from "./email";
import { ac, adminRole } from "./permissions";

export const auth = betterAuth({
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: false,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.email) {
            try {
              await sendWelcomeEmail({
                id: user.id,
                email: user.email,
                name: user.name,
              });
            } catch (error) {
              console.error("Failed to process welcome email hook:", error);
            }
          }
        },
      },
    },
  },
  plugins: [admin({
    adminUserIds: ["c9Sa0FR0y236qUbVIKupYrw2JjX2YNlP"],
    ac,
    roles: {
      admin: adminRole,
    },
  })],
});
