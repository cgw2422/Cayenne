-- Facebook is the acquisition channel, so it gets its own funnel step rather
-- than being folded into the generic native-share event. WORDING_CHANGED tells
-- us whether the line library is doing its job or being cycled past.
ALTER TYPE "ShareEventType" ADD VALUE IF NOT EXISTS 'FACEBOOK_SHARE_CLICKED';
ALTER TYPE "ShareEventType" ADD VALUE IF NOT EXISTS 'WORDING_CHANGED';
