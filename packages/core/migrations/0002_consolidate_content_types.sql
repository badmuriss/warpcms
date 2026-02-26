-- Consolidate removed content types to their equivalents.
-- pdf -> file (browsers handle PDF display natively; file type accepts any file)
-- html -> text (HTML type was identical to text with a richtext editor)
-- Idempotent: safe to run multiple times.
UPDATE content SET collection_id = 'file' WHERE collection_id = 'pdf';
UPDATE content SET collection_id = 'text' WHERE collection_id = 'html';
