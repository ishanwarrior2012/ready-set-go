-- Add UPDATE policy for chat_messages table for completeness
-- This allows users to update their own messages if needed (e.g., for editing or content moderation)
CREATE POLICY "Users can update their own messages"
ON public.chat_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);