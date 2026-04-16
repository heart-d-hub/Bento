import type { LucideIcon } from 'lucide-react'
import {
  Boxes,
  BookOpen,
  Building2,
  FileText,
  Gift,
  History,
  NotebookPen,
  Package,
  RotateCcw,
  Scale,
  Barcode,
  Settings,
  ShoppingBag,
  Truck,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import { NEUTRAL_ICON_WRAP } from '@/ui/tokens'

export type ActionTile = {
  id: string
  label: string
  icon: LucideIcon
  iconWrap: string
}

export const ACTION_TILES: ActionTile[] = [
  { id: 'buy', label: 'ซื้อ', icon: ShoppingBag, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'suppliers', label: 'ผู้จำหน่าย', icon: Building2, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'members', label: 'สมาชิก', icon: Users, iconWrap: NEUTRAL_ICON_WRAP },
  {
    id: 'ar-ap',
    label: 'ลูกหนี้/เจ้าหนี้',
    icon: Scale,
    iconWrap: NEUTRAL_ICON_WRAP,
  },
  { id: 'promotions', label: 'โปรโมชัน', icon: Gift, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'branch-stock', label: 'คลังสินค้า', icon: Package, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'central', label: 'คลังกลาง', icon: Boxes, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'returns', label: 'คืนสินค้า / เคลม', icon: RotateCcw, iconWrap: NEUTRAL_ICON_WRAP },
  {
    id: 'customer-order',
    label: 'สั่งสินค้าให้ลูกค้า',
    icon: Truck,
    iconWrap: NEUTRAL_ICON_WRAP,
  },
  { id: 'catalog', label: 'Catalog', icon: BookOpen, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'label-print', label: 'พิมพ์ป้ายสินค้า', icon: Barcode, iconWrap: NEUTRAL_ICON_WRAP },
  {
    id: 'dashboard-layout',
    label: 'Dashboard',
    icon: SlidersHorizontal,
    iconWrap: NEUTRAL_ICON_WRAP,
  },
  {
    id: 'task-notepad-history',
    label: 'ประวัติโน้ตสั่งงาน',
    icon: NotebookPen,
    iconWrap: NEUTRAL_ICON_WRAP,
  },
  { id: 'report', label: 'Report', icon: FileText, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'activity', label: 'Log Activity', icon: History, iconWrap: NEUTRAL_ICON_WRAP },
  { id: 'settings', label: 'ตั้งค่า', icon: Settings, iconWrap: NEUTRAL_ICON_WRAP },
]
