const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) return "th";

  const lastDigit = day % 10;
  if (lastDigit === 1) return "st";
  if (lastDigit === 2) return "nd";
  if (lastDigit === 3) return "rd";
  return "th";
}

export function formatWorkaHiveDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const day = date.getDate();
  return `${day}${getOrdinalSuffix(day)} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatWorkaHiveDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return `${formatWorkaHiveDate(date)} ${date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}
