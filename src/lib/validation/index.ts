// Auth schemas
export {
  passwordSchema,
  emailSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  loginSchema,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type LoginInput,
} from "./schemas/auth";

// Deck schemas
export {
  createDeckSchema,
  generateSchema,
  updateDeckSchema,
  type CreateDeckInput,
  type GenerateInput,
  type UpdateDeckInput,
} from "./schemas/deck";

// Team schemas
export {
  createTeamSchema,
  updateTeamSchema,
  inviteTeamMemberSchema,
  type CreateTeamInput,
  type UpdateTeamInput,
  type InviteTeamMemberInput,
} from "./schemas/team";

// Upload schemas and utilities
export {
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
  MAGIC_BYTES,
  validateMagicBytes,
  getFileTypeFromMime,
  validateUploadedFile,
  uploadMetadataSchema,
  type FileType,
  type FileValidationResult,
  type UploadMetadata,
} from "./schemas/upload";

// Middleware utilities
export {
  validateRequest,
  validationErrorResponse,
  parseAndValidate,
  type ValidationResult,
  type ValidationError,
} from "./middleware";
