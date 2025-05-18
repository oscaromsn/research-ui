export * from './common';
export * from './env';
export * from './utils';

/**
 * This is the main entry point for all Zod schemas
 * Import schemas from this file to ensure consistency across the application
 * Example: import { string, number, env, parse } from '@/lib/schemas';
 * 
 * Recommended usage patterns:
 * 
 * 1. For simple validations:
 *    import { string } from '@/lib/schemas';
 *    const nameSchema = string.nonEmpty;
 * 
 * 2. For complex schemas:
 *    import { z } from 'zod';
 *    import { string, createSchema } from '@/lib/schemas';
 *    
 *    const userSchema = createSchema(z.object({
 *      id: z.string(),
 *      name: string.nonEmpty,
 *      email: string.email
 *    }));
 *    
 *    // Then use the schema with type inference
 *    type User = z.infer<typeof userSchema.schema>;
 *    
 *    // And validation helpers
 *    const validUser = userSchema.parse(data);
 */