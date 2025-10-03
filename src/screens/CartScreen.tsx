import React from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { addToCart, removeFromCart, clearCart, decreaseQuantity } from '../redux/slices/cartSlice';
import { getDatabase, ref, push, set } from 'firebase/database';

export default function CartScreen() {
    const cartItems = useSelector((state: RootState) => state.cart.items);
    const user = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();

    const groupedItems = cartItems.reduce((acc: { [key: string]: any }, item) => {
        if (!acc[item.id]) {
            acc[item.id] = { ...item, quantity: 1 };
        } else {
            acc[item.id].quantity++;
        }
        return acc;
    }, {});

    const items = Object.values(groupedItems);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.21;
    const total = subtotal + tax;

    const confirmPurchase = async () => {
        if (!user.uid) {
            Alert.alert('Error', 'Debes estar logueado para comprar.');
            return;
        }

        try {
            const db = getDatabase();
            const purchaseRef = ref(db, `purchases/${user.uid}`);
            const newPurchaseRef = push(purchaseRef);

            const purchaseData = {
                date: new Date().toISOString(),
                total,
                items: items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
            };

            await set(newPurchaseRef, purchaseData);

            dispatch(clearCart());
            Alert.alert('¡Gracias por tu compra!', `Total: $${total.toFixed(2)}`);
        } catch (error) {
            console.log('ERROR COMPRA:', error);
            Alert.alert('Error', 'No se pudo completar la compra');
        }
    };

    return (
        <View style={styles.container}>
            {items.length === 0 ? (
                <Text style={styles.emptyText}>Tu carrito está vacío</Text>
            ) : (
                <>
                    <FlatList
                        data={items}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <Image source={{ uri: item.image }} style={styles.image} />
                                <View style={styles.info}>
                                    <Text style={styles.itemTitle}>{item.name}</Text>
                                    <View style={styles.controlsRow}>
                                        <Text style={styles.price}>${(item.price * item.quantity).toFixed(2)} x{item.quantity}</Text>

                                        <TouchableOpacity
                                            style={styles.qtyButton}
                                            onPress={() => {
                                                if (item.quantity < item.stock) {
                                                    dispatch(addToCart(item));
                                                }
                                            }}
                                        >
                                            <Text style={styles.qtyButtonText}>＋</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.qtyButton}
                                            onPress={() => {
                                                if (item.quantity > 1) {
                                                    dispatch(decreaseQuantity(item.id));
                                                }
                                            }}
                                        >
                                            <Text style={styles.qtyButtonText}>−</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => dispatch(removeFromCart(item.id))}
                                        >
                                            <Text style={styles.removeText}>Eliminar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                    />

                    <View style={styles.totalContainer}>
                        <View style={styles.row}><Text style={styles.label}>Subtotal:</Text><Text style={styles.amount}>${subtotal.toFixed(2)}</Text></View>
                        <View style={styles.row}><Text style={styles.label}>IVA (21%):</Text><Text style={styles.amount}>${tax.toFixed(2)}</Text></View>
                        <View style={styles.row}><Text style={styles.label}>Total:</Text><Text style={styles.amount}>${total.toFixed(2)}</Text></View>

                        <TouchableOpacity style={styles.confirmButton} onPress={confirmPurchase}>
                            <Text style={styles.confirmText}>Confirmar compra</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 10,
        paddingTop: 20,
    },
    emptyText: {
        color: '#ccc',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 380,
    },
    card: {
        backgroundColor: '#111',
        flexDirection: 'row',
        padding: 10,
        marginTop: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    image: {
        width: 70,
        height: 70,
        borderRadius: 6,
    },
    info: {
        flex: 1,
        marginLeft: 10,
    },
    itemTitle: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 5,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 5,
        gap: 10,
    },
    price: {
        color: '#ccc',
        fontSize: 14,
        marginRight: 10,
    },
    qtyButton: {
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    qtyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        marginLeft: 'auto',
    },
    removeText: {
        color: 'red',
        fontSize: 14,
        marginLeft: 10,
    },
    totalContainer: {
        paddingTop: 10,
        borderTopColor: '#222',
        borderTopWidth: 1,
        marginBottom: 60,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 5,
    },
    label: {
        color: '#aaa',
        fontSize: 16,
    },
    amount: {
        color: '#fff',
        fontSize: 16,
    },
    confirmButton: {
        backgroundColor: '#f4511e',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    confirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
