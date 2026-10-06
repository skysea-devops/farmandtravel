-- Rename the seeded monthly meetup title to a simpler "Topluluk buluşması".
-- The "(online)" suffix is redundant (the card already shows a 🟢 Online badge).
UPDATE activities
   SET title = 'Topluluk buluşması'
 WHERE kind = 'meeting'
   AND title = 'Aylık topluluk buluşması (online)';
