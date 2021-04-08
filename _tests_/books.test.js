/* Integration tests for books.js routes */

process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db');

let book_isbn;

beforeEach(async () => {
	const result = await db.query(`
        INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
                          VALUES ('12345', 'https://amazon.com/apple', 'Apple Man', 'English', 500, 'Publishay', 'The Great Fall', 1984)
                          RETURNING isbn`);
	book_isbn = result.rows[0].isbn;
});

describe('GET /books', () => {
	test('Gets a list with one book', async () => {
		const response = await request(app).get('/books');

		expect(response.body.books).toHaveLength(1);
		expect(response.body.books[0].isbn).toBe('12345');
		expect(response.body.books[0]).toHaveProperty('amazon_url');
	});
});

describe('GET /books/:isbn', () => {
	test('Gets book with isbn matching the isbn in params ', async () => {
		const response = await request(app).get(`/books/${book_isbn}`);

		expect(response.body.book.isbn).toBe('12345');
		expect(response.body.book).toHaveProperty('amazon_url');
	});
	test('Return 404 for non-existing isbn', async () => {
		const response = await request(app).get('/books/xxx');
		expect(response.statusCode).toBe(404);
	});
});

describe('POST /books', () => {
	test('Creates new book', async () => {
		const response = await request(app).post('/books').send({
			isbn: '54321',
			amazon_url: 'http://amazon.com/grapes',
			author: 'Grape Man',
			language: 'English',
			pages: 1,
			publisher: 'Fruity',
			title: 'Grapes',
			year: 2000
		});

		expect(response.statusCode).toBe(201);
		expect(response.body.book.isbn).toBe('54321');
		expect(response.body.book).toHaveProperty('amazon_url');
	});
	test('Return 400 for invalid JSON schema', async () => {
		const response = await request(app).post('/books').send({
			amazon_url: 'http://amazon.com/grapes',
			author: 'Grape Man',
			language: 'English',
			pages: 1,
			publisher: 'Fruity',
			title: 'Grapes',
			year: 2000
		});
		expect(response.statusCode).toBe(400);
	});
});

describe('PUT /books/:isbn', () => {
	test('Updates book with isbn matching the isbn in params ', async () => {
		const response = await request(app).put(`/books/${book_isbn}`).send({
			amazon_url: 'http://amazon.com/pinneapple',
			author: 'Pinneapple Man',
			language: 'English',
			pages: 600,
			publisher: 'Fruity',
			title: 'The Great Update',
			year: 1984
		});

		expect(response.statusCode).toBe(200);
		expect(response.body.book.isbn).toBe('12345');
		expect(response.body.book).toHaveProperty('amazon_url');
		expect(response.body.book.title).toBe('The Great Update');
	});
	test('Return 400 for invalid JSON schema', async () => {
		const response = await request(app).put(`/books/${book_isbn}`).send({
			isbn: '12345',
			amazon_url: 'http://amazon.com/pinneapple',
			author: 'Pinneapple Man',
			language: 'English',
			pages: 600,
			publisher: 'Fruity',
			title: 'The Great Update',
			year: 1984
		});
		expect(response.statusCode).toBe(400);
	});

	test('Return 404 for non-existing isbn', async () => {
		const response = await request(app).put(`/books/xxx`).send({
			amazon_url: 'http://amazon.com/pinneapple',
			author: 'Pinneapple Man',
			language: 'English',
			pages: 600,
			publisher: 'Fruity',
			title: 'The Great Update',
			year: 1984
		});
		expect(response.statusCode).toBe(404);
	});
});

describe('DELETE /books/:isbn', function() {
	test('Deletes a single a book', async function() {
		const response = await request(app).delete(`/books/${book_isbn}`);
		expect(response.body).toEqual({ message: 'Book deleted' });
	});
});

afterEach(async () => {
	await db.query(`DELETE FROM books`);
});

afterAll(async function() {
	await db.end();
});
