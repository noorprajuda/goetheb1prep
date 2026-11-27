import nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";
import dotenv from "dotenv";

dotenv.config();

// Mailtrap configuration using API token
const TOKEN = process.env.MAILTRAP_API_TOKEN;

const transport = nodemailer.createTransport(
  MailtrapTransport({
    token: TOKEN,
  })
);

const sender = {
  name: "Goethe B1 Prep",
  email: process.env.MAILTRAP_FROM_EMAIL || "noreply@goetheb1prep.com",
};

export { transport, sender };
