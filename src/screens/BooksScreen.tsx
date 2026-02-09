import React, { useEffect, useState } from "react";
import { FlatList, View, StyleSheet } from "react-native";
import { Appbar, ActivityIndicator, Text } from "react-native-paper";
import { Book } from "../types/book";
import { initDatabase, getBooks, addBook, updateBook, deleteBook } from "../database/db";
import { BookCard } from "../components/BookCard";
import { BookDialog } from "../components/BookDialog";

export default function BooksScreen() {
    const [books, setBooks] = useState<Book[]>([]);
    const [visible, setVisible] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [formdata, setFormdata] = useState({
        title: "",
        author: "",
        category: "",
        year: "",
        description: "",
        image: ""
    });

    const refreshBooks = async () => {
        console.log("Refreshing books...");
        const data = await getBooks();
        setBooks(data);
        console.log("Books loaded:", data.length);
    };

    useEffect(() => {
        const setup = async () => {
            console.log("Initializing database...");
            try {
                await initDatabase();
                await refreshBooks();
                setIsLoading(false);
                console.log("Database and books ready.");
            } catch (err) {
                console.error("Setup failed:", err);
                setIsLoading(false);
            }
        };
        setup();
    }, []);

    const handleSave = async () => {
        const bookData = {
            title: formdata.title,
            author: formdata.author,
            category: formdata.category,
            year: parseInt(formdata.year) || 0,
            description: formdata.description,
            image: formdata.image || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8wWQG-P91nnS1e7U0Lg-jkA4rrXiDQZow3Q&s"
        };

        try {
            if (editId) {
                await updateBook(editId, bookData);
            } else {
                await addBook(bookData);
            }
            setVisible(false);
            setEditId(null);
            setFormdata({ title: "", author: "", category: "", year: "", description: "", image: "" });
            await refreshBooks();
        } catch (error) {
            console.error("Failed to save book:", error);
        }
    };

    const handleEdit = (id: number) => {
        const book = books.find(b => b.id === id);
        if (book) {
            setFormdata({
                title: book.title,
                author: book.author,
                category: book.category,
                year: book.year.toString(),
                description: book.description,
                image: book.image
            });
            setEditId(id);
            setVisible(true);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteBook(id);
            await refreshBooks();
        } catch (error) {
            console.error("Failed to delete book:", error);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>Memuat Data...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header elevated>
                <Appbar.Content title="Perpustakaan Digital" />
                <Appbar.Action icon="plus" onPress={() => {
                    setEditId(null);
                    setFormdata({ title: "", author: "", category: "", year: "", description: "", image: "" });
                    setVisible(true);
                }} />
            </Appbar.Header>

            <View style={styles.content}>
                <FlatList
                    data={books}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => (
                        <BookCard
                            item={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                />
            </View>

            <BookDialog
                visible={visible}
                onDismiss={() => setVisible(false)}
                onSave={handleSave}
                formdata={formdata}
                setFormdata={setFormdata}
                isEditing={!!editId}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        padding: 10,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 10,
    }
});
