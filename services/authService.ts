// services/authService.ts
import { User } from "../types";

const DB_USERS_KEY = "hireprep_db_users";       // localStorage user table
const SESSION_KEY = "hireprep_current_session"; // current login session

// Optional latency simulation to mimic backend request delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class AuthService {
  // --- LocalStorage "Database" helpers ---

  private getUsers(): User[] {
    const raw = localStorage.getItem(DB_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveUsers(users: User[]) {
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
  }

  private setSession(user: User) {
    const { password, ...safeUser } = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  }

  /**
   * Register a user (pure localStorage)
   */
  async register(name: string, email: string, password: string) {
    await delay(300);

    const users = this.getUsers();

    if (users.some((u) => u.email === email)) {
      throw new Error("Email already exists.");
    }

    const newUser: User = {
      id: Date.now(), // unique ID
      name,
      email,
      password, // (only for demo; no hashing since purely local)
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setSession(newUser);

    return newUser;
  }

  /**
   * Login (pure localStorage)
   */
  async login(email: string, password: string) {
    await delay(300);

    const users = this.getUsers();
    const user = users.find((u) => u.email === email);

    if (!user) throw new Error("User not found.");
    if (user.password !== password) throw new Error("Invalid password.");

    this.setSession(user);
    return user;
  }

  /**
   * Logout (clears session)
   */
  logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  /**
   * Returns user from session (if logged in)
   */
  getCurrentUser(): User | null {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  /**
   * Clears all stored user accounts (optional helper)
   */
  clearAllUsers() {
    localStorage.removeItem(DB_USERS_KEY);
  }
}

export const authService = new AuthService();