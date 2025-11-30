import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

// Thay đổi IP này thành IP thực của máy bạn đang chạy Backend Server
// Ví dụ: http://192.168.1.XX:3000 hoặc http://10.0.2.2:3000 (cho Android Emulator)
const BACKEND_URL = "http://192.168.1.120:3000";

export default function ProductScreen() {
  const router = useRouter();
  const [productName] = useState("Gói Premium");
  const [amount] = useState(10000);
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/payment/create-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productName, amount }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Payment link created:", data.checkoutUrl);
        router.push({
          pathname: "/payment",
          params: { checkoutUrl: data.checkoutUrl, orderCode: data.orderCode },
        });
      } else {
        Alert.alert(
          "Lỗi",
          `Không thể tạo link thanh toán: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error calling create-link API:", error);
      Alert.alert(
        "Lỗi",
        "Không thể kết nối đến server backend hoặc tạo link thanh toán."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chọn gói dịch vụ</Text>
      <View style={styles.productCard}>
        <Text style={styles.productName}>{productName}</Text>
        <Text style={styles.productPrice}>
          {amount.toLocaleString("vi-VN")} đ
        </Text>
        <Button
          title={isLoading ? "Đang xử lý..." : "Thanh toán ngay"}
          onPress={handlePayment}
          disabled={isLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
  },
  productCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: "center",
    width: "80%",
  },
  productName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: "#555",
  },
  productPrice: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#28a745",
    marginBottom: 20,
  },
});
