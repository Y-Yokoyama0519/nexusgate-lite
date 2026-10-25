import { CustomerForm } from '../_components/customer-form'

export const metadata = {
  title: '新規顧客登録',
}

export default function NewCustomerPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <CustomerForm />
    </div>
  )
}