import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Mua sắm' }} />
      <Stack.Screen name="payment" options={{ title: 'Thanh toán PayOS' }} />
      <Stack.Screen name="result" options={{ title: 'Kết quả' }} />
    </Stack>
  );
}