import React from 'react';
import { View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { Book } from '../types/book';

interface BookCardProps {
    item: Book;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ item, onEdit, onDelete }) => (
    <Card style={{ width: '48%', padding: 8, marginBottom: 8 }}>
        <Card.Cover source={{ uri: item.image || 'https://via.placeholder.com/150' }} />
        <View style={{ padding: 8, gap: 5 }}>
            <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                {item.title}
            </Text>
            <Text variant="bodySmall">
                {item.author} - {item.year} - {item.category}
            </Text>
            <Text variant="bodySmall" numberOfLines={2}>
                {item.description}
            </Text>
        </View>

        <View style={{ flexDirection: 'column', gap: 7, marginTop: 10 }}>
            <Button
                mode="contained"
                onPress={() => onEdit(item.id)}
                buttonColor="#007aff"
                compact
            >
                Edit
            </Button>
            <Button
                mode="contained"
                onPress={() => onDelete(item.id)}
                buttonColor="red"
                compact
            >
                Delete
            </Button>
        </View>
    </Card>
);
