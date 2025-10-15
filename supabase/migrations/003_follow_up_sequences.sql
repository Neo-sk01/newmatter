-- Follow-up Sequence System
-- This migration adds comprehensive follow-up sequence tracking with timestamps

-- 1. Follow-up Sequence Templates (defines reusable sequence templates)
CREATE TABLE IF NOT EXISTS public.follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Sequence Steps (individual steps in a sequence)
CREATE TABLE IF NOT EXISTS public.sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.follow_up_sequences(id) ON DELETE CASCADE,
  step_number INT NOT NULL, -- 1, 2, 3, etc.
  delay_days INT NOT NULL DEFAULT 3, -- Days to wait after previous email
  delay_hours INT NOT NULL DEFAULT 0, -- Additional hours for fine-grained control
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sequence_id, step_number)
);

-- 3. Lead Sequences (tracks which leads are in which sequences)
CREATE TABLE IF NOT EXISTS public.lead_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.follow_up_sequences(id) ON DELETE CASCADE,
  current_step INT NOT NULL DEFAULT 0, -- 0 means not started, 1+ is current step
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lead_id, sequence_id)
);

-- 4. Sent Emails (tracks all emails sent with timestamps)
CREATE TABLE IF NOT EXISTS public.sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES public.follow_up_sequences(id) ON DELETE SET NULL,
  step_id UUID REFERENCES public.sequence_steps(id) ON DELETE SET NULL,
  lead_sequence_id UUID REFERENCES public.lead_sequences(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_follow_up BOOLEAN NOT NULL DEFAULT false,
  follow_up_number INT, -- 1, 2, 3 for follow-ups
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')),
  response_received_at TIMESTAMPTZ,
  next_follow_up_due_at TIMESTAMPTZ, -- When the next follow-up should be sent
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Email Responses (tracks responses from leads)
CREATE TABLE IF NOT EXISTS public.email_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_email_id UUID NOT NULL REFERENCES public.sent_emails(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  response_body TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'unsubscribe')),
  auto_detected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sent_email_id) -- One response per sent email
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_company_id ON public.follow_up_sequences(company_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence_id ON public.sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_step_number ON public.sequence_steps(sequence_id, step_number);
CREATE INDEX IF NOT EXISTS idx_lead_sequences_lead_id ON public.lead_sequences(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_sequences_sequence_id ON public.lead_sequences(sequence_id);
CREATE INDEX IF NOT EXISTS idx_lead_sequences_status ON public.lead_sequences(status);
CREATE INDEX IF NOT EXISTS idx_sent_emails_lead_id ON public.sent_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON public.sent_emails(sent_at);
CREATE INDEX IF NOT EXISTS idx_sent_emails_next_follow_up ON public.sent_emails(next_follow_up_due_at) WHERE next_follow_up_due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sent_emails_status ON public.sent_emails(status);
CREATE INDEX IF NOT EXISTS idx_email_responses_lead_id ON public.email_responses(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_responses_received_at ON public.email_responses(received_at);

-- Enable Row Level Security
ALTER TABLE public.follow_up_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (company members can access their data)
CREATE POLICY follow_up_sequences_company_member ON public.follow_up_sequences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships 
      WHERE company_id = follow_up_sequences.company_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY sequence_steps_via_sequence ON public.sequence_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.follow_up_sequences fs
      JOIN public.company_memberships cm ON cm.company_id = fs.company_id
      WHERE fs.id = sequence_steps.sequence_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY lead_sequences_via_lead ON public.lead_sequences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.leadlists ll ON ll.id = l.leadlist_id
      JOIN public.company_memberships cm ON cm.company_id = ll.company_id
      WHERE l.id = lead_sequences.lead_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY sent_emails_via_lead ON public.sent_emails
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.leadlists ll ON ll.id = l.leadlist_id
      JOIN public.company_memberships cm ON cm.company_id = ll.company_id
      WHERE l.id = sent_emails.lead_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY email_responses_via_lead ON public.email_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.leadlists ll ON ll.id = l.leadlist_id
      JOIN public.company_memberships cm ON cm.company_id = ll.company_id
      WHERE l.id = email_responses.lead_id
      AND cm.user_id = auth.uid()
    )
  );

-- Development policies (allow anon access)
CREATE POLICY follow_up_sequences_anon_dev ON public.follow_up_sequences
  FOR ALL USING (auth.role() = 'anon')
  WITH CHECK (auth.role() = 'anon');

CREATE POLICY sequence_steps_anon_dev ON public.sequence_steps
  FOR ALL USING (auth.role() = 'anon')
  WITH CHECK (auth.role() = 'anon');

CREATE POLICY lead_sequences_anon_dev ON public.lead_sequences
  FOR ALL USING (auth.role() = 'anon')
  WITH CHECK (auth.role() = 'anon');

CREATE POLICY sent_emails_anon_dev ON public.sent_emails
  FOR ALL USING (auth.role() = 'anon')
  WITH CHECK (auth.role() = 'anon');

CREATE POLICY email_responses_anon_dev ON public.email_responses
  FOR ALL USING (auth.role() = 'anon')
  WITH CHECK (auth.role() = 'anon');

-- Triggers for updated_at
CREATE TRIGGER trg_follow_up_sequences_updated_at
  BEFORE UPDATE ON public.follow_up_sequences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_sequence_steps_updated_at
  BEFORE UPDATE ON public.sequence_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_lead_sequences_updated_at
  BEFORE UPDATE ON public.lead_sequences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_sent_emails_updated_at
  BEFORE UPDATE ON public.sent_emails
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper function to calculate next follow-up due date
CREATE OR REPLACE FUNCTION calculate_next_follow_up_date(
  p_sent_at TIMESTAMPTZ,
  p_delay_days INT,
  p_delay_hours INT DEFAULT 0
)
RETURNS TIMESTAMPTZ LANGUAGE SQL IMMUTABLE AS $$
  SELECT p_sent_at + (p_delay_days || ' days')::INTERVAL + (p_delay_hours || ' hours')::INTERVAL;
$$;

-- Function to get lead sequence status with timing
CREATE OR REPLACE FUNCTION get_lead_sequence_timeline(p_lead_id UUID)
RETURNS TABLE(
  sequence_name TEXT,
  step_number INT,
  subject TEXT,
  sent_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ,
  status TEXT,
  response_received BOOLEAN
) LANGUAGE SQL STABLE AS $$
  SELECT 
    fs.name AS sequence_name,
    se.follow_up_number AS step_number,
    se.subject,
    se.sent_at,
    se.next_follow_up_due_at AS next_due_at,
    se.status,
    EXISTS(SELECT 1 FROM public.email_responses er WHERE er.sent_email_id = se.id) AS response_received
  FROM public.sent_emails se
  LEFT JOIN public.follow_up_sequences fs ON fs.id = se.sequence_id
  WHERE se.lead_id = p_lead_id
  ORDER BY se.sent_at DESC;
$$;

-- Function to auto-advance sequence when response is received
CREATE OR REPLACE FUNCTION handle_email_response()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Update the sent email status
  UPDATE public.sent_emails
  SET 
    status = 'replied',
    response_received_at = NEW.received_at,
    next_follow_up_due_at = NULL
  WHERE id = NEW.sent_email_id;

  -- If this email was part of a sequence, pause or complete it
  UPDATE public.lead_sequences
  SET 
    status = CASE 
      WHEN NEW.sentiment = 'positive' THEN 'completed'
      WHEN NEW.sentiment = 'unsubscribe' THEN 'cancelled'
      ELSE 'paused'
    END,
    completed_at = CASE WHEN NEW.sentiment = 'positive' THEN NOW() ELSE completed_at END,
    paused_at = CASE WHEN NEW.sentiment IN ('neutral', 'negative') THEN NOW() ELSE paused_at END
  WHERE lead_id = NEW.lead_id
    AND status = 'active';

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_handle_email_response
  AFTER INSERT ON public.email_responses
  FOR EACH ROW EXECUTE FUNCTION handle_email_response();

-- Insert a default sequence template for testing
INSERT INTO public.follow_up_sequences (id, company_id, name, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Default Follow-up Sequence',
  'A 3-step follow-up sequence for cold outreach'
) ON CONFLICT (id) DO NOTHING;

-- Insert default sequence steps
INSERT INTO public.sequence_steps (sequence_id, step_number, delay_days, subject_template, body_template) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    1,
    3,
    'Following up on my previous email',
    'Hi {{firstName}},\n\nI wanted to follow up on my previous email. I believe {{company}} could benefit from our solution.\n\nDo you have 15 minutes this week for a quick call?\n\nBest regards'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    2,
    5,
    'Last attempt to connect',
    'Hi {{firstName}},\n\nI understand you''re busy, so this will be my last email.\n\nIf you''re interested in learning how we can help {{company}}, just reply and we can set up a brief call.\n\nBest regards'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    3,
    7,
    'Breaking up is hard to do',
    'Hi {{firstName}},\n\nI haven''t heard back, so I''ll assume this isn''t a priority right now.\n\nIf things change, feel free to reach out anytime.\n\nBest regards'
  )
ON CONFLICT (sequence_id, step_number) DO NOTHING;

