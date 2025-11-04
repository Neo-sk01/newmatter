/**
 * Re-export langfuseSpanProcessor from instrumentation.ts
 * This allows importing it using the @/ alias from within src/
 */
import { langfuseSpanProcessor } from "../../../instrumentation";

export { langfuseSpanProcessor };
