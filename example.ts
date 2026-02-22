import { getCaptcha, login, sendSms } from ".";
import { getTestAccount, input } from "./utils";

const { username } = await getTestAccount();

const { cookie, image } = await getCaptcha();
await Bun.write("captcha.png", image);
console.log("验证码已保存到 captcha.png");

const vcode = await input("vcode(from image): ");
const smsResult = await sendSms({ username, vcode, cookie });
console.log("sms status:", smsResult.status);
console.log("sms body:", smsResult.body);

const smsCode = await input("sms code: ");
const loginResult = await login({ username, smsCode, cookie });
console.log("login status:", loginResult.status);
console.log("login body:", loginResult.body);
