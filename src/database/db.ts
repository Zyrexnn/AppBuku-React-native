import * as SQLite from 'expo-sqlite';
import { Book } from '../types/book';

let _db: SQLite.SQLiteDatabase | null = null;

// Fallback memory storage for when SQLite fails (common on some web environments)
let _memoryBooks: Book[] = [];

async function getDb() {
    if (_db) return _db;
    try {
        _db = await SQLite.openDatabaseAsync('books.db');
        return _db;
    } catch (e) {
        console.warn("SQLite openDatabaseSync failed, using fallback storage:", e);
        return null;
    }
}

// Helper to handle Web LocalStorage fallback
const STORAGE_KEY = 'app_buku_backup';
const saveToLocalStorage = (data: Book[]) => {
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
};

const loadFromLocalStorage = (): Book[] => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const data = window.localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }
    return [];
};

export async function initDatabase() {
    const db = await getDb();
    if (!db) {
        _memoryBooks = loadFromLocalStorage();
        return;
    }
    try {
        await db.execAsync(
            `CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                category TEXT NOT NULL,
                year INTEGER NOT NULL,
                description TEXT NOT NULL,
                image TEXT NOT NULL
            );`
        );
        console.log("Database initialized successfully");
    } catch (error) {
        console.error("Error creating table:", error);
    }
}

export async function getBooks(): Promise<Book[]> {
    const db = await getDb();
    if (!db) return _memoryBooks.length > 0 ? _memoryBooks : loadFromLocalStorage();

    try {
        const result = await db.getAllAsync<Book>("SELECT * FROM books ORDER BY id DESC");
        return result;
    } catch (error) {
        console.error("Error fetching books:", error);
        return _memoryBooks;
    }
}

export async function addBook(book: Omit<Book, 'id'>) {
    const db = await getDb();
    if (!db) {
        const newBook = { ...book, id: Date.now() };
        _memoryBooks = [newBook, ..._memoryBooks];
        saveToLocalStorage(_memoryBooks);
        return newBook.id;
    }

    try {
        const result = await db.runAsync(
            `INSERT INTO books (title, author, category, year, description, image) VALUES (?, ?, ?, ?, ?, ?)`,
            [book.title, book.author, book.category, book.year, book.description, book.image]
        );
        return result.lastInsertRowId;
    } catch (error) {
        console.error("Error adding book:", error);
        throw error;
    }
}

export async function updateBook(id: number, book: Omit<Book, 'id'>) {
    const db = await getDb();
    if (!db) {
        _memoryBooks = _memoryBooks.map(b => b.id === id ? { ...book, id } : b);
        saveToLocalStorage(_memoryBooks);
        return;
    }

    try {
        await db.runAsync(
            `UPDATE books SET title = ?, author = ?, category = ?, year = ?, description = ?, image = ? WHERE id = ?`,
            [book.title, book.author, book.category, book.year, book.description, book.image, id]
        );
    } catch (error) {
        console.error("Error updating book:", error);
        throw error;
    }
}

export async function deleteBook(id: number) {
    const db = await getDb();
    if (!db) {
        _memoryBooks = _memoryBooks.filter(b => b.id !== id);
        saveToLocalStorage(_memoryBooks);
        return;
    }

    try {
        await db.runAsync("DELETE FROM books WHERE id = ?", [id]);
    } catch (error) {
        console.error("Error deleting book:", error);
        throw error;
    }
}
