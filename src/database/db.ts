import * as SQLite from 'expo-sqlite';
import { Book } from '../types/book';

const db = SQLite.openDatabaseSync('books.db');

export async function initDatabase() {
    try {
        await db.runAsync(
            `CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                category TEXT NOT NULL,
                year INTEGER NOT NULL,
                description TEXT NOT NULL,
                image TEXT NOT NULL
            )`
        );
    } catch (error) {
        console.error("Error initializing database:", error);
    }
}

export async function getBooks(): Promise<Book[]> {
    try {
        const result = await db.getAllAsync<Book>("SELECT * FROM books");
        return result;
    } catch (error) {
        console.error("Error getting books:", error);
        return [];
    }
}

export async function addBook(book: Omit<Book, 'id'>) {
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
    try {
        await db.runAsync("DELETE FROM books WHERE id = ?", [id]);
    } catch (error) {
        console.error("Error deleting book:", error);
        throw error;
    }
}
