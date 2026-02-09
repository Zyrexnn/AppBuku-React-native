import React from 'react';
import { View, ScrollView } from "react-native";
import { Button, Dialog, Portal, TextInput, Avatar } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';

interface BookDialogProps {
    visible: boolean;
    onDismiss: () => void;
    onSave: () => void;
    formdata: {
        title: string;
        author: string;
        category: string;
        year: string;
        description: string;
        image: string;
    };
    setFormdata: (data: any) => void;
    isEditing: boolean;
}

export const BookDialog: React.FC<BookDialogProps> = ({
    visible,
    onDismiss,
    onSave,
    formdata,
    setFormdata,
    isEditing
}) => {
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setFormdata({ ...formdata, image: result.assets[0].uri });
        }
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss} style={{ maxHeight: '80%' }}>
                <Dialog.Title>{isEditing ? 'Edit Buku' : 'Tambah Buku Baru'}</Dialog.Title>
                <Dialog.Content>
                    <ScrollView>
                        <View style={{ alignItems: 'center', marginBottom: 15 }}>
                            {formdata.image ? (
                                <Avatar.Image size={100} source={{ uri: formdata.image }} />
                            ) : (
                                <Avatar.Icon size={100} icon="book-plus" />
                            )}
                            <Button onPress={pickImage} style={{ marginTop: 5 }}>
                                {formdata.image ? 'Ganti Foto' : 'Pilih Foto'}
                            </Button>
                        </View>

                        <TextInput
                            label="Judul"
                            mode="outlined"
                            value={formdata.title}
                            onChangeText={(text) => setFormdata({ ...formdata, title: text })}
                            style={{ marginBottom: 12 }}
                        />

                        <TextInput
                            label="Penulis"
                            mode="outlined"
                            value={formdata.author}
                            onChangeText={(text) => setFormdata({ ...formdata, author: text })}
                            style={{ marginBottom: 12 }}
                        />

                        <TextInput
                            label="Kategori"
                            mode="outlined"
                            value={formdata.category}
                            onChangeText={(text) => setFormdata({ ...formdata, category: text })}
                            style={{ marginBottom: 12 }}
                        />

                        <TextInput
                            label="Tahun"
                            mode="outlined"
                            value={formdata.year}
                            onChangeText={(text) => setFormdata({ ...formdata, year: text })}
                            keyboardType="number-pad"
                            style={{ marginBottom: 12 }}
                        />

                        <TextInput
                            label="Deskripsi"
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            value={formdata.description}
                            onChangeText={(text) => setFormdata({ ...formdata, description: text })}
                            style={{ marginBottom: 12 }}
                        />
                    </ScrollView>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={onDismiss}>Batal</Button>
                    <Button onPress={onSave}>Simpan</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};
