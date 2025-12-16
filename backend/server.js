import express from 'express';
import pkg from 'pg';
import cors from 'cors';

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'Ali',
  host: 'localhost',
  database: 'hadiths',
  password: '1963',
  port: 5433,
});

// 1️⃣ Get all books
app.get('/api/books', async (req, res) => {
  const result = await pool.query('SELECT * FROM books ORDER BY id');
  res.json(result.rows);
});

// 2️⃣ Get volumes for a book
app.get('/api/books/:bookId/volumes', async (req, res) => {
  const { bookId } = req.params;
  const result = await pool.query(
    'SELECT * FROM volumes WHERE book_id = $1 ORDER BY volume_number',
    [bookId]
  );
  res.json(result.rows);
});

// 3️⃣ Get chapters for a volume
app.get('/api/volumes/:volumeId/chapters', async (req, res) => {
  const { volumeId } = req.params;
  const result = await pool.query(
    'SELECT * FROM chapters WHERE volume_id = $1 ORDER BY chapter_number',
    [volumeId]
  );
  res.json(result.rows);
});

// 4️⃣ Get chapters for a book without volumes
app.get('/api/books/:bookId/chapters', async (req, res) => {
  const { bookId } = req.params;
  const result = await pool.query(`
    SELECT c.id, c.chapter_number, c.title_ar, c.title_en
    FROM chapters c
    LEFT JOIN volumes v ON v.id = c.volume_id
    WHERE v.book_id = $1 OR c.volume_id IS NULL
    ORDER BY c.chapter_number
  `, [bookId]);
  res.json(result.rows);
});

// 5️⃣ Get hadith for a chapter
app.get('/api/chapters/:chapterId/hadith', async (req, res) => {
  const { chapterId } = req.params;
  const result = await pool.query(`
    SELECT h.id, h.hadith_number, h.arabic, h.english, r.reference
    FROM hadith h
    LEFT JOIN hadith_reference r ON r.hadith_id = h.id
    WHERE h.chapter_id = $1
    ORDER BY h.hadith_number
  `, [chapterId]);
  res.json(result.rows);
});

app.listen(4000, () => console.log('Backend running on http://localhost:4000'));
