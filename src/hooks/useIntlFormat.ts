import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function useIntlFormat() {
  const { i18n } = useTranslation();
  const locale = i18n.language || navigator.language || "en";

  const formatters = useMemo(() => {
    const dateShort = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const dateLong = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    const dateTime = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const timeOnly = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const relativeTime = new Intl.RelativeTimeFormat(locale, {
      numeric: "auto",
    });

    return { dateShort, dateLong, dateTime, timeOnly, relativeTime };
  }, [locale]);

  const formatDate = (date: string | Date, style: "short" | "long" | "datetime" = "short") => {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    switch (style) {
      case "long": return formatters.dateLong.format(d);
      case "datetime": return formatters.dateTime.format(d);
      default: return formatters.dateShort.format(d);
    }
  };

  const formatTime = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return formatters.timeOnly.format(d);
  };

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatNumber = (num: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, options).format(num);
  };

  const formatRelativeTime = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHr / 24);

    if (Math.abs(diffSec) < 60) return formatters.relativeTime.format(diffSec, "second");
    if (Math.abs(diffMin) < 60) return formatters.relativeTime.format(diffMin, "minute");
    if (Math.abs(diffHr) < 24) return formatters.relativeTime.format(diffHr, "hour");
    return formatters.relativeTime.format(diffDay, "day");
  };

  return {
    locale,
    formatDate,
    formatTime,
    formatCurrency,
    formatNumber,
    formatRelativeTime,
  };
}
