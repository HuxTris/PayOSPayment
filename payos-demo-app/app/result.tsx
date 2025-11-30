import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

// Phải trùng với IP trong file index.tsx
const BACKEND_URL = "http://192.168.1.120:3000";

export default function ResultScreen() {
  const router = useRouter();
  const { orderCode } = useLocalSearchParams();
  const [status, setStatus] = useState("Đang kiểm tra...");
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!orderCode) return;

    const checkOrderStatus = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/payment/order/${orderCode}`
        );
        const data = await response.json();

        if (response.ok) {
          setStatus(
            data.status === "PAID"
              ? "Thanh toán thành công!"
              : "Thanh toán thất bại/chưa hoàn tất."
          );
        } else {
          setStatus("Lỗi: Không tìm thấy đơn hàng hoặc lỗi server.");
        }
      } catch (error) {
        console.error("Error fetching order status:", error);
        setStatus("Lỗi: Không thể kết nối đến server backend.");
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
          <Text
            style={[
              styles.resultStatus,
              status.includes("thành công")
                ? styles.successText
                : styles.failText,
            ]}
          >
            Trạng thái: {status}
          </Text>
        )}
        <Button title="Quay về trang chủ" onPress={() => router.replace("/")} />
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
  resultCard: {
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
  resultOrderCode: {
    fontSize: 18,
    marginBottom: 10,
    color: "#666",
  },
  resultStatus: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  successText: {
    color: "#28a745",
  },
  failText: {
    color: "#dc3545",
  },
});
