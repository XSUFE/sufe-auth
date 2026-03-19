export async function input(message?: string): Promise<string> {
  if (message) process.stdout.write(message);
  for await (const line of console) {
    return line.trim();
  }
  return "";
}

export async function getTestAccount() {
  if (!process.env.SUFE_USERNAME) {
    console.warn("Environment variable SUFE_USERNAME is not set");
    process.env.SUFE_USERNAME = await input("SUFE username: ");
  }
  return { username: process.env.SUFE_USERNAME as string };
}
