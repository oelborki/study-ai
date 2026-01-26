import { NextResponse } from "next/server";
import { z, ZodSchema } from "zod";

export interface ValidationResult<T> {
  success: true;
  data: T;
}

export interface ValidationError {
  success: false;
  error: string;
  details: z.ZodIssue[];
}

/**
 * Validates request body against a Zod schema
 * Returns parsed data on success, or a NextResponse with validation errors on failure
 */
export function validateRequest<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> | ValidationError {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Validation failed",
      details: result.error.issues,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Creates a standardized validation error response
 */
export function validationErrorResponse(
  error: string,
  details?: z.ZodIssue[]
): NextResponse {
  return NextResponse.json(
    {
      error,
      details: details?.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    },
    { status: 400 }
  );
}

/**
 * Helper to parse and validate JSON request body
 */
export async function parseAndValidate<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T> | ValidationError> {
  try {
    const body = await request.json();
    return validateRequest(schema, body);
  } catch {
    return {
      success: false,
      error: "Invalid JSON in request body",
      details: [],
    };
  }
}
