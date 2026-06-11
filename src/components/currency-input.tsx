"use client";

import { useState } from "react";
import CurrencyInputField from "react-currency-input-field";

/**
 * Locale + currency aware money input (same formatting behaviour as
 * vue-currency-input: live grouping separators and the currency symbol).
 *
 * The visible field is for display only; a hidden input carries a clean
 * numeric string under `name` so the server action receives a plain number.
 */
export function CurrencyInput({
  name,
  currency,
  locale = "en-US",
  placeholder,
  defaultValue,
  className = "",
}: {
  name: string;
  currency: string;
  locale?: string;
  placeholder?: string;
  defaultValue?: number | string;
  className?: string;
}) {
  const [value, setValue] = useState<string | undefined>(
    defaultValue != null ? String(defaultValue) : undefined,
  );

  // Currency-correct decimal places (JPY → 0, USD/EUR → 2, …).
  let decimals = 2;
  try {
    decimals =
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    /* keep default */
  }

  return (
    <>
      <CurrencyInputField
        intlConfig={{ locale, currency }}
        allowNegativeValue={false}
        decimalsLimit={decimals}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onValueChange={(v) => setValue(v)}
        className={className}
      />
      {/* Clean numeric value (no symbol/grouping) for the server action. */}
      <input type="hidden" name={name} value={value ?? ""} />
    </>
  );
}
