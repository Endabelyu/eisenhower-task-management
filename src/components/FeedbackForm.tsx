import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function FeedbackForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState('feedback');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    try {
      // We will try to invoke a Supabase Edge Function to send the email via Resend
      const { error } = await supabase.functions.invoke('send-feedback', {
        body: { type: feedbackType, message, email },
      });

      if (error) {
        throw error;
      }

      toast({
        title: t('settings.feedback.success'),
        description: t('settings.feedback.success.desc'),
      });
      setMessage('');
      setEmail('');
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        title: t('settings.feedback.error'),
        description: t('settings.feedback.error.desc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="feedback-type">{t('settings.feedback.type')}</Label>
        <Select value={feedbackType} onValueChange={setFeedbackType}>
          <SelectTrigger id="feedback-type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="feedback">{t('settings.feedback.type.feedback')}</SelectItem>
            <SelectItem value="suggestion">{t('settings.feedback.type.suggestion')}</SelectItem>
            <SelectItem value="bug">{t('settings.feedback.type.bug')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-email">{t('settings.feedback.email')}</Label>
        <Input
          id="feedback-email"
          type="email"
          placeholder={t('settings.feedback.email.placeholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-message">{t('settings.feedback.message')}</Label>
        <Textarea
          id="feedback-message"
          placeholder={t('settings.feedback.message.placeholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
        />
      </div>

      <Button type="submit" disabled={isSubmitting || !message.trim()} className="w-full gap-2">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {t('settings.feedback.submit')}
      </Button>
    </form>
  );
}
