import {
  ACTION_TILE_ORDER_CHANGED_EVENT,
  loadActionTileOrder,
  orderActionTiles,
} from '@/features/main/data/actionTileLayout'
import { BentoCard } from '@/components/ui/BentoCard'
import { ACTION_TILES } from '@/features/main/data/actionTiles'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import { clsx } from 'clsx'
import { useEffect, useMemo, useState } from 'react'

type ActionGridProps = {
  className?: string
}

export function ActionGrid({ className }: ActionGridProps) {
  const { openTab } = useWorkspaceTabs()
  const [menuOrder, setMenuOrder] = useState<string[]>(() => loadActionTileOrder())

  useEffect(() => {
    const onChanged = () => setMenuOrder(loadActionTileOrder())
    window.addEventListener(ACTION_TILE_ORDER_CHANGED_EVENT, onChanged)
    return () => window.removeEventListener(ACTION_TILE_ORDER_CHANGED_EVENT, onChanged)
  }, [])

  const orderedTiles = useMemo(() => orderActionTiles(ACTION_TILES, menuOrder), [menuOrder])

  return (
    <div
      className={clsx(
        'relative z-0 grid auto-rows-fr grid-cols-2 content-start gap-2 overflow-y-auto sm:grid-cols-3 sm:gap-2.5 lg:min-h-0 lg:gap-2.5',
        className,
      )}
    >
      {orderedTiles.map((tile) => (
        <BentoCard
          key={tile.id}
          icon={tile.icon}
          label={tile.label}
          iconClassName={tile.iconWrap}
          onClick={() => openTab(tile.id, tile.label)}
        />
      ))}
    </div>
  )
}
