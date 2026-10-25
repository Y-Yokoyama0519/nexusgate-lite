import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type CustomerItem } from '../schema'

type CustomersTableProps = {
  customers: CustomerItem[]
}

export function CustomersTable({ customers }: CustomersTableProps) {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">顧客コード</TableHead>
            <TableHead className="min-w-[200px]">顧客名 / 店舗名</TableHead>
            <TableHead className="w-[120px]">担当者</TableHead>
            <TableHead className="w-[180px]">連絡先</TableHead>
            <TableHead className="min-w-[220px]">所在地</TableHead>
            <TableHead className="w-[90px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                登録されている顧客情報はありません。
              </TableCell>
            </TableRow>
          ) : (
            customers.map((c) => (
              <TableRow key={c.id} className={!c.is_active ? 'opacity-50 bg-muted/20' : ''}>
                <TableCell className="font-mono text-xs font-semibold">
                  {c.customer_code}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{c.name}</div>
                  {c.branch_name && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {c.branch_name}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {c.contact_name || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5 text-xs">
                    {c.phone && <div className="font-mono">{c.phone}</div>}
                    {c.email && (
                      <div className="text-muted-foreground truncate max-w-[170px]" title={c.email}>
                        {c.email}
                      </div>
                    )}
                    {!c.phone && !c.email && <span className="text-muted-foreground">-</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground line-clamp-2" title={`${c.address ?? ''} ${c.address2 ?? ''}`}>
                    {c.address ? `${c.address} ${c.address2 ?? ''}` : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/operator/customers/${c.id}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    編集
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}