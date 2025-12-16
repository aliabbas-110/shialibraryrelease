-- ===============================
-- DATABASE SCHEMA FOR HADITH APP
-- ===============================

-- 1️⃣ Books Table
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  english_title TEXT,
  author TEXT
);

-- 2️⃣ Volumes Table
CREATE TABLE IF NOT EXISTS volumes (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  volume_number INTEGER NOT NULL
);

-- 3️⃣ Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  volume_id INTEGER REFERENCES volumes(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title_ar TEXT,
  title_en TEXT
);

-- 4️⃣ Hadith Table
CREATE TABLE IF NOT EXISTS hadith (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  hadith_number INTEGER NOT NULL,
  arabic TEXT NOT NULL,
  english TEXT NOT NULL
);

-- 5️⃣ Hadith Reference Table
CREATE TABLE IF NOT EXISTS hadith_reference (
  hadith_id INTEGER REFERENCES hadith(id) ON DELETE CASCADE,
  reference TEXT
);
