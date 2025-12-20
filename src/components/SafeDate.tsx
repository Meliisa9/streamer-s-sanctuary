import { formatDistanceToNow, format, isValid, parseISO } from "date-fns";

interface SafeDateProps {
  date: string | Date | null | undefined;
  formatType?: "relative" | "absolute" | "both";
  absoluteFormat?: string;
  fallback?: string;
  className?: string;
}

/**
 * Safely formats a date, handling null/undefined/invalid values gracefully
 */
export function SafeDate({ 
  date, 
  formatType = "relative", 
  absoluteFormat = "MMM d, yyyy",
  fallback = "—",
  className 
}: SafeDateProps) {
  if (!date) return <span className={className}>{fallback}</span>;

  let parsed: Date;
  
  if (typeof date === "string") {
    parsed = parseISO(date);
  } else {
    parsed = date;
  }

  if (!isValid(parsed)) {
    return <span className={className}>{fallback}</span>;
  }

  try {
    if (formatType === "relative") {
      return <span className={className}>{formatDistanceToNow(parsed, { addSuffix: true })}</span>;
    }
    
    if (formatType === "absolute") {
      return <span className={className}>{format(parsed, absoluteFormat)}</span>;
    }
    
    // both
    return (
      <span className={className} title={format(parsed, "PPpp")}>
        {formatDistanceToNow(parsed, { addSuffix: true })}
      </span>
    );
  } catch {
    return <span className={className}>{fallback}</span>;
  }
}

/**
 * Utility function to safely format dates (for non-component use)
 */
export function safeFormatDate(
  date: string | Date | null | undefined,
  formatString: string = "MMM d, yyyy",
  fallback: string = "—"
): string {
  if (!date) return fallback;

  let parsed: Date;
  
  if (typeof date === "string") {
    parsed = parseISO(date);
  } else {
    parsed = date;
  }

  if (!isValid(parsed)) return fallback;

  try {
    return format(parsed, formatString);
  } catch {
    return fallback;
  }
}

/**
 * Utility function to safely format relative dates
 */
export function safeFormatRelative(
  date: string | Date | null | undefined,
  fallback: string = "—"
): string {
  if (!date) return fallback;

  let parsed: Date;
  
  if (typeof date === "string") {
    parsed = parseISO(date);
  } else {
    parsed = date;
  }

  if (!isValid(parsed)) return fallback;

  try {
    return formatDistanceToNow(parsed, { addSuffix: true });
  } catch {
    return fallback;
  }
}
