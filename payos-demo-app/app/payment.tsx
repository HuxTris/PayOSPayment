import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PaymentScreen() {
  const router = useRouter();
  const { checkoutUrl, orderCode } = useLocalSearchParams();

  if (!checkoutUrl || typeof checkoutUrl !== 'string') {
    return <Text>Lỗi: Không có URL thanh toán.</Text>;
  }

  const handleNavigationStateChange = (navState) => {
    console.log('WebView URL:', navState.url);
    if (navState.url.includes('https://your-domain.com/return')) {
      router.replace({ 
        pathname: "/result",
        params: { orderCode: String(orderCode) }
      });
    }
    if (navState.url.includes('https://your-domain.com/cancel')) {
      Alert.alert('Thông báo', 'Giao dịch đã bị hủy hoặc không thành công.');
      router.back();
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
