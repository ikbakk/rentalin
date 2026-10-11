export function normalizeIndonesianWhatsAppNumber(phone: string) {
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`
  else if (digits.startsWith("8")) digits = `62${digits}`
  if (digits.length < 9 || digits.length > 15) return null
  return digits
}
