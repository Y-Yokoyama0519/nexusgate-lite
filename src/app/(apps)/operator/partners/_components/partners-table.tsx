import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type PartnerItem } from '../schema'

interface PartnersTableProps {
  partners: PartnerItem[]
}

export function PartnersTable({ partners }: PartnersTableProps) {
  if (partners.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10 text-muted-foreground text-sm">
        登録されているパートナー情報はありません。
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>屋号 / パートナー名</TableHead>
            <TableHead>連絡先</TableHead>
            <TableHead>待機場所 / 拠点</TableHead>
            <TableHead>登録日</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map((partner) => (
            <TableRow key={partner.id}>
              <TableCell className="font-medium">{partner.name}</TableCell>
              <TableCell>{partner.phone ?? partner.email ?? '-'}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {partner.base_address ?? partner.home_address ?? '-'}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {partner.created_at
                  ? new Date(partner.created_at).toLocaleDateString('ja-JP')
                  : '-'}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/operator/partners/${partner.id}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  確認・編集
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}