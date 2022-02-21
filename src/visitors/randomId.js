import { randomBytes } from "crypto";

export const randomId = () => "_" + randomBytes(4).toString("hex");
