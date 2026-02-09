import '@expo/metro-runtime';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ScrollView,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  PaperProvider,
  MD3LightTheme,
  Appbar,
  Card,
  Text,
  Button,
  TextInput,
  Portal,
  Dialog,
  Avatar,
  ActivityIndicator,
  FAB,
  Searchbar,
  Snackbar,
} from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

// Import Database logic
import { initDatabase, getBooks, addBook, updateBook, deleteBook } from './src/database/db';
import { Book } from './src/types/book';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#000000',
    secondary: '#424242',
    surface: '#FFFFFF',
    background: '#FAFAFA',
    outline: '#E0E0E0',
    surfaceVariant: '#F5F5F5',
  },
};

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <AppContent />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const [form, setForm] = useState({
    title: '', author: '', category: '', year: '', description: '', image: ''
  });

  const loadData = async () => {
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (e) {
      console.error("Load error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        await loadData();
      } catch (error) {
        console.error("Init error:", error);
        setIsLoading(false);
      }
    };
    init();
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handlePickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      aspect: [3, 4],
    });
    if (!res.canceled) setForm({ ...form, image: res.assets[0].uri });
  };

  const handleFetchFromInternet = async () => {
    if (!form.title) {
      setSnackbar({ visible: true, message: 'Judul buku diperlukan' });
      return;
    }
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(form.title)}`);
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const bookInfo = data.items[0].volumeInfo;
        setForm({
          ...form,
          title: bookInfo.title || form.title,
          author: bookInfo.authors ? bookInfo.authors.join(', ') : 'Unknown Author',
          description: bookInfo.description || '',
          year: bookInfo.publishedDate ? bookInfo.publishedDate.substring(0, 4) : '',
          category: bookInfo.categories ? bookInfo.categories[0] : '',
          image: bookInfo.imageLinks ? bookInfo.imageLinks.thumbnail.replace('http:', 'https:') : ''
        });
        setSnackbar({ visible: true, message: 'Data ditemukan' });
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Gagal mencari data' });
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.author) {
      setSnackbar({ visible: true, message: 'Mohon isi Judul dan Penulis' });
      return;
    }

    const payload = {
      title: form.title,
      author: form.author,
      category: form.category || 'Books',
      year: parseInt(form.year) || new Date().getFullYear(),
      description: form.description || '',
      image: form.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=2730'
    };

    try {
      if (editId) {
        await updateBook(editId, payload);
        setSnackbar({ visible: true, message: 'Buku diperbarui' });
      } else {
        await addBook(payload);
        setSnackbar({ visible: true, message: 'Buku ditambahkan' });
      }
      resetForm();
      setModalVisible(false);
      loadData();
    } catch (e) {
      setSnackbar({ visible: true, message: 'Gagal menyimpan' });
    }
  };

  const resetForm = () => {
    setForm({ title: '', author: '', category: '', year: '', description: '', image: '' });
    setEditId(null);
  };

  const handleEdit = (book: Book) => {
    setForm({
      title: book.title,
      author: book.author,
      category: book.category,
      year: book.year.toString(),
      description: book.description,
      image: book.image
    });
    setEditId(book.id);
    setDetailVisible(false);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBook(id);
      setDetailVisible(false);
      setSnackbar({ visible: true, message: 'Buku dihapus' });
      loadData();
    } catch (error) {
      setSnackbar({ visible: true, message: 'Gagal menghapus' });
    }
  };

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content
          title="MANAJEMEN BUKU"
          titleStyle={styles.appTitle}
        />
      </Appbar.Header>

      <View style={styles.header}>
        <Searchbar
          placeholder="Search collections..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#000"
          placeholderTextColor="#999"
          inputStyle={styles.searchInput}
          elevation={0}
        />
      </View>

      <FlatList
        data={filteredBooks}
        keyExtractor={item => item.id.toString()}
        numColumns={Platform.OS === 'web' ? 4 : 2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.cardContainer, { width: Platform.OS === 'web' ? '23.5%' : '47.5%' }]}
            onPress={() => { setSelectedBook(item); setDetailVisible(true); }}
          >
            <View style={styles.minimalCard}>
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                style={styles.minimalImage}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.minimalTitle} numberOfLines={1}>{item.title.toUpperCase()}</Text>
                <Text style={styles.minimalAuthor} numberOfLines={1}>{item.author}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Empty state. Add your first book.</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color="#FFF"
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      />

      <Portal>
        {/* ZEN DIALOG ADD/EDIT */}
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)} style={styles.zenDialog}>
          <Dialog.Title style={styles.zenDialogTitle}>
            {editId ? 'MODIFY COLLECTION' : 'NEW ADDITION'}
          </Dialog.Title>
          <Dialog.Content>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              <View style={styles.zenPickerContainer}>
                {form.image ? (
                  <Image source={{ uri: form.image }} style={styles.zenPreview} />
                ) : (
                  <View style={styles.zenPlaceholder}>
                    <Avatar.Icon size={40} icon="image-outline" style={{ backgroundColor: 'transparent' }} color="#CCC" />
                  </View>
                )}
                <View style={styles.zenActionRow}>
                  <Button mode="text" onPress={handlePickImage} textColor="#000" compact>CHOOSE IMAGE</Button>
                  <View style={styles.dot} />
                  <Button mode="text" onPress={handleFetchFromInternet} textColor="#000" compact>AUTO-FETCH</Button>
                </View>
              </View>

              <TextInput
                label="TITLE"
                value={form.title}
                onChangeText={t => setForm({ ...form, title: t })}
                mode="flat"
                style={styles.zenInput}
                activeUnderlineColor="#000"
              />
              <TextInput
                label="AUTHOR"
                value={form.author}
                onChangeText={t => setForm({ ...form, author: t })}
                mode="flat"
                style={styles.zenInput}
                activeUnderlineColor="#000"
              />

              <View style={styles.flexRow}>
                <TextInput
                  label="YEAR"
                  value={form.year}
                  onChangeText={t => setForm({ ...form, year: t })}
                  mode="flat"
                  keyboardType="numeric"
                  style={[styles.zenInput, { flex: 1, marginRight: 15 }]}
                  activeUnderlineColor="#000"
                />
                <TextInput
                  label="CATEGORY"
                  value={form.category}
                  onChangeText={t => setForm({ ...form, category: t })}
                  mode="flat"
                  style={[styles.zenInput, { flex: 1 }]}
                  activeUnderlineColor="#000"
                />
              </View>

              <TextInput
                label="STORY / DESCRIPTION"
                value={form.description}
                onChangeText={t => setForm({ ...form, description: t })}
                mode="flat"
                multiline
                numberOfLines={3}
                style={styles.zenInput}
                activeUnderlineColor="#000"
              />
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions style={styles.zenActions}>
            <Button onPress={() => setModalVisible(false)} textColor="#999">CANCEL</Button>
            <Button onPress={handleSave} textColor="#000" style={styles.btnSave}>SAVE COLLECTION</Button>
          </Dialog.Actions>
        </Dialog>

        {/* ZEN DETAIL DIALOG */}
        <Dialog visible={detailVisible} onDismiss={() => setDetailVisible(false)} style={styles.zenDialogFull}>
          {selectedBook && (
            <View style={styles.zenDetailContainer}>
              <Image source={{ uri: selectedBook.image }} style={styles.zenDetailImage} />
              <ScrollView contentContainerStyle={styles.zenDetailScroll}>
                <Text style={styles.zenDetailCategory}>{selectedBook.category.toUpperCase()}</Text>
                <Text style={styles.zenDetailTitle}>{selectedBook.title}</Text>
                <Text style={styles.zenDetailAuthor}>{selectedBook.author} • {selectedBook.year}</Text>
                <View style={styles.zenDivider} />
                <Text style={styles.zenDetailDesc}>{selectedBook.description}</Text>
              </ScrollView>
              <View style={styles.zenDetailFooter}>
                <TouchableOpacity onPress={() => handleDelete(selectedBook.id)}>
                  <Text style={styles.btnDelete}>DELETE</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setDetailVisible(false)} style={{ marginRight: 20 }}>
                    <Text style={styles.btnCancel}>CLOSE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEdit(selectedBook)} style={styles.btnEditZen}>
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>EDIT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={2000}
        style={styles.zenSnackbar}
        action={{ label: 'DISMISS', textColor: '#FFF', onPress: () => { } }}
      >
        {snackbar.message.toUpperCase()}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appbar: { backgroundColor: '#FFF', height: 60, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', elevation: 0 },
  appTitle: { fontSize: 14, letterSpacing: 4, fontWeight: '300', textAlign: 'center', width: '100%' },
  header: { padding: 20, backgroundColor: '#FFF' },
  searchBar: { backgroundColor: '#F9F9F9', borderBottomWidth: 1, borderBottomColor: '#EEE', borderRadius: 0 },
  searchInput: { fontSize: 13, height: 40 },
  list: { paddingHorizontal: 15, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 20 },
  cardContainer: { marginBottom: 10 },
  minimalCard: { backgroundColor: '#FFF' },
  minimalImage: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#F5F5F5' },
  cardInfo: { marginTop: 10 },
  minimalTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, color: '#000' },
  minimalAuthor: { fontSize: 10, color: '#999', marginTop: 2, textTransform: 'uppercase' },
  emptyText: { color: '#CCC', fontSize: 12, letterSpacing: 1 },
  fab: { position: 'absolute', margin: 24, right: 0, bottom: 0, backgroundColor: '#000', borderRadius: 0 },
  flexRow: { flexDirection: 'row' },

  // Zen Dialog Styles
  zenDialog: { backgroundColor: '#FFF', borderRadius: 0, paddingHorizontal: 10 },
  zenDialogFull: { backgroundColor: '#FFF', borderRadius: 0, margin: 0, flex: 1 },
  zenDialogTitle: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center', marginTop: 20 },
  zenPickerContainer: { alignItems: 'center', marginVertical: 25 },
  zenPreview: { width: 90, height: 120, borderWith: 1, borderColor: '#EEE' },
  zenPlaceholder: { width: 90, height: 120, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#DDD' },
  zenActionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#DDD', marginHorizontal: 5 },
  zenInput: { backgroundColor: 'transparent', fontSize: 12, marginBottom: 15, paddingHorizontal: 0 },
  zenActions: { padding: 20, justifyContent: 'space-between' },
  btnSave: { borderLeftWidth: 1, borderLeftColor: '#F0F0F0', paddingLeft: 15 },

  // Zen Detail Styles
  zenDetailContainer: { flex: 1 },
  zenDetailImage: { width: '100%', height: '45%', resizeMode: 'cover' },
  zenDetailScroll: { padding: 30 },
  zenDetailCategory: { fontSize: 10, letterSpacing: 2, color: '#999', marginBottom: 10 },
  zenDetailTitle: { fontSize: 24, fontWeight: '300', color: '#000', marginBottom: 10 },
  zenDetailAuthor: { fontSize: 12, color: '#666', letterSpacing: 1 },
  zenDivider: { height: 1, width: 40, backgroundColor: '#000', marginVertical: 25 },
  zenDetailDesc: { fontSize: 14, lineHeight: 26, color: '#333', fontWeight: '300' },
  zenDetailFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 30, borderTopWidth: 1, borderTopColor: '#F9F9F9' },
  btnDelete: { fontSize: 11, letterSpacing: 1.5, color: '#FF3B30', fontWeight: 'bold' },
  btnCancel: { fontSize: 11, letterSpacing: 1.5, color: '#999' },
  btnEditZen: { backgroundColor: '#000', paddingHorizontal: 20, paddingVertical: 10 },
  zenSnackbar: { backgroundColor: '#000', borderRadius: 0 }
});