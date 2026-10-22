import { convexAuth } from "@convex-dev/auth/server";
import { PasswordReset } from "./passwordReset";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password({
    reset: PasswordReset,
    validatePasswordRequirements(password) {
      if (password.length < 12) throw new Error("Password must be at least 12 characters long");
    },
  })],
});
