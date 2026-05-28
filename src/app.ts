import "dotenv/config";
import express from "express";
import { Markup, Telegraf } from "telegraf";

const token = process.env.CUSTOMER_BOT_TOKEN;
const adminId = Number(process.env.CUSTOMER_ADMIN_ID || "0");
const baseUrl = (process.env.BASE_URL || "").replace(//$/, "");

const bot = new Telegraf(token || "missing");
const app = express();
app.use(express.json());

const status = { ready: false, startedAt: new Date().toISOString(), error: null as string | null };

const BUSINESS_NAME = "ماهان تجارت";
const WELCOME_MESSAGE = "خوش امدین";
const SUPPORT_CONTACT = "@mrh3d";
const TEMPLATE = "فروشگاهی";
const DETAILS = "شامپو";
const FEATURES = [
  "پرداخت کارت‌به‌کارت و تایید رسید",
  "مدیریت محصول/خدمت",
  "گزارش‌گیری"
];

function mainMenu() {
  return Markup.keyboard([
    ["📋 معرفی خدمات", "📝 ثبت درخواست"],
    ["☎️ پشتیبانی", "ℹ️ درباره ما"]
  ]).resize();
}

bot.start(async (ctx) => {
  await ctx.reply(WELCOME_MESSAGE, mainMenu());
});

bot.hears("📋 معرفی خدمات", async (ctx) => {
  const features = FEATURES.map((f) => "• " + f).join("\n") || "ثبت نشده";
  await ctx.reply("نوع ربات: " + TEMPLATE + "\n\nامکانات فعال:\n" + features + "\n\nجزئیات:\n" + (DETAILS || "ثبت نشده"), mainMenu());
});

bot.hears("☎️ پشتیبانی", async (ctx) => {
  await ctx.reply("راه ارتباطی پشتیبانی:\n" + SUPPORT_CONTACT, mainMenu());
});

bot.hears("ℹ️ درباره ما", async (ctx) => {
  await ctx.reply(BUSINESS_NAME + "\n\nاین ربات برای ارتباط سریع‌تر با مشتریان ساخته شده است.", mainMenu());
});

bot.hears("📝 ثبت درخواست", async (ctx) => {
  await ctx.reply("درخواست شما دریافت شد ✅\nلطفاً توضیحاتتان را همینجا ارسال کنید تا برای مدیر فرستاده شود.");
});

bot.on("text", async (ctx) => {
  if (ctx.message.text.startsWith("/")) return;
  if (["📋 معرفی خدمات", "📝 ثبت درخواست", "☎️ پشتیبانی", "ℹ️ درباره ما"].includes(ctx.message.text)) return;
  if (adminId) {
    const from = ctx.from?.username ? "@" + ctx.from.username : String(ctx.chat.id);
    await ctx.telegram.sendMessage(adminId, "پیام جدید از کاربر:\n\nاز: " + from + "\n\n" + ctx.message.text);
  }
  await ctx.reply("پیام شما برای مدیر ارسال شد ✅", mainMenu());
});

app.get("/health", (_req, res) => res.status(200).send("ok"));
app.get("/", (_req, res) => res.json(status));

const port = Number(process.env.PORT || 10000);
app.listen(port, "0.0.0.0", async () => {
  console.log("Listening on " + port);
  try {
    if (!token) throw new Error("CUSTOMER_BOT_TOKEN is missing");
    if (!baseUrl) throw new Error("BASE_URL is missing");
    const path = "/webhook/" + token.split(":")[0];
    app.post(path, async (req, res) => {
      try {
        await bot.handleUpdate(req.body);
        res.sendStatus(200);
      } catch (error) {
        console.error(error);
        res.sendStatus(200);
      }
    });
    await bot.telegram.setWebhook(baseUrl + path, { drop_pending_updates: true });
    status.ready = true;
    status.error = null;
    console.log("Customer bot ready");
  } catch (error) {
    status.ready = false;
    status.error = error instanceof Error ? error.message : String(error);
    console.error(error);
  }
});
