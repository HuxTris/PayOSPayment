// App.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, ScrollView, TextInput, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';

// Thay đổi IP này thành IP thực của máy bạn đang chạy Backend Server
// Ví dụ: http://192.168.1.XX:3000 hoặc http://10.0.2.2:3000 (cho Android Emulator)
// Đối với iOS Simulator, bạn có thể dùng http://localhost:3000 hoặc http://127.0.0.1:3000
const BACKEND_URL = 'http://YOUR_BACKEND_IP:3000'; 

const Stack = createNativeStackNavigator();

// --- Màn hình sản phẩm ---
function ProductScreen({ navigation }) {
  const [productName] = useState('Gói Premium');
  const [amount] = useState(20000); // 20.000đ
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/payment/create-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productName, amount }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Payment link created:', data.checkoutUrl);
        navigation.navigate('Payment', { 
          checkoutUrl: data.checkoutUrl, 
          orderCode: data.orderCode 
        });
      } else {
        Alert.alert('Lỗi', `Không thể tạo link thanh toán: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error calling create-link API:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server backend hoặc tạo link thanh toán.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chọn gói dịch vụ</Text>
      <View style={styles.productCard}>
        <Text style={styles.productName}>{productName}</Text>
        <Text style={styles.productPrice}>{amount.toLocaleString('vi-VN')} đ</Text>
        <Button 
          title={isLoading ? "Đang xử lý..." : "Thanh toán ngay"} 
          onPress={handlePayment} 
          disabled={isLoading} 
        />
      </View>
    </View>
  );
}

// --- Màn hình thanh toán (WebView) ---
function PaymentScreen({ route, navigation }) {
  const { checkoutUrl, orderCode } = route.params;

  // Lắng nghe sự kiện điều hướng của WebView
  const handleNavigationStateChange = (navState) => {
    console.log('WebView URL:', navState.url);
    // Kiểm tra nếu URL là returnUrl từ PayOS
    if (navState.url.includes('https://your-domain.com/return')) { // Phải trùng với RETURN_URL trong backend
      navigation.replace('Result', { orderCode }); // replace để không quay lại WebView nữa
    }
    // Có thể thêm xử lý cho cancelUrl nếu cần
    if (navState.url.includes('https://your-domain.com/cancel')) {
        Alert.alert('Thông báo', 'Giao dịch đã bị hủy hoặc không thành công.');
        navigation.goBack(); // Quay về màn hình sản phẩm
    }
  };

  return (
    <WebView
      source={{ uri: checkoutUrl }}
      style={{ flex: 1 }}
      onNavigationStateChange={handleNavigationStateChange}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      renderLoading={() => (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Đang tải cổng thanh toán...</Text>
        </View>
      )}
    />
  );
}

// --- Màn hình kết quả ---
function ResultScreen({ route, navigation }) {
  const { orderCode } = route.params;
  const [status, setStatus] = useState('Đang kiểm tra...');
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const checkOrderStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/payment/order/${orderCode}`);
        const data = await response.json();

        if (response.ok) {
          setStatus(data.status === 'PAID' ? 'Thanh toán thành công!' : 'Thanh toán thất bại/chưa hoàn tất.');
        } else {
          setStatus('Lỗi: Không tìm thấy đơn hàng hoặc lỗi server.');
        }
      } catch (error) {
        console.error('Error fetching order status:', error);
        setStatus('Lỗi: Không thể kết nối đến server backend.');
      } finally {
        setIsFetching(false);
      }
    };

    checkOrderStatus();
  }, [orderCode]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kết quả thanh toán</Text>
      <View style={styles.resultCard}>
        <Text style={styles.resultOrderCode}>Mã đơn hàng: {orderCode}</Text>
        {isFetching ? (
          <ActivityIndicator size="small" color="#0000ff" />
        ) : (
          <Text style={[styles.resultStatus, status.includes('thành công') ? styles.successText : styles.failText]}>
            Trạng thái: {status}
          </Text>
        )}
        <Button title="Quay về trang chủ" onPress={() => navigation.popToTop()} />
      </View>
    </View>
  );
}

// --- Cấu hình Stack Navigator ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Product">
        <Stack.Screen name="Product" component={ProductScreen} options={{ title: 'Mua sắm' }} />
        <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Thanh toán PayOS' }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Kết quả' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  productCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    width: '80%',
  },
  productName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#555',
  },
  productPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    width: '80%',
  },
  resultOrderCode: {
    fontSize: 18,
    marginBottom: 10,
    color: '#666',
  },
  resultStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  successText: {
    color: '#28a745',
  },
  failText: {
    color: '#dc3545',
  },
});
