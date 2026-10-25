import { PartnerForm } from './_components/partner-form'

export const metadata = {
  title: '新規パートナー登録 | NexusGate',
}

export default function NewPartnerPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PartnerForm />
    </div>
  )
}