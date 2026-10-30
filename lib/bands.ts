// Fests that hand out wristbands. Their accounts record band, desk and flag
// details at the registration desk and on Manage Users.
const BAND_FEST_ACCOUNTS = ["banjaara", "shatranj"]

export function tracksBands(username: string | null | undefined) {
  return !!username && BAND_FEST_ACCOUNTS.includes(username.toLowerCase())
}
