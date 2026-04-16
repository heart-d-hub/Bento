import type { LucideIcon } from 'lucide-react'
import {
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  Gift,
  History,
  Monitor,
  Package,
  RotateCcw,
  Scale,
  Barcode,
  Car,
  Settings,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sunset,
  Users,
} from 'lucide-react'
import { NEUTRAL_ICON_WRAP } from '@/ui/tokens'

/** สิทธิ์เข้าถึงเมนูหลัก (แต่ละไทล์) */
export type MainMenuPermission = 'allow' | 'deny'

export type PermissionMenuTile = {
  id: string
  label: string
  icon: LucideIcon
  iconWrap: string
}

/**
 * ลำดับเมนูตามแดชบอร์ด — สไตล์ไอคอนใช้โทนกลาง (ค่อยแยกธีมสีทีหลัง)
 */
export const PERMISSION_MENU_GRID: PermissionMenuTile[] = [
  { id: 'pos', label: 'POS', icon: Monitor, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'sales-history', label: 'ประวัติการขาย', icon: ClipboardList, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'day-close', label: 'สรุปยอดสิ้นวัน', icon: Sunset, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'buy', label: 'ซื้อ', icon: ShoppingBag, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'suppliers', label: 'ผู้จำหน่าย', icon: Building2, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'members', label: 'สมาชิก', icon: Users, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'promotions', label: 'โปรโมชัน', icon: Gift, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'branch-stock', label: 'คลังสินค้า', icon: Package, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'central', label: 'คลังกลาง', icon: Boxes, iconWrap: NEUTRAL_ICON_WRAP },
  {
    id: 'ar-ap',
    label: 'ลูกหนี้/เจ้าหนี้',
    icon: Scale,
    iconWrap: NEUTRAL_ICON_WRAP,
  },
  {
    id: 'customer-order',
    label: 'สั่งสินค้าให้ลูกค้า',
    icon: ShoppingCart,
    iconWrap: NEUTRAL_ICON_WRAP,
  },
  {
    id: 'dashboard-layout',
    label: 'Dashboard',
    icon: SlidersHorizontal,
    iconWrap: NEUTRAL_ICON_WRAP,
  },
  { id: 'label-print', label: 'พิมพ์ป้ายสินค้า', icon: Barcode, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'returns', label: 'คืนสินค้า / เคลม', icon: RotateCcw, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'car-model', label: 'รถ', icon: Car, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'report', label: 'Report', icon: FileText, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'activity', label: 'Log Activity', icon: History, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'settings', label: 'ตั้งค่า', icon: Settings, iconWrap: NEUTRAL_ICON_WRAP },
]
