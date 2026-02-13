import { FastifyRequest, FastifyReply } from 'fastify';
import { db, messageUsage } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

/**
 * Middleware to enforce message limits based on subscription tier.
 *
 * Premium users: unlimited messages (bypass)
 * Free users: 10 messages per day limit
 *
 * Uses transactions for thread-safe counter increment.
 * Returns 429 with MESSAGE_LIMIT_EXCEEDED when limit is hit.
 *
 * @param {FastifyRequest} request - Fastify request with authenticated user
 * @param {FastifyReply} reply - Fastify reply for sending responses
 * @returns {Promise<void>} Resolves if under limit, sends 429 if exceeded
 *
 * @example
 * // Apply to message sending endpoint
 * app.post('/:chatId/message', {
 *   preHandler: checkMessageLimit
 * }, sendMessageHandler);
 */
export async function checkMessageLimit(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = request.user as any;
  const { subscriptionTier } = user;

  // Premium users bypass limit check
  if (subscriptionTier === 'premium') {
    return;
  }

  // For Free users - check daily limit
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const userId = user.userId;

  try {
    // Use transaction for thread safety
    await db.transaction(async (tx) => {
      // Get or create usage record for today
      let usage = await tx.query.messageUsage.findFirst({
        where: and(
          eq(messageUsage.userId, userId),
          eq(messageUsage.date, today)
        )
      });

      if (!usage) {
        // Create new usage record
        const [newUsage] = await tx.insert(messageUsage).values({
          userId,
          date: today,
          messageCount: 0
        }).returning();
        usage = newUsage;
      }

      // Check if limit exceeded
      if (usage.messageCount >= 10) {
        return reply.code(429).send({
          success: false,
          error: {
            code: 'MESSAGE_LIMIT_EXCEEDED',
            message: 'Вы достигли лимита 10 сообщений в день. Перейдите на Premium для безлимитного доступа.',
            messagesUsedToday: usage.messageCount,
            upgradeUrl: '/subscription'
          }
        });
      }

      // Increment counter
      await tx.update(messageUsage)
        .set({
          messageCount: usage.messageCount + 1,
          updatedAt: new Date()
        })
        .where(eq(messageUsage.id, usage.id));
    });
  } catch (error) {
    // Log error but allow request to proceed if it's not a reply error
    // (reply errors occur when we've already sent 429 response)
    if (!reply.sent) {
      console.error('Failed to check message limit:', error);
      // Let the request proceed on DB errors to avoid blocking users
    }
  }
}
