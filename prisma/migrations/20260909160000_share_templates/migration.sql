-- Redesigned share templates.
--
-- Three themes were renamed as part of the redesign: each template is now its
-- own composition rather than a recolour, and the names describe what they are.
-- Renaming the enum values in place preserves every published card's link.

ALTER TYPE "ShareTheme" RENAME VALUE 'PEPPER_COUNTRY' TO 'FRESH_CAYENNE';
ALTER TYPE "ShareTheme" RENAME VALUE 'CELEBRATION' TO 'MASCOT';
ALTER TYPE "ShareTheme" RENAME VALUE 'SOCIAL' TO 'FACEBOOK';
