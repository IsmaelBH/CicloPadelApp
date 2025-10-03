import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Image,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Product } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const SIDE_SPACING = (width - CARD_WIDTH) / 2;

export default function StoreScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'products'));
                const data: Product[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Product[];
                setProducts(data);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleAddToCart = () => {
        if (selectedProduct) {
            dispatch(addToCart(selectedProduct));
            Alert.alert('Producto agregado', 'El producto fue añadido al carrito.');
            setSelectedProduct(null);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                ListHeaderComponent={
                    <>
                        <Text style={styles.header}>Destacados</Text>
                        <FlatList
                            data={products.slice(0, 3)}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={CARD_WIDTH}
                            decelerationRate="fast"
                            snapToAlignment="start"
                            contentContainerStyle={{
                                paddingHorizontal: SIDE_SPACING,
                            }}
                            initialScrollIndex={1}
                            getItemLayout={(_, index) => ({
                                length: CARD_WIDTH,
                                offset: CARD_WIDTH * index,
                                index,
                            })}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.featuredCard}
                                    onPress={() => setSelectedProduct(item)}
                                >
                                    <Image
                                        source={{ uri: item.image }}
                                        style={styles.featuredImage}
                                    />
                                    <Text style={styles.featuredTitle}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <Text style={styles.header}>Todos los productos</Text>
                    </>
                }
                data={products}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => setSelectedProduct(item)}
                    >
                        <Image source={{ uri: item.image }} style={styles.image} />
                        <View style={styles.cardContent}>
                            <Text style={styles.title}>{item.name}</Text>
                            <Text style={styles.price}>${item.price}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />

            <Modal
                visible={!!selectedProduct}
                animationType="slide"
                transparent
                onRequestClose={() => setSelectedProduct(null)}
            >
                <TouchableOpacity
                    style={styles.modalContainer}
                    activeOpacity={1}
                    onPressOut={() => setSelectedProduct(null)}
                >
                    <View style={styles.modalContent}>
                        {selectedProduct && (
                            <>
                                <Image
                                    source={{ uri: selectedProduct.image }}
                                    style={styles.modalImage}
                                />
                                <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                                <Text style={styles.modalPrice}>Precio: ${selectedProduct.price}</Text>
                                <Text style={styles.modalDescription}>
                                    {selectedProduct.description}
                                </Text>
                                <TouchableOpacity style={styles.closeButton} onPress={handleAddToCart}>
                                    <Image
                                        source={require('../../assets/icons/cart.png')}
                                        style={styles.iconCart}
                                    />
                                    <Text style={styles.textAddToCart}>Agregar al carrito</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111',
        flex: 1,
        padding: 10,
        paddingTop: 20,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 10,
        textAlign: 'center',
    },
    featuredCard: {
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 10,
        marginRight: 15,
        width: CARD_WIDTH,
        alignItems: 'center',
    },
    featuredImage: {
        width: '75%',
        height: width * 0.5,
        borderRadius: 10,
        marginBottom: 12,
    },
    featuredTitle: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#222',
        marginBottom: 12,
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    image: {
        width: 90,
        height: 90,
        borderRadius: 10,
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    price: {
        color: '#ccc',
        marginTop: 4,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#222',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalImage: {
        width: 150,
        height: 150,
        marginBottom: 15,
        borderRadius: 10,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalPrice: {
        color: '#ccc',
        fontSize: 16,
        marginBottom: 8,
    },
    modalDescription: {
        color: '#ddd',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 15,
    },
    textAddToCart: {
        color: '#fff',
        textAlign: 'center',
    },
    iconCart: {
        width: 20,
        height: 20,
        marginRight: 6,
    },
    closeButton: {
        backgroundColor: '#f4511e',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: 10,
    },
});
