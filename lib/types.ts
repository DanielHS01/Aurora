import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/lib/types/database.types'

// Filas (lo que devuelve un SELECT)
export type Business = Tables<'businesses'>
export type BusinessSettings = Tables<'business_settings'>
export type BusinessUser = Tables<'business_users'>
export type Profile = Tables<'profiles'>
export type Customer = Tables<'customers'>
export type CustomerAddress = Tables<'customer_addresses'>
export type MenuCategory = Tables<'menu_categories'>
export type Product = Tables<'products'>
export type ProductOption = Tables<'product_options'>
export type ProductOptionValue = Tables<'product_option_values'>
export type RestaurantTable = Tables<'restaurant_tables'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type OrderItemOption = Tables<'order_item_options'>
export type KitchenTicket = Tables<'kitchen_tickets'>
export type Reservation = Tables<'reservations'>
export type Payment = Tables<'payments'>
export type Invoice = Tables<'invoices'>
export type InvoiceItem = Tables<'invoice_items'>
export type AiAgent = Tables<'ai_agents'>
export type AiConversation = Tables<'ai_conversations'>
export type AiMessage = Tables<'ai_messages'>
export type AiAction = Tables<'ai_actions'>
export type Plan = Tables<'plans'>
export type Subscription = Tables<'subscriptions'>
export type ActivityLog = Tables<'activity_logs'>

// Inserts (lo que mandas para crear una fila)
export type ProductInsert = TablesInsert<'products'>
export type OrderInsert = TablesInsert<'orders'>
export type OrderItemInsert = TablesInsert<'order_items'>
export type CustomerInsert = TablesInsert<'customers'>
export type ReservationInsert = TablesInsert<'reservations'>

// Updates (lo que mandas para actualizar una fila)
export type ProductUpdate = TablesUpdate<'products'>
export type OrderUpdate = TablesUpdate<'orders'>

// Enums (los estados válidos)
export type OrderStatus = Enums<'order_status'>
export type OrderType = Enums<'order_type'>
export type PaymentStatus = Enums<'payment_status'>
export type PaymentMethod = Enums<'payment_method'>
export type ReservationStatus = Enums<'reservation_status'>
export type TableStatus = Enums<'table_status'>
export type KitchenTicketStatus = Enums<'kitchen_ticket_status'>
export type BusinessRole = Enums<'business_role'>
export type AiChannel = Enums<'ai_channel'>
export type AiSender = Enums<'ai_sender'>
export type SubscriptionStatus = Enums<'subscription_status'>