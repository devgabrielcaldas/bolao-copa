export function formatMatchDate(dateValue) {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function canEditPrediction(matchStartDate) {
  const now = new Date();
  const startDate = new Date(matchStartDate);

  const lockDate = new Date(startDate.getTime() - 60 * 1000);

  return now < lockDate;
}