// Plain types shared by client and server. No server-only imports here, so
// this file is safe for components to import.

export type Role = "admin" | "staff";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustReset: boolean;
};

export type PinAccount = {
  id: string;
  name: string;
  role: Role;
};
